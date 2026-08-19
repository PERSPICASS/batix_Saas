<?php

namespace Tests\Feature\Api\V1;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Couvre les endpoints devis et factures v1, ouverts à l'assistant IA via le MCP.
 *
 * L'enjeu central est la garde « brouillon » : l'API prépare des documents, elle
 * n'en émet aucun. Une facture émise déstocke la marchandise et consomme un numéro
 * qui ne sera jamais réattribué — un modèle qui se trompe ne doit pas pouvoir en
 * arriver là.
 */
class QuoteInvoiceEndpointsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerWithShop(float $shopTaxRate = 18): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create([
            'user_id' => $user->id,
            'default_tax_rate' => $shopTaxRate,
        ]);

        return [$user, $shop];
    }

    private function quotePayload(Shop $shop, Customer $customer, Product $product, int $qty = 2, float $price = 1000): array
    {
        return [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(15)->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => $qty, 'unit_price' => $price],
            ],
        ];
    }

    // ---------------------------------------------------------------- lecture

    public function test_quotes_index_returns_only_the_accessible_shops_quotes(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        // Quote n'a pas de factory : création directe.
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        Quote::create([
            'shop_id' => $shop->id, 'customer_id' => $customer->id,
            'quote_number' => 'QTE-1', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 100, 'tax_amount' => 18, 'total' => 118,
        ]);

        // Devis d'une boutique étrangère : ne doit jamais apparaître.
        $otherShop = Shop::factory()->create();
        $otherCustomer = Customer::factory()->create(['shop_id' => $otherShop->id]);
        Quote::create([
            'shop_id' => $otherShop->id, 'customer_id' => $otherCustomer->id,
            'quote_number' => 'QTE-INTRUS', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 999, 'tax_amount' => 0, 'total' => 999,
        ]);

        Sanctum::actingAs($user, ['quotes:read']);

        $this->getJson('/api/v1/quotes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.quote_number', 'QTE-1');
    }

    public function test_quote_show_hides_a_quote_from_another_shop(): void
    {
        [$user] = $this->ownerWithShop();
        $otherShop = Shop::factory()->create();
        $customer = Customer::factory()->create(['shop_id' => $otherShop->id]);
        $quote = Quote::create([
            'shop_id' => $otherShop->id, 'customer_id' => $customer->id,
            'quote_number' => 'QTE-X', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 1, 'tax_amount' => 0, 'total' => 1,
        ]);

        Sanctum::actingAs($user, ['quotes:read']);

        $this->getJson("/api/v1/quotes/{$quote->id}")->assertNotFound();
    }

    public function test_document_download_links_are_short_lived_signed_and_tenant_scoped(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $quote = Quote::create([
            'shop_id' => $shop->id, 'customer_id' => $customer->id,
            'quote_number' => 'QTE-LINK', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 100, 'tax_amount' => 18, 'total' => 118,
        ]);
        $invoice = Invoice::create([
            'shop_id' => $shop->id, 'customer_id' => $customer->id, 'user_id' => $user->id,
            'invoice_number' => 'INV-LINK', 'status' => 'draft',
            'invoice_date' => now(), 'due_date' => now()->addDays(30),
            'subtotal' => 100, 'tax_amount' => 18, 'discount_amount' => 0, 'total' => 118,
        ]);

        Sanctum::actingAs($user, ['quotes:read', 'invoices:read']);

        $quoteResponse = $this->getJson("/api/v1/quotes/{$quote->id}/download-link")
            ->assertOk()->assertJsonStructure(['data' => ['download_url', 'expires_at']]);
        $invoiceResponse = $this->getJson("/api/v1/invoices/{$invoice->id}/download-link")
            ->assertOk()->assertJsonStructure(['data' => ['download_url', 'expires_at']]);

        $this->assertStringContainsString("/d/devis/{$quote->id}", $quoteResponse->json('data.download_url'));
        $this->assertStringContainsString("/d/facture/{$invoice->id}", $invoiceResponse->json('data.download_url'));
        $this->assertStringContainsString('signature=', $quoteResponse->json('data.download_url'));
        $this->assertStringContainsString('signature=', $invoiceResponse->json('data.download_url'));
        $this->assertEqualsWithDelta(
            now()->addMinutes(15)->timestamp,
            strtotime($quoteResponse->json('data.expires_at')),
            1,
        );

        [$otherUser] = $this->ownerWithShop();
        Sanctum::actingAs($otherUser, ['quotes:read', 'invoices:read']);
        $this->getJson("/api/v1/quotes/{$quote->id}/download-link")->assertNotFound();
        $this->getJson("/api/v1/invoices/{$invoice->id}/download-link")->assertNotFound();
    }

    public function test_reading_quotes_requires_the_quotes_read_ability(): void
    {
        [$user] = $this->ownerWithShop();
        Sanctum::actingAs($user, ['products:read']);

        $this->getJson('/api/v1/quotes')->assertForbidden();
    }

    // -------------------------------------------------------------- création

    public function test_quote_is_created_as_a_draft_with_totals_from_the_shop_tax_rate(): void
    {
        [$user, $shop] = $this->ownerWithShop(shopTaxRate: 18);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        // tax_rate null sur le produit => on retombe sur le taux de la boutique.
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);

        Sanctum::actingAs($user, ['quotes:write']);

        $response = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product, qty: 2, price: 1000))
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.subtotal', 2000)
            ->assertJsonPath('data.tax_amount', 360)
            ->assertJsonPath('data.total', 2360);

        $quote = Quote::find($response->json('data.id'));
        $this->assertSame('draft', $quote->status);
        $this->assertNull($quote->sent_at, 'Un devis créé par l\'API ne doit pas être marqué comme envoyé.');
        $this->assertSame($user->id, $quote->user_id);
    }

    public function test_a_product_tax_rate_takes_precedence_over_the_shop_rate(): void
    {
        [$user, $shop] = $this->ownerWithShop(shopTaxRate: 18);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 0]);

        Sanctum::actingAs($user, ['quotes:write']);

        // Produit exonéré : 0 % est une réponse, pas une absence de réponse.
        $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product, qty: 1, price: 500))
            ->assertCreated()
            ->assertJsonPath('data.tax_amount', 0)
            ->assertJsonPath('data.total', 500);
    }

    public function test_creating_a_quote_requires_the_write_ability(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['quotes:read']);

        $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product))
            ->assertForbidden();

        $this->assertSame(0, Quote::count());
    }

    public function test_a_quote_cannot_be_created_in_a_shop_the_token_cannot_access(): void
    {
        [$user] = $this->ownerWithShop();
        $foreignShop = Shop::factory()->create();
        $customer = Customer::factory()->create(['shop_id' => $foreignShop->id]);
        $product = Product::factory()->create(['shop_id' => $foreignShop->id]);

        Sanctum::actingAs($user, ['quotes:write']);

        $this->postJson('/api/v1/quotes', $this->quotePayload($foreignShop, $customer, $product))
            ->assertForbidden();

        $this->assertSame(0, Quote::count());
    }

    public function test_a_customer_from_another_shop_is_rejected(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $product = Product::factory()->create(['shop_id' => $shop->id]);
        $foreignCustomer = Customer::factory()->create(['shop_id' => Shop::factory()->create()->id]);

        Sanctum::actingAs($user, ['quotes:write']);

        $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $foreignCustomer, $product))
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_id');
    }

    // ------------------------------------------------------------- factures

    public function test_invoice_is_created_as_a_draft_and_ignores_a_status_sent_by_the_caller(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'stock_quantity' => 50, 'tax_rate' => null]);

        Sanctum::actingAs($user, ['invoices:write']);

        $response = $this->postJson('/api/v1/invoices', [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'invoice_date' => now()->toDateString(),
            // Tentative d'émission directe : doit être ignorée, pas obéie.
            'status' => 'paid',
            'items' => [[
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => 3,
                'unit_price' => 1000,
            ]],
        ])->assertCreated()->assertJsonPath('data.status', 'draft');

        $invoice = Invoice::find($response->json('data.id'));
        $this->assertSame('draft', $invoice->status);
        $this->assertNull($invoice->stock_released_at, 'Un brouillon ne doit pas sortir la marchandise.');
        $this->assertSame(50, $product->fresh()->stock_quantity, 'Le stock ne doit pas bouger sur un brouillon.');
    }

    public function test_invoice_line_without_tax_rate_falls_back_to_the_shop_rate(): void
    {
        [$user, $shop] = $this->ownerWithShop(shopTaxRate: 20);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);

        Sanctum::actingAs($user, ['invoices:write']);

        // Sans ce repli, InvoiceItem normaliserait le null en 0 et la facture
        // d'une boutique assujettie sortirait hors taxe.
        $this->postJson('/api/v1/invoices', [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'invoice_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => 1,
                'unit_price' => 1000,
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.tax_amount', 200)
            ->assertJsonPath('data.total', 1200);
    }

    public function test_a_created_quote_carries_a_link_to_its_page(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['quotes:write']);

        $response = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product))
            ->assertCreated();

        $id = $response->json('data.id');

        // Le lien est renvoyé par l'API plutôt que composé par l'assistant : un modèle
        // qui fabrique une URL invente tôt ou tard un identifiant, et l'utilisateur
        // découvre le lien mort en cliquant.
        $this->assertSame(
            route('quotes.show', ['code_user' => $user->code_user, 'quote' => $id]),
            $response->json('data.web_url'),
        );
    }

    public function test_the_link_uses_the_account_owner_code_not_the_staff_member(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        // Un employé navigue sous le code de son patron : construire l'URL avec son
        // propre code produirait un lien refusé à l'ouverture.
        $staff = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($staff, ['quotes:write']);

        $webUrl = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product))
            ->assertCreated()
            ->json('data.web_url');

        $this->assertStringContainsString($owner->code_user, $webUrl);
        $this->assertStringNotContainsString($staff->code_user, $webUrl);
    }

    public function test_a_quote_is_found_by_its_number(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Matthieu Aka']);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['quotes:write']);

        $created = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product))
            ->assertCreated()
            ->json('data');

        // Distracteur indispensable : avec un seul devis dans la boutique, « je trouve
        // un résultat » resterait vrai même sans aucun filtre.
        $other = Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Awa Traoré']);
        Quote::create([
            'shop_id' => $shop->id, 'customer_id' => $other->id,
            'quote_number' => 'QTE-AUTRE-999', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 5, 'tax_amount' => 0, 'total' => 5,
        ]);

        Sanctum::actingAs($user, ['quotes:read']);

        // Le numéro est la seule référence qu'un utilisateur — ou l'assistant, d'un tour
        // de conversation à l'autre — garde sous la main. Sans cette recherche, il ne
        // reste qu'à deviner un identifiant, ce qui tombe sur un autre devis ou sur rien.
        $this->getJson('/api/v1/quotes?search=' . urlencode($created['quote_number']) . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $created['id']);
    }

    public function test_a_quote_is_found_by_its_customer_name(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Matthieu Aka']);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['quotes:write']);
        $mine = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product))
            ->assertCreated()
            ->json('data.id');

        // Devis d'un autre client, dans la même boutique : il ne doit pas remonter.
        $other = Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Awa Traoré']);
        Quote::create([
            'shop_id' => $shop->id, 'customer_id' => $other->id,
            'quote_number' => 'QTE-AUTRE-998', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 5, 'tax_amount' => 0, 'total' => 5,
        ]);

        Sanctum::actingAs($user, ['quotes:read']);

        // « matthieu » en minuscules : la recherche traverse la relation client et reste
        // insensible à la casse.
        $this->getJson('/api/v1/quotes?search=' . urlencode('matthieu') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine);
    }

    // ------------------------------------------------------- modification (brouillon)

    public function test_products_can_be_added_to_a_draft_quote(): void
    {
        [$user, $shop] = $this->ownerWithShop(shopTaxRate: 18);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $first = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);
        $second = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);

        Sanctum::actingAs($user, ['quotes:write']);

        $id = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $first, qty: 1, price: 1000))
            ->assertCreated()
            ->json('data.id');

        // Cas d'usage rapporté : « ajoute d'autres produits au devis ». Les lignes
        // remplacent les précédentes, donc on renvoie la liste complète.
        $this->putJson("/api/v1/quotes/{$id}", [
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(15)->toDateString(),
            'items' => [
                ['product_id' => $first->id, 'quantity' => 1, 'unit_price' => 1000],
                ['product_id' => $second->id, 'quantity' => 2, 'unit_price' => 500],
            ],
        ])
            ->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.subtotal', 2000)
            ->assertJsonPath('data.tax_amount', 360)
            ->assertJsonPath('data.total', 2360)
            ->assertJsonPath('data.status', 'draft');

        $quote = Quote::find($id);
        $this->assertSame(2, $quote->items()->count(), 'Les anciennes lignes doivent être remplacées, pas accumulées.');
    }

    public function test_a_sent_quote_can_no_longer_be_modified(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['quotes:write']);

        $id = $this->postJson('/api/v1/quotes', $this->quotePayload($shop, $customer, $product))
            ->assertCreated()
            ->json('data.id');

        // Un devis envoyé engage le commerçant vis-à-vis de son client : le rechiffrer
        // ferait diverger le document du client et celui de la boutique.
        Quote::find($id)->update(['status' => 'sent']);

        $this->putJson("/api/v1/quotes/{$id}", [
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(15)->toDateString(),
            'items' => [['product_id' => $product->id, 'quantity' => 99, 'unit_price' => 1]],
        ])->assertStatus(409);

        // La quantité d'origine vient de quotePayload() : 2. Le refus doit avoir laissé
        // le devis intact, pas seulement renvoyé le bon code HTTP.
        $this->assertSame(2, Quote::find($id)->items()->first()->quantity, 'Le devis envoyé ne doit pas avoir bougé.');
    }

    public function test_a_quote_from_another_shop_cannot_be_modified(): void
    {
        [$user] = $this->ownerWithShop();
        $foreign = Shop::factory()->create();
        $customer = Customer::factory()->create(['shop_id' => $foreign->id]);
        $product = Product::factory()->create(['shop_id' => $foreign->id]);
        $quote = Quote::create([
            'shop_id' => $foreign->id, 'customer_id' => $customer->id,
            'quote_number' => 'QTE-X', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 1, 'tax_amount' => 0, 'total' => 1,
        ]);

        Sanctum::actingAs($user, ['quotes:write']);

        $this->putJson("/api/v1/quotes/{$quote->id}", [
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(15)->toDateString(),
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 1]],
        ])->assertNotFound();
    }

    public function test_a_draft_invoice_can_be_modified_and_a_sent_one_cannot(): void
    {
        [$user, $shop] = $this->ownerWithShop(shopTaxRate: 20);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'stock_quantity' => 50, 'tax_rate' => null]);

        Sanctum::actingAs($user, ['invoices:write']);

        $id = $this->postJson('/api/v1/invoices', [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'invoice_date' => now()->toDateString(),
            'items' => [['product_id' => $product->id, 'product_name' => $product->name, 'quantity' => 1, 'unit_price' => 1000]],
        ])->assertCreated()->json('data.id');

        $payload = [
            'invoice_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'product_name' => $product->name, 'quantity' => 2, 'unit_price' => 1000],
            ],
        ];

        $this->putJson("/api/v1/invoices/{$id}", $payload)
            ->assertOk()
            ->assertJsonPath('data.total', 2400)
            ->assertJsonPath('data.status', 'draft');

        // Le brouillon modifié ne doit toujours pas avoir sorti la marchandise.
        $this->assertNull(Invoice::find($id)->stock_released_at);
        $this->assertSame(50, $product->fresh()->stock_quantity);

        Invoice::find($id)->update(['status' => 'sent']);

        $this->putJson("/api/v1/invoices/{$id}", $payload)->assertStatus(409);
    }

    public function test_modifying_a_quote_requires_the_write_ability(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id]);
        $quote = Quote::create([
            'shop_id' => $shop->id, 'customer_id' => $customer->id,
            'quote_number' => 'QTE-9', 'status' => 'draft',
            'quote_date' => now(), 'expiry_date' => now()->addDays(10),
            'subtotal' => 1, 'tax_amount' => 0, 'total' => 1,
        ]);

        Sanctum::actingAs($user, ['quotes:read']);

        $this->putJson("/api/v1/quotes/{$quote->id}", [
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(15)->toDateString(),
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 1]],
        ])->assertForbidden();
    }

    public function test_creating_an_invoice_requires_the_write_ability(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['invoices:read']);

        $this->postJson('/api/v1/invoices', [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'invoice_date' => now()->toDateString(),
            'items' => [['product_name' => 'Divers', 'quantity' => 1, 'unit_price' => 100]],
        ])->assertForbidden();

        $this->assertSame(0, Invoice::count());
    }
}
