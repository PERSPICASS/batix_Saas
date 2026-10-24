<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

class DocumentNumber
{
    /**
     * Next number of a "PREFIX + zero-padded counter" sequence, one past the highest
     * already issued in $query (which the caller scopes exactly like the table's
     * unique constraint — per shop, withTrashed, …).
     *
     * The highest is taken NUMERICALLY. Two shortcuts used to live in the generators
     * and both break the sequence for good:
     * - sorting the strings: past 9999, "…10000" sorts below "…9999", so the same
     *   number came back forever (the ticket outage of 2026-10-15);
     * - reading the last 4 characters of the latest row: "PO-2026-10000" reads
     *   as 0, so the counter restarted at 0001 and collided.
     * And counting the rows (what quotes did) hands out a number again as soon as
     * a document is deleted.
     */
    public static function next(Builder $query, string $column, string $prefix, int $pad = 4): string
    {
        $last = $query
            ->where($column, 'like', $prefix.'%')
            ->pluck($column)
            ->map(fn (string $number) => (int) substr($number, strlen($prefix)))
            ->max() ?? 0;

        return $prefix.str_pad((string) ($last + 1), $pad, '0', STR_PAD_LEFT);
    }
}
