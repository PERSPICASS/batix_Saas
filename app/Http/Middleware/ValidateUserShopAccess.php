<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use App\Models\Shop;

class ValidateUserShopAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $codeUser = $request->route('code_user');
        $shopSlug = $request->route('shop_slug');
        
        // Vérifier que les paramètres existent
        if (!$codeUser || !$shopSlug) {
            abort(404);
        }
        
        // Récupérer l'utilisateur par code_user
        $user = User::where('code_user', $codeUser)->first();
        
        if (!$user) {
            abort(404, 'Utilisateur non trouvé');
        }
        
        // Vérifier que l'utilisateur connecté correspond
        if (auth()->id() !== $user->id) {
            abort(403, 'Accès non autorisé à ce compte');
        }
        
        // Récupérer la boutique parmi les boutiques accessibles
        $shop = $user->accessibleShopsQuery()->where('slug', $shopSlug)->first();
        
        if (!$shop) {
            abort(404, 'Boutique non trouvée');
        }
        
        // Définir la boutique active en session
        session(['active_shop_id' => $shop->id]);
        
        // Partager les données avec les vues
        $request->merge([
            'current_user' => $user,
            'current_shop' => $shop,
        ]);
        
        return $next($request);
    }
}
