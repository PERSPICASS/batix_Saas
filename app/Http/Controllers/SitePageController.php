<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Static/light marketing pages for the public site (not CMS-backed, unlike Blog):
 * Fonctionnalités, Tarifs, Clients, Ressources, À propos. Content lives in
 * resources/js/types/*.ts, mirroring how the existing landing page copy works.
 */
class SitePageController extends Controller
{
    /**
     * Publiques : SitemapController s'en sert pour lister ces pages, afin que le
     * sitemap ne puisse pas diverger des slugs réellement servis ici.
     */
    public const FEATURE_SLUGS = [
        'vente-caisse',
        'stocks-depots',
        'multi-boutiques',
        'rapports',
        'assistant-ia',
    ];

    public const POLICY_TYPES = ['terms', 'privacy', 'refund'];

    public function features(): Response
    {
        return Inertia::render('Features/Index', [
            'localeLinks' => [
                'fr' => route('features.index'),
                'en' => route('en.features.index'),
            ],
        ]);
    }

    public function featureShow(string $slug): Response
    {
        abort_unless(in_array($slug, self::FEATURE_SLUGS, true), 404);

        return Inertia::render('Features/Show', [
            'slug' => $slug,
            'localeLinks' => [
                'fr' => route('features.show', $slug),
                'en' => route('en.features.show', $slug),
            ],
        ]);
    }

    public function pricing(): Response
    {
        return Inertia::render('Pricing/Index', [
            'subscriptionPlans' => SubscriptionPlan::activePublicPlans(),
            'localeLinks' => [
                'fr' => route('pricing'),
                'en' => route('en.pricing'),
            ],
        ]);
    }

    public function customers(): Response
    {
        // Rendered from Pages/Testimonials/ (not Pages/Customers/, which is the
        // authenticated CRM "customers" module — different feature, same word).
        return Inertia::render('Testimonials/Index', [
            'localeLinks' => [
                'fr' => route('customers'),
                'en' => route('en.customers'),
            ],
        ]);
    }

    public function resources(): Response
    {
        return Inertia::render('Resources/Index', [
            'localeLinks' => [
                'fr' => route('resources'),
                'en' => route('en.resources'),
            ],
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('About/Index', [
            'localeLinks' => [
                'fr' => route('about'),
                'en' => route('en.about'),
            ],
        ]);
    }

    public function contactShow(): Response
    {
        return Inertia::render('Contact/Index', [
            'localeLinks' => [
                'fr' => route('contact.show'),
                'en' => route('en.contact.show'),
            ],
        ]);
    }

    public function policy(string $type): Response
    {
        abort_unless(in_array($type, self::POLICY_TYPES, true), 404);

        return Inertia::render('Policies/Show', [
            'policyType' => $type,
            'localeLinks' => [
                'fr' => route('policies.show', $type),
                'en' => route('en.policies.show', $type),
            ],
        ]);
    }

    public function security(): Response
    {
        return Inertia::render('Security/Index', [
            'localeLinks' => [
                'fr' => route('security'),
                'en' => route('en.security'),
            ],
        ]);
    }

    public function subprocessors(): Response
    {
        return Inertia::render('Subprocessors/Index', [
            'localeLinks' => [
                'fr' => route('subprocessors'),
                'en' => route('en.subprocessors'),
            ],
        ]);
    }

    public function reliability(): Response
    {
        return Inertia::render('Reliability/Index', [
            'localeLinks' => [
                'fr' => route('reliability'),
                'en' => route('en.reliability'),
            ],
        ]);
    }
}
