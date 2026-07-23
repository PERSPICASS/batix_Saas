<?php

namespace Tests\Unit;

use App\Support\ConcurrencySafe;
use Illuminate\Database\UniqueConstraintViolationException;
use PDOException;
use PHPUnit\Framework\TestCase;

/**
 * Regression guard for the MySQL-vs-Postgres bug: retryOnDuplicate used to match
 * MySQL error code 1062 by hand, so on the Postgres prod DB (SQLSTATE 23505) the
 * duplicate was never recognised and the document-numbering race surfaced as a 500.
 * We now catch Laravel's driver-agnostic UniqueConstraintViolationException, so the
 * retry must fire regardless of which driver raised it.
 */
class ConcurrencySafeTest extends TestCase
{
    private function makeUniqueViolation(): UniqueConstraintViolationException
    {
        // Mirrors what Laravel's Postgres driver builds: SQLSTATE 23505, code 7.
        $pdo = new PDOException('SQLSTATE[23505]: Unique violation: 7 duplicate key value');
        $pdo->errorInfo = ['23505', 7, 'duplicate key value violates unique constraint'];

        return new UniqueConstraintViolationException('pgsql', 'insert into "invoices" ...', [], $pdo);
    }

    public function test_it_retries_and_succeeds_after_a_duplicate_violation(): void
    {
        $calls = 0;

        $result = ConcurrencySafe::retryOnDuplicate(function () use (&$calls) {
            $calls++;
            if ($calls < 2) {
                throw $this->makeUniqueViolation();
            }

            return 'ok';
        });

        $this->assertSame('ok', $result);
        $this->assertSame(2, $calls, 'The callback should have been retried once.');
    }

    public function test_it_rethrows_after_exhausting_all_attempts(): void
    {
        $calls = 0;

        $this->expectException(UniqueConstraintViolationException::class);

        try {
            ConcurrencySafe::retryOnDuplicate(function () use (&$calls) {
                $calls++;
                throw $this->makeUniqueViolation();
            }, attempts: 3);
        } finally {
            $this->assertSame(3, $calls, 'The callback should have been attempted exactly `attempts` times.');
        }
    }

    public function test_it_does_not_retry_unrelated_exceptions(): void
    {
        $calls = 0;

        try {
            ConcurrencySafe::retryOnDuplicate(function () use (&$calls) {
                $calls++;
                throw new \RuntimeException('boom');
            });
            $this->fail('Expected the RuntimeException to propagate.');
        } catch (\RuntimeException $e) {
            $this->assertSame('boom', $e->getMessage());
        }

        $this->assertSame(1, $calls, 'A non-duplicate error must propagate immediately without retrying.');
    }

    public function test_it_returns_on_first_success_without_retrying(): void
    {
        $calls = 0;

        $result = ConcurrencySafe::retryOnDuplicate(function () use (&$calls) {
            $calls++;

            return 42;
        });

        $this->assertSame(42, $result);
        $this->assertSame(1, $calls);
    }
}
