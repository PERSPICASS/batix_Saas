<?php

namespace Tests\Feature\Invoice;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What an issued invoice is allowed to become.
 *
 * Before this, destroy() hard-deleted the row, so the document left the database and
 * generateInvoiceNumber() — highest number present, plus one — handed its number to the
 * next invoice. Two distinct documents shared an identity, which the
 * [shop_id, invoice_number] unique index could not catch, the first row being gone.
 * update() also logged an empty change set, so the audit trail recorded that an invoice
 * had been modified without recording what changed.
 */
class InvoiceImmutabilityTest extends TestCase
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
            'total' => 1000,
        ]);

        return $invoice->fresh();
    }

    public function test_a_deleted_invoice_keeps_its_number_out_of_circulation(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);

        $first = $this->invoice($shop);
        $second = $this->invoice($shop);
        $retired = $second->invoice_number;

        $second->delete();

        $third = $this->invoice($shop);

        $this->assertNotSame($retired, $third->invoice_number, 'A retired number must never come back.');
        $this->assertNotSame($first->invoice_number, $third->invoice_number);

        // The sequence is allowed to skip; that gap is the point.
        $this->assertSame(
            (int) substr($retired, -4) + 1,
            (int) substr($third->invoice_number, -4)
        );
    }

    public function test_deleting_an_invoice_keeps_a_recoverable_trace(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);
        $invoice = $this->invoice($shop);

        $invoice->delete();

        $this->assertSoftDeleted('invoices', ['id' => $invoice->id]);
        $this->assertNotNull(
            Invoice::withTrashed()->find($invoice->id),
            'The document must stay reachable for audit.'
        );
    }

    /**
     * A deleted invoice must stop appearing in listings and totals — soft deletion is
     * for the audit trail, not a way to keep cancelled documents in the figures.
     */
    public function test_a_deleted_invoice_is_out_of_ordinary_queries(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);
        $invoice = $this->invoice($shop);

        $invoice->delete();

        $this->assertNull(Invoice::find($invoice->id));
        $this->assertSame(0, Invoice::where('shop_id', $shop->id)->count());
    }

    /**
     * The lines are dropped and recreated on every update, so unless the previous set is
     * written to the log it is gone. This is what an empty change array was costing.
     */
    public function test_an_update_records_what_actually_changed(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'draft');

        $this->actingAs($user)->put("/{$user->code_user}/factures/{$invoice->id}", [
            'shop_id' => $shop->id,
            'customer_id' => $invoice->customer_id,
            'invoice_date' => $invoice->invoice_date->toDateString(),
            'due_date' => $invoice->due_date->toDateString(),
            'status' => 'draft',
            'items' => [[
                'product_name' => 'Fer à béton',
                'quantity' => 1,
                'unit_price' => 250,
            ]],
        ])->assertRedirect();

        $log = ActivityLog::where('action', 'update')->latest('id')->first();
        $this->assertNotNull($log, 'The update should be journalled.');

        $changes = $log->properties['changes'] ?? [];
        $this->assertNotEmpty($changes, 'An update must record what changed, not just that it happened.');

        $this->assertArrayHasKey('items', $changes);
        $this->assertSame('Ciment 50kg', $changes['items']['old'][0]['product_name']);
        $this->assertSame('Fer à béton', $changes['items']['new'][0]['product_name']);
    }
}
