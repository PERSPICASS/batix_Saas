<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\RecurringInvoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * The recurring-invoice job was declared in app/Console/Kernel.php, which Laravel 11+
 * never reads: it had never run in production. These tests cover the behaviour that
 * turning it on actually exposes.
 */
class RecurringInvoiceScheduleTest extends TestCase
{
    use RefreshDatabase;

    private function makeCycle(array $attributes = []): RecurringInvoice
    {
        $shop = Shop::factory()->create();
        $user = User::factory()->create(['shop_id' => $shop->id]);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        return RecurringInvoice::create(array_merge([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_prefix' => 'REC-TEST',
            'subtotal' => 100,
            'tax_amount' => 0,
            'total' => 100,
            'frequency' => 'monthly',
            'start_date' => now()->subMonths(3)->toDateString(),
            'next_invoice_date' => now()->subDay()->toDateString(),
            'is_active' => true,
        ], $attributes));
    }

    public function test_the_task_is_scheduled(): void
    {
        // The whole point of the fix: a task defined in the dead Kernel.php reported
        // nothing here, which is how it stayed unnoticed.
        $this->artisan('schedule:list')
            ->expectsOutputToContain('invoices:generate-recurring');
    }

    public function test_dry_run_writes_nothing(): void
    {
        $this->makeCycle();

        $this->artisan('invoices:generate-recurring', ['--dry-run' => true])
            ->expectsOutputToContain('DRY RUN')
            ->assertSuccessful();

        $this->assertSame(0, Invoice::count());
    }

    public function test_it_generates_a_draft_invoice_and_advances_the_cycle(): void
    {
        $cycle = $this->makeCycle(['next_invoice_date' => now()->subDay()->toDateString()]);

        $this->artisan('invoices:generate-recurring')->assertSuccessful();

        $invoice = Invoice::where('recurring_invoice_id', $cycle->id)->first();

        $this->assertNotNull($invoice, 'The due cycle should have produced an invoice.');
        // Draft, so activating the scheduler cannot bill a customer without review.
        $this->assertSame('draft', $invoice->status);

        $cycle->refresh();
        $this->assertTrue(
            $cycle->next_invoice_date->isFuture(),
            'next_invoice_date must move forward, otherwise the cycle re-bills every night.'
        );
    }

    public function test_a_cycle_not_yet_due_is_left_alone(): void
    {
        $this->makeCycle(['next_invoice_date' => now()->addWeek()->toDateString()]);

        $this->artisan('invoices:generate-recurring')->assertSuccessful();

        $this->assertSame(0, Invoice::count());
    }

    public function test_one_broken_cycle_does_not_abort_the_others(): void
    {
        Log::spy();

        // An unexpected frequency makes calculateNextInvoiceDate()'s match throw
        // \UnhandledMatchError — an \Error, not an \Exception. Before the fix the job
        // caught only \Exception, so this aborted every cycle queued behind it.
        // sqlite stores `frequency` as text (see the create migration), which lets the
        // test reproduce a value Postgres' enum would reject.
        $this->makeCycle(['invoice_prefix' => 'REC-BROKEN', 'frequency' => 'fortnightly']);
        $healthy = $this->makeCycle(['invoice_prefix' => 'REC-HEALTHY']);

        $this->artisan('invoices:generate-recurring')->assertSuccessful();

        $this->assertNotNull(
            Invoice::where('recurring_invoice_id', $healthy->id)->first(),
            'The healthy cycle must still be billed when an earlier one throws.'
        );

        Log::shouldHaveReceived('error')
            ->withArgs(fn (string $message) => str_contains($message, 'REC-BROKEN'))
            ->once();
    }
}
