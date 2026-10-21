<?php

namespace Tests\Feature\Sale;

use App\Models\Sale;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Le numéro de ticket était un compteur unique pour toute la plateforme, sur
 * 4 chiffres par jour, retrouvé par tri de chaînes : à la 10 000ᵉ vente du jour
 * (tous clients confondus), le même numéro revenait indéfiniment et toutes les
 * ventes de tous les clients échouaient jusqu'à minuit.
 */
class TicketNumberTest extends TestCase
{
    use RefreshDatabase;

    private function insertSale(Shop $shop, string $number): void
    {
        DB::table('sales')->insert([
            'shop_id' => $shop->id,
            'user_id' => $shop->user_id,
            'ticket_number' => $number,
            'sale_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_each_shop_has_its_own_daily_counter(): void
    {
        $a = Shop::factory()->create();
        $b = Shop::factory()->create();
        $prefix = 'TKT-'.date('Ymd');

        $this->insertSale($a, $prefix.'0001');
        $this->insertSale($a, $prefix.'0002');

        $this->assertSame($prefix.'0003', Sale::generateTicketNumber($a->id));
        $this->assertSame($prefix.'0001', Sale::generateTicketNumber($b->id), "Les ventes d'une autre boutique ne consomment pas mon compteur.");

        // Two shops may now hold the same number (unique per shop).
        $this->insertSale($b, $prefix.'0001');
        $this->assertSame(2, DB::table('sales')->where('ticket_number', $prefix.'0001')->count());
    }

    public function test_the_counter_keeps_going_past_9999(): void
    {
        $shop = Shop::factory()->create();
        $prefix = 'TKT-'.date('Ymd');

        $this->insertSale($shop, $prefix.'9999');
        $this->assertSame($prefix.'10000', Sale::generateTicketNumber($shop->id));

        $this->insertSale($shop, $prefix.'10000');
        $this->assertSame($prefix.'10001', Sale::generateTicketNumber($shop->id), 'Tri de chaînes : « …10000 » passait sous « …9999 ».');
    }

    public function test_a_number_cannot_repeat_within_a_shop(): void
    {
        $shop = Shop::factory()->create();
        $this->insertSale($shop, 'TKT-X');

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        $this->insertSale($shop, 'TKT-X');
    }
}
