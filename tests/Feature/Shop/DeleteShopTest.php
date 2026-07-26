<?php

namespace Tests\Feature\Shop;

use App\Models\Customer;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Deleting a shop, which `$shop->delete()` alone could not do.
 *
 * Two independent defects sat on the same line. Six foreign keys declared without `onDelete`
 * are RESTRICT and block the cascade instead of following it, so a shop that had issued a
 * quote or a credit note could not be deleted at all. And `users.shop_id` cascades, so
 * deleting the shop the owner was currently attached to deleted *the owner's own account* —
 * along with their other shops and their subscription.
 *
 * @see \App\Services\AccountDeletion
 * @see \Tests\Feature\Profile\DeleteAccountTest for the account-level path.
 */
class DeleteShopTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerWithShop(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $user->update(['shop_id' => $shop->id]);

        return [$user->fresh(), $shop];
    }

    private function deleteUrl(User $user, Shop $shop): string
    {
        return route('shops.destroy', ['code_user' => $user->code_user, 'shop' => $shop->id]);
    }

    private function quoteIn(Shop $shop, User $user): Quote
    {
        return Quote::create([
            'shop_id' => $shop->id,
            'customer_id' => Customer::factory()->create(['shop_id' => $shop->id])->id,
            'user_id' => $user->id,
            'quote_number' => 'DEV-' . $shop->id,
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'subtotal' => 100, 'tax_amount' => 20, 'total' => 120,
        ]);
    }

    public function test_a_shop_can_be_deleted(): void
    {
        [$owner, $shop] = $this->ownerWithShop();

        $this->actingAs($owner)->delete($this->deleteUrl($owner, $shop));

        $this->assertDatabaseMissing('shops', ['id' => $shop->id]);
    }

    /** The RESTRICT regression: one quote used to make the shop undeletable. */
    public function test_a_shop_that_issued_quotes_can_be_deleted(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $quote = $this->quoteIn($shop, $owner);

        $this->actingAs($owner)->delete($this->deleteUrl($owner, $shop));

        $this->assertDatabaseMissing('shops', ['id' => $shop->id]);
        $this->assertDatabaseMissing('quotes', ['id' => $quote->id]);
    }

    /**
     * The severe one: the owner must survive deleting a branch. `users.shop_id` cascades,
     * so their account went with the shop they happened to be attached to.
     */
    public function test_deleting_a_branch_does_not_delete_the_owner(): void
    {
        [$owner, $branch] = $this->ownerWithShop();
        $kept = Shop::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->delete($this->deleteUrl($owner, $branch));

        $this->assertDatabaseHas('users', ['id' => $owner->id]);
        $this->assertDatabaseHas('shops', ['id' => $kept->id]);

        // Et rattaché à la boutique qui reste, sans quoi il n'a plus de boutique courante.
        $this->assertSame($kept->id, $owner->fresh()->shop_id);
    }

    /** Deleting the only shop leaves the account, with no shop — the onboarding state. */
    public function test_deleting_the_only_shop_leaves_the_account_without_one(): void
    {
        [$owner, $shop] = $this->ownerWithShop();

        $this->actingAs($owner)->delete($this->deleteUrl($owner, $shop));

        $this->assertDatabaseHas('users', ['id' => $owner->id]);
        $this->assertNull($owner->fresh()->shop_id);
    }

    /** Staff belong to their shop and go with it — the declared cascade, asserted. */
    public function test_the_staff_of_a_deleted_shop_goes_with_it(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        $staff = User::factory()->create(['role' => 'cashier', 'shop_id' => $shop->id]);

        $this->actingAs($owner)->delete($this->deleteUrl($owner, $shop));

        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    /** A stale `active_shop_id` makes current_shop() null, i.e. no active shop at all. */
    public function test_the_active_shop_pointer_is_cleared(): void
    {
        [$owner, $branch] = $this->ownerWithShop();
        Shop::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $branch->id])
            ->delete($this->deleteUrl($owner, $branch));

        $this->assertNull(session('active_shop_id'));
    }

    public function test_another_tenant_cannot_delete_the_shop(): void
    {
        [$owner, $shop] = $this->ownerWithShop();
        [$intruder] = $this->ownerWithShop();

        $this->actingAs($intruder)->delete($this->deleteUrl($intruder, $shop));

        $this->assertDatabaseHas('shops', ['id' => $shop->id]);
    }
}
