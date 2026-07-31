<?php

namespace Tests\Feature\Seo;

use Tests\TestCase;

/**
 * Les vignettes de partage social ont été déclarées en `og:image` pendant des mois
 * alors que le fichier n'existait pas : `https://batixpro.com/og-image.jpg` renvoyait
 * 404, donc tout lien BATIX PRO partagé sur WhatsApp, Facebook ou LinkedIn
 * s'affichait sans image. Rien ne le signalait — une og:image cassée ne casse
 * aucune page, elle ne fait que priver chaque partage de son aperçu.
 *
 * Ces tests portent sur des fichiers statiques, pas sur du rendu : c'est
 * exactement ce qui manquait.
 */
class SocialCardTest extends TestCase
{
    /**
     * Les chemins sont ceux référencés par SeoHead.tsx (constante OG_IMAGES) et
     * par types/data.ts (`seo.ogImage`, une par locale).
     */
    private const CARDS = ['og-image.jpg', 'og-image-en.jpg'];

    public function test_every_declared_social_card_exists(): void
    {
        foreach (self::CARDS as $card) {
            $this->assertFileExists(
                public_path($card),
                "public/{$card} est déclaré en og:image mais absent : chaque partage sera sans aperçu",
            );
        }
    }

    /**
     * 1200×630 n'est pas une préférence esthétique : en dessous de 600 px de large,
     * ou à un autre ratio, Facebook et WhatsApp basculent sur une petite vignette
     * carrée au lieu de la grande image.
     */
    public function test_every_social_card_is_1200_by_630(): void
    {
        foreach (self::CARDS as $card) {
            [$width, $height] = getimagesize(public_path($card));

            $this->assertSame(1200, $width, "public/{$card} doit faire 1200 px de large");
            $this->assertSame(630, $height, "public/{$card} doit faire 630 px de haut");
        }
    }

    /**
     * Plusieurs scrapers récupèrent l'image avec un délai d'attente court et
     * abandonnent au-delà. Rester sous 300 Ko garde une marge confortable.
     */
    public function test_every_social_card_stays_light(): void
    {
        foreach (self::CARDS as $card) {
            $this->assertLessThan(
                300 * 1024,
                filesize(public_path($card)),
                "public/{$card} dépasse 300 Ko : certains scrapers abandonneront le téléchargement",
            );
        }
    }

    /**
     * Le composant doit continuer à servir une carte par langue. Un visuel porte
     * son accroche en toutes lettres : une image française sous un lien anglais
     * se remarque immédiatement.
     */
    public function test_seo_head_declares_one_card_per_locale(): void
    {
        $source = file_get_contents(resource_path('js/Components/SeoHead.tsx'));

        foreach (self::CARDS as $card) {
            $this->assertStringContainsString(
                $card,
                $source,
                "SeoHead ne référence plus {$card}",
            );
        }
    }
}
