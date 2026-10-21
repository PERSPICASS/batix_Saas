<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\Fne\FneService;
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
            'fne' => $this->fneSettings($this->fneShop($request)),
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
     * Réglages FNE de la boutique active.
     *
     * Par boutique, à la différence du reste de cette page : chaque boutique est un
     * établissement / point de vente distinct pour la DGI. La clé API n'est jamais
     * renvoyée au navigateur — on dit seulement si elle existe. Un champ laissé vide
     * conserve la clé enregistrée.
     */
    public function updateFne(Request $request): RedirectResponse
    {
        $shop = $this->fneShop($request);
        abort_unless($shop, 404);

        if (!$shop->isInCoteDIvoire()) {
            return back()->with('error', "La facturation électronique FNE ne concerne que les boutiques situées en Côte d'Ivoire.");
        }

        $validated = $request->validate([
            'fne_enabled' => 'required|boolean',
            'fne_environment' => 'required|in:test,prod',
            'fne_api_key' => 'nullable|string|max:500',
            'fne_base_url' => 'nullable|url|max:255|required_if:fne_environment,prod',
            'fne_establishment' => 'nullable|string|max:255|required_if:fne_enabled,true,1',
            'fne_point_of_sale' => 'nullable|string|max:255|required_if:fne_enabled,true,1',
            'fne_zero_rate_code' => 'required|in:' . implode(',', FneService::ZERO_RATE_CODES),
        ], [
            'fne_base_url.required_if' => "L'URL de production est transmise par la DGI après validation de vos spécimens.",
        ]);

        if (blank($validated['fne_api_key'] ?? null)) {
            unset($validated['fne_api_key']);
        }

        if ($validated['fne_enabled'] && blank($validated['fne_api_key'] ?? $shop->fne_api_key)) {
            return back()->withErrors(['fne_api_key' => 'La clé API FNE est obligatoire pour activer la certification.']);
        }

        $shop->update($validated);

        return back()->with('success', 'Réglages FNE enregistrés.');
    }

    public function testFne(Request $request, FneService $fne): RedirectResponse
    {
        $shop = $this->fneShop($request);
        abort_unless($shop, 404);

        $result = $fne->testConnection($shop);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    /**
     * La boutique active, bornée à celles que l'utilisateur peut voir.
     */
    private function fneShop(Request $request): ?Shop
    {
        $query = $request->user()->accessibleShopsQuery();

        if ($activeId = get_active_shop_id()) {
            if ($shop = (clone $query)->where('id', $activeId)->first()) {
                return $shop;
            }
        }

        return $query->first();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fneSettings(?Shop $shop): ?array
    {
        if (!$shop) {
            return null;
        }

        return [
            'shop_id' => $shop->id,
            'shop_name' => $shop->name,
            'available' => $shop->isInCoteDIvoire(),
            'enabled' => (bool) $shop->fne_enabled,
            'active' => $shop->fneActive(),
            'environment' => $shop->fne_environment ?: 'test',
            'has_api_key' => filled($shop->fne_api_key),
            'base_url' => $shop->fne_base_url,
            'establishment' => $shop->fne_establishment,
            'point_of_sale' => $shop->fne_point_of_sale,
            'zero_rate_code' => $shop->fne_zero_rate_code ?: 'TVAD',
            'balance_sticker' => $shop->fne_balance_sticker,
            'sticker_warning' => (bool) $shop->fne_sticker_warning,
            'test_url' => config('services.fne.test_url'),
        ];
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
