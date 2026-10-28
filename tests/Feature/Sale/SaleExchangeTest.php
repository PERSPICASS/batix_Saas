<?php

namespace Tests\Feature\Sale;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ReturnedInventory;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * L'échange d'un article et l'avoir client.
 *
 * Un échange enregistre en une fois les retours sur la vente d'origine et la vente de
 * remplacement ; ce qui reste dû au client est rendu en espèces, gardé en avoir, ou les deux.
 */
class SaleExchangeTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private Customer $customer;
    private Product $drill;   // 10 000
    private Product $grinder; // 12 000
    private Product $hammer;  //  6 000

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
        $this->customer = Customer::factory()->create(['shop_id' => $this->shop->id]);

        $make = fn (string $name, int $price) => Product::factory()->create([
            'shop_id' => $this->shop->id, 'name' => $name, 'selling_price' => $price,
            'tax_rate' => 0, 'stock_quantity' => 20, 'track_stock' => true,
        ]);
        $this->drill = $make('Perceuse', 10000);
        $this->grinder = $make('Meuleuse', 12000);
        $this->hammer = $make('Marteau', 6000);
    }

    private function url(string $path): string
    {
        return "/{$this->owner->code_user}/{$path}";
    }

    private function sell(Product $product, array $attrs = []): Sale
    {
        $this->actingAs($this->owner)->post($this->url('ventes'), array_merge([
            'shop_id' => $this->shop->id, 'payment_method' => 'cash',
            'amount_paid' => (float) $product->selling_price,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => (float) $product->selling_price]],
        ], $attrs))->assertSessionHasNoErrors();

        return Sale::latest('id')->firstOrFail();
    }

    private function exchange(Sale $original, Product $for, array $attrs = [])
    {
        return $this->actingAs($this->owner)->post($this->url("ventes/{$original->id}/echange"), array_merge([
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => 0,
            'items' => [['product_id' => $for->id, 'quantity' => 1, 'unit_price' => (float) $for->selling_price]],
            'lines' => [['sale_item_id' => $original->items()->first()->id, 'quantity' => 1, 'reason' => 'wrong_item']],
        ], $attrs));
    }

    private function newSale(): Sale
    {
        return Sale::latest('id')->firstOrFail();
    }

    public function test_a_dearer_item_costs_only_the_difference(): void
    {
        $original = $this->sell($this->drill);

        $this->exchange($original, $this->grinder, ['amount_paid' => 2000])->assertSessionHasNoErrors();
        $new = $this->newSale();

        $this->assertSame($original->id, $new->exchanged_sale_id);
        $this->assertSame('10000.00', $new->exchange_credit);
        $this->assertSame('12000.00', $new->total);
        $this->assertSame('12000.00', $new->amount_paid);
        $this->assertSame('0.00', $new->change_amount);
        $this->assertSame('completed', $new->status);

        $original->refresh();
        $this->assertSame('returned', $original->status);
        $this->assertSame($new->id, $original->returns()->sole()->replacement_sale_id);
        // L'article rendu passe par l'inventaire des retours, comme un retour simple.
        $this->assertSame('pending', ReturnedInventory::sole()->status);
        $this->assertSame(19.0, $this->grinder->fresh()->stock_quantity);
    }

    public function test_a_cheaper_item_splits_the_rest_between_cash_and_credit(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);

        // 10 000 rendus, marteau à 6 000 : 4 000 à rendre, dont 1 500 gardés en avoir.
        $this->exchange($original, $this->hammer, ['store_credit_kept' => 1500])->assertSessionHasNoErrors();
        $new = $this->newSale();

        $this->assertSame('2500.00', $new->change_amount, 'Rendu en espèces');
        $this->assertSame('1500.00', $new->store_credit_kept);
        $this->assertSame($this->customer->id, $new->customer_id, "Le client de la vente d'origine");
        $this->assertSame(1500.0, $this->customer->creditBalance());
    }

    public function test_a_walk_in_customer_cannot_keep_credit_and_nothing_is_recorded(): void
    {
        $original = $this->sell($this->drill);

        $this->exchange($original, $this->hammer, ['store_credit_kept' => 1000])->assertSessionHasErrors('store_credit_kept');

        // La transaction entière est annulée : pas de retour orphelin sur la vente d'origine.
        $this->assertSame(0, $original->returns()->count());
        $this->assertSame('completed', $original->fresh()->status);
        $this->assertSame(1, Sale::count());
    }

    public function test_keeping_more_than_is_owed_is_refused(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);

        $this->exchange($original, $this->hammer, ['store_credit_kept' => 5000])->assertSessionHasErrors('store_credit_kept');
        $this->assertSame(0.0, $this->customer->creditBalance());
    }

    public function test_an_unpaid_credit_sale_gives_no_credit(): void
    {
        // Vendue à crédit, rien payé : rendre l'article efface la dette, il n'y a rien à rendre.
        $original = $this->sell($this->drill, ['payment_method' => 'credit', 'amount_paid' => 0, 'customer_id' => $this->customer->id]);

        $this->exchange($original, $this->hammer, ['amount_paid' => 6000])->assertSessionHasNoErrors();
        $new = $this->newSale();

        $this->assertSame('0.00', $new->exchange_credit);
        $this->assertSame('completed', $new->status);
        $this->assertSame('0.00', $original->fresh()->remaining_amount);
    }

    public function test_the_credit_matches_a_plain_return_with_vat_and_discount(): void
    {
        $this->drill->update(['tax_rate' => 18]);
        // 10 000 HT, remise 1 000, TVA 18 % sur 9 000 = 1 620 : payé 10 620.
        $original = $this->sell($this->drill->fresh(), ['amount_paid' => 10620, 'discount_amount' => 1000]);
        $this->assertSame('10620.00', $original->total);

        $this->actingAs($this->owner)->get($this->url("ventes/create?exchange={$original->id}&lines[0][sale_item_id]={$original->items()->first()->id}&lines[0][quantity]=1"))
            ->assertInertia(fn ($page) => $page->where('exchange.credit', 10620));

        $this->exchange($original, $this->grinder)->assertSessionHasNoErrors();
        $this->assertSame('10620.00', $this->newSale()->exchange_credit);
        $this->assertSame('1380.00', $this->newSale()->remaining_amount);
    }

    public function test_customer_credit_pays_part_of_a_later_sale_and_comes_back_on_cancel(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        $this->exchange($original, $this->hammer, ['store_credit_kept' => 4000])->assertSessionHasNoErrors();
        $this->assertSame(4000.0, $this->customer->creditBalance());

        // Plus tard : meuleuse à 12 000, dont 4 000 en avoir.
        $later = $this->sell($this->grinder, ['customer_id' => $this->customer->id, 'amount_paid' => 8000, 'store_credit_used' => 4000]);
        $this->assertSame('completed', $later->status);
        $this->assertSame('12000.00', $later->amount_paid);
        $this->assertSame(0.0, $this->customer->creditBalance());

        $this->actingAs($this->owner)->delete($this->url("ventes/{$later->id}"))->assertSessionMissing('error');
        $this->assertSame(4000.0, $this->customer->creditBalance(), "L'annulation rend l'avoir");

        $this->actingAs($this->owner)->patch($this->url("ventes/{$later->id}/reactiver"))->assertSessionMissing('error');
        $this->assertSame(0.0, $this->customer->creditBalance(), 'La réactivation le dépense à nouveau');
    }

    public function test_credit_cannot_exceed_the_balance(): void
    {
        $this->actingAs($this->owner)->post($this->url('ventes'), [
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => 0,
            'customer_id' => $this->customer->id, 'store_credit_used' => 6000,
            'items' => [['product_id' => $this->hammer->id, 'quantity' => 1, 'unit_price' => 6000]],
        ])->assertSessionHasErrors('store_credit_used');

        $this->assertSame(0, Sale::count());
    }

    public function test_an_exchange_cannot_be_half_undone(): void
    {
        $original = $this->sell($this->drill);
        $this->exchange($original, $this->grinder, ['amount_paid' => 2000]);
        $new = $this->newSale();

        $this->actingAs($this->owner)->delete($this->url("ventes/{$new->id}"))->assertSessionHas('error');
        $this->assertNotSame('cancelled', $new->fresh()->status);

        $return = $original->returns()->sole();
        $this->actingAs($this->owner)->delete($this->url("retours/{$return->id}"))->assertSessionHas('error');
        $this->assertNotNull($return->fresh());
    }

    public function test_a_plain_return_into_credit_credits_the_customer(): void
    {
        $sale = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        $item = $sale->items()->first();

        $this->actingAs($this->owner)->postJson($this->url("ventes/{$sale->id}/retours"), [
            'sale_item_id' => $item->id, 'quantity_returned' => 1, 'refund_method' => 'store_credit', 'reason' => 'not_satisfied',
        ])->assertOk();

        $this->assertSame(10000.0, $this->customer->creditBalance());
        $this->assertSame('0.00', $sale->fresh()->change_amount, "Gardé en avoir, rien n'est rendu en espèces");

        $this->actingAs($this->owner)->delete($this->url('retours/' . $sale->returns()->sole()->id))->assertSessionMissing('error')->assertSessionHasNoErrors();
        $this->assertSame(0.0, $this->customer->creditBalance(), "Annuler le retour reprend l'avoir");
    }

    public function test_a_plain_return_into_credit_needs_a_customer(): void
    {
        $sale = $this->sell($this->drill);

        $this->actingAs($this->owner)->post($this->url("ventes/{$sale->id}/retours"), [
            'sale_item_id' => $sale->items()->first()->id, 'quantity_returned' => 1, 'refund_method' => 'store_credit', 'reason' => 'other',
        ])->assertSessionHasErrors('refund_method');

        $this->assertSame(0, $sale->returns()->count());
    }

    public function test_a_customer_with_credit_cannot_be_deleted(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        $this->exchange($original, $this->hammer, ['store_credit_kept' => 4000]);

        $this->actingAs($this->owner)->delete($this->url("clients/{$this->customer->id}"))->assertSessionHas('error');
        $this->assertNotNull($this->customer->fresh());
    }

    public function test_the_ticket_shows_the_exchange(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        $this->exchange($original, $this->hammer, ['store_credit_kept' => 1500]);
        $new = $this->newSale();

        $html = view('pdf.ticket', [
            'sale' => $new->load(['items.returns', 'shop', 'customer', 'user', 'exchangedSale']),
            'logo' => null, 'shop' => $new->shop, 'currencySymbol' => 'FCFA',
        ])->render();

        $this->assertStringContainsString($original->ticket_number, $html);
        $this->assertStringContainsString(e(__('documents.exchange_credit')), $html);
        $this->assertStringContainsString(e(__('documents.store_credit_kept')), $html);
        // L'avoir a payé la vente : il s'affiche en positif, et l'argent remis à part (rien ici).
        $this->assertStringNotContainsString('-10 000,00', $html);
        $this->assertMatchesRegularExpression('/' . preg_quote(__('documents.amount_paid'), '/') . '<\/td>\s*<td class="right">0,00/', $html);
    }

    public function test_revenue_by_payment_method_separates_what_credit_paid(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        // Meuleuse 12 000 : 10 000 par l'avoir de l'échange, 2 000 en espèces.
        $this->exchange($original, $this->grinder, ['amount_paid' => 2000]);

        $methods = collect(app(\App\Services\ShopReport::class)->paymentMethods([$this->shop->id], now()->subDay(), now()->addDay()))
            ->keyBy('method');

        // La vente d'origine est entièrement retournée (0) ; la meuleuse : 2 000 espèces + 10 000 avoir.
        $this->assertSame(2000.0, $methods['cash']['revenue']);
        $this->assertSame(10000.0, $methods['store_credit']['revenue']);
        $this->assertSame(12000.0, $methods->sum('revenue'), 'La somme reste le CA');
    }

    public function test_the_revenue_nets_out_and_the_kept_credit_is_a_debt(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        // 10 000 encaissés ; marteau 6 000 ; 2 500 rendus, 1 500 gardés en avoir.
        $this->exchange($original, $this->hammer, ['store_credit_kept' => 1500]);

        $figures = app(\App\Services\ShopsOverview::class)->figures(collect([$this->shop]), now()->subDay(), now()->addDay())[$this->shop->id];

        // CA 6 000 + dette envers le client 1 500 = 7 500 réellement gardés (10 000 - 2 500).
        $this->assertSame(6000.0, (float) $figures['revenue']);
        $this->assertSame(1500.0, $figures['customer_credit']);
        // Le coût de la perceuse rendue ne pèse plus sur la marge : seul le marteau est vendu.
        $this->assertEqualsWithDelta(6000 - (float) $this->hammer->purchase_price, $figures['gross_margin'], 0.01);
    }

    public function test_the_sales_export_shows_the_exchange(): void
    {
        $original = $this->sell($this->drill, ['customer_id' => $this->customer->id]);
        $this->exchange($original, $this->hammer, ['store_credit_kept' => 1500]);
        $new = $this->newSale();

        $export = new \App\Exports\SalesLinesExport(Sale::whereKey($new->id)->select('id'));
        $row = $export->map($export->query()->first());
        $headings = $export->headings();

        $this->assertSame($original->ticket_number, $row[array_search('Échange de (ticket)', $headings)]);
        $this->assertSame(6000.0, $row[array_search('Réglé par avoir (vente)', $headings)]);
        $this->assertSame(1500.0, $row[array_search('Gardé en avoir (vente)', $headings)]);
    }
}
