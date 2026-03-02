<?php

namespace App\Http\Controllers\Auth;

trait RedirectsUsers
{
    /**
     * Get the post-authentication redirect path.
     * Redirige vers /{code_user}/dashboard où code_user est celui du propriétaire du compte.
     */
    protected function redirectPath(): string
    {
        $user = auth()->user();
        
        if (!$user) {
            return route('login');
        }
        
        // Si c'est un admin plateforme, rediriger vers le dashboard plateforme
        if ($user->role === 'admin_platforme') {
            // Nettoyer l'URL intended si elle contient une route qui nécessite code_user
            $intended = session('url.intended');
            if ($intended && (str_contains($intended, '/dashboard') || str_contains($intended, '{code_user}'))) {
                session()->forget('url.intended');
            }
            return route('platform.dashboard');
        }
        
        // Récupérer la boutique accessible de l'utilisateur
        $shop = $user->accessibleShopsQuery()->first();
        
        if (!$shop) {
            return route('login')->with('error', 'Aucune boutique associée à votre compte');
        }
        
        // Définir la boutique active en session
        session(['active_shop_id' => $shop->id]);
        
        // Déterminer le code_user du compte (propriétaire)
        if ($user->role === 'super_admin') {
            // C'est le propriétaire, utiliser son code_user
            $accountCode = $user->code_user;
        } else {
            // C'est un employé, trouver le propriétaire via la boutique
            $accountOwner = \App\Models\User::find($shop->user_id);
            $accountCode = $accountOwner ? $accountOwner->code_user : $user->code_user;
        }
        
        // Rediriger vers /{code_user}/dashboard
        return route('dashboard', ['code_user' => $accountCode]);
    }
}

