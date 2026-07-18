<?php

namespace App\Services;

use Anthropic\Client;
use App\Services\Mcp\McpClient;

/**
 * Assistant IA interne. Ne définit ni n'exécute plus aucun tool localement : il agit
 * comme un client MCP et délègue toutes ses lectures métier à la passerelle BATIXPRO
 * (App\Services\Mcp\McpClient). La liste des tools est découverte dynamiquement via
 * `tools/list`, et leur exécution passe par `tools/call`. Une source unique de tools
 * et de sécurité, partagée avec les assistants externes.
 */
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
        // Token Sanctum éphémère : porte exactement les abilities de lecture dont le
        // MCP a besoin, révoqué en fin de requête (voir finally). Le MCP le transfère
        // verbatim à l'API v1, qui applique le scoping tenant.
        $token = $user->createToken(
            'ai-chat-mcp',
            ['products:read', 'customers:read', 'sales:read', 'stock-movements:read'],
            now()->addMinutes(10),
        );

        try {
            $mcp = new McpClient(config('services.batixpro_mcp.url'), $token->plainTextToken);
            $mcp->initialize();
            $tools = $mcp->listTools();

            return self::runConversation($message, $history, $shopIds, $user, $shopName, $mcp, $tools);
        } finally {
            $token->accessToken->delete();
        }
    }

    /**
     * @param  array<int, array>  $tools  Définitions de tools au format Anthropic (via MCP).
     * @param  array<int>  $shopIds
     */
    private static function runConversation(
        string $message,
        array $history,
        array $shopIds,
        object $user,
        string $shopName,
        McpClient $mcp,
        array $tools,
    ): string {
        $messages = self::buildMessages($history, $message);

        $systemPrompt = "Tu es un assistant IA expert en gestion de commerce pour Batix SaaS.
                    - La boutique actuelle est: $shopName
                    - La date actuelle est: " . date('Y-m-d H:i:s') . "
                    - Le rôle de l'utilisateur est: {$user->role}

                    Réponds TOUJOURS en français.
                    Utilise les outils pour récupérer les données métier fraîches plutôt que de répondre de mémoire.
                    Fournis des réponses concises et actionnables.";

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

            // On force la boutique sélectionnée : l'assistant reste cantonné à la
            // boutique courante (les tools ignorant shop_id le laissent simplement tomber).
            $arguments = (array) $toolUseBlock->input;
            $arguments['shop_id'] = $shopIds[0];

            $toolResult = $mcp->callTool($toolUseBlock->name, $arguments);

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
}
