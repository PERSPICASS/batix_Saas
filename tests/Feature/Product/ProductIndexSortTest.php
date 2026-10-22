<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** La liste des produits se trie par nom, sans tenir compte des majuscules. */
class ProductIndexSortTest extends TestCase
{
    use RefreshDatabase;

    private function names(string $sort = ''): array
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $this->subscribeOwnerOf($shop);

        foreach (['Brouette', 'Vis 6mm', 'agrafes', 'ciment 50kg'] as $i => $name) {
            Product::factory()->create([
                'shop_id' => $shop->id, 'name' => $name, 'is_active' => true, 'created_at' => now()->addMinutes($i),
            ]);
        }

        $names = [];
        $this->actingAs($owner)->withSession(['active_shop_id' => $shop->id])
            ->get("/{$owner->code_user}/produits" . ($sort ? "?sort={$sort}" : ''))
            ->assertOk()
            ->assertInertia(function ($page) use (&$names) {
                $names = array_column($page->toArray()['props']['products']['data'], 'name');
            });

        return $names;
    }

    public function test_newest_first_by_default(): void
    {
        $this->assertSame(['ciment 50kg', 'agrafes', 'Vis 6mm', 'Brouette'], $this->names());
    }

    public function test_by_name_ascending(): void
    {
        $this->assertSame(['agrafes', 'Brouette', 'ciment 50kg', 'Vis 6mm'], $this->names('name_asc'));
    }

    public function test_by_name_descending(): void
    {
        $this->assertSame(['Vis 6mm', 'ciment 50kg', 'Brouette', 'agrafes'], $this->names('name_desc'));
    }
}
