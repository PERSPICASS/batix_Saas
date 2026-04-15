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
            // Nettoyer complètement l'URL intended pour éviter les conflits
            // car les routes admin plateforme n'utilisent pas code_user
            session()->forget('url.intended');
            return route('platform.dashboard');
        }
        
        // Récupérer la boutique accessible de l'utilisateur
        $shop = $user->accessibleShopsQuery()->first();
        
        if (!$shop) {
            // Nettoyer la session et rediriger vers login avec erreur
            session()->forget('url.intended');
            return route('login');
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
        
        // Sécurité : si le code_user est null ou vide, impossible de générer la route dashboard
        if (empty($accountCode)) {
            session()->forget('url.intended');
            \Log::warning('RedirectsUsers: code_user manquant pour user_id=' . $user->id . ' (role=' . $user->role . ')');
            return route('login');
        }
        
        // Vérifier si l'URL intended est compatible avec le code_user
        $intended = session('url.intended');
        if ($intended) {
            // Si l'URL intended ne contient pas le bon code_user, la nettoyer
            if (!str_contains($intended, "/{$accountCode}/")) {
                session()->forget('url.intended');
            }
        }
        
        // Rediriger vers /{code_user}/dashboard
        return route('dashboard', ['code_user' => $accountCode]);
    }
}

