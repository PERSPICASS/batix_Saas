import { Head } from '@inertiajs/react';

/**
 * Vignette de partage par défaut. Il en existe une par langue : le visuel porte
 * l'accroche en toutes lettres, une image française sous un lien anglais se voit.
 * Fichiers dans `public/`, régénérables via `scripts/og-image/` — ne pas les
 * remplacer par un format autre que 1200×630, c'est le ratio qu'attendent
 * Facebook, LinkedIn et WhatsApp pour un grand aperçu plutôt qu'une miniature.
 */
const OG_IMAGES: Record<string, string> = {
    fr: 'https://batixpro.com/og-image.jpg',
    en: 'https://batixpro.com/og-image-en.jpg',
};

interface SeoHeadProps {
    title: string;
    description: string;
    /** Absolue et non relative : plusieurs scrapers sociaux ne résolvent pas les chemins relatifs. */
    ogImage?: string;
    ogLocale?: string;
    canonical?: string;
    noIndex?: boolean;
    ogType?: 'website' | 'article';
    publishedAt?: string;
    author?: string;
    /** Real per-locale URLs for this page, e.g. { fr: '/blog/x', en: '/en/blog/x' } */
    hreflangAlternates?: { locale: string; href: string }[];
    /**
     * Blocs de données structurées schema.org rendus en <script type="application/ld+json">.
     * Passer par ici plutôt que d'écrire le <script> dans la page (comme le fait
     * Welcome.tsx, antérieur à ce composant) : le balisage reste au même endroit que
     * les autres métadonnées.
     */
    jsonLd?: Record<string, unknown>[];
}

export function SeoHead({
    title,
    description,
    ogImage,
    ogLocale = 'fr_FR',
    canonical,
    noIndex = false,
    ogType = 'website',
    publishedAt,
    author,
    hreflangAlternates,
    jsonLd,
}: SeoHeadProps) {
    const fullTitle = `${title} | BATIX PRO`;
    const resolvedOgImage = ogImage ?? OG_IMAGES[ogLocale.slice(0, 2)] ?? OG_IMAGES.fr;

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {noIndex && <meta name="robots" content="noindex,nofollow" />}
            {canonical && <link rel="canonical" href={canonical} />}
            {hreflangAlternates?.map((alt) => (
                <link key={alt.locale} rel="alternate" hrefLang={alt.locale} href={alt.href} />
            ))}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={resolvedOgImage} />
            {/* Dimensions annoncées : sans elles, Facebook et WhatsApp affichent
                d'abord une vignette carrée le temps de télécharger l'image. */}
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={fullTitle} />
            <meta property="og:type" content={ogType} />
            <meta property="og:locale" content={ogLocale} />
            <meta property="og:locale:alternate" content={ogLocale === 'fr_FR' ? 'en_US' : 'fr_FR'} />
            <meta property="og:site_name" content="BATIX PRO" />
            {canonical && <meta property="og:url" content={canonical} />}

            {/* Article meta (blog) */}
            {ogType === 'article' && publishedAt && (
                <meta property="article:published_time" content={publishedAt} />
            )}
            {ogType === 'article' && author && (
                <meta property="article:author" content={author} />
            )}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={resolvedOgImage} />

            {/* Données structurées */}
            {jsonLd?.map((block, i) => (
                <script key={`ld-${i}`} type="application/ld+json">
                    {JSON.stringify(block)}
                </script>
            ))}
        </Head>
    );
}
