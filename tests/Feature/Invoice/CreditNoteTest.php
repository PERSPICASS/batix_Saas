<?php

namespace Tests\Feature\Invoice;

use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The credit note is the only way to correct an issued invoice, now that an invoice is
 * frozen the moment it leaves 'draft'.
 *
 * The invoice itself is never rewritten — that is the whole point. A credit note is a
 * separate document that offsets it, so the figure the customer holds stays true and the
 * correction is a traceable act of its own.
 */
class CreditNoteTest extends TestCase
{
    use RefreshDatabase;

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    private function invoice(Shop $shop, string $status = 'sent'): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => $status,
            'subtotal' => 1000,
            'tax_amount' => 0,
            'total' => 1000,
        ]);

        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 10,
            'unit_price' => 100,
            'tax_rate' => 0,
            'total' => 1000,
        ]);

        return $invoice->fresh();
    }

    private function credit(User $user, Invoice $invoice, int $quantity, ?int $itemId = null)
    {
        return $this->actingAs($user)->post("/{$user->code_user}/factures/{$invoice->id}/avoir", [
            'reason' => 'Retour marchandise',
            'items' => [[
                'invoice_item_id' => $itemId ?? $invoice->items->first()->id,
                'quantity' => $quantity,
            ]],
        ]);
    }

    public function test_a_partial_credit_note_offsets_the_invoice_without_touching_it(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop);

        $this->credit($user, $invoice, 2)->assertSessionHas('success');

        $creditNote = CreditNote::firstOrFail();
        $this->assertSame('200.00', (string) $creditNote->total);

        // The invoice is untouched: same status, same total, same lines.
        $invoice->refresh();
        $this->assertSame('sent', $invoice->status);
        $this->assertSame('1000.00', (string) $invoice->total);
        $this->assertSame(10, $invoice->items->first()->quantity);

        // Only the computed view of it changes.
        $this->assertSame(200.0, $invoice->creditedTotal());
        $this->assertSame(800.0, $invoice->netTotal());
    }

    public function test_credited_quantities_accumulate_across_credit_notes(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop);

        $this->credit($user, $invoice, 6)->assertSessionHas('success');
        $this->credit($user, $invoice, 4)->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame(1000.0, $invoice->creditedTotal());
        $this->assertSame(0.0, $invoice->netTotal());

        // Fully credited: there is nothing left to credit.
        $this->assertFalse($invoice->isCreditable());
        $this->assertSame(0, $invoice->items->first()->quantityCreditable());
    }

    public function test_crediting_more_than_was_invoiced_is_refused(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop);

        $this->credit($user, $invoice, 11)->assertSessionHasErrors('items.0.quantity');

        $this->assertSame(0, CreditNote::count());
    }

    public function test_a_second_credit_note_cannot_exceed_what_is_left(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop);

        $this->credit($user, $invoice, 8)->assertSessionHas('success');

        // 2 remain; asking for 3 must not slip through on the strength of the line total.
        $this->credit($user, $invoice->fresh(), 3)->assertSessionHasErrors('items.0.quantity');

        $this->assertSame(1, CreditNote::count());
        $this->assertSame(800.0, $invoice->fresh()->creditedTotal());
    }

    public function test_a_line_from_another_invoice_is_refused(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $mine = $this->invoice($shop);
        $other = $this->invoice($shop);

        $this->credit($user, $mine, 1, $other->items->first()->id)
            ->assertSessionHasErrors('items.0.invoice_item_id');

        $this->assertSame(0, CreditNote::count());
    }

    public static function uncreditableStatuses(): array
    {
        return [
            'draft' => ['draft'],
            'cancelled' => ['cancelled'],
        ];
    }

    /**
     * A draft has produced nothing to correct, and a cancelled invoice never stood for
     * anything — neither can be credited.
     */
    #[DataProvider('uncreditableStatuses')]
    public function test_only_an_issued_invoice_can_be_credited(string $status): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, $status);

        $this->credit($user, $invoice, 1)->assertSessionHas('error');

        $this->actingAs($user)
            ->get("/{$user->code_user}/factures/{$invoice->id}/avoir")
            ->assertForbidden();

        $this->assertSame(0, CreditNote::count());
    }

    public function test_numbers_restart_per_shop(): void
    {
        $shopA = Shop::factory()->create();
        $userA = $this->owner($shopA);
        $invoiceA = $this->invoice($shopA);

        $shopB = Shop::factory()->create();
        $userB = $this->owner($shopB);
        $invoiceB = $this->invoice($shopB);

        $this->credit($userA, $invoiceA, 1)->assertSessionHas('success');
        $this->credit($userB, $invoiceB, 1)->assertSessionHas('success');

        $prefix = 'AV-' . date('Ym');
        $numbers = CreditNote::orderBy('id')->pluck('credit_note_number')->all();

        $this->assertSame(["{$prefix}0001", "{$prefix}0001"], $numbers);
    }

    public function test_a_credit_note_cannot_be_edited_or_deleted(): void
    {
        $names = collect(Route::getRoutes())->map->getName()->filter()->all();

        $this->assertNotContains('credit-notes.edit', $names);
        $this->assertNotContains('credit-notes.update', $names);
        $this->assertNotContains('credit-notes.destroy', $names);

        $this->assertFalse(method_exists(\App\Http\Controllers\CreditNoteController::class, 'update'));
        $this->assertFalse(method_exists(\App\Http\Controllers\CreditNoteController::class, 'destroy'));
    }

    public function test_the_customer_total_is_net_of_credit_notes(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'paid');

        $this->assertSame('1000.00', (string) $invoice->customer->fresh()->total_purchases);

        $this->credit($user, $invoice, 3)->assertSessionHas('success');

        $this->assertSame('700.00', (string) $invoice->customer->fresh()->total_purchases);
    }

    public function test_another_tenants_invoice_cannot_be_credited(): void
    {
        $mine = Shop::factory()->create();
        $user = $this->owner($mine);

        $theirs = Shop::factory()->create();
        $this->owner($theirs);
        $foreign = $this->invoice($theirs);

        $this->credit($user, $foreign, 1)->assertForbidden();

        $this->assertSame(0, CreditNote::count());
    }

    public function test_a_credit_note_of_another_tenant_cannot_be_read(): void
    {
        $theirs = Shop::factory()->create();
        $theirOwner = $this->owner($theirs);
        $foreign = $this->invoice($theirs);
        $this->credit($theirOwner, $foreign, 1);

        $mine = Shop::factory()->create();
        $user = $this->owner($mine);

        $this->actingAs($user)
            ->get("/{$user->code_user}/avoirs/" . CreditNote::firstOrFail()->id)
            ->assertForbidden();
    }

    public function test_a_reason_is_required(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop);

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/avoir", [
                'items' => [['invoice_item_id' => $invoice->items->first()->id, 'quantity' => 1]],
            ])
            ->assertSessionHasErrors('reason');

        $this->assertSame(0, CreditNote::count());
    }
}
