<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\ForceHttpsInSession::class,
            \App\Http\Middleware\SetActiveShop::class,
            \App\Http\Middleware\CheckScreenLock::class,
            \App\Http\Middleware\SentryContext::class,
        ]);

        $middleware->trustProxies(at: [
            '*',
        ]);

        $middleware->alias([
            'subscription.limits' => \App\Http\Middleware\CheckSubscriptionLimits::class,
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'platform.admin' => \App\Http\Middleware\EnsurePlatformAdmin::class,
            'setlocale' => \App\Http\Middleware\SetPublicLocale::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        \Sentry\Laravel\Integration::handles($exceptions);
    })->create();
