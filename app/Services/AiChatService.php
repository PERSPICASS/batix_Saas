<?php

namespace App\Services;

use Anthropic\Client;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Alert;
use Illuminate\Support\Collection;

class AiChatService
{
    private static Client $client;

    private static function client(): Client
    {
        return self::$client ??= new Client(
            apiKey: config('services.anthropic.key')
        );
    }

    public static function chat(string $message, array $history, array $shopIds, object $user, string $shopName): string
    {
        $messages = self::buildMessages($history, $message);

        $systemPrompt = "Tu es un assistant IA expert en gestion de commerce pour Batix SaaS.
                    - La boutique actuelle est: $shopName
                    - La date actuelle est: " . date('Y-m-d H:i:s') . "
                    - Le rôle de l'utilisateur est: {$user->role}

                    Réponds TOUJOURS en français.
                    Utilise les outils pour récupérer les données métier fraîches plutôt que de répondre de mémoire.
                    Fournis des réponses concises et actionnables.";

        $tools = [
            [
                'name' => 'get_sales_summary',
                'description' => 'Obtient les KPIs de ventes (chiffre affaires, nombre de ventes, panier moyen)',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'days' => [
                            'type' => 'integer',
                            'description' => 'Nombre de jours à analyser (défaut: 30)',
                        ],
                    ],
                    'required' => [],
                ],
            ],
            [
                'name' => 'get_stock_levels',
                'description' => 'Obtient les niveaux de stock des produits',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'product_name' => [
                            'type' => 'string',
                            'description' => 'Nom du produit à filtrer (optionnel)',
                        ],
                    ],
                    'required' => [],
                ],
            ],
            [
                'name' => 'get_alerts',
                'description' => 'Obtient les alertes de stock actives (ruptures, stocks bas)',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [],
                    'required' => [],
                ],
            ],
            [
                'name' => 'get_top_products',
                'description' => 'Obtient les meilleurs produits par chiffre affaires',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'Nombre de produits à retourner (défaut: 10)',
                        ],
                        'days' => [
                            'type' => 'integer',
                            'description' => 'Nombre de jours à analyser (défaut: 30)',
                        ],
                    ],
                    'required' => [],
                ],
            ],
        ];

        $response = self::client()->messages->create(
            model: 'claude-haiku-4-5',
            maxTokens: 1024,
            system: $systemPrompt,
            tools: $tools,
            messages: $messages,
        );

        // Cap tool round-trips: an unbounded loop would let a single HTTP request trigger
        // unlimited Anthropic API calls (each resending the growing message history),
        // making one request arbitrarily expensive regardless of the per-minute throttle.
        $maxToolRounds = 5;
        $toolRounds = 0;

        while ($response->stopReason === 'tool_use' && $toolRounds < $maxToolRounds) {
            $toolRounds++;
            $toolUseBlock = collect($response->content)->firstWhere('type', 'tool_use');

            $toolResult = self::executeTool(
                $toolUseBlock->name,
                $toolUseBlock->input,
                $shopIds,
            );

            $messages[] = [
                'role' => 'assistant',
                'content' => $response->content,
            ];

            $messages[] = [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'tool_result',
                        'tool_use_id' => $toolUseBlock->id,
                        'content' => $toolResult,
                    ],
                ],
            ];

            $response = self::client()->messages->create(
                model: 'claude-haiku-4-5',
                maxTokens: 1024,
                system: $systemPrompt,
                tools: $tools,
                messages: $messages,
            );
        }

        $textBlock = collect($response->content)->firstWhere('type', 'text');
        return $textBlock?->text ?? 'Je n\'ai pas pu générer une réponse.';
    }

    private static function buildMessages(array $history, string $message): array
    {
        $messages = [];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => $msg['content'] ?? '',
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        return $messages;
    }

    private static function executeTool(string $toolName, mixed $input, array $shopIds): string
    {
        return match ($toolName) {
            'get_sales_summary' => self::getSalesSummary($input, $shopIds),
            'get_stock_levels' => self::getStockLevels($input, $shopIds),
            'get_alerts' => self::getAlerts($shopIds),
            'get_top_products' => self::getTopProducts($input, $shopIds),
            default => 'Outil inconnu',
        };
    }

    private static function getSalesSummary(mixed $input, array $shopIds): string
    {
        $days = $input->days ?? 30;
        $startDate = now()->subDays($days)->startOfDay();

        $sales = Sale::whereIn('shop_id', $shopIds)
            ->where('status', 'completed')
            ->where('sale_date', '>=', $startDate)
            ->get();

        if ($sales->isEmpty()) {
            return 'Aucune vente trouvée pour la période.';
        }

        $totalRevenue = $sales->sum('total');
        $saleCount = $sales->count();
        $avgBasket = $totalRevenue / $saleCount;

        return json_encode([
            'period_days' => $days,
            'total_revenue' => round($totalRevenue, 2),
            'sale_count' => $saleCount,
            'average_basket' => round($avgBasket, 2),
            'currency' => 'XOF',
        ], JSON_UNESCAPED_UNICODE);
    }

    private static function getStockLevels(mixed $input, array $shopIds): string
    {
        $query = Product::whereIn('shop_id', $shopIds);

        if (isset($input->product_name) && !empty($input->product_name)) {
            $query->where('name', 'like', "%{$input->product_name}%");
        }

        $products = $query->limit(20)->get([
            'id',
            'name',
            'stock_quantity',
            'sku',
        ]);

        if ($products->isEmpty()) {
            return 'Aucun produit trouvé.';
        }

        return json_encode($products->toArray(), JSON_UNESCAPED_UNICODE);
    }

    private static function getAlerts(array $shopIds): string
    {
        $alerts = Alert::whereIn('shop_id', $shopIds)
            ->where('is_active', true)
            ->with('product:id,name')
            ->limit(20)
            ->get(['id', 'product_id', 'alert_type', 'threshold', 'is_active']);

        if ($alerts->isEmpty()) {
            return 'Aucune alerte active.';
        }

        return json_encode($alerts->toArray(), JSON_UNESCAPED_UNICODE);
    }

    private static function getTopProducts(mixed $input, array $shopIds): string
    {
        $limit = $input->limit ?? 10;
        $days = $input->days ?? 30;
        $startDate = now()->subDays($days)->startOfDay();

        $topProducts = Sale::whereIn('shop_id', $shopIds)
            ->where('status', 'completed')
            ->where('sale_date', '>=', $startDate)
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select('products.id', 'products.name')
            ->selectRaw('SUM(sale_items.quantity * sale_items.unit_price) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        if ($topProducts->isEmpty()) {
            return 'Aucun produit vendu pour la période.';
        }

        return json_encode($topProducts->toArray(), JSON_UNESCAPED_UNICODE);
    }
}
