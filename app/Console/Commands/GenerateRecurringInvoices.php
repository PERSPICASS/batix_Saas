<?php

namespace App\Console\Commands;

use App\Jobs\GenerateRecurringInvoices as GenerateRecurringInvoicesJob;
use App\Models\RecurringInvoice;
use Illuminate\Console\Command;

class GenerateRecurringInvoices extends Command
{
    protected $signature = 'invoices:generate-recurring
        {--dry-run : List what would be generated without writing anything.}';

    protected $description = 'Generate the invoices due from active recurring cycles';

    public function handle(): int
    {
        $due = RecurringInvoice::active()
            ->where('next_invoice_date', '<=', now()->toDateString())
            ->with('customer')
            ->orderBy('next_invoice_date')
            ->get();

        if ($due->isEmpty()) {
            $this->info('No recurring cycle is due.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->preview($due);

            return self::SUCCESS;
        }

        (new GenerateRecurringInvoicesJob)->handle();

        $this->info("Processed {$due->count()} due recurring cycle(s). See the log for per-cycle results.");

        return self::SUCCESS;
    }

    /**
     * Show the backlog before it is billed.
     *
     * This matters because `calculateNextInvoiceDate()` advances from the cycle's own
     * `next_invoice_date`, not from today: a cycle five periods behind stays due after
     * generating one invoice, and produces the four others on the four following days.
     * The "periods behind" column is therefore the number of invoices each cycle will
     * eventually issue, not the number issued tonight.
     */
    private function preview(iterable $due): void
    {
        $this->warn('DRY RUN — nothing will be written.');
        $this->newLine();

        $total = 0;

        $rows = [];
        foreach ($due as $cycle) {
            $periods = $this->periodsBehind($cycle);
            $total += $periods;

            $rows[] = [
                $cycle->id,
                $cycle->invoice_prefix,
                $cycle->customer?->name ?? '—',
                $cycle->frequency,
                $cycle->next_invoice_date->toDateString(),
                $periods,
            ];
        }

        $this->table(
            ['ID', 'Prefix', 'Customer', 'Frequency', 'Next due', 'Periods behind'],
            $rows
        );

        $this->line("{$due->count()} cycle(s) due tonight — {$total} invoice(s) in total once the backlog is caught up.");
        $this->line('Invoices are created with status "draft"; nothing is emailed to customers.');
    }

    /**
     * How many periods separate the cycle's due date from today, i.e. how many invoices
     * it will produce before it stops being overdue.
     */
    private function periodsBehind(RecurringInvoice $cycle): int
    {
        $months = match ($cycle->frequency) {
            'monthly' => 1,
            'quarterly' => 3,
            'semi-annual' => 6,
            'annual' => 12,
            // Mirrors the job's own tolerance: an unexpected value must not crash a
            // read-only preview.
            default => 0,
        };

        if ($months === 0) {
            return 1;
        }

        $elapsed = $cycle->next_invoice_date->diffInMonths(now());

        return max(1, (int) floor($elapsed / $months) + 1);
    }
}
