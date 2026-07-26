<?php

namespace Tests\Feature\Stock;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * stock:audit confronts the counters to the ledger.
 *
 * products.stock_quantity says the state, stock_movements says how it was reached, and
 * nothing checked that the two told the same story — so drift was undetectable: you could
 * not see it, date it, or trace its cause. Run for the first time on the development
 * database, the command reported 3048 discrepancies.
 *
 * It never corrects a counter. Real stock is what sits on the shelves; rewriting a
 * quantity from the ledger would replace a doubtful figure with a wrong one.
 */
class StockAuditTest extends TestCase
{
    use RefreshDatabase;

    private function shopWithOwner(): Shop
    {
        $shop = Shop::factory()->create();
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->actingAs($user);

        return $shop->fresh();
    }

    public function test_a_counter_matching_its_movements_raises_nothing(): void
    {
        $shop = $this->shopWithOwner();
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 30,
        ]);

        StockMovement::create([
            'shop_id' => $shop->id,
            'product_id' => $product->id,
            'user_id' => $shop->user_id,
            'type' => 'in',
            'quantity' => 30,
            'movement_date' => now()->toDateString(),
        ]);

        $this->artisan('stock:audit')
            ->expectsOutputToContain('Aucun écart')
            ->assertSuccessful();
    }

    public function test_a_counter_with_no_movement_behind_it_is_reported(): void
    {
        $shop = $this->shopWithOwner();
        Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 42,
            'name' => 'Ciment 50kg',
        ]);

        $this->artisan('stock:audit')
            ->expectsOutputToContain('Ciment 50kg')
            ->expectsOutputToContain('1 écart(s)')
            ->assertSuccessful();
    }

    /**
     * The whole point: the command must never touch real stock.
     */
    public function test_the_audit_leaves_the_counters_alone(): void
    {
        $shop = $this->shopWithOwner();
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 42,
        ]);

        $this->artisan('stock:audit')->assertSuccessful();
        $this->assertSame(42, $product->fresh()->stock_quantity);

        $this->artisan('stock:audit', ['--baseline' => true])->assertSuccessful();
        $this->assertSame(42, $product->fresh()->stock_quantity);
    }

    /**
     * A first audit mostly reports history — inventories set an absolute quantity and depot
     * movements did not exist before. Once the baseline is written, the ledger adds up, so
     * any new discrepancy points at a real problem.
     */
    public function test_the_baseline_makes_the_ledger_add_up(): void
    {
        $shop = $this->shopWithOwner();
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 42,
        ]);

        $this->artisan('stock:audit', ['--baseline' => true])->assertSuccessful();

        $this->assertSame(42, (int) StockMovement::where('product_id', $product->id)->sum('quantity'));

        // Et l'audit suivant ne signale plus rien.
        $this->artisan('stock:audit')
            ->expectsOutputToContain('Aucun écart')
            ->assertSuccessful();
    }

    /**
     * The baseline is written by the command, not by a person: attributing it to a user
     * who did nothing would pollute exactly what a ledger exists to establish.
     */
    public function test_the_baseline_movement_has_no_author(): void
    {
        $shop = $this->shopWithOwner();
        Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 42,
        ]);

        $this->artisan('stock:audit', ['--baseline' => true])->assertSuccessful();

        $this->assertNull(StockMovement::firstOrFail()->user_id);
    }

    /**
     * The depot branch was never exercised: every test here used counter stock only, so
     * the command shipped selecting depots.shop_id — a column that does not exist, a depot
     * belonging to the ACCOUNT (depots.code_user). It crashed on the first production run,
     * where four depots exist.
     */
    public function test_a_depot_quantity_with_no_movement_behind_it_is_reported(): void
    {
        $shop = $this->shopWithOwner();
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 0,
            'name' => 'Fer à béton 8mm',
        ]);

        $depot = Depot::factory()->create([
            'user_id' => $shop->user_id,
            'code_user' => $shop->user->code_user,
            'name' => 'Dépôt central',
        ]);

        DepotProduct::create([
            'depot_id' => $depot->id,
            'product_id' => $product->id,
            'quantity' => 60,
            'min_stock_alert' => 0,
        ]);

        // Une seule attente : expectsOutputToContain consomme la ligne qu'elle vient de
        // faire correspondre, donc deux chaînes situées sur la MÊME ligne du tableau ne
        // peuvent pas être vérifiées l'une après l'autre. Le nom du dépôt suffit : il
        // n'apparaît que dans la colonne Emplacement, donc la branche dépôt a bien tourné.
        $this->artisan('stock:audit')
            ->expectsOutputToContain('Dépôt central')
            ->assertSuccessful();
    }

    public function test_the_baseline_settles_a_depot_too(): void
    {
        $shop = $this->shopWithOwner();
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 0,
        ]);

        $depot = Depot::factory()->create([
            'user_id' => $shop->user_id,
            'code_user' => $shop->user->code_user,
        ]);

        DepotProduct::create([
            'depot_id' => $depot->id,
            'product_id' => $product->id,
            'quantity' => 60,
            'min_stock_alert' => 0,
        ]);

        $this->artisan('stock:audit', ['--baseline' => true])->assertSuccessful();

        $this->assertSame(60, (int) StockMovement::inDepot($depot->id)->sum('quantity'));

        $this->artisan('stock:audit')
            ->expectsOutputToContain('Aucun écart')
            ->assertSuccessful();
    }

    /**
     * --shop filters depots through their PRODUCTS, a depot having no shop of its own.
     */
    public function test_filtering_by_shop_reaches_depot_lines(): void
    {
        $shop = $this->shopWithOwner();
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 0,
            'name' => 'Ciment 50kg',
        ]);

        $depot = Depot::factory()->create([
            'user_id' => $shop->user_id,
            'code_user' => $shop->user->code_user,
        ]);

        DepotProduct::create([
            'depot_id' => $depot->id,
            'product_id' => $product->id,
            'quantity' => 15,
            'min_stock_alert' => 0,
        ]);

        $this->artisan('stock:audit', ['--shop' => $shop->id])
            ->expectsOutputToContain('Ciment 50kg')
            ->assertSuccessful();
    }

    /**
     * A discrepancy is not a failure — the command did its job. But the scheduler has only
     * the exit code to know something happened, hence the flag.
     */
    public function test_the_flag_turns_a_discrepancy_into_a_failure(): void
    {
        $shop = $this->shopWithOwner();
        Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 42,
        ]);

        $this->artisan('stock:audit')->assertSuccessful();
        $this->artisan('stock:audit', ['--fail-on-drift' => true])->assertFailed();
    }

    public function test_the_flag_reports_success_when_nothing_drifts(): void
    {
        $this->shopWithOwner();

        $this->artisan('stock:audit', ['--fail-on-drift' => true])->assertSuccessful();
    }

    /**
     * A first audit can raise thousands of lines, which no terminal renders usefully and no
     * scheduled run has any reason to compose. The largest discrepancies come first.
     */
    public function test_the_table_is_capped_and_says_how_many_are_hidden(): void
    {
        $shop = $this->shopWithOwner();

        for ($i = 1; $i <= 25; $i++) {
            Product::factory()->create([
                'shop_id' => $shop->id,
                'track_stock' => true,
                'stock_quantity' => $i,
                'name' => "Produit {$i}",
            ]);
        }

        $this->artisan('stock:audit')
            ->expectsOutputToContain('et 5 autre(s) écart(s) non affiché(s)')
            ->assertSuccessful();
    }

    public function test_a_product_that_is_not_tracked_is_ignored(): void
    {
        $shop = $this->shopWithOwner();
        Product::factory()->create([
            'shop_id' => $shop->id,
            'track_stock' => false,
            'stock_quantity' => 999,
        ]);

        $this->artisan('stock:audit')
            ->expectsOutputToContain('Aucun écart')
            ->assertSuccessful();
    }
}
