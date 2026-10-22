<?php

namespace Tests\Feature\Analytics;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/** L'export Excel de la page Statistiques reprend les chiffres que la page affiche. */
class AnalyticsExportTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['currency' => 'XOF', 'name' => 'Quincaillerie Centrale']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    private function sell(Product $product, int $quantity, ?Customer $customer = null): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", array_filter([
            'shop_id' => $this->shop->id,
            'customer_id' => $customer?->id,
            'payment_method' => 'cash',
            'amount_paid' => 1_000_000,
            'items' => [['product_id' => $product->id, 'quantity' => $quantity, 'unit_price' => 2500]],
        ]))->assertRedirect();
    }

    public function test_the_workbook_carries_the_figures_shown_on_the_page(): void
    {
        $cement = Product::factory()->create(['shop_id' => $this->shop->id, 'name' => 'Ciment CPJ 45', 'stock_quantity' => 50, 'track_stock' => true, 'tax_rate' => 0]);
        // Un nom qui commence par « = » : il doit arriver en texte, pas en formule.
        $customer = Customer::factory()->create(['shop_id' => $this->shop->id, 'name' => '=HYPERLINK("x")']);
        $this->sell($cement, 3, $customer);
        $this->sell($cement, 1);

        $as = $this->actingAs($this->owner)->withSession(['active_shop_id' => $this->shop->id]);
        $revenue = $as->get("/{$this->owner->code_user}/analytics?period=year")
            ->assertOk()
            ->viewData('page')['props']['kpis']['revenue']['value'];
        $this->assertEquals(10000, $revenue);

        $response = $as->get("/{$this->owner->code_user}/analytics/export?period=year")->assertOk();
        $this->assertStringContainsString('Statistiques-year-', $response->headers->get('content-disposition'));

        $book = IOFactory::load($response->getFile()->getPathname());
        $this->assertSame(
            ['Synthèse', 'Évolution des ventes', 'Top produits', 'Catégories', 'Top clients', 'Paiements', 'Boutiques', 'Comparaison'],
            $book->getSheetNames(),
        );

        $summary = $book->getSheetByName('Synthèse')->toArray();
        $this->assertSame('Quincaillerie Centrale', $summary[1][1]);
        $this->assertSame("Chiffre d'affaires", $summary[5][0]);
        $this->assertEquals($revenue, $summary[5][1]);
        $this->assertEquals(2, $summary[6][1]);

        $products = $book->getSheetByName('Top produits')->toArray();
        $this->assertSame(['Ciment CPJ 45', $cement->sku, 4, 10000], [$products[1][0], $products[1][1], (int) $products[1][2], (int) $products[1][3]]);

        $customerCell = $book->getSheetByName('Top clients')->getCell('A2');
        $this->assertFalse($customerCell->isFormula());
        $this->assertStringContainsString('HYPERLINK', (string) $customerCell->getValue());
    }

    public function test_a_cashier_cannot_export(): void
    {
        $cashier = User::factory()->create(['role' => 'cashier', 'shop_id' => $this->shop->id]);

        $this->actingAs($cashier)->get("/{$this->owner->code_user}/analytics/export")->assertForbidden();
    }
}
