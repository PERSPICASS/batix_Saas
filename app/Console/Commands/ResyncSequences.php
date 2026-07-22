<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResyncSequences extends Command
{
    protected $signature = 'db:resync-sequences {--dry-run : Report the sequences that are behind without changing anything}';

    protected $description = 'Fast-forward every Postgres identity sequence to its table\'s MAX(id), fixing "duplicate key ... _pkey" errors after a dump/restore or data import';

    public function handle(): int
    {
        $driver = DB::connection()->getDriverName();

        if ($driver !== 'pgsql') {
            // MySQL/SQLite advance AUTO_INCREMENT on explicit-id inserts, so they
            // never desync the way a Postgres sequence does. Nothing to do.
            $this->info("Driver is '{$driver}', not pgsql — sequences only desync on Postgres. Nothing to do.");
            return self::SUCCESS;
        }

        // Every column backed by an owned identity/serial sequence in the public schema.
        $columns = DB::select(<<<'SQL'
            SELECT c.relname AS table_name,
                   a.attname AS column_name,
                   pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) AS sequence_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
            WHERE c.relkind = 'r'
              AND n.nspname = 'public'
              AND pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL
            ORDER BY c.relname, a.attname
        SQL);

        if (empty($columns)) {
            $this->info('No identity sequences found in the public schema.');
            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $fixed = [];

        foreach ($columns as $col) {
            $table = $col->table_name;
            $column = $col->column_name;
            $sequence = $col->sequence_name;

            $maxId = DB::table($table)->max($column);
            $seqValue = (int) DB::selectOne('SELECT last_value FROM ' . $sequence)->last_value;

            // An empty table leaves max NULL; keep the sequence where it is.
            if ($maxId === null) {
                continue;
            }

            $maxId = (int) $maxId;

            // The sequence is safe when its last_value is at least MAX(id): the next
            // nextval() will hand out a free number. Only a lagging sequence collides.
            if ($seqValue >= $maxId) {
                continue;
            }

            $fixed[] = [$table, $column, $seqValue, $maxId];

            if (!$dryRun) {
                // setval(seq, MAX(id)) so the *next* nextval() returns MAX(id)+1.
                DB::selectOne('SELECT setval(?, ?)', [$sequence, $maxId]);
            }
        }

        if (empty($fixed)) {
            $this->info('All sequences are already ahead of their table — nothing to fix.');
            return self::SUCCESS;
        }

        $this->table(
            ['Table', 'Column', 'Sequence was at', 'Table MAX'],
            $fixed
        );

        if ($dryRun) {
            $this->newLine();
            $this->warn(count($fixed) . ' sequence(s) are behind. Re-run without --dry-run to fix them.');
            return self::SUCCESS;
        }

        $this->newLine();
        $this->info('Resynced ' . count($fixed) . ' sequence(s).');

        return self::SUCCESS;
    }
}
