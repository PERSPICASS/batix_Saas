<?php

namespace Tests\Feature\TenantIsolation;

use App\Models\Customer;
use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ProductArticle;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Les lignes d'une pièce (vente, facture, devis, précommande, transfert) désignent des
 * produits, articles et clients par identifiant. La boutique de la pièce était bien
 * contrôlée, mais pas ce que ses lignes désignaient : un `exists:products,id` accepte
 * n'importe quel produit de la base, quel que soit son compte.
 *
 * Conséquences avant correctif (audit du 2026-10-16) :
 * - vendre ou émettre une facture sur le produit d'un autre compte décrémentait SON stock ;
 * - le nom, le SKU et le taux de TVA de ce produit étaient recopiés sur le ticket ;
 * - une vente rattachée au client d'un autre compte affichait ses coordonnées ;
 * - un article de série d'un autre compte passait au statut « vendu ».
 */
class CrossTenantLineItemsTest extends TestCase
{
    use RefreshDatabase;

    private User $me;
    private Shop $myShop;
    private Product $myProduct;
    private Customer $myCustomer;

    private Shop $theirShop;
    private Product $theirProduct;
    private Customer $theirCustomer;
    private ProductArticle $theirArticle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->me = User::factory()->create(['role' => 'super_admin']);
        $this->myShop = Shop::factory()->create(['user_id' => $this->me->id]);
        $this->me->update(['shop_id' => $this->myShop->id]);
        $this->subscribeOwnerOf($this->myShop);

        $this->myProduct = Product::factory()->create([
            'shop_id' => $this->myShop->id, 'track_stock' => true, 'stock_quantity' => 50,
        ]);
        $this->myCustomer = Customer::factory()->create(['shop_id' => $this->myShop->id]);

        $this->theirShop = Shop::factory()->create();
        $this->theirProduct = Product::factory()->create([
            'shop_id' => $this->theirShop->id, 'track_stock' => true, 'stock_quantity' => 50,
        ]);
        $this->theirCustomer = Customer::factory()->create(['shop_id' => $this->theirShop->id]);
        $this->theirArticle = ProductArticle::create([
            'product_id' => $this->theirProduct->id,
            'shop_id' => $this->theirShop->id,
            'name' => 'SN-VICTIME',
            'status' => 'available',
        ]);
    }

    private function url(string $path): string
    {
        return '/'.$this->me->accountCode().'/'.$path;
    }

    private function assertTheirStockUntouched(): void
    {
        $this->assertEquals(50, (int) $this->theirProduct->fresh()->stock_quantity, "Le stock d'un autre compte a bougé.");
    }

    private function sale(array $overrides = [], array $item = []): array
    {
        return array_merge([
            'shop_id' => $this->myShop->id,
            'payment_method' => 'cash',
            'amount_paid' => 10000,
            'items' => [array_merge(['product_id' => $this->myProduct->id, 'quantity' => 2, 'unit_price' => 500], $item)],
        ], $overrides);
    }

    private function invoice(array $item = []): array
    {
        return [
            'shop_id' => $this->myShop->id,
            'customer_id' => $this->myCustomer->id,
            'invoice_date' => now()->toDateString(),
            'status' => 'sent',
            'items' => [array_merge([
                'product_id' => $this->myProduct->id,
                'product_name' => 'Ligne',
                'quantity' => 2,
                'unit_price' => 500,
            ], $item)],
        ];
    }

    // --- Vente au comptoir -------------------------------------------------------------

    public function test_a_sale_on_my_own_product_and_customer_goes_through(): void
    {
        $this->actingAs($this->me)
            ->post($this->url('ventes'), $this->sale(['customer_id' => $this->myCustomer->id]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertEquals(48, (int) $this->myProduct->fresh()->stock_quantity);
    }

    public function test_a_sale_cannot_sell_another_tenants_product(): void
    {
        $this->actingAs($this->me)
            ->post($this->url('ventes'), $this->sale([], ['product_id' => $this->theirProduct->id]))
            ->assertSessionHasErrors();

        $this->assertTheirStockUntouched();
        $this->assertDatabaseMissing('sale_items', ['product_id' => $this->theirProduct->id]);
    }

    public function test_a_sale_cannot_be_attached_to_another_tenants_customer(): void
    {
        $this->actingAs($this->me)
            ->post($this->url('ventes'), $this->sale(['customer_id' => $this->theirCustomer->id]))
            ->assertSessionHasErrors('customer_id');

        $this->assertDatabaseMissing('sales', ['customer_id' => $this->theirCustomer->id]);
    }

    public function test_an_offline_sync_cannot_sell_another_tenants_product(): void
    {
        $this->actingAs($this->me)
            ->postJson($this->url('ventes/sync-offline'), ['sales' => [
                $this->sale([
                    'client_uuid' => (string) Str::uuid(),
                    'sale_date' => now()->toDateTimeString(),
                ], ['product_id' => $this->theirProduct->id]),
            ]])
            ->assertJsonPath('results.0.status', 'rejected');

        $this->assertTheirStockUntouched();
    }

    // --- Factures ----------------------------------------------------------------------

    public function test_an_issued_invoice_cannot_release_another_tenants_stock(): void
    {
        $this->actingAs($this->me)
            ->post($this->url('factures'), $this->invoice(['product_id' => $this->theirProduct->id]))
            ->assertSessionHasErrors('items.0.product_id');

        $this->assertTheirStockUntouched();
    }

    public function test_an_invoice_cannot_mark_another_tenants_article_as_sold(): void
    {
        $this->actingAs($this->me)
            ->post($this->url('factures'), $this->invoice(['product_article_id' => $this->theirArticle->id]))
            ->assertSessionHasErrors('items.0.product_article_id');

        $this->assertSame('available', $this->theirArticle->fresh()->status);
    }

    public function test_a_draft_invoice_cannot_be_edited_onto_another_tenants_product(): void
    {
        $draft = Invoice::create([
            'shop_id' => $this->myShop->id,
            'customer_id' => $this->myCustomer->id,
            'user_id' => $this->me->id,
            'invoice_date' => now()->toDateString(),
            'status' => 'draft',
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        $this->actingAs($this->me)
            ->put($this->url("factures/{$draft->id}"), $this->invoice(['product_id' => $this->theirProduct->id]))
            ->assertSessionHasErrors('items.0.product_id');

        $this->assertTheirStockUntouched();
    }

    // --- Devis, précommandes, dépôts ---------------------------------------------------

    public function test_a_quote_cannot_mark_another_tenants_article_as_sold(): void
    {
        $this->actingAs($this->me)
            ->withSession(['active_shop_id' => $this->myShop->id])
            ->post($this->url('devis'), [
                'customer_id' => $this->myCustomer->id,
                'quote_date' => now()->toDateString(),
                'expiry_date' => now()->addDays(30)->toDateString(),
                'items' => [[
                    'product_id' => $this->myProduct->id,
                    'product_article_id' => $this->theirArticle->id,
                    'quantity' => 1,
                    'unit_price' => 500,
                ]],
            ])
            ->assertSessionHasErrors('items.0.product_article_id');

        $this->assertSame('available', $this->theirArticle->fresh()->status);
    }

    public function test_a_preorder_cannot_be_attached_to_another_tenants_customer(): void
    {
        $this->actingAs($this->me)
            ->post($this->url('precommandes'), [
                'shop_id' => $this->myShop->id,
                'customer_id' => $this->theirCustomer->id,
                'items' => [[
                    'product_id' => $this->myProduct->id,
                    'quantity_ordered' => 1,
                    'unit_price' => 500,
                    'expected_delivery_date' => now()->addDays(7)->toDateString(),
                ]],
            ])
            ->assertSessionHasErrors('customer_id');

        $this->assertDatabaseMissing('preorders', ['customer_id' => $this->theirCustomer->id]);
    }

    public function test_depot_stock_cannot_be_transferred_to_another_tenants_shop(): void
    {
        $depot = Depot::factory()->create(['code_user' => $this->me->accountCode(), 'user_id' => $this->me->id]);
        DepotProduct::factory()->create([
            'depot_id' => $depot->id, 'product_id' => $this->myProduct->id, 'quantity' => 10,
        ]);

        $this->actingAs($this->me)
            ->post($this->url("depots/{$depot->id}/transfer"), [
                'shop_id' => $this->theirShop->id,
                'items' => [['product_id' => $this->myProduct->id, 'quantity' => 1]],
            ])
            ->assertSessionHasErrors('shop_id');

        $this->assertDatabaseMissing('depot_transfers', ['shop_id' => $this->theirShop->id]);
    }
}
