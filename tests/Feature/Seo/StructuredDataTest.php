<?php

namespace Tests\Feature\Seo;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Les données structurées n'existaient que sur l'accueil, les tarifs, le blog et
 * les fiches fonctionnalité. Six pages publiques bien remplies (à propos, contact,
 * ressources, index des fonctionnalités, sécurité, fiabilité) n'en émettaient
 * aucune — non par choix, mais parce que SeoHead ne savait pas en produire avant
 * 2026-07-16 et que personne n'était repassé dessus ensuite.
 *
 * Comme SitemapTest, ces tests lisent la source du composant : le balisage est
 * émis par React, hors de portée d'une assertion sur la réponse HTTP.
 */
class StructuredDataTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Pages listées au sitemap qui n'ont pas à porter de balisage : ce sont des
     * écrans d'application, pas des pages de contenu à faire remonter.
     */
    private const EXEMPT = ['Auth/', 'Plans/'];

    /**
     * @return array<string, string> chemin => composant
     */
    private function publicComponents(): array
    {
        preg_match_all('/<loc>([^<]+)<\/loc>/', $this->get('/sitemap.xml')->getContent(), $m);
        $base = rtrim(config('app.url'), '/');

        $components = [];

        foreach ($m[1] as $url) {
            $path = str_replace($base, '', $url);
            $response = $this->get($path);

            if ($response->status() !== 200) {
                continue;
            }

            $component = $response->viewData('page')['component'] ?? null;

            if ($component === null) {
                continue;
            }

            foreach (self::EXEMPT as $prefix) {
                if (str_starts_with($component, $prefix)) {
                    continue 2;
                }
            }

            $components[$path] = $component;
        }

        return $components;
    }

    public function test_every_public_page_emits_structured_data(): void
    {
        $components = $this->publicComponents();

        $this->assertNotEmpty($components, 'aucune page publique trouvée : le sitemap est-il vide ?');

        foreach ($components as $path => $component) {
            $source = file_get_contents(resource_path("js/Pages/{$component}.tsx"));

            // Welcome.tsx est antérieur au prop `jsonLd` et écrit ses <script> à la main.
            $emits = str_contains($source, 'jsonLd={')
                || str_contains($source, 'application/ld+json');

            $this->assertTrue(
                $emits,
                "{$path} ({$component}) n'émet aucune donnée structurée",
            );
        }
    }

    /**
     * Le fil d'Ariane est ce que Google affiche à la place de l'URL nue sous le
     * titre du résultat. Il passe désormais par `breadcrumbSchema()` partout.
     */
    public function test_every_public_page_declares_a_breadcrumb(): void
    {
        foreach ($this->publicComponents() as $path => $component) {
            $source = file_get_contents(resource_path("js/Pages/{$component}.tsx"));

            // L'accueil est la racine du fil : il n'a pas de parent à déclarer.
            if ($component === 'Welcome') {
                continue;
            }

            $this->assertStringContainsString(
                'breadcrumbSchema(',
                $source,
                "{$path} ({$component}) ne déclare pas de fil d'Ariane",
            );
        }
    }

    /**
     * Un bloc FAQPage sans FAQ visible sur la page est un motif de sanction
     * manuelle « données structurées trompeuses ». L'inverse — une FAQ affichée
     * sans balisage — est simplement une occasion manquée.
     */
    public function test_faq_markup_only_where_a_faq_is_rendered(): void
    {
        foreach ($this->publicComponents() as $path => $component) {
            $source = file_get_contents(resource_path("js/Pages/{$component}.tsx"));

            $declaresFaq = str_contains($source, 'faqSchema(')
                || str_contains($source, 'faqSchemaData');

            if (! $declaresFaq) {
                continue;
            }

            $this->assertStringContainsString(
                '<FaqSection',
                $source,
                "{$path} ({$component}) déclare une FAQPage sans afficher de FAQ",
            );
        }
    }
}
