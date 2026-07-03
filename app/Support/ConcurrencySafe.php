<?php

namespace App\Support;

use Illuminate\Database\QueryException;

class ConcurrencySafe
{
    /**
     * Retry a callback that may fail on a unique-constraint race — typically two
     * requests computing the same "next document number" (ticket/invoice/quote) at
     * the same instant. Laravel/MySQL surfaces this as a QueryException with MySQL
     * error code 1062 (duplicate entry) rather than a clean validation error.
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
            } catch (QueryException $e) {
                $isDuplicateKey = ($e->errorInfo[1] ?? null) === 1062;

                if (!$isDuplicateKey || $attempt === $attempts) {
                    throw $e;
                }
            }
        }
    }
}
