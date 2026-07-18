<?php

namespace Tests\Feature\Api\V1;

use App\Models\Alert;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Couvre les endpoints analytics v1 consommés par l'assistant IA via le MCP :
 * calcul des KPIs, gate d'ability Sanctum et isolation tenant (scoping shop_id).
 */
class AnalyticsEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function ownerWithShop(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        return [$user, $shop];
    }

    private function completedSale(Shop $shop, User $user, float $total, string $ticket): Sale
    {
        return Sale::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'ticket_number' => $ticket,
            'sale_date' => now(),
            'status' => 'completed',
            'total' => $total,
        ]);
    }

    public function test_sales_summary_returns_kpis_for_the_accessible_shop(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $this->completedSale($shop, $user, 1000, 'T-1');
        $this->completedSale($shop, $user, 3000, 'T-2');
        // Exclue : hors statut completed.
        Sale::create([
            'shop_id' => $shop->id, 'user_id' => $user->id, 'ticket_number' => 'T-3',
            'sale_date' => now(), 'status' => 'pending', 'total' => 9999,
        ]);

        Sanctum::actingAs($user, ['sales:read']);

        $this->getJson('/api/v1/analytics/sales-summary?days=30')
            ->assertOk()
            ->assertJsonPath('data.total_revenue', 4000)
            ->assertJsonPath('data.sale_count', 2)
            ->assertJsonPath('data.average_basket', 2000);
    }

    public function test_top_products_are_ranked_by_revenue(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $cheap = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Vis']);
        $pricey = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Perceuse']);

        $sale = $this->completedSale($shop, $user, 5000, 'T-10');
        // withoutEvents : éviter l'observer SaleItem qui génère un mouvement de stock
        // (non pertinent ici — seul le join sale_items↔products alimente le classement).
        SaleItem::withoutEvents(function () use ($sale, $cheap, $pricey) {
            SaleItem::create([
                'sale_id' => $sale->id, 'product_id' => $cheap->id, 'product_name' => 'Vis',
                'quantity' => 2, 'unit_price' => 500, 'total' => 1000,
            ]);
            SaleItem::create([
                'sale_id' => $sale->id, 'product_id' => $pricey->id, 'product_name' => 'Perceuse',
                'quantity' => 1, 'unit_price' => 4000, 'total' => 4000,
            ]);
        });

        Sanctum::actingAs($user, ['sales:read']);

        $this->getJson('/api/v1/analytics/top-products?limit=5&days=30')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Perceuse')
            ->assertJsonPath('data.1.name', 'Vis');
    }

    public function test_alerts_returns_unread_only(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Alert::create([
            'user_id' => $user->id, 'shop_id' => $shop->id, 'type' => 'stock_low',
            'title' => 'Rupture', 'message' => 'Stock bas', 'is_read' => false,
        ]);
        Alert::create([
            'user_id' => $user->id, 'shop_id' => $shop->id, 'type' => 'stock_low',
            'title' => 'Déjà vue', 'message' => 'Ancienne', 'is_read' => true,
        ]);

        Sanctum::actingAs($user, ['stock-movements:read']);

        $this->getJson('/api/v1/alerts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Rupture');
    }

    public function test_sales_summary_requires_the_sales_read_ability(): void
    {
        [$user] = $this->ownerWithShop();

        // Token porté sur une autre ability : le middleware abilities:sales:read refuse.
        Sanctum::actingAs($user, ['products:read']);

        $this->getJson('/api/v1/analytics/sales-summary')->assertForbidden();
    }

    public function test_cannot_query_another_tenants_shop_via_shop_id(): void
    {
        [$user] = $this->ownerWithShop();

        $otherOwner = User::factory()->create(['role' => 'super_admin']);
        $otherShop = Shop::factory()->create(['user_id' => $otherOwner->id]);
        $this->completedSale($otherShop, $otherOwner, 7777, 'T-X');

        Sanctum::actingAs($user, ['sales:read']);

        // shop_id d'un tenant non accessible → 403 (resolveShopIds abort).
        $this->getJson("/api/v1/analytics/sales-summary?shop_id={$otherShop->id}")
            ->assertForbidden();
    }
}
