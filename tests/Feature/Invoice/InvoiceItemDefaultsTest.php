<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * invoice_items.tax_rate and .discount_amount are NOT NULL DEFAULT 0.
 *
 * A SQL default only applies to a column ABSENT from the INSERT, never to an explicit
 * null — and an explicit null is exactly what arrived: the validation accepts both as
 * `nullable`, and ConvertEmptyStringsToNull turns a field the user simply cleared in the
 * form into null. Production raised
 * "null value in column tax_rate violates not-null constraint" on
 * PUT /{code_user}/factures/{invoice}.
 */
class InvoiceItemDefaultsTest extends TestCase
{
    use RefreshDatabase;

    private function draft(Shop $shop): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 1,
            'unit_price' => 100,
            'tax_rate' => 20,
            'total' => 120,
        ]);

        return $invoice->fresh();
    }

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    /**
     * The exact production scenario: the tax field is cleared in the edit form, so it
     * reaches the controller as null.
     */
    public function test_updating_an_invoice_with_a_cleared_tax_field_works(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $invoice = $this->draft($shop);

        $this->actingAs($user)
            ->put("/{$user->code_user}/factures/{$invoice->id}", [
                'shop_id' => $shop->id,
                'customer_id' => $invoice->customer_id,
                'invoice_date' => $invoice->invoice_date->toDateString(),
                'due_date' => $invoice->due_date->toDateString(),
                'status' => 'draft',
                'items' => [[
                    'product_name' => 'Regulateur solaire 30A',
                    'quantity' => 1,
                    'unit_price' => 15000,
                    'tax_rate' => null,
                    'discount_amount' => null,
                ]],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $item = $invoice->fresh()->items->first();

        $this->assertSame('0.00', (string) $item->tax_rate);
        $this->assertSame('0.00', (string) $item->discount_amount);
        $this->assertSame('15000.00', (string) $item->total);
    }

    public function test_creating_an_invoice_with_a_cleared_tax_field_works(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures", [
                'shop_id' => $shop->id,
                'customer_id' => $customer->id,
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => 'draft',
                'items' => [[
                    'product_name' => 'Regulateur solaire 30A',
                    'quantity' => 1,
                    'unit_price' => 15000,
                    'tax_rate' => null,
                ]],
            ])
            ->assertSessionHasNoErrors();

        $item = Invoice::latest('id')->firstOrFail()->items->first();

        $this->assertSame('0.00', (string) $item->tax_rate);
        $this->assertSame('15000.00', (string) $item->total);
    }

    /**
     * The normalisation sits on the model, so every write path is covered — recurring
     * invoices and quote conversion included, not just the two controller actions.
     */
    public function test_a_null_rate_written_straight_to_the_model_still_lands_as_zero(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);
        $invoice = $this->draft($shop);

        $item = $invoice->items()->create([
            'product_name' => 'Fer à béton',
            'quantity' => 2,
            'unit_price' => 50,
            'tax_rate' => null,
            'discount_amount' => null,
            'total' => 100,
        ]);

        $this->assertSame('0.00', (string) $item->fresh()->tax_rate);
        $this->assertSame('0.00', (string) $item->fresh()->discount_amount);
    }

    /**
     * A rate that was actually provided must survive untouched — the normalisation must
     * not flatten real tax rates to zero.
     */
    public function test_a_provided_tax_rate_is_untouched(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);
        $invoice = $this->draft($shop);

        $item = $invoice->items()->create([
            'product_name' => 'Tuyau PVC',
            'quantity' => 1,
            'unit_price' => 200,
            'tax_rate' => 18,
            'total' => 236,
        ]);

        $this->assertSame('18.00', (string) $item->fresh()->tax_rate);
        $this->assertSame('36.00', (string) $item->fresh()->tax_amount);
    }
}
