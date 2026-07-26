<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Measuring the VAT overstated on documents issued before the discount fix.
 *
 * A discount granted on a whole document reduces the taxable base. It used to be taken off
 * the TTC total — after the tax — so the total did fall by the discount while the tax
 * stayed computed on the undiscounted base. Any declaration resting on those documents
 * overstates the tax collected.
 *
 * The command changes nothing: it recomputes what each document should carry and compares.
 */
class AuditDiscountTaxTest extends TestCase
{
    use RefreshDatabase;

    private function shop(): Shop
    {
        $shop = Shop::factory()->create(['currency' => 'XOF', 'name' => 'Quincaillerie']);
        $shop->update(['user_id' => User::factory()->create(['shop_id' => $shop->id])->id]);

        return $shop->fresh();
    }

    /**
     * An invoice as the old code left it: the tax computed on the gross base.
     */
    private function legacyInvoice(Shop $shop, float $discount): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'discount_amount' => $discount,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 1,
            'unit_price' => 100000,
            'tax_rate' => 18,
        ]);

        // Le modèle recalcule correctement depuis le correctif : on réécrit en base ce que
        // l'ancien code aurait laissé, sans quoi le cas d'origine serait irreproductible.
        DB::table('invoices')->where('id', $invoice->id)->update([
            'tax_amount' => 18000,
            'total' => 118000 - $discount,
        ]);

        return $invoice->fresh();
    }

    public function test_nothing_is_reported_when_no_document_carries_a_discount(): void
    {
        $shop = $this->shop();
        $this->legacyInvoice($shop, 0);

        $this->artisan('tax:audit-discounts')
            ->expectsOutputToContain('Aucun document remisé')
            ->assertSuccessful();
    }

    public function test_an_old_discounted_invoice_is_measured(): void
    {
        $shop = $this->shop();
        $this->legacyInvoice($shop, 10000);

        // Base 100 000 à 18 % : la taxe due porte sur 90 000, soit 16 200 au lieu de
        // 18 000. L'écart est de 1 800.
        $this->artisan('tax:audit-discounts')
            ->expectsOutputToContain('1 800,00')
            ->assertSuccessful();
    }

    /**
     * A document issued since the fix already carries the right tax and must not show up —
     * which is what makes the command usable without knowing any deployment date.
     */
    public function test_a_correct_invoice_is_not_reported(): void
    {
        $shop = $this->shop();
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'discount_amount' => 10000,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        // Passe par le modèle, donc calculé correctement.
        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 1,
            'unit_price' => 100000,
            'tax_rate' => 18,
        ]);

        $this->assertSame('16200.00', (string) $invoice->fresh()->tax_amount);

        $this->artisan('tax:audit-discounts')
            ->expectsOutputToContain('Aucun document remisé')
            ->assertSuccessful();
    }

    /**
     * The command must never touch a document: these are issued pieces, and correcting one
     * would take a credit note, not a rewrite.
     */
    public function test_the_audit_changes_nothing(): void
    {
        $shop = $this->shop();
        $invoice = $this->legacyInvoice($shop, 10000);

        $this->artisan('tax:audit-discounts')->assertSuccessful();

        $invoice->refresh();
        $this->assertSame('18000.00', (string) $invoice->tax_amount);
        $this->assertSame('108000.00', (string) $invoice->total);
    }

    /**
     * Amounts are grouped by currency: adding XOF to MAD would mean nothing.
     */
    public function test_totals_are_grouped_by_currency(): void
    {
        $this->legacyInvoice($this->shop(), 10000);

        $moroccan = Shop::factory()->create(['currency' => 'MAD']);
        $moroccan->update(['user_id' => User::factory()->create(['shop_id' => $moroccan->id])->id]);
        $this->legacyInvoice($moroccan->fresh(), 10000);

        $this->artisan('tax:audit-discounts')
            ->expectsOutputToContain('XOF : 1 document(s)')
            ->expectsOutputToContain('MAD : 1 document(s)')
            ->assertSuccessful();
    }
}
