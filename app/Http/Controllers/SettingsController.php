<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Utiliser accessibleShopsQuery pour tous les rôles
        $shop = $user->accessibleShopsQuery()->first();

        if (!$shop) {
            return Inertia::render('Settings/Index', [
                'shop' => null,
                'error' => 'Aucune boutique n\'est associée à votre compte.',
            ]);
        }

        return Inertia::render('Settings/Index', [
            'shop' => $shop->load('user'),
            'currencies' => $this->getCurrencies(),
        ]);
    }

    /**
     * Update shop settings.
     * For super_admin: updates all shops
     * For other roles: updates only their assigned shop
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        // Utiliser accessibleShopsQuery pour tous les rôles
        $shop = $user->accessibleShopsQuery()->first();

        if (!$shop) {
            return Redirect::route('settings.index', ['code_user' => $user->accountCode()])
                ->with('error', 'Aucune boutique n\'est associée à votre compte.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|image|max:2048|mimes:jpeg,jpg,png,gif',
            'tax_id' => 'nullable|string|max:50',
            'currency' => 'required|string|max:3',
            // La langue des documents émis — mails et PDF. Distincte de users.locale, qui
            // ne gouverne que l'interface.
            'locale' => 'nullable|in:fr,en',
            'default_tax_rate' => 'nullable|numeric|min:0|max:100',
            'invoice_prefix' => 'nullable|string|max:10',
            'invoice_footer' => 'nullable|string',
        ]);

        // Gérer l'upload du logo
        if ($request->hasFile('logo')) {
            // Sauvegarder le chemin de l'ancien logo pour suppression éventuelle
            $oldLogo = $shop->logo;
            
            // Upload du nouveau logo
            $validated['logo'] = $request->file('logo')->store('logos', 'public');
            
            // Supprimer l'ancien logo SEULEMENT s'il n'est plus utilisé par d'autres boutiques
            if ($oldLogo) {
                $otherShopsUsingLogo = $user->shops()
                    ->where('id', '!=', $shop->id)
                    ->where('logo', $oldLogo)
                    ->count();
                
                // Si aucune autre boutique n'utilise ce logo, on peut le supprimer
                if ($otherShopsUsingLogo === 0) {
                    Storage::disk('public')->delete($oldLogo);
                }
            }
        }

        // Si super_admin : mettre à jour TOUTES ses boutiques
        if ($user->role === 'super_admin') {
            $shopsUpdated = $user->shops()->update($validated);
            
            $message = $shopsUpdated > 0 
                ? "Paramètres mis à jour avec succès pour {$shopsUpdated} boutique(s)."
                : 'Paramètres mis à jour avec succès.';
                
            return Redirect::route('settings.index', ['code_user' => $user->accountCode()])
                ->with('success', $message);
        }
        
        // Pour les autres rôles : mettre à jour uniquement leur boutique assignée
        $shop->update($validated);

        return Redirect::route('settings.index', ['code_user' => $user->accountCode()])
            ->with('success', 'Paramètres mis à jour avec succès.');
    }

    /**
     * Get available currencies.
     */
    private function getCurrencies(): array
    {
        return [
            ['code' => 'USD', 'name' => 'Dollar Américain', 'symbol' => '$'],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
            ['code' => 'XOF', 'name' => 'Franc CFA', 'symbol' => 'CFA'],
        ];
    }
}
