<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SetActiveShop
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Skip pour les admins plateforme qui n'ont pas de boutiques
            if ($user->role === 'admin_platforme') {
                return $next($request);
            }
            
            // Si paramètre shop présent, le sauver en session
            if ($request->has('shop')) {
                $shopId = (int) $request->get('shop');
                $userShopIds = $user->accessibleShops()->pluck('id')->toArray();
                
                // Vérifier que l'utilisateur a accès à cette boutique
                if (in_array($shopId, $userShopIds)) {
                    session(['active_shop_id' => $shopId]);
                }
            }
            
            // Si pas de boutique active en session, prendre la première
            if (!session('active_shop_id')) {
                $firstShop = $user->accessibleShops()->first();
                if ($firstShop) {
                    session(['active_shop_id' => $firstShop->id]);
                }
            }
        }

        return $next($request);
    }
}
