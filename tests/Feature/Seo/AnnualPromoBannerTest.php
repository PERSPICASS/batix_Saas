<?php

namespace Tests\Feature\Seo;

use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le bandeau public annonce « 2 mois offerts » sur l'abonnement annuel. C'est
 * une affirmation chiffrée sur un prix : elle doit rester vraie.
 *
 * Elle repose sur une seule convention — l'année est facturée 10 mensualités au
 * lieu de 12 — appliquée à trois endroits sans rien qui les relie :
 * PaymentController::store (le montant réellement débité), les accesseurs
 * price_*_yearly du modèle (le prix affiché) et buildPlanViews côté front.
 * Changer le multiplicateur à un seul de ces endroits rendrait le bandeau faux
 * sans casser quoi que ce soit.
 */
class AnnualPromoBannerTest extends TestCase
{
    use RefreshDatabase;

    private const MONTHS_BILLED_PER_YEAR = 10;

    private function plan(): SubscriptionPlan
    {
        return SubscriptionPlan::create([
            'name' => 'Test',
            'slug' => 'test-annual-promo',
            'price' => 15000,
            'max_shops' => 1,
            'is_active' => true,
        ]);
    }

    public function test_a_year_costs_ten_months_not_twelve(): void
    {
        $plan = $this->plan();

        $this->assertSame(
            '150 000 FCFA',
            $plan->price_fcfa_yearly,
            'le prix annuel affiché ne vaut plus 10 mensualités',
        );
    }

    /**
     * Le chiffre du bandeau est déduit ici plutôt que recopié : si la convention
     * passe un jour à 11 mensualités, ce test dit « 1 » et échoue en pointant la
     * formulation à corriger.
     */
    public function test_the_banner_announces_the_number_of_months_actually_free(): void
    {
        $freeMonths = 12 - self::MONTHS_BILLED_PER_YEAR;
        $copy = file_get_contents(resource_path('js/types/data.ts'));

        $this->assertStringContainsString(
            "{$freeMonths} mois offerts",
            $copy,
            "le bandeau doit annoncer {$freeMonths} mois offerts",
        );

        $this->assertStringContainsString(
            "{$freeMonths} months free",
            $copy,
            "la version anglaise doit annoncer {$freeMonths} months free",
        );
    }

    /**
     * Le montant débité est ce qui rend la promesse honnête ou mensongère.
     */
    public function test_the_server_charges_ten_months_for_a_yearly_subscription(): void
    {
        $source = file_get_contents(app_path('Http/Controllers/PaymentController.php'));

        $this->assertStringContainsString(
            '$plan->price * ' . self::MONTHS_BILLED_PER_YEAR,
            $source,
            'PaymentController ne facture plus 10 mensualités pour une année : le bandeau annonce une remise qui n\'est pas appliquée',
        );
    }

    /**
     * Rendu côté serveur, donc présent pour les crawlers et sans décalage de mise
     * en page après hydratation. S'il ne sortait qu'au montage React, le bandeau
     * pousserait toute la page vers le bas une fois affichée (CLS).
     */
    public function test_the_banner_is_server_rendered_on_public_pages(): void
    {
        $layout = file_get_contents(resource_path('js/Layouts/PublicLayout.tsx'));

        $this->assertStringContainsString(
            '<AnnualPromoBanner',
            $layout,
            'le bandeau doit rester dans PublicLayout, rendu pour toutes les pages publiques',
        );

        // Le masquage avant première peinture dépend de ce script inline : sans lui,
        // le visiteur qui a fermé le bandeau le revoit le temps d'un éclair.
        $this->assertStringContainsString(
            'batix_annual_promo_dismissed',
            file_get_contents(resource_path('views/app.blade.php')),
            'le script de masquage pré-peinture a disparu de app.blade.php',
        );
    }

    /**
     * Le bandeau est un levier d'abonnement : une fermeture définitive perdrait le
     * message pour de bon auprès de quelqu'un qui n'était pas prêt ce jour-là. La
     * fermeture ne doit valoir que pour la visite en cours — d'où sessionStorage,
     * dans le composant comme dans le script pré-peinture.
     */
    public function test_dismissal_lasts_only_for_the_current_visit(): void
    {
        $sources = [
            'AnnualPromoBanner.tsx' => resource_path('js/Components/Welcome/AnnualPromoBanner.tsx'),
            'app.blade.php' => resource_path('views/app.blade.php'),
        ];

        foreach ($sources as $label => $path) {
            $source = file_get_contents($path);

            $this->assertStringContainsString(
                'sessionStorage',
                $source,
                "{$label} doit lire la fermeture du bandeau en sessionStorage",
            );

            // On vise les appels, pas le mot : les deux fichiers mentionnent
            // localStorage en commentaire pour expliquer pourquoi il est écarté.
            foreach (['localStorage.getItem', 'localStorage.setItem'] as $call) {
                $this->assertStringNotContainsString(
                    $call,
                    $source,
                    "{$label} remet la fermeture du bandeau en localStorage : elle redeviendrait définitive",
                );
            }
        }
    }
}
