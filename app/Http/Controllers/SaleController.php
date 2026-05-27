<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $activeShopId = get_active_shop_id();
        $shopId        = $request->input('shop_id');
        $status        = $request->input('status');
        $search        = $request->input('search');
        $paymentMethod = $request->input('payment_method');
        $dateFrom      = $request->input('date_from');
        $dateTo        = $request->input('date_to');
        $creditOnly    = $request->boolean('credit_only');

        $shops   = $user->accessibleShops();
        $shopIds = $shops->pluck('id');

        $query = Sale::with(['shop', 'user', 'customer'])
            ->whereIn('shop_id', $shopIds)
            ->orderBy('sale_date', 'desc');

        // Les caissiers ne voient que leurs propres ventes
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $query->where('user_id', $user->id);
        }

        // Filtrer par boutique active si sélectionnée
        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId) {
            $query->where('shop_id', $shopId);
        }

        if ($status) {
            $query->where('status', $status);
        } else {
            // Par défaut : masquer les ventes annulées
            $query->where('status', '!=', 'cancelled');
        }

        if ($paymentMethod) {
            $query->where('payment_method', $paymentMethod);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom) {
            $query->whereDate('sale_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('sale_date', '<=', $dateTo);
        }

        if ($creditOnly) {
            $query->where('remaining_amount', '>', 0);
        }

        $sales = $query->paginate(20)->withQueryString();

        // Calculer les statistiques en fonction de la boutique active
        $statsQuery = Sale::where('status', 'completed')
            ->whereIn('shop_id', $shopIds);

        // Requête séparée pour les créances (pending avec remaining_amount > 0)
        $creditQuery = Sale::whereIn('status', ['pending', 'completed'])
            ->where('remaining_amount', '>', 0)
            ->whereIn('shop_id', $shopIds);

        // Les caissiers ne voient que leurs propres stats
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $statsQuery->where('user_id', $user->id);
            $creditQuery->where('user_id', $user->id);
        }

        if ($activeShopId) {
            $statsQuery->where('shop_id', $activeShopId);
            $creditQuery->where('shop_id', $activeShopId);
        }

        $stats = [
            'total_revenue'          => $statsQuery->sum('total'),
            'total_sales'            => $statsQuery->count(),
            'total_credit_remaining' => $creditQuery->sum('remaining_amount'),
            'total_credit_sales'     => $creditQuery->count(),
        ];

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'shops'   => $shops,
            'filters' => $request->only(['search', 'status', 'shop_id', 'payment_method', 'date_from', 'date_to', 'credit_only']),
            'stats'   => $stats,
        ]);
    }

    public function create(): Response
    {
        $activeShopId = get_active_shop_id();
        
        if (!$activeShopId) {
            return redirect()->route('shops.index')
                ->with('error', 'Veuillez sélectionner une boutique active.');
        }
        
        $shops = Auth::user()->accessibleShops();
        
        $customers = Customer::where('shop_id', $activeShopId)->get();
        
        $products = Product::where('shop_id', $activeShopId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with(['variations' => fn($q) => $q->where('is_active', true)->orderBy('name')])
            ->get();

        return Inertia::render('Sales/Create', [
            'shops' => $shops,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id'            => 'required|exists:shops,id',
            'customer_id'        => 'nullable|exists:customers,id',
            'payment_method'     => 'required|in:cash,card,transfer,check,mobile,multiple,credit',
            'amount_paid'        => 'required|numeric|min:0',
            'discount_amount'    => 'nullable|numeric|min:0',
            'credit_due_date'    => 'nullable|date|after_or_equal:today',
            'notes'              => 'nullable|string',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);

        $sale = DB::transaction(function () use ($validated, $shop) {
            $items = $validated['items'];
            unset($validated['items']);

            $validated['user_id'] = Auth::id();

            // Calculer les montants pour déterminer le reste à payer
            $subtotal = 0;
            $taxAmount = 0;
            $productItems = [];

            foreach ($items as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $lineTotal = $itemData['unit_price'] * $itemData['quantity'];
                $lineTax   = $lineTotal * ($product->tax_rate ?? 0) / 100;
                $subtotal  += $lineTotal;
                $taxAmount += $lineTax;
                $productItems[] = array_merge($itemData, ['product' => $product, 'line_total' => $lineTotal, 'line_tax' => $lineTax]);
            }

            $discount  = (float) ($validated['discount_amount'] ?? 0);
            $total     = $subtotal + $taxAmount - $discount;
            $amountPaid = (float) $validated['amount_paid'];
            $remaining = max(0, $total - $amountPaid);
            $change    = max(0, $amountPaid - $total);

            // Vente à crédit si reste > 0
            $validated['status']           = $remaining > 0 ? 'pending' : 'completed';
            $validated['subtotal']         = $subtotal;
            $validated['tax_amount']       = $taxAmount;
            $validated['discount_amount']  = $discount;
            $validated['total']            = $total;
            $validated['change_amount']    = $change;
            $validated['remaining_amount'] = $remaining;

            // credit_due_date seulement si vente à crédit
            if ($remaining <= 0) {
                $validated['credit_due_date'] = null;
            }

            $sale = $shop->sales()->create($validated);

            foreach ($productItems as $itemData) {
                $product = $itemData['product'];

                // Si c'est une déclinaison, charger le parent pour avoir le nom complet
                $parentName = null;
                if ($product->parent_id) {
                    $parent = $product->parent ?? Product::find($product->parent_id);
                    $parentName = $parent?->name;
                }

                $sale->items()->create([
                    'product_id'      => $product->id,
                    'product_name'    => $parentName ? "{$parentName} › {$product->name}" : $product->name,
                    'sku'             => $product->sku,
                    'quantity'        => $itemData['quantity'],
                    'unit_price'      => $itemData['unit_price'],
                    'tax_rate'        => $product->tax_rate ?? 0,
                    'discount_amount' => 0,
                ]);
            }

            return $sale;
        });

        ActivityLogger::created($sale, "Vente enregistrée: {$sale->ticket_number}");

        $msg = $sale->remaining_amount > 0
            ? "Vente à crédit enregistrée. Reste à payer : " . number_format($sale->remaining_amount, 0, ',', ' ') . " FCFA"
            : 'Vente enregistrée avec succès.';

        return redirect()->route('sales.show', [
            'code_user' => request()->route('code_user'),
            'sale' => $sale->id,
            'print' => '1'
        ])->with('success', $msg);
    }

    /**
     * Encaisser tout ou partie du reste dû sur une vente à crédit.
     */
    public function payCredit(Request $request, string $code_user, Sale $sale)
    {
        if ($sale->shop->user_id !== Auth::id() && !Auth::user()->accessibleShopsQuery()->where('id', $sale->shop_id)->exists()) {
            abort(403);
        }

        if ($sale->remaining_amount <= 0) {
            return back()->with('error', 'Cette vente n\'a pas de reste à payer.');
        }

        $validated = $request->validate([
            'payment_amount'  => "required|numeric|min:0.01|max:{$sale->remaining_amount}",
            'payment_method'  => 'required|in:cash,card,transfer,check,mobile',
            'notes'           => 'nullable|string',
        ]);

        $newRemaining = round($sale->remaining_amount - $validated['payment_amount'], 2);

        $sale->update([
            'amount_paid'      => $sale->amount_paid + $validated['payment_amount'],
            'remaining_amount' => $newRemaining,
            'status'           => $newRemaining <= 0 ? 'completed' : 'pending',
            'notes'            => $sale->notes
                ? $sale->notes . "\n[Paiement crédit " . now()->format('d/m/Y') . ": " . number_format($validated['payment_amount'], 0, ',', ' ') . " via " . $validated['payment_method'] . "]"
                : "[Paiement crédit " . now()->format('d/m/Y') . ": " . number_format($validated['payment_amount'], 0, ',', ' ') . " via " . $validated['payment_method'] . "]",
        ]);

        $msg = $newRemaining <= 0
            ? 'Vente soldée. Paiement complet enregistré.'
            : 'Paiement partiel enregistré. Reste à payer : ' . number_format($newRemaining, 0, ',', ' ') . ' FCFA';

        return back()->with('success', $msg);
    }

    public function show(string $code_user, Sale $sale)
    {
        $sale->load(['shop', 'user', 'customer', 'items.product.parent', 'items.returns', 'returns']);

        // Enrichir le product_name des anciens items de déclinaisons qui ne l'ont pas encore
        $sale->items->each(function ($item) {
            if ($item->product && $item->product->parent_id && !str_contains($item->product_name, ' › ')) {
                $item->product_name = "{$item->product->parent->name} › {$item->product->name}";
            }
        });

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    public function destroy(string $code_user, Sale $sale)
    {
        $user = Auth::user();
        $isAdmin = in_array($user->role, ['super_admin', 'manager']);

        // Vérifier que la boutique de la vente est accessible par cet utilisateur
        $accessibleShopIds = $user->accessibleShopsQuery()->pluck('id');
        if (!$accessibleShopIds->contains($sale->shop_id)) {
            abort(403);
        }

        // Les caissiers ne peuvent pas annuler de ventes
        if (in_array($user->role, ['cashier', 'caisse'])) {
            return back()->with('error', 'Vous n\'avez pas l\'autorisation d\'annuler des ventes.');
        }

        // Les non-admins ne peuvent annuler que les ventes du jour
        if (!$isAdmin && !$sale->sale_date->isToday()) {
            return back()->with('error', 'Vous ne pouvez annuler que les ventes du jour. Contactez un administrateur pour les ventes plus anciennes.');
        }

        // Impossible d'annuler une vente déjà annulée
        if ($sale->status === 'cancelled') {
            return back()->with('error', 'Cette vente est déjà annulée.');
        }

        DB::transaction(function () use ($sale) {
            // Remettre le stock uniquement si la vente n'était pas déjà retournée
            if ($sale->status !== 'returned') {
                foreach ($sale->items as $item) {
                    if ($item->product && $item->product->track_stock) {
                        $item->product->increment('stock_quantity', $item->quantity);
                    }
                }
            }

            $sale->update(['status' => 'cancelled']);
        });

        return redirect()->route('sales.index', ['code_user' => $code_user])
            ->with('success', 'Vente ' . $sale->ticket_number . ' annulée avec succès.');
    }

    public function restore(string $code_user, Sale $sale)
    {
        $user = Auth::user();

        // Seuls les admins peuvent réactiver une vente
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            return back()->with('error', 'Seul un administrateur peut réactiver une vente.');
        }

        // Vérifier que la boutique est accessible
        $accessibleShopIds = $user->accessibleShopsQuery()->pluck('id');
        if (!$accessibleShopIds->contains($sale->shop_id)) {
            abort(403);
        }

        // Seules les ventes annulées peuvent être réactivées
        if ($sale->status !== 'cancelled') {
            return back()->with('error', 'Seules les ventes annulées peuvent être réactivées.');
        }

        DB::transaction(function () use ($sale) {
            // Redéduire le stock (l'annulation l'avait remis)
            foreach ($sale->items as $item) {
                if ($item->product && $item->product->track_stock) {
                    $item->product->decrement('stock_quantity', $item->quantity);
                }
            }

            $sale->update(['status' => 'completed']);
        });

        return redirect()->route('sales.index', ['code_user' => $code_user])
            ->with('success', 'Vente ' . $sale->ticket_number . ' réactivée avec succès.');
    }
}
