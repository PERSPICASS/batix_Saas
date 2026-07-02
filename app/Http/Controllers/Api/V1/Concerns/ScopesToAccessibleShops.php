<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use Illuminate\Http\Request;

trait ScopesToAccessibleShops
{
    /**
     * Resolve which shop_id(s) this request is allowed to see.
     *
     * With no shop_id filter, returns every shop the token's account can access
     * (a super_admin's token spans their whole account). With one given — as a
     * ?shop_id= query param on GET, or a shop_id body field on POST/PUT — restricts
     * to that one shop, but only if it actually belongs to the account; otherwise
     * aborts with 403 rather than silently returning nothing. Uses input() (query
     * + parsed body) rather than query() so this works for both cases.
     *
     * @return array<int>
     */
    protected function resolveShopIds(Request $request): array
    {
        $accessibleShopIds = $request->user()->accessibleShopsQuery()->pluck('shops.id')->all();

        if (!$request->filled('shop_id')) {
            return $accessibleShopIds;
        }

        $shopId = (int) $request->input('shop_id');

        abort_unless(in_array($shopId, $accessibleShopIds, true), 403, 'Unauthorized shop.');

        return [$shopId];
    }

    /**
     * Clamp a client-supplied page size to a sane range.
     */
    protected function resolvePerPage(Request $request, int $default = 25, int $max = 100): int
    {
        return min(max((int) $request->query('per_page', $default), 1), $max);
    }
}
