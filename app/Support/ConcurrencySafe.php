<?php

namespace App\Support;

use Illuminate\Database\UniqueConstraintViolationException;

class ConcurrencySafe
{
    /**
     * Retry a callback that may fail on a unique-constraint race — typically two
     * requests computing the same "next document number" (ticket/invoice/quote) at
     * the same instant.
     *
     * Laravel normalises unique-constraint failures across every driver into a
     * single UniqueConstraintViolationException, so we catch that rather than
     * matching a driver-specific error code. (The old code only matched MySQL's
     * 1062, which never fired against the Postgres prod DB whose unique violations
     * are SQLSTATE 23505 — the exception was rethrown on the first race and the
     * user got a 500 instead of a retried, freshly numbered document.)
     *
     * The callback must recompute the number on each attempt (e.g. by calling
     * Model::create() without pre-setting the number, so a model's `creating` hook
     * generates a fresh one every time).
     */
    public static function retryOnDuplicate(callable $callback, int $attempts = 3)
    {
        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                return $callback();
            } catch (UniqueConstraintViolationException $e) {
                if ($attempt === $attempts) {
                    throw $e;
                }
            }
        }
    }
}
