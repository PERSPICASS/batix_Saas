<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockTransfer;
use App\Services\ActivityLogger;
use App\Services\StockTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Les transferts de stock entre les boutiques d'un compte (StockTransferService).
 *
 * Chacun voit les transferts qui partent de ses boutiques ou y arrivent : le propriétaire
 * tous, un gérant ceux de sa boutique — c'est lui qui réceptionne ce qui lui est envoyé.
 */
class StockTransferController extends Controller
{
    public function __construct(private StockTransferService $transfers) {}

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $shops = $user->accessibleShopsQuery()->orderBy('name')->get(['shops.id', 'shops.name']);
        $shopIds = $shops->pluck('id');

        $status = $request->input('status', 'in_transit');
        $list = StockTransfer::with(['fromShop:id,name', 'toShop:id,name', 'user:id,name', 'receiver:id,name', 'items'])
            ->where(fn ($q) => $q->whereIn('from_shop_id', $shopIds)->orWhereIn('to_shop_id', $shopIds))
            ->when(in_array($status, ['in_transit', 'received', 'cancelled'], true), fn ($q) => $q->where('status', $status))
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            // Les mêmes règles que receive() et cancel() : n'afficher que les boutons utiles.
            ->through(fn ($transfer) => $transfer->setAttribute('can_receive', $transfer->status === 'in_transit' && $shopIds->contains($transfer->to_shop_id))
                ->setAttribute('can_cancel', $transfer->status === 'in_transit' && $shopIds->contains($transfer->from_shop_id)));

        // Le transfert à la main part d'une boutique choisie : ses produits en stock.
        $fromShopId = (int) $request->input('from_shop_id', $shops->first()?->id);
        $sourceProducts = $shopIds->contains($fromShopId)
            ? Product::where('shop_id', $fromShopId)->where('track_stock', true)->where('has_variations', false)
                ->where('stock_quantity', '>', 0)->orderBy('name')
                ->get(['id', 'name', 'sku', 'stock_quantity'])
            : collect();

        return Inertia::render('StockTransfers/Index', [
            'transfers' => $list,
            'shops' => $shops,
            // Rééquilibrer suppose de voir toutes les boutiques : le propriétaire seulement.
            'suggestions' => $user->role === 'super_admin' && $shops->count() >= 2 ? $this->transfers->suggestions($shops) : [],
            'canSend' => $shops->count() >= 2,
            'sourceProducts' => $sourceProducts,
            'filters' => (object) ['status' => $status, 'from_shop_id' => $fromShopId],
        ]);
    }

    /**
     * Un transfert, ou plusieurs d'un coup depuis les suggestions (un par couple de
     * boutiques) : `transfers[] = {from_shop_id, to_shop_id, items[] = {product_id, quantity}}`.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'transfers' => 'required|array|min:1',
            'transfers.*.from_shop_id' => 'required|integer',
            'transfers.*.to_shop_id' => 'required|integer',
            'transfers.*.notes' => 'nullable|string|max:1000',
            'transfers.*.items' => 'required|array|min:1',
            'transfers.*.items.*.product_id' => 'required|integer',
            'transfers.*.items.*.quantity' => 'required|integer|min:1',
        ]);

        $accessible = $user->accessibleShopsQuery()->pluck('shops.id')->map(fn ($id) => (int) $id);

        $sent = DB::transaction(function () use ($validated, $accessible, $user) {
            $sent = [];
            foreach ($validated['transfers'] as $data) {
                // Les deux boutiques doivent être du compte : jamais un envoi vers ou depuis ailleurs.
                abort_unless($accessible->contains((int) $data['from_shop_id']) && $accessible->contains((int) $data['to_shop_id']), 403);

                $lines = [];
                foreach ($data['items'] as $item) {
                    $lines[(int) $item['product_id']] = ($lines[(int) $item['product_id']] ?? 0) + (int) $item['quantity'];
                }

                $sent[] = $this->transfers->send(
                    Shop::findOrFail($data['from_shop_id']),
                    Shop::findOrFail($data['to_shop_id']),
                    $lines,
                    $user,
                    $data['notes'] ?? null,
                );
            }

            return $sent;
        });

        foreach ($sent as $transfer) {
            ActivityLogger::created($transfer, $transfer->reference);
        }

        return redirect()
            ->route('stock-transfers.index', ['code_user' => $request->route('code_user')])
            ->with('success', count($sent) === 1
                ? "Transfert {$sent[0]->reference} envoyé : il attend sa réception."
                : count($sent) . ' transferts envoyés : ils attendent leur réception.');
    }

    public function receive(string $codeUser, StockTransfer $stockTransfer): RedirectResponse
    {
        $user = Auth::user();
        // Réceptionner revient à la boutique qui reçoit.
        abort_unless($user->accessibleShopsQuery()->whereKey($stockTransfer->to_shop_id)->exists(), 403);

        $this->transfers->receive($stockTransfer, $user);
        ActivityLogger::message('update', 'stock_transfer_received', ['reference' => $stockTransfer->reference], $stockTransfer);

        return back()->with('success', "Transfert {$stockTransfer->reference} réceptionné : le stock est entré.");
    }

    public function cancel(string $codeUser, StockTransfer $stockTransfer): RedirectResponse
    {
        $user = Auth::user();
        // Annuler revient à la boutique qui a envoyé.
        abort_unless($user->accessibleShopsQuery()->whereKey($stockTransfer->from_shop_id)->exists(), 403);

        $this->transfers->cancel($stockTransfer, $user);
        ActivityLogger::message('update', 'stock_transfer_cancelled', ['reference' => $stockTransfer->reference], $stockTransfer);

        return back()->with('success', "Transfert {$stockTransfer->reference} annulé : le stock est revenu à l'origine.");
    }
}
