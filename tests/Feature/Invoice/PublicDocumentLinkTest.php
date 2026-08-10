<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Services\DocumentLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * A customer at a hardware store has no account, and is exactly who these documents are
 * for. A wa.me link carries text only, never a file, so the link IS their copy.
 *
 * Everything rests on the signature: Laravel seals the whole URL with the application
 * key, so an edited id invalidates it. Nothing is guessable, nothing is enumerable, and
 * one link opens one document — the one that was deliberately shared.
 */
class PublicDocumentLinkTest extends TestCase
{
    use RefreshDatabase;

    private function shopWithOwner(): Shop
    {
        $shop = Shop::factory()->create();
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $shop->fresh();
    }

    private function sale(Shop $shop): Sale
    {
        $this->actingAs($shop->user);

        $sale = Sale::create([
            'shop_id' => $shop->id,
            'user_id' => $shop->user_id,
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

        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 1,
            'unit_price' => 100,
            'tax_rate' => 18,
        ]);

        return $invoice->fresh();
    }

    /**
     * No session at all: the recipient is a customer with no account.
     */
    public function test_a_signed_link_opens_the_ticket_without_logging_in(): void
    {
        $shop = $this->shopWithOwner();
        $sale = $this->sale($shop);

        $link = DocumentLink::forSale($sale);

        // Drop the session the helper needed to build the sale.
        auth()->logout();

        $response = $this->get($link);

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_the_same_holds_for_an_invoice(): void
    {
        $shop = $this->shopWithOwner();
        $invoice = $this->invoice($shop);

        $response = $this->get(DocumentLink::forInvoice($invoice));

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    /**
     * The failure this suite missed: in production every link 403'd.
     *
     * The container's nginx listens on HTTP and forwards nothing about the scheme to PHP
     * — no fastcgi_param HTTPS, no X-Forwarded-Proto — so Laravel sees an http request,
     * while AppServiceProvider calls URL::forceScheme('https') and therefore signs an
     * https URL. An absolute signature covers the scheme, so the signed URL and the
     * verified URL could never match.
     *
     * Reproduced exactly: force https for the generation, then arrive over http as the
     * proxy makes it look. Signing the path and query only removes the dependency.
     */
    public function test_a_link_signed_as_https_still_opens_over_http(): void
    {
        $shop = $this->shopWithOwner();
        $sale = $this->sale($shop);

        // Ce que fait AppServiceProvider en production.
        URL::forceScheme('https');
        $link = DocumentLink::forSale($sale);

        // Ce que voit l'application derrière le proxy : la même URL, mais en http.
        URL::forceScheme('http');

        $this->get(parse_url($link, PHP_URL_PATH) . '?' . parse_url($link, PHP_URL_QUERY))
            ->assertOk();
    }

    public function test_an_unsigned_url_is_refused(): void
    {
        $shop = $this->shopWithOwner();
        $sale = $this->sale($shop);

        $this->get("/d/ticket/{$sale->id}")->assertForbidden();
    }

    /**
     * The signature covers the whole URL, so swapping the id for someone else's document
     * breaks it. This is what stands in for tenant scoping on a route with no session.
     */
    public function test_editing_the_id_breaks_the_signature(): void
    {
        $mine = $this->shopWithOwner();
        $sale = $this->sale($mine);

        $theirs = $this->shopWithOwner();
        $foreign = $this->sale($theirs);

        $link = DocumentLink::forSale($sale);
        $tampered = str_replace("/d/ticket/{$sale->id}?", "/d/ticket/{$foreign->id}?", $link);

        $this->assertNotSame($link, $tampered);
        $this->get($tampered)->assertForbidden();
    }

    public function test_a_link_stops_working_once_it_has_expired(): void
    {
        $shop = $this->shopWithOwner();
        $sale = $this->sale($shop);

        $link = DocumentLink::forSale($sale);

        $this->travel(DocumentLink::LIFETIME_DAYS + 1)->days();

        $this->get($link)->assertForbidden();
    }

    public function test_a_link_still_works_the_day_before_it_expires(): void
    {
        $shop = $this->shopWithOwner();
        $sale = $this->sale($shop);

        $link = DocumentLink::forSale($sale);

        $this->travel(DocumentLink::LIFETIME_DAYS - 1)->days();

        $this->get($link)->assertOk();
    }
}
