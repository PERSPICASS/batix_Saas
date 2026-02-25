<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
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
            'countries' => $this->getCountries(),
        ]);
    }

    /**
     * Update shop settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        // Utiliser accessibleShopsQuery pour tous les rôles
        $shop = $user->accessibleShopsQuery()->first();

        if (!$shop) {
            return Redirect::route('settings.index')
                ->with('error', 'Aucune boutique n\'est associée à votre compte.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'tax_id' => 'nullable|string|max:50',
            'currency' => 'required|string|max:3',
            'default_tax_rate' => 'nullable|numeric|min:0|max:100',
            'invoice_prefix' => 'nullable|string|max:10',
            'invoice_footer' => 'nullable|string',
        ]);

        $shop->update($validated);

        return Redirect::route('settings.index')
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

    /**
     * Get available countries.
     */
    private function getCountries(): array
    {
        return [
            'Maroc',
            'France',
            'Algérie',
            'Tunisie',
            'Sénégal',
            'Côte d\'Ivoire',
            'Cameroun',
            'Mali',
            'Burkina Faso',
            'Niger',
            'Bénin',
            'Togo',
            'Guinée',
            'Congo',
            'Gabon',
            'Madagascar',
            'Égypte',
            'Belgique',
            'Suisse',
            'Canada',
        ];
    }
}
