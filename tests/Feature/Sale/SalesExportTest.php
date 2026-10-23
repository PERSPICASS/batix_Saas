<?php

namespace Tests\Feature\Sale;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/** L'export Excel des ventes d'une période, une ligne par article vendu. */
class SalesExportTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private Product $cement;
    private Product $screws;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['currency' => 'XOF', 'name' => 'Quincaillerie Centrale']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->cement = Product::factory()->create(['shop_id' => $this->shop->id, 'name' => 'Ciment CPJ 45', 'stock_quantity' => 50, 'track_stock' => true, 'tax_rate' => 0]);
        // Un nom qui commence par « = » : il doit arriver en texte, pas en formule.
        $this->screws = Product::factory()->create(['shop_id' => $this->shop->id, 'name' => '=Vis 6mm', 'stock_quantity' => 500, 'track_stock' => true, 'tax_rate' => 0]);
    }

    private function sell(array $items, array $overrides = [], ?string $on = null): Sale
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", array_merge([
            'shop_id' => $this->shop->id,
            'payment_method' => 'cash',
            'amount_paid' => 1_000_000,
            'items' => $items,
        ], $overrides))->assertRedirect();

        $sale = Sale::latest('id')->first();
        if ($on) {
            $sale->update(['sale_date' => $on]);
        }

        return $sale;
    }

    private function staff(string $role): User
    {
        $user = User::factory()->create(['role' => $role, 'shop_id' => $this->shop->id]);
        $user->permissions()->create(['module' => 'sales', 'can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => false]);

        return $user->fresh();
    }

    private function rows(User $user, string $query = 'date_from=2026-10-01&date_to=2026-10-31'): array
    {
        $response = $this->actingAs($user)->withSession(['active_shop_id' => $this->shop->id])
            ->get("/{$this->owner->code_user}/ventes/export?{$query}")
            ->assertOk();

        $this->assertStringContainsString('ventes_2026-10-01_2026-10-31.xlsx', $response->headers->get('content-disposition'));

        $sheet = IOFactory::load($response->getFile()->getPathname())->getActiveSheet();
        $rows = $sheet->toArray(null, false, false);

        // Après toArray() : getCell() crée la cellule demandée, donc une ligne de plus.
        for ($row = 2; $row <= count($rows); $row++) {
            $this->assertFalse($sheet->getCell("E{$row}")->isFormula());
        }

        return $rows;
    }

    public function test_one_row_per_item_sold_in_the_period(): void
    {
        $this->sell([
            ['product_id' => $this->cement->id, 'quantity' => 3, 'unit_price' => 5000],
            ['product_id' => $this->screws->id, 'quantity' => 10, 'unit_price' => 100],
        ], ['payment_method' => 'mobile'], '2026-10-10 09:00:00');
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 1, 'unit_price' => 5000]], [], '2026-09-30 18:00:00');
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 1, 'unit_price' => 5000]], [], '2026-11-01 08:00:00');
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 2, 'unit_price' => 5000]], [], '2026-10-12 08:00:00')
            ->update(['status' => 'cancelled']);

        $rows = $this->rows($this->owner);

        $this->assertSame('Article', $rows[0][4]);
        $this->assertCount(3, $rows, 'en-tête + les 2 lignes de la seule vente du mois non annulée');
        $this->assertSame(['Ciment CPJ 45', 3, 5000, 15000, 'XOF', 'Mobile money'], [$rows[1][4], (int) $rows[1][6], (int) $rows[1][7], (int) $rows[1][9], $rows[1][10], $rows[1][11]]);
        // Sans remise, la remise vaut 0 et non une cellule vide.
        $this->assertSame([0, 0, 'Non'], [(int) $rows[1][8], (int) $rows[1][12], $rows[1][13]]);
        $this->assertNotNull($rows[1][8]);
        $this->assertStringContainsString('Vis 6mm', (string) $rows[2][4]);
        $this->assertSame([10, 1000], [(int) $rows[2][6], (int) $rows[2][9]]);
    }

    public function test_a_sale_discount_is_shared_across_its_lines(): void
    {
        // 15 000 + 5 000, remise de 2 000 sur la vente : 10 % de chaque ligne.
        $this->sell([
            ['product_id' => $this->cement->id, 'quantity' => 3, 'unit_price' => 5000],
            ['product_id' => $this->screws->id, 'quantity' => 50, 'unit_price' => 100],
        ], ['discount_amount' => 2000], '2026-10-10 09:00:00');

        $rows = $this->rows($this->owner);

        $this->assertEquals([1500, 13500], [$rows[1][8], $rows[1][9]]);
        $this->assertEquals([500, 4500], [$rows[2][8], $rows[2][9]]);
    }

    public function test_an_admin_can_export_but_not_a_manager_or_cashier(): void
    {
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 1, 'unit_price' => 5000]], [], '2026-10-10 09:00:00');

        $this->assertCount(2, $this->rows($this->staff('admin')));

        foreach (['manager', 'cashier'] as $role) {
            $this->actingAs($this->staff($role))
                ->get("/{$this->owner->code_user}/ventes/export?date_from=2026-10-01&date_to=2026-10-31")
                ->assertForbidden();
        }
    }

    public function test_another_tenants_sales_never_appear(): void
    {
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 1, 'unit_price' => 5000]], [], '2026-10-10 09:00:00');

        $other = Shop::factory()->create(['currency' => 'XOF']);
        $otherOwner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $other->id]);
        $other->update(['user_id' => $otherOwner->id]);
        $this->subscribeOwnerOf($other);

        // Même en demandant explicitement la boutique de l'autre, sans boutique active.
        $response = $this->actingAs($otherOwner)
            ->get("/{$otherOwner->code_user}/ventes/export?date_from=2026-10-01&date_to=2026-10-31&shop_id={$this->shop->id}")
            ->assertOk();

        $rows = IOFactory::load($response->getFile()->getPathname())->getActiveSheet()->toArray();
        $this->assertCount(1, $rows, 'seulement l\'en-tête');
    }

    public function test_without_an_end_date_the_export_runs_to_today(): void
    {
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 1, 'unit_price' => 5000]], [], now()->subDays(3)->toDateTimeString());
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 2, 'unit_price' => 5000]]);
        $this->sell([['product_id' => $this->cement->id, 'quantity' => 4, 'unit_price' => 5000]], [], now()->subDays(10)->toDateTimeString());

        $from = now()->subDays(5)->toDateString();
        $response = $this->actingAs($this->owner)->withSession(['active_shop_id' => $this->shop->id])
            ->get("/{$this->owner->code_user}/ventes/export?date_from={$from}")
            ->assertOk();

        $this->assertStringContainsString("ventes_{$from}_" . now()->toDateString() . '.xlsx', $response->headers->get('content-disposition'));
        $rows = IOFactory::load($response->getFile()->getPathname())->getActiveSheet()->toArray();
        $this->assertSame([1, 2], [(int) $rows[1][6], (int) $rows[2][6]]);
        $this->assertCount(3, $rows);
    }

    public function test_the_start_date_is_required(): void
    {
        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/ventes/export?date_to=2026-10-31")
            ->assertSessionHasErrors('date_from');

        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/ventes/export?date_from=2026-10-31&date_to=2026-10-01")
            ->assertSessionHasErrors('date_to');
    }
}
