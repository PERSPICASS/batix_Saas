<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces a platform-admin suspension (users.is_active / shops.is_active) on
 * sessions and API tokens that already exist: LoginRequest only stops new
 * logins. See User::isSuspended() for who counts as suspended.
 */
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        // On the api group this runs before the route's auth:sanctum, so the
        // default (session) guard knows nothing about a bearer token yet.
        $isApi = $request->is('api/*');
        $user = $isApi ? Auth::guard('sanctum')->user() : $request->user();

        if (!$user || !$user->isSuspended()) {
            return $next($request);
        }

        $message = __('platform.account_suspended');

        if ($isApi || $request->expectsJson()) {
            return response()->json(['message' => $message], 403);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->withErrors(['email' => $message]);
    }
}
