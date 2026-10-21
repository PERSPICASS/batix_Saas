/**
 * Fabriques de blocs schema.org, à passer au prop `jsonLd` de <SeoHead>.
 *
 * Ces blocs étaient écrits à la main dans chaque page, ce qui explique pourquoi
 * la moitié du site public n'en avait aucun : il fallait à chaque fois réécrire
 * le même squelette. Le regroupement ici sert surtout à ce qu'ajouter une page
 * publique coûte une ligne.
 *
 * Deux règles valables partout :
 *  - L'organisation n'est déclarée en entier que sur l'accueil ; ailleurs on la
 *    référence par `@id` (`${appUrl}/#organization`). La redéclarer créerait
 *    plusieurs entités concurrentes pour la même société.
 *  - Ne jamais décrire ici ce que la page n'affiche pas. Une FAQPage sans FAQ
 *    visible, un ItemList qui ne correspond à aucune liste rendue, sont des
 *    motifs de sanction manuelle « données structurées trompeuses ».
 */

interface Crumb {
    name: string;
    item: string;
}

/**
 * Fil d'Ariane. Google l'affiche à la place de l'URL nue sous le titre du
 * résultat. Le premier maillon (l'accueil) est ajouté ici, les pages ne
 * passent que la suite.
 */
export function breadcrumbSchema(appUrl: string, trail: Crumb[]): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'BATIX PRO', item: appUrl }, ...trail].map((crumb, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: crumb.name,
            item: crumb.item,
        })),
    };
}

/**
 * Page éditoriale simple (sécurité, fiabilité, à propos…). `type` accepte les
 * sous-types de WebPage : 'AboutPage', 'ContactPage', 'CollectionPage'…
 */
export function webPageSchema(
    appUrl: string,
    {
        type = 'WebPage',
        name,
        description,
        url,
        locale,
    }: { type?: string; name: string; description: string; url: string; locale: string },
): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': type,
        name,
        description,
        url,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
        isPartOf: { '@id': `${appUrl}/#website` },
        publisher: { '@id': `${appUrl}/#organization` },
    };
}

/**
 * Liste ordonnée de liens internes (fonctionnalités, ressources). Décrit à
 * Google la structure d'une page d'index, et lui donne les URL enfants.
 */
export function itemListSchema(
    items: { name: string; url: string; description?: string }[],
): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((entry, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: entry.name,
            url: entry.url,
            ...(entry.description ? { description: entry.description } : {}),
        })),
    };
}

/**
 * FAQ. À n'émettre que sur une page qui affiche réellement ces questions —
 * c'est une exigence explicite de Google, pas une bonne pratique optionnelle.
 */
export function faqSchema(faqs: { question: string; answer: string }[]): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
    };
}
