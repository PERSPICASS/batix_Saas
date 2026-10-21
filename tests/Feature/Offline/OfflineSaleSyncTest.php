<?php

namespace Tests\Feature\Offline;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Rejeu des ventes saisies hors ligne.
 *
 * L'idempotence est la garantie centrale : une vente en file d'attente est renvoyée
 * tant qu'elle n'est pas confirmée, et sur un réseau instable le client peut très bien
 * avoir été enregistré côté serveur sans jamais recevoir la réponse. Sans le garde-fou
 * du client_uuid, ce simple réessai facturerait le client deux fois et décrémenterait
 * le stock deux fois.
 */
class OfflineSaleSyncTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop, 2: Product} */
    private function sellerWithStock(int $stock = 10): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $user->update(['shop_id' => $shop->id]);

        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'stock_quantity' => $stock,
            'track_stock' => true,
            'selling_price' => 1000,
        ]);

        return [$user, $shop, $product];
    }

    private function payload(Shop $shop, Product $product, string $uuid, int $qty = 1): array
    {
        return [
            'client_uuid' => $uuid,
            'shop_id' => $shop->id,
            'payment_method' => 'cash',
            'amount_paid' => 1000 * $qty,
            'sale_date' => now()->subHours(3)->toDateTimeString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => $qty, 'unit_price' => 1000],
            ],
        ];
    }

    private function sync(User $user, array $sales)
    {
        return $this->actingAs($user)->postJson(
            "/{$user->code_user}/ventes/sync-offline",
            ['sales' => $sales]
        );
    }

    public function test_a_queued_sale_is_recorded_and_stock_is_decremented(): void
    {
        [$user, $shop, $product] = $this->sellerWithStock(10);

        $response = $this->sync($user, [$this->payload($shop, $product, (string) Str::uuid(), 3)]);

        $response->assertOk();
        $this->assertSame('synced', $response->json('results.0.status'));
        $this->assertNotEmpty($response->json('results.0.ticket_number'));
        $this->assertSame(7, $product->fresh()->stock_quantity);
    }

    public function test_replaying_the_same_sale_does_not_record_it_twice(): void
    {
        [$user, $shop, $product] = $this->sellerWithStock(10);
        $uuid = (string) Str::uuid();

        $first = $this->sync($user, [$this->payload($shop, $product, $uuid, 2)]);
        $second = $this->sync($user, [$this->payload($shop, $product, $uuid, 2)]);

        $first->assertOk();
        $second->assertOk();

        // Le second envoi doit être confirmé, pas rejeté : le client purge sa file sur
        // cette confirmation. Un échec le ferait réessayer indéfiniment.
        $this->assertSame('synced', $second->json('results.0.status'));
        $this->assertSame(
            $first->json('results.0.ticket_number'),
            $second->json('results.0.ticket_number'),
            'Le rejeu doit renvoyer le ticket déjà émis.'
        );

        $this->assertSame(1, Sale::where('client_uuid', $uuid)->count());
        // Le point qui compte : le stock n'a été décrémenté qu'une fois.
        $this->assertSame(8, $product->fresh()->stock_quantity);
    }

    public function test_the_real_sale_time_is_kept_not_the_sync_time(): void
    {
        [$user, $shop, $product] = $this->sellerWithStock();
        $soldAt = now()->subHours(5)->startOfMinute();

        $payload = $this->payload($shop, $product, (string) Str::uuid());
        $payload['sale_date'] = $soldAt->toDateTimeString();

        $this->sync($user, [$payload])->assertOk();

        // Sinon toutes les ventes de la journée porteraient l'heure de la
        // synchronisation et les rapports du gérant seraient faux.
        $this->assertSame(
            $soldAt->toDateTimeString(),
            Sale::first()->sale_date->toDateTimeString()
        );
    }

    public function test_a_sale_beyond_available_stock_is_rejected_with_a_reason(): void
    {
        [$user, $shop, $product] = $this->sellerWithStock(2);

        $response = $this->sync($user, [$this->payload($shop, $product, (string) Str::uuid(), 5)]);

        $response->assertOk();
        $this->assertSame('rejected', $response->json('results.0.status'));
        $this->assertStringContainsString('Stock insuffisant', $response->json('results.0.message'));
        $this->assertSame(2, $product->fresh()->stock_quantity, 'Aucun stock ne doit bouger.');
    }

    public function test_one_rejected_sale_does_not_block_the_rest_of_the_batch(): void
    {
        [$user, $shop, $product] = $this->sellerWithStock(4);

        // La première épuise le stock, la seconde passe quand même.
        $response = $this->sync($user, [
            $this->payload($shop, $product, (string) Str::uuid(), 99),
            $this->payload($shop, $product, (string) Str::uuid(), 2),
        ]);

        $response->assertOk();
        $this->assertSame('rejected', $response->json('results.0.status'));
        $this->assertSame('synced', $response->json('results.1.status'));
        $this->assertSame(2, $product->fresh()->stock_quantity);
    }

    public function test_a_sale_for_another_tenants_shop_is_refused(): void
    {
        [$user] = $this->sellerWithStock();

        $intruder = User::factory()->create(['role' => 'super_admin']);
        $otherShop = Shop::factory()->create(['user_id' => $intruder->id]);
        $otherProduct = Product::factory()->create([
            'shop_id' => $otherShop->id,
            'stock_quantity' => 10,
            'track_stock' => true,
        ]);

        $response = $this->sync($user, [$this->payload($otherShop, $otherProduct, (string) Str::uuid())]);

        $response->assertOk();
        $this->assertSame('rejected', $response->json('results.0.status'));
        $this->assertSame(0, Sale::count());
        $this->assertSame(10, $otherProduct->fresh()->stock_quantity);
    }

    public function test_guests_cannot_sync(): void
    {
        [$user, $shop, $product] = $this->sellerWithStock();

        $this->postJson(
            "/{$user->code_user}/ventes/sync-offline",
            ['sales' => [$this->payload($shop, $product, (string) Str::uuid())]]
        )->assertStatus(401);

        $this->assertSame(0, Sale::count());
    }
}
