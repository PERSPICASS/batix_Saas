<?php

namespace Tests\Feature\Purchase;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Le bon de commande fournisseur s'imprime, sans les notes internes. */
class PurchaseOrderPdfTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Purchase $purchase;

    protected function setUp(): void
    {
        parent::setUp();

        $shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($shop);

        $supplier = Supplier::create(['name' => 'Kofi Traoré', 'company_name' => 'SOCOCIM Distribution']);
        $supplier->shops()->attach($shop->id);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Ciment CPJ 45']);

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/purchases", [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'shipping_cost' => 2500,
            'notes' => 'Livrer avant 10h',
            'internal_notes' => 'Négocier 5 % la prochaine fois',
            'items' => [['product_id' => $product->id, 'quantity' => 20, 'unit_price' => 4500]],
        ])->assertSessionHasNoErrors();

        $this->purchase = Purchase::sole();
    }

    public function test_the_purchase_order_prints_for_the_supplier(): void
    {
        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/purchases/{$this->purchase->id}/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_it_shows_the_order_but_not_the_internal_notes(): void
    {
        app()->setLocale('fr');
        $purchase = $this->purchase->fresh(['items', 'shop', 'supplier']);
        $html = view('pdf.purchase-order', ['purchase' => $purchase, 'logo' => null, 'shop' => $purchase->shop, 'currencySymbol' => 'F'])->render();

        $this->assertStringContainsString('BON DE COMMANDE', $html);
        $this->assertStringContainsString($purchase->reference, $html);
        $this->assertStringContainsString('SOCOCIM Distribution', $html);
        $this->assertStringContainsString('Ciment CPJ 45', $html);
        $this->assertStringContainsString('90 000,00', $html);
        $this->assertStringContainsString('Frais de port', $html);
        $this->assertStringContainsString('Livrer avant 10h', $html);
        // The document goes to the supplier: the internal note must never be on it.
        $this->assertStringNotContainsString('Négocier', $html);
    }

    public function test_another_account_cannot_print_it(): void
    {
        $other = Shop::factory()->create();
        $intruder = User::factory()->create(['role' => 'super_admin', 'shop_id' => $other->id]);
        $other->update(['user_id' => $intruder->id]);
        $this->subscribeOwnerOf($other);

        $response = $this->actingAs($intruder)->get("/{$intruder->code_user}/purchases/{$this->purchase->id}/pdf");

        $this->assertContains($response->status(), [403, 404]);
    }

    private function render(Purchase $purchase): string
    {
        app()->setLocale('fr');
        $purchase = $purchase->fresh(['items', 'shop', 'supplier']);

        return view('pdf.purchase-order', ['purchase' => $purchase, 'logo' => null, 'shop' => $purchase->shop, 'currencySymbol' => 'F'])->render();
    }

    public function test_prices_and_amounts_are_shown_by_default(): void
    {
        $this->assertTrue($this->purchase->show_unit_prices);
        $this->assertTrue($this->purchase->show_amounts);

        $html = $this->render($this->purchase);
        $this->assertStringContainsString('P.U. HT', $html);
        $this->assertStringContainsString('92 500,00', $html);
    }

    public function test_unticking_both_prints_a_list_of_quantities_to_price(): void
    {
        $item = $this->purchase->items()->sole();

        // Saved from the edit form, like the quote's two boxes.
        $this->actingAs($this->owner)->put("/{$this->owner->code_user}/purchases/{$this->purchase->id}", [
            'supplier_id' => $this->purchase->supplier_id,
            'order_date' => now()->toDateString(),
            'show_unit_prices' => false,
            'show_amounts' => false,
            'items' => [['product_id' => $item->product_id, 'quantity' => 20, 'unit_price' => 4500]],
        ])->assertSessionHasNoErrors();

        $purchase = $this->purchase->fresh();
        $this->assertFalse($purchase->show_unit_prices);
        $this->assertFalse($purchase->show_amounts);

        $html = $this->render($purchase);
        $this->assertStringContainsString('Ciment CPJ 45', $html);
        $this->assertStringContainsString('>20<', $html);
        foreach (['P.U. HT', '4 500,00', '90 000,00', 'Sous-total', 'TOTAL', 'TVA'] as $hidden) {
            $this->assertStringNotContainsString($hidden, $html, "« {$hidden} » should not be printed");
        }
    }

    public function test_unit_prices_can_be_hidden_alone(): void
    {
        $this->purchase->update(['show_unit_prices' => false]);

        $html = $this->render($this->purchase);
        $this->assertStringNotContainsString('P.U. HT', $html);
        $this->assertStringNotContainsString('4 500,00', $html);
        $this->assertStringContainsString('90 000,00', $html);
    }
}
