<?php

namespace Tests\Feature\Sale;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Retrouver les ventes dont la remise a été rognée au HT de la première ligne, entre
 * f45033f et son correctif. La commande ne modifie rien.
 */
class AuditCappedSaleDiscountsTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['currency' => 'XOF']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    /** 5 000 taxés à 18 % + 5 000 exonérés, remise de 8 000 : total dû 2 180. */
    private function sale(float $paid): Sale
    {
        $product = fn (int $rate) => Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 10, 'track_stock' => true, 'tax_rate' => $rate,
        ]);

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", [
            'shop_id' => $this->shop->id,
            'payment_method' => 'cash',
            'amount_paid' => $paid,
            'discount_amount' => 8000,
            'items' => [
                ['product_id' => $product(18)->id, 'quantity' => 1, 'unit_price' => 5000],
                ['product_id' => $product(0)->id, 'quantity' => 1, 'unit_price' => 5000],
            ],
        ])->assertRedirect();

        return Sale::latest('id')->firstOrFail();
    }

    /** Ce que l'ancien calcul laissait : remise ramenée à 5 000, TVA et total sur cette base. */
    private function corrupt(Sale $sale): void
    {
        DB::table('sales')->where('id', $sale->id)->update([
            'discount_amount' => 5000,
            'tax_amount' => 450,
            'total' => 5450,
        ]);
    }

    public function test_a_correct_sale_is_not_reported(): void
    {
        $this->sale(0);

        $this->artisan('sales:audit-capped-discounts')
            ->expectsOutputToContain('Aucune vente ne porte de remise rognée')
            ->assertSuccessful();
    }

    public function test_a_credit_sale_gives_back_its_exact_discount(): void
    {
        $sale = $this->sale(0);
        $this->corrupt($sale);

        $this->assertSame(0, Artisan::call('sales:audit-capped-discounts'));
        $output = Artisan::output();

        $this->assertStringContainsString('1 vente(s) suspecte(s)', $output);
        $this->assertStringContainsString('| 8 000,00 ', $output);
        $this->assertStringContainsString('| 2 180,00 XOF', $output);

        $this->assertEquals(5000, (float) $sale->fresh()->discount_amount);
    }

    public function test_a_cash_sale_only_gives_a_bound(): void
    {
        $this->corrupt($this->sale(3000));

        $this->artisan('sales:audit-capped-discounts')
            ->expectsOutputToContain('≤ 3 000,00 XOF')
            ->assertSuccessful();
    }
}
