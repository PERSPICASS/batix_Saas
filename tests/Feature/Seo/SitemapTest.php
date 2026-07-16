<?php

namespace Tests\Feature\Seo;

use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    private function locs(): array
    {
        $response = $this->get('/sitemap.xml');
        $response->assertOk();

        preg_match_all('/<loc>([^<]+)<\/loc>/', $response->getContent(), $m);

        $base = rtrim(config('app.url'), '/');

        return array_map(fn ($url) => str_replace($base, '', $url), $m[1]);
    }

    public function test_it_serves_valid_xml(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=utf-8');

        $xml = simplexml_load_string($response->getContent());
        $this->assertNotFalse($xml, 'the sitemap must parse as XML');
    }

    /**
     * Every public marketing page belongs here. These are listed explicitly rather than
     * derived from the router: the sitemap is hand-maintained, and pages added later
     * (security, reliability, subprocessors, policies) had been forgotten.
     */
    public function test_it_lists_every_public_page_in_both_locales(): void
    {
        $locs = $this->locs();

        $expected = [
            '/', '/en',
            '/fonctionnalites', '/en/features',
            '/tarifs', '/en/pricing',
            '/clients', '/en/customers',
            '/ressources', '/en/resources',
            '/blog', '/en/blog',
            '/a-propos', '/en/about',
            '/contact', '/en/contact',
            '/securite', '/en/security',
            '/fiabilite', '/en/reliability',
            '/sous-traitants', '/en/subprocessors',
            '/politiques/terms', '/en/policies/terms',
            '/politiques/privacy', '/en/policies/privacy',
            '/politiques/refund', '/en/policies/refund',
        ];

        foreach ($expected as $path) {
            $this->assertContains($path, $locs, "{$path} is missing from the sitemap");
        }
    }

    public function test_it_lists_every_feature_page_in_both_locales(): void
    {
        $locs = $this->locs();

        foreach (['vente-caisse', 'stocks-depots', 'multi-boutiques', 'rapports', 'assistant-ia'] as $slug) {
            $this->assertContains("/fonctionnalites/{$slug}", $locs);
            $this->assertContains("/en/features/{$slug}", $locs);
        }
    }

    public function test_it_lists_published_posts_and_hides_unpublished_ones(): void
    {
        Post::create([
            'slug' => 'article-publie',
            'title_fr' => 'Article publié',
            'title_en' => 'Published post',
            'content_fr' => 'Contenu',
            'content_en' => 'Content',
            'is_published' => true,
            'published_at' => now()->subDay(),
        ]);

        Post::create([
            'slug' => 'brouillon',
            'title_fr' => 'Brouillon',
            'title_en' => 'Draft',
            'content_fr' => 'Contenu',
            'content_en' => 'Content',
            'is_published' => false,
            'published_at' => null,
        ]);

        $locs = $this->locs();

        $this->assertContains('/blog/article-publie', $locs);
        $this->assertContains('/en/blog/article-publie', $locs);
        $this->assertNotContains('/blog/brouillon', $locs, 'a draft must never be advertised to crawlers');
        $this->assertNotContains('/en/blog/brouillon', $locs);
    }

    /**
     * A sitemap is a canonical list, so a URL appearing twice sends mixed signals.
     */
    public function test_it_lists_no_url_twice(): void
    {
        $locs = $this->locs();

        $this->assertSame(array_unique($locs), $locs, 'duplicate <loc> entries: ' . implode(', ', array_diff_assoc($locs, array_unique($locs))));
    }

    /**
     * Every bilingual page must advertise both alternates, or hreflang is a no-op.
     */
    public function test_bilingual_pages_declare_their_alternates(): void
    {
        $content = $this->get('/sitemap.xml')->getContent();
        $base = rtrim(config('app.url'), '/');

        $this->assertStringContainsString('xmlns:xhtml="http://www.w3.org/1999/xhtml"', $content);
        $this->assertStringContainsString('hreflang="fr" href="' . $base . '/securite"', $content);
        $this->assertStringContainsString('hreflang="en" href="' . $base . '/en/security"', $content);
    }
}
