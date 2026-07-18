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
            } catch (\Throwable $e) {
                // \Throwable and not \Exception: calculateNextInvoiceDate() uses a match
                // with no default arm, so an unexpected `frequency` raises
                // \UnhandledMatchError — an \Error, which \Exception does not catch. That
                // would abort every remaining cycle in the batch, unattended, at 2am.
                // Each cycle has its own transaction inside generateNextInvoice(), so
                // skipping one leaves no partial write behind.
                Log::error("Failed to generate invoice for recurring cycle {$recurringInvoice->invoice_prefix}: {$e->getMessage()}");
                report($e);
            }
        }
    }
}

