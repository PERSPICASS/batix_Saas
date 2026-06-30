<?php

namespace App\Jobs;

use App\Models\RecurringInvoice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateRecurringInvoices implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $recurringInvoices = RecurringInvoice::active()
            ->where('next_invoice_date', '<=', now()->toDateString())
            ->get();

        foreach ($recurringInvoices as $recurringInvoice) {
            try {
                // Check if end date has passed
                if ($recurringInvoice->end_date && $recurringInvoice->end_date < now()) {
                    $recurringInvoice->update(['is_active' => false]);
                    continue;
                }

                // Load items with products
                $recurringInvoice->load('items.product');

                // Generate invoice
                $invoice = $recurringInvoice->generateNextInvoice();

                Log::info("Generated invoice {$invoice->invoice_number} from recurring cycle {$recurringInvoice->invoice_prefix}");
            } catch (\Exception $e) {
                Log::error("Failed to generate invoice for recurring cycle {$recurringInvoice->invoice_prefix}: {$e->getMessage()}");
            }
        }
    }
}

