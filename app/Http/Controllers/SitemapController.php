<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Paire d'URLs fr/en d'une même page, chacune déclarant l'autre en alternate.
     * Écrire les deux entrées à la main était la raison pour laquelle des pages
     * ajoutées plus tard (sécurité, fiabilité, sous-traitants, politiques) n'étaient
     * jamais arrivées jusqu'ici.
     */
    private function bilingualPair(string $frPath, string $enPath, string $changefreq, string $priority, string $lastmod): array
    {
        $baseUrl = rtrim(config('app.url'), '/');
        $alternates = ['fr' => $baseUrl . $frPath, 'en' => $baseUrl . $enPath];

        return [
            [
                'loc' => $baseUrl . $frPath,
                'lastmod' => $lastmod,
                'changefreq' => $changefreq,
                'priority' => $priority,
                'alternates' => $alternates,
            ],
            [
                'loc' => $baseUrl . $enPath,
                'lastmod' => $lastmod,
                'changefreq' => $changefreq,
                'priority' => $priority,
                'alternates' => $alternates,
            ],
        ];
    }

    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');
        $today = now()->format('Y-m-d');
        $blogLastmod = Post::published()->max('published_at');
        $blogLastmodDate = $blogLastmod ? substr($blogLastmod, 0, 10) : $today;

        $urls = [
            // Home
            [
                'loc' => $baseUrl . '/',
                'lastmod' => $today,
                'changefreq' => 'weekly',
                'priority' => '1.0',
                'alternates' => ['fr' => $baseUrl . '/', 'en' => $baseUrl . '/en'],
            ],
            [
                'loc' => $baseUrl . '/en',
                'lastmod' => $today,
                'changefreq' => 'weekly',
                'priority' => '1.0',
                'alternates' => ['fr' => $baseUrl . '/', 'en' => $baseUrl . '/en'],
            ],

            // Fonctionnalités / Features
            [
                'loc' => $baseUrl . '/fonctionnalites',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.8',
                'alternates' => ['fr' => $baseUrl . '/fonctionnalites', 'en' => $baseUrl . '/en/features'],
            ],
            [
                'loc' => $baseUrl . '/en/features',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.8',
                'alternates' => ['fr' => $baseUrl . '/fonctionnalites', 'en' => $baseUrl . '/en/features'],
            ],

            // Tarifs / Pricing
            [
                'loc' => $baseUrl . '/tarifs',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.9',
                'alternates' => ['fr' => $baseUrl . '/tarifs', 'en' => $baseUrl . '/en/pricing'],
            ],
            [
                'loc' => $baseUrl . '/en/pricing',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.9',
                'alternates' => ['fr' => $baseUrl . '/tarifs', 'en' => $baseUrl . '/en/pricing'],
            ],

            // Legacy /plans (dashboard-style plan picker, no EN equivalent)
            [
                'loc' => $baseUrl . '/plans',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.5',
            ],

            // /clients et /en/customers retirées avec la page qu'elles indexaient.
            // Laisser une URL supprimée dans le sitemap génère des erreurs
            // « Explorée, actuellement non indexée » dans la Search Console.

            // Ressources / Resources
            [
                'loc' => $baseUrl . '/ressources',
                'lastmod' => $today,
                'changefreq' => 'weekly',
                'priority' => '0.7',
                'alternates' => ['fr' => $baseUrl . '/ressources', 'en' => $baseUrl . '/en/resources'],
            ],
            [
                'loc' => $baseUrl . '/en/resources',
                'lastmod' => $today,
                'changefreq' => 'weekly',
                'priority' => '0.7',
                'alternates' => ['fr' => $baseUrl . '/ressources', 'en' => $baseUrl . '/en/resources'],
            ],

            // Blog index
            [
                'loc' => $baseUrl . '/blog',
                'lastmod' => $blogLastmodDate,
                'changefreq' => 'daily',
                'priority' => '0.8',
                'alternates' => ['fr' => $baseUrl . '/blog', 'en' => $baseUrl . '/en/blog'],
            ],
            [
                'loc' => $baseUrl . '/en/blog',
                'lastmod' => $blogLastmodDate,
                'changefreq' => 'daily',
                'priority' => '0.8',
                'alternates' => ['fr' => $baseUrl . '/blog', 'en' => $baseUrl . '/en/blog'],
            ],

            // À propos / About
            [
                'loc' => $baseUrl . '/a-propos',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.5',
                'alternates' => ['fr' => $baseUrl . '/a-propos', 'en' => $baseUrl . '/en/about'],
            ],
            [
                'loc' => $baseUrl . '/en/about',
                'lastmod' => $today,
                'changefreq' => 'monthly',
                'priority' => '0.5',
                'alternates' => ['fr' => $baseUrl . '/a-propos', 'en' => $baseUrl . '/en/about'],
            ],

            // Contact
            [
                'loc' => $baseUrl . '/contact',
                'lastmod' => $today,
                'changefreq' => 'yearly',
                'priority' => '0.5',
                'alternates' => ['fr' => $baseUrl . '/contact', 'en' => $baseUrl . '/en/contact'],
            ],
            [
                'loc' => $baseUrl . '/en/contact',
                'lastmod' => $today,
                'changefreq' => 'yearly',
                'priority' => '0.5',
                'alternates' => ['fr' => $baseUrl . '/contact', 'en' => $baseUrl . '/en/contact'],
            ],

            // Sécurité / Fiabilité / Sous-traitants : pages de confiance, consultées
            // pendant l'évaluation d'un achat — elles doivent être indexables.
            ...$this->bilingualPair('/securite', '/en/security', 'monthly', '0.5', $today),
            ...$this->bilingualPair('/fiabilite', '/en/reliability', 'monthly', '0.5', $today),
            ...$this->bilingualPair('/sous-traitants', '/en/subprocessors', 'monthly', '0.4', $today),

            // Auth pages (low priority)
            [
                'loc' => $baseUrl . '/login',
                'lastmod' => $today,
                'changefreq' => 'never',
                'priority' => '0.3',
            ],
            [
                'loc' => $baseUrl . '/register',
                'lastmod' => $today,
                'changefreq' => 'never',
                'priority' => '0.5',
            ],
        ];

        foreach (SitePageController::FEATURE_SLUGS as $slug) {
            $urls = array_merge($urls, $this->bilingualPair(
                '/fonctionnalites/' . $slug,
                '/en/features/' . $slug,
                'monthly',
                '0.7',
                $today,
            ));
        }

        foreach (SitePageController::POLICY_TYPES as $type) {
            $urls = array_merge($urls, $this->bilingualPair(
                '/politiques/' . $type,
                '/en/policies/' . $type,
                'yearly',
                '0.3',
                $today,
            ));
        }

        $posts = Post::published()
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at', 'published_at']);

        foreach ($posts as $post) {
            $lastmod = ($post->updated_at ?? $post->published_at)->format('Y-m-d');
            $urls = array_merge($urls, $this->bilingualPair(
                '/blog/' . $post->slug,
                '/en/blog/' . $post->slug,
                'monthly',
                '0.6',
                $lastmod,
            ));
        }

        $content = view('sitemap', ['urls' => $urls])->render();

        return response($content, 200)
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }
}
