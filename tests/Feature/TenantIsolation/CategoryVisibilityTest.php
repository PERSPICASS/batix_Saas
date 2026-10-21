<?php

namespace Tests\Feature\TenantIsolation;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\Subcategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Modèle mixte (décidé le 2026-10-15) : catalogue commun BATIX (shop_id NULL),
 * visible de tous et en lecture seule, + catégories propres à chaque boutique.
 * Avant, les pages listaient Category::all() : chaque client voyait les
 * catégories de tous les autres, et pouvait en affecter une à ses produits.
 */
class CategoryVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private User $me;
    private Shop $myShop;
    private Category $global;
    private Category $mine;
    private Category $theirs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->me = User::factory()->create(['role' => 'super_admin']);
        $this->myShop = Shop::factory()->create(['user_id' => $this->me->id]);
        $this->me->update(['shop_id' => $this->myShop->id]);

        $other = Shop::factory()->create();

        $this->global = Category::factory()->create(['shop_id' => null, 'name' => 'Plomberie commune']);
        $this->mine = Category::factory()->create(['shop_id' => $this->myShop->id, 'name' => 'Ma catégorie']);
        $this->theirs = Category::factory()->create(['shop_id' => $other->id, 'name' => 'Catégorie concurrente']);
    }

    private function url(string $path): string
    {
        return '/'.$this->me->accountCode().'/'.$path;
    }

    public function test_the_categories_page_shows_the_shared_catalogue_and_mine_only(): void
    {
        $this->actingAs($this->me)->get($this->url('categories'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('categories', 2)
                ->where('categories', fn ($cats) => collect($cats)->pluck('id')->sort()->values()->all()
                    === collect([$this->global->id, $this->mine->id])->sort()->values()->all())
            );
    }

    public function test_the_product_form_does_not_list_another_tenants_categories(): void
    {
        $this->actingAs($this->me)->get($this->url('produits/create'))
            ->assertOk()
            ->assertDontSee('Catégorie concurrente');
    }

    public function test_a_product_cannot_be_put_in_another_tenants_category(): void
    {

        $this->assertFalse(
            $this->validates(['category_id' => $this->theirs->id]),
            "La catégorie d'un autre compte doit être refusée."
        );
        $this->assertTrue($this->validates(['category_id' => $this->global->id]));
        $this->assertTrue($this->validates(['category_id' => $this->mine->id]));
    }

    private function validates(array $data): bool
    {
        $this->actingAs($this->me);

        return validator($data, [
            'category_id' => ['nullable', \App\Rules\AccessibleCategory::visible($this->me)],
        ])->passes();
    }

    public function test_a_shared_category_is_read_only_to_an_account(): void
    {
        $this->assertTrue($this->me->can('view', $this->global));
        $this->assertFalse($this->me->can('update', $this->global));
        $this->assertFalse($this->me->can('delete', $this->global));

        $this->assertTrue($this->me->can('update', $this->mine));
        $this->assertFalse($this->me->can('view', $this->theirs));
    }

    /** Une sous-catégorie sous une catégorie commune serait visible de tous les comptes. */
    public function test_a_subcategory_can_only_be_added_under_one_of_my_categories(): void
    {
        $validator = fn (int $id) => validator(['category_id' => $id], [
            'category_id' => [\App\Rules\AccessibleCategory::managed($this->me)],
        ])->passes();

        $this->assertTrue($validator($this->mine->id));
        $this->assertFalse($validator($this->global->id));
        $this->assertFalse($validator($this->theirs->id));
    }

    public function test_the_subcategories_page_renders_and_hides_other_tenants(): void
    {
        Subcategory::create(['category_id' => $this->global->id, 'name' => 'Sous commune', 'slug' => 'sous-commune']);
        Subcategory::create(['category_id' => $this->mine->id, 'name' => 'Sous à moi', 'slug' => 'sous-a-moi']);
        Subcategory::create(['category_id' => $this->theirs->id, 'name' => 'Sous concurrente', 'slug' => 'sous-concurrente']);

        $this->actingAs($this->me)->get($this->url('sous-categories'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('subcategories', 2));
    }
}
