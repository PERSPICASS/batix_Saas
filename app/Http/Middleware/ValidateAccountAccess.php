<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class ValidateAccountAccess
{
    /**
     * Handle an incoming request.
     * Valide que l'utilisateur connecté appartient bien au compte (code_user).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $codeUser = $request->route('code_user');
        
        // Vérifier que le code_user existe
        if (!$codeUser) {
            abort(404);
        }
        
        // Récupérer le propriétaire du compte (super admin qui a créé le compte)
        $accountOwner = User::where('code_user', $codeUser)
            ->where('role', 'super_admin')
            ->first();
        
        if (!$accountOwner) {
            abort(404, 'Compte non trouvé');
        }
        
        $currentUser = auth()->user();
        
        // Vérifier que l'utilisateur connecté appartient à ce compte
        // Soit c'est le propriétaire lui-même, soit c'est un employé d'une de ses boutiques
        $hasAccess = false;
        
        if ($currentUser->id === $accountOwner->id) {
            // C'est le propriétaire du compte
            $hasAccess = true;
        } else {
            // Vérifier si l'utilisateur appartient à une boutique du propriétaire
            $userShopId = $currentUser->shop_id;
            if ($userShopId) {
                $belongsToAccount = $accountOwner->shops()
                    ->where('id', $userShopId)
                    ->exists();
                $hasAccess = $belongsToAccount;
            }
        }
        
        if (!$hasAccess) {
            abort(403, 'Accès non autorisé à ce compte');
        }
        
        // Définir la boutique active en session si pas déjà fait
        if (!session('active_shop_id')) {
            $shop = $currentUser->accessibleShopsQuery()->first();
            if ($shop) {
                session(['active_shop_id' => $shop->id]);
            }
        }
        
        // Partager le code_user et le propriétaire du compte
        $request->merge([
            'account_owner' => $accountOwner,
            'account_code' => $codeUser,
        ]);

        // Permet aux appels route() côté frontend (Ziggy) d'omettre {code_user},
        // puisque c'est un préfixe présent sur toutes les routes de ce groupe.
        URL::defaults(['code_user' => $codeUser]);

        // Aligne la langue Laravel (__(), Carbon, etc.) sur la préférence de l'utilisateur,
        // pour que tout texte rendu côté serveur (ex. journal d'activité) soit dans sa langue.
        App::setLocale($currentUser->getLocale());

        return $next($request);
    }
}
