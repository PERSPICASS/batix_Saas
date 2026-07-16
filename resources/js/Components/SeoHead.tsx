import { Head } from '@inertiajs/react';

interface SeoHeadProps {
    title: string;
    description: string;
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
    ogImage = 'https://batixpro.com/og-image.jpg',
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
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content={ogType} />
            <meta property="og:locale" content={ogLocale} />
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
            <meta name="twitter:image" content={ogImage} />

            {/* Données structurées */}
            {jsonLd?.map((block, i) => (
                <script key={`ld-${i}`} type="application/ld+json">
                    {JSON.stringify(block)}
                </script>
            ))}
        </Head>
    );
}
