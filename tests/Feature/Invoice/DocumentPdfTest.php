<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Services\DocumentPdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The project had no PDF generation at all — no library, nothing writing to disk — while
 * both mailables already attached quotes/{id}.pdf, so every send failed (5d669b3).
 *
 * Nothing is stored: a document is immutable once issued, so its rendering is
 * reproducible and a file on disk would only be a cache to invalidate, plus a copy of
 * fiscal data to back up and purge.
 */
class DocumentPdfTest extends TestCase
{
    use RefreshDatabase;

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    private function sale(Shop $shop, User $user): Sale
    {
        $this->actingAs($user);

        $sale = Sale::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'sale_date' => now(),
            'payment_method' => 'cash',
            'status' => 'completed',
            'subtotal' => 1000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 1000,
            'amount_paid' => 1000,
            'change_amount' => 0,
            'remaining_amount' => 0,
        ]);

        $product = Product::factory()->create(['shop_id' => $shop->id]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => 'Ciment 50kg',
            'quantity' => 2,
            'unit_price' => 500,
            'total' => 1000,
        ]);

        return $sale->fresh();
    }

    private function invoice(Shop $shop): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        // Deux taux différents sur la même facture : c'est le cas qui rend la ventilation
        // obligatoire, et il est devenu courant depuis que le taux vient du produit.
        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 10,
            'unit_price' => 100,
            'tax_rate' => 18,
        ]);
        $invoice->items()->create([
            'product_name' => 'Sac de riz',
            'quantity' => 2,
            'unit_price' => 500,
            'tax_rate' => 0,
        ]);

        return $invoice->fresh();
    }

    public function test_the_ticket_is_served_as_a_pdf(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $sale = $this->sale($shop, $user);

        $response = $this->actingAs($user)->get("/{$user->code_user}/ventes/{$sale->id}/pdf");

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
    }

    public function test_the_invoice_is_served_as_a_pdf(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop);

        $response = $this->actingAs($user)->get("/{$user->code_user}/factures/{$invoice->id}/pdf");

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
    }

    /**
     * A single "TVA" line does not say what the amount is made of. The breakdown groups
     * the taxable base by rate, which is what a tax inspection asks for.
     */
    public function test_the_tax_breakdown_groups_the_base_by_rate(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);
        $invoice = $this->invoice($shop);

        $pdf = app(DocumentPdf::class);
        $breakdown = (new \ReflectionMethod($pdf, 'taxBreakdown'))
            ->invoke($pdf, $invoice->items);

        $this->assertCount(2, $breakdown);

        // Highest rate first, so the exempt band reads last.
        $this->assertSame(18.0, $breakdown[0]['rate']);
        $this->assertSame(1000.0, $breakdown[0]['base']);
        $this->assertSame(180.0, $breakdown[0]['tax']);

        $this->assertSame(0.0, $breakdown[1]['rate']);
        $this->assertSame(1000.0, $breakdown[1]['base']);
        $this->assertSame(0.0, $breakdown[1]['tax']);
    }

    /**
     * The logo is embedded as data, not linked. dompdf would otherwise have to fetch the
     * file over the network from the server itself — slow, dependent on the site being
     * reachable, and defeated by any protection in front of it.
     */
    public function test_the_logo_travels_inside_the_document(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('logos/shop.png', 'fake-png-bytes');

        $shop = Shop::factory()->create(['logo' => 'logos/shop.png']);
        $pdf = app(DocumentPdf::class);

        $logo = (new \ReflectionMethod($pdf, 'logo'))->invoke($pdf, $shop);

        $this->assertStringStartsWith('data:', $logo);
        $this->assertStringContainsString(base64_encode('fake-png-bytes'), $logo);
    }

    public function test_a_shop_without_a_logo_gets_none(): void
    {
        $shop = Shop::factory()->create(['logo' => null]);
        $pdf = app(DocumentPdf::class);

        $this->assertNull((new \ReflectionMethod($pdf, 'logo'))->invoke($pdf, $shop));
    }

    /**
     * A document must come out whatever happens: without its logo rather than not at all.
     */
    public function test_a_missing_logo_file_does_not_break_the_document(): void
    {
        Storage::fake('public');

        $shop = Shop::factory()->create(['logo' => 'logos/disparu.png']);
        $user = $this->owner($shop);
        $sale = $this->sale($shop, $user);

        $response = $this->actingAs($user)->get("/{$user->code_user}/ventes/{$sale->id}/pdf");

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    /**
     * The receipt height is computed rather than fitted afterwards, so the logo has to be
     * counted or it would push the end of the ticket off the roll.
     */
    public function test_the_receipt_grows_to_fit_its_logo(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('logos/shop.png', 'fake-png-bytes');

        $pdf = app(DocumentPdf::class);
        $heights = [];

        foreach ([['logo' => 'logos/shop.png'], ['logo' => null]] as $attributes) {
            $shop = Shop::factory()->create($attributes);
            $user = $this->owner($shop);
            $sale = $this->sale($shop, $user);

            $heights[] = (new \ReflectionMethod($pdf, 'receiptHeight'))->invoke($pdf, $sale);
        }

        $this->assertGreaterThan($heights[1], $heights[0]);
    }

    public function test_another_tenants_ticket_cannot_be_downloaded(): void
    {
        $theirs = Shop::factory()->create();
        $theirOwner = $this->owner($theirs);
        $sale = $this->sale($theirs, $theirOwner);

        $mine = Shop::factory()->create();
        $user = $this->owner($mine);

        $this->actingAs($user)
            ->get("/{$user->code_user}/ventes/{$sale->id}/pdf")
            ->assertForbidden();
    }

    public function test_another_tenants_invoice_cannot_be_downloaded(): void
    {
        $theirs = Shop::factory()->create();
        $this->owner($theirs);
        $invoice = $this->invoice($theirs);

        $mine = Shop::factory()->create();
        $user = $this->owner($mine);

        $this->actingAs($user)
            ->get("/{$user->code_user}/factures/{$invoice->id}/pdf")
            ->assertForbidden();
    }
}
