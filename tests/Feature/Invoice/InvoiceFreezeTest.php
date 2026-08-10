<?php

namespace Tests\Feature\Invoice;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * An invoice is editable only while it is a draft.
 *
 * The single guard used to be status === 'paid', so an invoice already sent to the
 * customer could still be rewritten — amounts included — and update() drops every line
 * to recreate it, leaving no trace of what the customer actually received.
 *
 * Closing the edit screen at issuance takes away the only path that could mark an
 * invoice paid, since the status was a field of that form. updateStatus() replaces it
 * and touches nothing but the status.
 */
class InvoiceFreezeTest extends TestCase
{
    use RefreshDatabase;

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    private function invoice(Shop $shop, string $status): Invoice
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
            'total' => 1000,
        ]);

        return $invoice->fresh();
    }

    /** @return array<string, mixed> */
    private function payload(Invoice $invoice, array $overrides = []): array
    {
        return array_merge([
            'shop_id' => $invoice->shop_id,
            'customer_id' => $invoice->customer_id,
            'invoice_date' => $invoice->invoice_date->toDateString(),
            'due_date' => $invoice->due_date->toDateString(),
            'status' => 'draft',
            'items' => [[
                'product_name' => 'Autre chose',
                'quantity' => 1,
                'unit_price' => 1,
            ]],
        ], $overrides);
    }

    public static function issuedStatuses(): array
    {
        return [
            'sent' => ['sent'],
            'paid' => ['paid'],
            'cancelled' => ['cancelled'],
        ];
    }

    #[DataProvider('issuedStatuses')]
    public function test_an_issued_invoice_cannot_be_rewritten(string $status): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, $status);

        $this->actingAs($user)
            ->put("/{$user->code_user}/factures/{$invoice->id}", $this->payload($invoice))
            ->assertSessionHas('error');

        $invoice->refresh();
        $this->assertSame('1000.00', (string) $invoice->total);
        $this->assertSame('Ciment 50kg', $invoice->items->first()->product_name);
        $this->assertSame($status, $invoice->status);
    }

    #[DataProvider('issuedStatuses')]
    public function test_an_issued_invoice_cannot_be_deleted(string $status): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, $status);

        $this->actingAs($user)
            ->delete("/{$user->code_user}/factures/{$invoice->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'deleted_at' => null]);
    }

    #[DataProvider('issuedStatuses')]
    public function test_the_edit_screen_is_closed_on_an_issued_invoice(string $status): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, $status);

        $this->actingAs($user)
            ->get("/{$user->code_user}/factures/{$invoice->id}/edit")
            ->assertSessionHas('error');
    }

    public function test_a_draft_is_still_editable_and_deletable(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'draft');

        $this->actingAs($user)
            ->put("/{$user->code_user}/factures/{$invoice->id}", $this->payload($invoice))
            ->assertSessionHasNoErrors();

        $this->assertSame('Autre chose', $invoice->fresh()->items->first()->product_name);

        $this->actingAs($user)
            ->delete("/{$user->code_user}/factures/{$invoice->id}")
            ->assertSessionHas('success');

        $this->assertSoftDeleted('invoices', ['id' => $invoice->id]);
    }

    /**
     * The edit form used to be able to set any status, so leaving it open on drafts
     * would let draft → paid slip past the transition table below.
     */
    public function test_the_edit_form_cannot_mark_a_draft_paid(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'draft');

        $this->actingAs($user)
            ->put("/{$user->code_user}/factures/{$invoice->id}", $this->payload($invoice, ['status' => 'paid']))
            ->assertSessionHasErrors('status');

        $this->assertSame('draft', $invoice->fresh()->status);
    }

    public function test_a_sent_invoice_can_be_marked_paid(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/statut", [
                'status' => 'paid',
                'payment_method' => 'cash',
            ])
            ->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
        $this->assertSame('cash', $invoice->payment_method);
    }

    public function test_the_transition_is_journalled(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/statut", ['status' => 'paid']);

        $log = ActivityLog::where('action', 'update')->latest('id')->first();

        $this->assertNotNull($log);
        $this->assertSame(
            ['status' => ['old' => 'sent', 'new' => 'paid']],
            $log->properties['changes']
        );
    }

    /**
     * paid and cancelled are terminal: nothing walks an invoice back.
     */
    public function test_a_closed_invoice_accepts_no_further_transition(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);

        foreach (['paid', 'cancelled'] as $status) {
            $invoice = $this->invoice($shop, $status);

            $this->actingAs($user)
                ->post("/{$user->code_user}/factures/{$invoice->id}/statut", ['status' => 'cancelled'])
                ->assertSessionHas('error');

            $this->assertSame($status, $invoice->fresh()->status);
        }
    }

    /**
     * Re-emailing an invoice is legitimate — the customer asks for their copy again —
     * but send() used to set 'sent' unconditionally, walking a paid invoice backwards
     * and making it collectable a second time, right past the transition table.
     */
    public function test_resending_a_paid_invoice_does_not_reopen_it(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'paid');

        $this->actingAs($user)->post("/{$user->code_user}/factures/{$invoice->id}/envoyer");

        $this->assertSame('paid', $invoice->fresh()->status);
    }

    public function test_a_first_send_does_issue_the_draft(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'draft');

        $this->actingAs($user)->post("/{$user->code_user}/factures/{$invoice->id}/envoyer");

        $this->assertSame('sent', $invoice->fresh()->status);
    }

    public function test_the_status_action_refuses_a_status_it_does_not_own(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        // 'draft' is not a target this endpoint may set — issuing happens elsewhere.
        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/statut", ['status' => 'draft'])
            ->assertSessionHasErrors('status');

        $this->assertSame('sent', $invoice->fresh()->status);
    }

    public function test_the_status_action_is_scoped_to_the_tenant(): void
    {
        $mine = Shop::factory()->create();
        $user = $this->owner($mine);

        $theirs = Shop::factory()->create();
        $this->owner($theirs);
        $foreign = $this->invoice($theirs, 'sent');

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$foreign->id}/statut", ['status' => 'paid'])
            ->assertForbidden();

        $this->assertSame('sent', $foreign->fresh()->status);
    }
}
