<?php

namespace Tests\Feature\Quote;

use App\Mail\QuoteMail;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Quote;
use App\Models\Shop;
use App\Services\QuoteWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Un devis peut masquer ses prix unitaires et/ou ses montants. Le choix doit tenir
 * partout où le client voit le devis : le PDF (téléchargé, joint au mail, lien public,
 * tous rendus par pdf.quote) et le corps du mail, qui reprend les totaux.
 */
class QuotePriceVisibilityTest extends TestCase
{
    use RefreshDatabase;

    // 1 234,50 × 3 = 3 703,50 : des chaînes qu'aucun autre champ du document ne produit.
    private const UNIT_PRICE = '1 234,50';

    private const LINE_TOTAL = '3 703,50';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    private function quote(array $options = []): Quote
    {
        $shop = Shop::factory()->create(['currency' => 'EUR']);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        return QuoteWriter::create([
            'customer_id' => $customer->id,
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'items' => [['product_id' => $product->id, 'quantity' => 3, 'unit_price' => 1234.5]],
            ...$options,
        ], $shop)->refresh();
    }

    private function pdfHtml(Quote $quote): string
    {
        $quote->load('items', 'shop', 'customer');

        return view('pdf.quote', [
            'quote' => $quote,
            'logo' => null,
            'shop' => $quote->shop,
            'currencySymbol' => '€',
            'taxBreakdown' => [],
        ])->render();
    }

    public function test_the_pdf_service_loads_the_product_name_for_the_designation(): void
    {
        // Les lignes ne copient pas le nom du produit : la désignation vient de la relation.
        // Charger le produit en colonnes réduites (id, unit) laissait la colonne vide.
        $quote = $this->quote();
        $name = $quote->items->first()->product->name;

        app(\App\Services\DocumentPdf::class)->forQuote($quote = Quote::find($quote->id));

        $this->assertSame($name, $quote->items->first()->product->name);
        $this->assertStringContainsString(e($name), $this->pdfHtml($quote));
    }

    public function test_a_new_quote_shows_everything_by_default(): void
    {
        $quote = $this->quote();

        $this->assertTrue($quote->show_unit_prices);
        $this->assertTrue($quote->show_amounts);

        $html = $this->pdfHtml($quote);
        $this->assertStringContainsString(self::UNIT_PRICE, $html);
        $this->assertStringContainsString(self::LINE_TOTAL, $html);
    }

    public function test_hiding_unit_prices_keeps_the_amounts(): void
    {
        $html = $this->pdfHtml($this->quote(['show_unit_prices' => false]));

        $this->assertStringNotContainsString(self::UNIT_PRICE, $html);
        $this->assertStringContainsString(self::LINE_TOTAL, $html);
    }

    public function test_hiding_amounts_keeps_unit_prices_and_drops_every_total(): void
    {
        $quote = $this->quote(['show_amounts' => false]);
        $html = $this->pdfHtml($quote);

        $this->assertStringContainsString(self::UNIT_PRICE, $html);
        $this->assertStringNotContainsString(self::LINE_TOTAL, $html);
        $this->assertStringNotContainsString(__('documents.grand_total'), $html);
    }

    public function test_hiding_both_leaves_a_plain_list_of_items(): void
    {
        $html = $this->pdfHtml($this->quote(['show_unit_prices' => false, 'show_amounts' => false]));

        $this->assertStringNotContainsString(self::UNIT_PRICE, $html);
        $this->assertStringNotContainsString(self::LINE_TOTAL, $html);
        $this->assertStringNotContainsString(' %', $html);
    }

    public function test_the_email_body_does_not_reveal_hidden_amounts(): void
    {
        $quote = $this->quote(['show_amounts' => false]);

        $body = (new QuoteMail($quote))->render();

        $this->assertStringNotContainsString(self::LINE_TOTAL, $body);
        $this->assertStringContainsString(self::LINE_TOTAL, (new QuoteMail($this->quote()))->render());
    }

    /** L'API v1 ne connaît pas ces options : une mise à jour sans elles ne doit pas les remettre à vrai. */
    public function test_an_update_without_the_options_keeps_the_choice(): void
    {
        $quote = $this->quote(['show_amounts' => false]);

        QuoteWriter::update($quote, [
            'quote_date' => $quote->quote_date->toDateString(),
            'expiry_date' => $quote->expiry_date->toDateString(),
            'items' => [['product_id' => $quote->items->first()->product_id, 'quantity' => 1, 'unit_price' => 10]],
        ]);

        $this->assertFalse($quote->refresh()->show_amounts);
    }
}
