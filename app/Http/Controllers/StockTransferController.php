<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockTransfer;
use App\Services\ActivityLogger;
use App\Services\StockTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
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

    /**
     * L'accueil du module : deux actions (rééquilibrer, nouveau transfert) et la liste des
     * transferts. Les suggestions et le choix des produits ont leur propre écran : tout
     * empiler ici faisait une page de plusieurs milliers de lignes sur un vrai catalogue.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $shops = $this->shops();
        $shopIds = $shops->pluck('id');

        $acting = $this->actingShopId();
        $status = $request->input('status', 'in_transit');
        $list = StockTransfer::with(['fromShop:id,name', 'toShop:id,name', 'user:id,name', 'receiver:id,name', 'items'])
            ->where(fn ($q) => $q->whereIn('from_shop_id', $shopIds)->orWhereIn('to_shop_id', $shopIds))
            ->when(in_array($status, ['in_transit', 'received', 'cancelled'], true), fn ($q) => $q->where('status', $status))
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            // Les mêmes règles que receive() et cancel() : n'afficher que les boutons utiles.
            ->through(fn ($transfer) => $transfer->setAttribute('can_receive', $transfer->status === 'in_transit' && (int) $transfer->to_shop_id === $acting)
                ->setAttribute('can_cancel', $transfer->status === 'in_transit' && (int) $transfer->from_shop_id === $acting));

        return Inertia::render('StockTransfers/Index', [
            'transfers' => $list,
            'canSend' => $shops->count() >= 2,
            // Le nombre seulement : le détail est sur l'écran Rééquilibrer.
            'rebalanceCount' => $this->canRebalance($shops) ? count($this->transfers->suggestions($shops)) : null,
            'inTransitCount' => StockTransfer::whereIn('to_shop_id', $shopIds)->where('status', 'in_transit')->count(),
            'filters' => (object) ['status' => $status],
        ]);
    }

    /**
     * Les suggestions, un trajet à la fois (de telle boutique vers telle autre), 25 par
     * page, les plus urgentes d'abord, avec une recherche par produit.
     */
    public function rebalance(Request $request): Response
    {
        $shops = $this->shops();
        abort_unless($this->canRebalance($shops), 403);

        $all = collect($this->transfers->suggestions($shops));

        $routes = $all->groupBy(fn ($s) => $s['from_shop_id'] . '-' . $s['to_shop_id'])
            ->map(fn ($group) => [
                'from_shop_id' => $group->first()['from_shop_id'],
                'from_shop' => $group->first()['from_shop'],
                'to_shop_id' => $group->first()['to_shop_id'],
                'to_shop' => $group->first()['to_shop'],
                'count' => $group->count(),
            ])->sortByDesc('count')->values();

        $from = (int) $request->input('from', $routes->first()['from_shop_id'] ?? 0);
        $to = (int) $request->input('to', $routes->first()['to_shop_id'] ?? 0);
        $search = trim((string) $request->input('q', ''));

        $matching = $all->filter(fn ($s) => $s['from_shop_id'] === $from && $s['to_shop_id'] === $to)
            ->when($search !== '', fn ($c) => $c->filter(fn ($s) => mb_stripos($s['product'], $search) !== false))
            ->values();

        $page = max(1, (int) $request->input('page', 1));
        $suggestions = new LengthAwarePaginator(
            $matching->forPage($page, 25)->values(),
            $matching->count(),
            25,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('StockTransfers/Rebalance', [
            'routes' => $routes,
            'route' => ['from' => $from, 'to' => $to],
            'suggestions' => $suggestions,
            'filters' => (object) ['q' => $search],
        ]);
    }

    /**
     * Un transfert à la main. Les produits ne sont envoyés qu'à la recherche (20 au plus) :
     * une liste déroulante de tout le catalogue en comptait plus de 3 000.
     */
    public function create(Request $request): Response
    {
        $shops = $this->shops();
        abort_unless($shops->count() >= 2, 403);

        $fromShopId = (int) $request->input('from_shop_id', $shops->first()->id);
        abort_unless($shops->pluck('id')->contains($fromShopId), 403);

        $search = trim((string) $request->input('q', ''));
        $products = $search === '' ? collect() : Product::where('shop_id', $fromShopId)
            ->where('track_stock', true)->where('has_variations', false)->where('stock_quantity', '>', 0)
            ->where(fn ($q) => $q->whereContains('name', $search)->orWhereContains('sku', $search))
            ->orderBy('name')->limit(20)
            ->get(['id', 'name', 'sku', 'stock_quantity']);

        return Inertia::render('StockTransfers/Create', [
            // Pas « shops » : ce nom est la prop partagée dont se servent le menu et le
            // sélecteur de boutique, qui n'affichaient plus « aucune boutique ».
            'shopChoices' => $shops,
            'products' => $products,
            'filters' => (object) ['from_shop_id' => $fromShopId, 'q' => $search],
        ]);
    }

    /**
     * La boutique au nom de laquelle on agit : la boutique active (sélecteur de l'en-tête),
     * à défaut celle de l'utilisateur. Le propriétaire a accès aux deux boutiques d'un
     * transfert : sans cette règle, la boutique qui envoie se voyait proposer de réceptionner.
     */
    private function actingShopId(): ?int
    {
        $user = Auth::user();

        foreach ([get_active_shop_id(), $user->shop_id] as $id) {
            if ($id && $user->accessibleShopsQuery()->whereKey($id)->exists()) {
                return (int) $id;
            }
        }

        return null;
    }

    private function shops()
    {
        return Auth::user()->accessibleShopsQuery()->orderBy('name')->get(['shops.id', 'shops.name']);
    }

    /** Rééquilibrer suppose de voir toutes les boutiques : le propriétaire seulement. */
    private function canRebalance($shops): bool
    {
        return Auth::user()->role === 'super_admin' && $shops->count() >= 2;
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
        // Réceptionner revient à la boutique qui reçoit : celle sur laquelle on se trouve.
        abort_unless($this->actingShopId() === (int) $stockTransfer->to_shop_id, 403);

        $this->transfers->receive($stockTransfer, $user);
        ActivityLogger::message('update', 'stock_transfer_received', ['reference' => $stockTransfer->reference], $stockTransfer);

        return back()->with('success', "Transfert {$stockTransfer->reference} réceptionné : le stock est entré.");
    }

    public function cancel(string $codeUser, StockTransfer $stockTransfer): RedirectResponse
    {
        $user = Auth::user();
        // Annuler revient à la boutique qui a envoyé : celle sur laquelle on se trouve.
        abort_unless($this->actingShopId() === (int) $stockTransfer->from_shop_id, 403);

        $this->transfers->cancel($stockTransfer, $user);
        ActivityLogger::message('update', 'stock_transfer_cancelled', ['reference' => $stockTransfer->reference], $stockTransfer);

        return back()->with('success', "Transfert {$stockTransfer->reference} annulé : le stock est revenu à l'origine.");
    }
}
