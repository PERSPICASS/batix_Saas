<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Shop;
use App\Models\User;
use App\Services\InventoryAnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Numérotation des inventaires, et fenêtre « depuis le dernier inventaire ».
 *
 * Le numéro se déduisait du dernier émis TOUTES BOUTIQUES CONFONDUES, sur une colonne unique
 * globalement : la numérotation d'une boutique était à trous, et ces trous laissaient deviner
 * l'activité des autres comptes. Les factures, devis et avoirs sont par boutique depuis
 * 4f63f0f ; l'inventaire était resté seul.
 */
class InventoryNumberingTest extends TestCase
{
    use RefreshDatabase;

    private function shopOf(User $user): Shop
    {
        return Shop::factory()->create(['user_id' => $user->id]);
    }

    private function inventoryIn(Shop $shop, User $user, string $status = 'draft'): Inventory
    {
        return Inventory::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'inventory_date' => now()->toDateString(),
            'status' => $status,
            'completed_at' => $status === 'completed' ? now() : null,
        ]);
    }

    public function test_each_shop_numbers_its_inventories_from_one(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $first = $this->shopOf($user);
        $second = $this->shopOf($user);

        $a = $this->inventoryIn($first, $user);
        $b = $this->inventoryIn($first, $user);
        $c = $this->inventoryIn($second, $user);

        $month = now()->format('Ym');

        $this->assertSame("INV-{$month}0001", $a->inventory_number);
        $this->assertSame("INV-{$month}0002", $b->inventory_number);
        // Auparavant : 0003, parce que le compteur ignorait la boutique.
        $this->assertSame("INV-{$month}0001", $c->inventory_number);
    }

    public function test_two_shops_may_share_the_same_number(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        $this->inventoryIn($this->shopOf($user), $user);
        $this->inventoryIn($this->shopOf($user), $user);

        // La contrainte est désormais (shop_id, inventory_number) : le même numéro dans deux
        // boutiques n'est pas un conflit. Sous l'ancienne unicité globale, ceci échouait.
        $this->assertSame(2, Inventory::where('inventory_number', 'INV-' . now()->format('Ym') . '0001')->count());
    }

    /**
     * La fenêtre part de `completed_at`, l'instant où les stocks ont été ajustés, et non de
     * `inventory_date`, une date saisie à la main. Comparer à une date écartait tout un jour de
     * ventes : celles passées après le comptage, le jour même du comptage.
     */
    public function test_sales_made_after_the_count_on_the_same_day_are_counted(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = $this->shopOf($user);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'parent_id' => null]);

        $this->travelTo(now()->startOfDay()->addHours(9));
        $inventory = $this->inventoryIn($shop, $user, 'completed');

        // Même jour, deux heures après l'ajustement.
        $this->travelTo(now()->addHours(2));
        $sale = Sale::create([
            'shop_id' => $shop->id, 'user_id' => $user->id,
            'ticket_number' => 'TCK-1', 'sale_date' => now(), 'total' => 10,
        ]);
        SaleItem::create([
            'sale_id' => $sale->id, 'product_id' => $product->id,
            'product_name' => $product->name, 'quantity' => 4,
            'unit_price' => 2.5, 'total' => 10,
        ]);

        $enriched = InventoryAnalysisService::enrichProductsWithMovements(
            Product::with('shop')->where('id', $product->id)->get(),
            $shop->id
        );

        $this->assertSame(4, $enriched[0]['sold_since_last_inventory']);
    }

    public function test_sales_made_before_the_last_count_are_excluded(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = $this->shopOf($user);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'parent_id' => null]);

        $this->travelTo(now()->startOfDay()->addHours(8));
        $sale = Sale::create([
            'shop_id' => $shop->id, 'user_id' => $user->id,
            'ticket_number' => 'TCK-2', 'sale_date' => now(), 'total' => 10,
        ]);
        SaleItem::create([
            'sale_id' => $sale->id, 'product_id' => $product->id,
            'product_name' => $product->name, 'quantity' => 4,
            'unit_price' => 2.5, 'total' => 10,
        ]);

        $this->travelTo(now()->addHours(3));
        $this->inventoryIn($shop, $user, 'completed');

        $enriched = InventoryAnalysisService::enrichProductsWithMovements(
            Product::with('shop')->where('id', $product->id)->get(),
            $shop->id
        );

        $this->assertSame(0, $enriched[0]['sold_since_last_inventory']);
    }

    /** Un inventaire non terminé ne ferme pas la fenêtre : il n'a rien ajusté. */
    public function test_a_draft_inventory_does_not_close_the_window(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = $this->shopOf($user);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'parent_id' => null]);

        $sale = Sale::create([
            'shop_id' => $shop->id, 'user_id' => $user->id,
            'ticket_number' => 'TCK-3', 'sale_date' => now(), 'total' => 10,
        ]);
        SaleItem::create([
            'sale_id' => $sale->id, 'product_id' => $product->id,
            'product_name' => $product->name, 'quantity' => 6,
            'unit_price' => 2.5, 'total' => 15,
        ]);

        $this->travelTo(now()->addHour());
        $this->inventoryIn($shop, $user, 'draft');

        $enriched = InventoryAnalysisService::enrichProductsWithMovements(
            Product::with('shop')->where('id', $product->id)->get(),
            $shop->id
        );

        $this->assertSame(6, $enriched[0]['sold_since_last_inventory']);
    }
}
