<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\RecurringInvoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Invoice numbers restart per shop (Invoice::generateInvoiceNumber scopes its lookup
 * by shop_id). The unique constraint used to be global, so the FIRST invoice of the
 * month in a second shop collided with the first shop's identical number — and since
 * every retry re-queried within the still-empty second shop, it regenerated the same
 * number and ConcurrencySafe exhausted its retries with a 500.
 */
class InvoiceNumberPerShopTest extends TestCase
{
    use RefreshDatabase;

    private function makeCycle(Shop $shop): RecurringInvoice
    {
        $user = User::factory()->create(['shop_id' => $shop->id]);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        return RecurringInvoice::create([
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
        ]);
    }

    public function test_two_shops_can_hold_the_same_first_invoice_number_of_the_month(): void
    {
        $shopA = Shop::factory()->create();
        $shopB = Shop::factory()->create();

        // Shop A takes the first number of the month.
        $first = $this->makeCycle($shopA)->generateNextInvoice();

        // Shop B, whose sequence is independent, must be able to take the same
        // per-shop number without tripping the (previously global) unique constraint.
        $second = $this->makeCycle($shopB)->generateNextInvoice();

        $this->assertSame(
            $first->invoice_number,
            $second->invoice_number,
            'Each shop restarts its own numbering, so both first invoices share a number.'
        );
        $this->assertNotSame($first->shop_id, $second->shop_id);
    }

    public function test_a_duplicate_number_within_the_same_shop_is_still_rejected(): void
    {
        $shop = Shop::factory()->create();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $user = User::factory()->create(['shop_id' => $shop->id]);

        $existing = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'subtotal' => 100,
            'tax_amount' => 0,
            'total' => 100,
        ]);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_number' => $existing->invoice_number, // force the collision
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'subtotal' => 100,
            'tax_amount' => 0,
            'total' => 100,
        ]);
    }
}
