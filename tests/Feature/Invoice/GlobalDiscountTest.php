<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use App\Services\DocumentPdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A discount granted on the whole document reduces the taxable base.
 *
 * Invoices and sales subtracted it from the TTC total, so after the tax: a 10 000
 * discount did lower the total by 10 000, but the tax stayed computed on the undiscounted
 * base. Declared VAT was overstated the moment a discount was given. Line-level discounts
 * were already right — InvoiceItem::saving and PurchaseItem::saving both deduct before
 * taxing.
 */
class GlobalDiscountTest extends TestCase
{
    use RefreshDatabase;

    private function invoiceWith(float $discount, array $lines): Invoice
    {
        $shop = Shop::factory()->create();
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'discount_amount' => $discount,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        foreach ($lines as [$quantity, $unitPrice, $rate]) {
            $invoice->items()->create([
                'product_name' => 'Article',
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'tax_rate' => $rate,
            ]);
        }

        return $invoice->fresh();
    }

    public function test_the_discount_reduces_the_taxable_base(): void
    {
        // 100 000 HT à 18 %, remise de 10 000.
        $invoice = $this->invoiceWith(10000, [[1, 100000, 18]]);

        // La taxe porte sur 90 000, pas sur 100 000 : 16 200 et non 18 000.
        $this->assertSame('16200.00', (string) $invoice->tax_amount);
        $this->assertSame('106200.00', (string) $invoice->total);

        // Le sous-total reste la base AVANT remise, le document l'affichant à part.
        $this->assertSame('100000.00', (string) $invoice->subtotal);
    }

    public function test_without_a_discount_nothing_changes(): void
    {
        $invoice = $this->invoiceWith(0, [[1, 100000, 18]]);

        $this->assertSame('18000.00', (string) $invoice->tax_amount);
        $this->assertSame('118000.00', (string) $invoice->total);
    }

    /**
     * The discount is apportioned pro rata, so a document carrying two rates stays
     * correct — charging it against a single band would skew the breakdown.
     */
    public function test_the_discount_is_spread_across_rates(): void
    {
        // 100 000 à 18 % et 100 000 exonéré, remise de 20 000 sur 200 000 : la base
        // taxable perd 10 %, donc la TVA aussi.
        $invoice = $this->invoiceWith(20000, [[1, 100000, 18], [1, 100000, 0]]);

        $this->assertSame('16200.00', (string) $invoice->tax_amount);
        $this->assertSame('196200.00', (string) $invoice->total);
    }

    /**
     * The bands printed on the PDF must add up to the invoice's own tax, otherwise the
     * document contradicts itself.
     */
    public function test_the_printed_breakdown_reconciles_with_the_invoice(): void
    {
        $invoice = $this->invoiceWith(20000, [[1, 100000, 18], [1, 100000, 0]]);

        $pdf = app(DocumentPdf::class);
        $breakdown = (new \ReflectionMethod($pdf, 'taxBreakdown'))
            ->invoke($pdf, $invoice->items, 'total', (float) $invoice->discount_amount);

        $this->assertSame(
            (float) $invoice->tax_amount,
            round(array_sum(array_column($breakdown, 'tax')), 2)
        );

        // Et les bases affichées somment à la base remisée.
        $this->assertSame(180000.0, round(array_sum(array_column($breakdown, 'base')), 2));
    }

    /**
     * Nothing validated that a discount stays under the document total, and one above it
     * produced a negative total — then a negative tax once the base was reduced.
     */
    public function test_a_discount_larger_than_the_invoice_is_capped(): void
    {
        $invoice = $this->invoiceWith(500000, [[1, 100000, 18]]);

        $this->assertSame('0.00', (string) $invoice->tax_amount);
        $this->assertSame('0.00', (string) $invoice->total);
    }
}
