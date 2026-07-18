<?php

namespace Tests\Feature\Backup;

use Tests\TestCase;

/**
 * The dump/verify/upload path can only be exercised against a real PostgreSQL
 * server, and this suite runs on in-memory sqlite (phpunit.xml:26). It was verified
 * manually end to end instead — see docs/DATABASE_BACKUP.md:
 *
 *   - dump of the dev database, restored into a throwaway database, row counts
 *     compared (55 tables, 3048 products);
 *   - off-site upload driven through the Storage abstraction with a local disk
 *     standing in for S3: remote size matched the local dump byte for byte, an
 *     expired remote copy was pruned, and a non-.dump object in the same prefix was
 *     left untouched.
 *
 * Not yet verified against a real S3 endpoint — no bucket credentials exist yet.
 *
 * What is worth guarding here is the driver check: without it, running db:backup
 * against a non-PostgreSQL connection would call pg_dump with a sqlite/mysql host
 * and fail with an opaque libpq error instead of saying what is wrong.
 */
class DatabaseBackupTest extends TestCase
{
    public function test_it_refuses_to_run_against_a_non_postgres_connection(): void
    {
        // The suite's default connection is sqlite.
        $this->artisan('db:backup')
            ->expectsOutputToContain('only supports PostgreSQL')
            ->assertFailed();
    }

    public function test_it_reports_an_unwritable_destination_instead_of_crashing(): void
    {
        config()->set('database.default', 'pgsql');

        // Laravel promotes mkdir()'s warning to an ErrorException; the command
        // suppresses it so the operator gets an actionable message. A stack trace
        // here would mean that suppression regressed.
        $this->artisan('db:backup', ['--path' => '/proc/batix-cannot-exist'])
            ->expectsOutputToContain('Cannot create the backup directory')
            ->assertFailed();
    }
}
