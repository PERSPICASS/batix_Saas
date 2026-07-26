<?php

namespace Tests\Feature\Profile;

use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Account deletion, reachable for the first time.
 *
 * The form was gated on `role === 'super_admin' || role === 'admin' && (<JSX/>)`, which parses
 * as `A || (B && JSX)` — true for a super_admin, and React renders nothing for a boolean. So
 * the button had never been displayed, and `destroy()` had never run against real data.
 *
 * It would not have worked: six foreign keys were declared without `onDelete`, so RESTRICT,
 * and they block the cascade instead of following it. Any account that had issued a quote or a
 * credit note — most of them — would have hit a constraint violation, *after* `Auth::logout()`
 * had already run.
 */
class DeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    private function owner(): User
    {
        $user = User::factory()->create([
            'role' => 'super_admin',
            'password' => bcrypt('motdepasse'),
            'email_verified_at' => now(),
        ]);

        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $user->update(['shop_id' => $shop->id]);

        return $user->fresh();
    }

    private function deleteUrl(User $user): string
    {
        return route('profile.destroy', ['code_user' => $user->code_user]);
    }

    // Ni Quote, ni Invoice, ni CreditNote n'a de factory : les lignes sont construites avec
    // le strict nécessaire, seules les clés étrangères important ici.

    private function quoteFor(User $user, Customer $customer): Quote
    {
        return Quote::create([
            'shop_id' => $user->shop_id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'quote_number' => 'DEV-0001',
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'subtotal' => 100, 'tax_amount' => 20, 'total' => 120,
        ]);
    }

    private function invoiceFor(User $user, Customer $customer): Invoice
    {
        return Invoice::create([
            'shop_id' => $user->shop_id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_number' => 'FAC-0001',
            'invoice_date' => now()->toDateString(),
            'subtotal' => 100, 'tax_amount' => 20, 'total' => 120,
        ]);
    }

    private function creditNoteFor(User $user, Customer $customer, Invoice $invoice): CreditNote
    {
        return CreditNote::create([
            'shop_id' => $user->shop_id,
            'invoice_id' => $invoice->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'credit_note_number' => 'AV-0001',
            'credit_note_date' => now()->toDateString(),
            'reason' => 'Erreur de facturation',
            'subtotal' => 100, 'tax_amount' => 20, 'total' => 120,
        ]);
    }

    public function test_the_owner_can_delete_their_account_with_their_shop(): void
    {
        $user = $this->owner();
        $shopId = $user->shop_id;

        $this->actingAs($user)
            ->delete($this->deleteUrl($user), ['password' => 'motdepasse'])
            ->assertRedirect('/');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('shops', ['id' => $shopId]);
        $this->assertGuest();
    }

    /**
     * The regression that made the feature unusable: `quotes.shop_id` is RESTRICT, so a shop
     * with a single quote could not be deleted at all.
     */
    public function test_an_account_that_issued_quotes_can_still_be_deleted(): void
    {
        $user = $this->owner();
        $shopId = $user->shop_id;

        $customer = Customer::factory()->create(['shop_id' => $shopId]);
        $quote = $this->quoteFor($user, $customer);

        $this->actingAs($user)
            ->delete($this->deleteUrl($user), ['password' => 'motdepasse'])
            ->assertRedirect('/');

        $this->assertDatabaseMissing('shops', ['id' => $shopId]);
        $this->assertDatabaseMissing('quotes', ['id' => $quote->id]);
        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    /** `credit_notes.user_id` is RESTRICT: it blocks deleting the account itself. */
    public function test_an_account_that_issued_credit_notes_can_still_be_deleted(): void
    {
        $user = $this->owner();
        $shopId = $user->shop_id;

        $customer = Customer::factory()->create(['shop_id' => $shopId]);
        $invoice = $this->invoiceFor($user, $customer);
        $creditNote = $this->creditNoteFor($user, $customer, $invoice);

        $this->actingAs($user)
            ->delete($this->deleteUrl($user), ['password' => 'motdepasse'])
            ->assertRedirect('/');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('credit_notes', ['id' => $creditNote->id]);
        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
    }

    public function test_the_staff_of_a_deleted_account_goes_with_it(): void
    {
        $user = $this->owner();

        // Un compte de personnel sans boutique est un fantôme : invisible et indélébile
        // dans l'interface (voir users:audit-orphans).
        $staff = User::factory()->create([
            'role' => 'cashier',
            'shop_id' => $user->shop_id,
        ]);

        $this->actingAs($user)->delete($this->deleteUrl($user), ['password' => 'motdepasse']);

        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    public function test_a_wrong_password_deletes_nothing(): void
    {
        $user = $this->owner();

        $this->actingAs($user)
            ->from($this->deleteUrl($user))
            ->delete($this->deleteUrl($user), ['password' => 'pas-le-bon'])
            ->assertSessionHasErrors('password');

        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->assertDatabaseHas('shops', ['id' => $user->shop_id]);
    }

    /**
     * A wrong password must not log the user out either: `Auth::logout()` used to run before
     * the delete, so any failure left them signed out of an account that still existed.
     */
    public function test_a_failed_deletion_leaves_the_user_signed_in(): void
    {
        $user = $this->owner();

        $this->actingAs($user)
            ->from($this->deleteUrl($user))
            ->delete($this->deleteUrl($user), ['password' => 'pas-le-bon']);

        $this->assertAuthenticatedAs($user->fresh());
    }

    /** Staff have no account of their own to delete — the route is not theirs. */
    public function test_staff_cannot_delete_the_account(): void
    {
        $owner = $this->owner();

        $staff = User::factory()->create([
            'role' => 'manager',
            'shop_id' => $owner->shop_id,
            'password' => bcrypt('motdepasse'),
        ]);

        $this->actingAs($staff)
            ->delete(route('profile.destroy', ['code_user' => $owner->code_user]), [
                'password' => 'motdepasse',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $staff->id]);
        $this->assertDatabaseHas('shops', ['id' => $owner->shop_id]);
    }
}
