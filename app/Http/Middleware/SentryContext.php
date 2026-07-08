<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Sentry\Laravel\Facade as Sentry;

class SentryContext
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {

            $user = auth()->user();

            Sentry::configureScope(function ($scope) use ($user) {

            

                $scope->setUser([
                    'id' => $user->id,
                    'code-user'=> $user->code_user,
                    'email' => $user->email,
                    'username' => $user->name ?? null,
                ]);

                if( $user->shop_id ) {
                    $scope->setTag(
                        'shop_id',
                        $user->shop_id
                    );
                }

            });
        }
        return $next($request);
    }
}
