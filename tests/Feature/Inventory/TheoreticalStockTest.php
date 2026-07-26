<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use App\Services\InventoryAnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le stock théorique est reconstruit, et non affirmé :
 *
 *     théorique = dernier comptage + reçu depuis − vendu depuis
 *
 * Le but n'est pas d'obtenir un nombre différent de `products.stock_quantity` — les deux doivent
 * coïncider — mais de pouvoir les comparer. Un écart signale que le compteur et l'historique se
 * contredisent, ce que `stock:audit` ne dirait que le lundi suivant.
 */
class TheoreticalStockTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->user->id]);
        $this->user->update(['shop_id' => $this->shop->id]);
        $this->user = $this->user->fresh();
    }

    private function product(int $stock): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => $stock,
            'is_active' => true,
            'parent_id' => null,
        ]);
    }

    /** Un inventaire appliqué qui a réellement compté ce produit. */
    private function countedAt(Product $product, int $quantity, $when): Inventory
    {
        $inventory = Inventory::create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->user->id,
            'inventory_date' => $when->toDateString(),
            'status' => 'completed',
            'completed_at' => $when,
        ]);

        InventoryItem::create([
            'inventory_id' => $inventory->id,
            'product_id' => $product->id,
            'expected_quantity' => $quantity,
            'counted_quantity' => $quantity,
            'unit_cost' => 1,
        ]);

        return $inventory;
    }

    private function sell(Product $product, int $quantity, $when): void
    {
        $sale = Sale::create([
            'shop_id' => $this->shop->id, 'user_id' => $this->user->id,
            'ticket_number' => 'TCK-' . uniqid(), 'sale_date' => $when, 'total' => 1,
        ]);
        SaleItem::create([
            'sale_id' => $sale->id, 'product_id' => $product->id,
            'product_name' => $product->name, 'quantity' => $quantity,
            'unit_price' => 1, 'total' => $quantity,
        ]);
        $sale->items()->update(['created_at' => $when]);
    }

    private function receive(Product $product, int $quantity, $when): void
    {
        $purchase = Purchase::create([
            'shop_id' => $this->shop->id,
            'supplier_id' => Supplier::create(['shop_id' => $this->shop->id, 'name' => 'F'])->id,
            'user_id' => $this->user->id,
            'reference' => 'PO-' . uniqid(),
            'status' => 'received',
            'order_date' => $when,
            'received_date' => $when,
        ]);
        PurchaseItem::create([
            'purchase_id' => $purchase->id, 'product_id' => $product->id,
            'product_name' => $product->name, 'quantity_ordered' => $quantity,
            'quantity_received' => $quantity, 'unit_price' => 1, 'total' => $quantity,
        ]);
    }

    /**
     * Fixer le compteur système, après coup.
     *
     * Créer une ligne de vente décrémente `products.stock_quantity` (mouvement de stock) : le
     * compteur bougerait donc sous les assertions. On le pose explicitement à la fin, ce qui dit
     * clairement ce que le test veut éprouver — « le compteur affirme X ».
     *
     * Par le query builder, et non `$product->update()` : l'instance en mémoire ignore la
     * décrémentation faite en base, donc réaffecter la même valeur qu'à la création ne serait pas
     * vu comme un changement et n'écrirait rien.
     */
    private function counterSays(Product $product, int $quantity): void
    {
        Product::whereKey($product->id)->update(['stock_quantity' => $quantity]);
    }

    private function enrich(Product ...$products): array
    {
        return InventoryAnalysisService::enrichProductsWithMovements(
            Product::with('shop')->whereIn('id', collect($products)->pluck('id'))->get(),
            $this->shop->id
        );
    }

    public function test_the_theoretical_stock_is_derived_from_the_last_count(): void
    {
        $product = $this->product(stock: 118);

        $this->countedAt($product, 100, now()->subDays(10));
        $this->receive($product, 30, now()->subDays(5));
        $this->sell($product, 12, now()->subDays(2));

        // 100 comptés, +30 reçus, −12 vendus : le compteur est d'accord.
        $this->counterSays($product, 118);

        $row = $this->enrich($product)[0];

        $this->assertSame(100, $row['last_counted_quantity']);
        $this->assertSame(30, $row['purchased_since_last_inventory']);
        $this->assertSame(12, $row['sold_since_last_inventory']);
        $this->assertSame(118, $row['theoretical_stock']);
        $this->assertSame(0, $row['ledger_drift']);
    }

    /** Le cas qui justifie tout : le compteur et l'historique ne racontent pas la même chose. */
    public function test_a_drift_between_the_counter_and_the_ledger_is_reported(): void
    {
        $product = $this->product(stock: 115);

        $this->countedAt($product, 100, now()->subDays(10));
        $this->receive($product, 30, now()->subDays(5));
        $this->sell($product, 12, now()->subDays(2));

        // Le compteur dit 115 là où l'historique conclut à 118.
        $this->counterSays($product, 115);

        $row = $this->enrich($product)[0];

        $this->assertSame(118, $row['theoretical_stock']);
        $this->assertSame(3, $row['ledger_drift']);
    }

    public function test_without_a_previous_count_the_counter_is_the_only_reference(): void
    {
        $product = $this->product(stock: 42);

        $row = $this->enrich($product)[0];

        $this->assertNull($row['last_counted_quantity']);
        $this->assertNull($row['last_counted_at']);
        $this->assertSame(42, $row['theoretical_stock']);
        $this->assertSame(0, $row['ledger_drift']);
    }

    /**
     * La borne est prise par produit, à son dernier comptage. Sans quoi compter une allée
     * remettrait à zéro la fenêtre de toutes les autres — or l'inventaire partiel est devenu un
     * cas normal depuis que « pas compté » se distingue de « compté zéro ».
     */
    public function test_each_product_has_its_own_window(): void
    {
        $recent = $this->product(stock: 50);
        $old = $this->product(stock: 20);

        $this->countedAt($old, 15, now()->subDays(30));
        $this->countedAt($recent, 45, now()->subDays(2));

        // Ventes intercalées : postérieures au vieux comptage, antérieures au récent.
        $this->sell($old, 5, now()->subDays(10));
        $this->sell($recent, 7, now()->subDays(10));

        $rows = collect($this->enrich($recent, $old))->keyBy('id');

        // Le produit compté récemment ignore la vente d'il y a dix jours.
        $this->assertSame(0, $rows[$recent->id]['sold_since_last_inventory']);
        $this->assertSame(45, $rows[$recent->id]['theoretical_stock']);

        // Celui compté il y a un mois la prend en compte.
        $this->assertSame(5, $rows[$old->id]['sold_since_last_inventory']);
        $this->assertSame(10, $rows[$old->id]['theoretical_stock']);
    }

    /** Un comptage plus récent remplace le précédent comme point de départ. */
    public function test_the_most_recent_count_wins(): void
    {
        $product = $this->product(stock: 80);

        $this->countedAt($product, 100, now()->subDays(20));
        $this->countedAt($product, 80, now()->subDays(3));
        $this->sell($product, 4, now()->subDays(10));

        $row = $this->enrich($product)[0];

        $this->assertSame(80, $row['last_counted_quantity']);
        // La vente précède le dernier comptage : elle est déjà dedans.
        $this->assertSame(0, $row['sold_since_last_inventory']);
        $this->assertSame(80, $row['theoretical_stock']);
    }

    /** Un inventaire non appliqué ne borne rien : il n'a rien ajusté. */
    public function test_a_draft_count_is_not_a_starting_point(): void
    {
        $product = $this->product(stock: 30);

        $draft = Inventory::create([
            'shop_id' => $this->shop->id, 'user_id' => $this->user->id,
            'inventory_date' => now()->toDateString(), 'status' => 'draft',
        ]);
        InventoryItem::create([
            'inventory_id' => $draft->id, 'product_id' => $product->id,
            'expected_quantity' => 30, 'counted_quantity' => 30, 'unit_cost' => 1,
        ]);

        $row = $this->enrich($product)[0];

        $this->assertNull($row['last_counted_quantity']);
        $this->assertSame(30, $row['theoretical_stock']);
    }

    /** Une ligne laissée vide dans un inventaire appliqué ne borne pas non plus. */
    public function test_an_uncounted_line_is_not_a_starting_point(): void
    {
        $product = $this->product(stock: 30);

        $inventory = Inventory::create([
            'shop_id' => $this->shop->id, 'user_id' => $this->user->id,
            'inventory_date' => now()->toDateString(), 'status' => 'completed',
            'completed_at' => now()->subDay(),
        ]);
        InventoryItem::create([
            'inventory_id' => $inventory->id, 'product_id' => $product->id,
            'expected_quantity' => 30, 'counted_quantity' => null, 'unit_cost' => 1,
        ]);

        $row = $this->enrich($product)[0];

        $this->assertNull($row['last_counted_quantity']);
    }
}
