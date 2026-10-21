import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';

/**
 * Rend cliquables les URL d'un texte brut.
 *
 * Le fil de l'assistant affiche du texte, pas du Markdown : un lien vers un devis y
 * restait une suite de caractères à recopier à la main. On découpe donc le texte et on
 * remplace les URL par de vraies ancres.
 *
 * Le découpage produit des éléments React, jamais du HTML injecté : le contenu vient
 * d'un modèle de langage, qui répète ce que des données métier lui ont donné. Passer par
 * `dangerouslySetInnerHTML` ferait de n'importe quel nom de produit contenant du balisage
 * une faille d'injection.
 *
 * DEUX TRAITEMENTS selon la destination :
 *
 * - Lien INTERNE → navigation Inertia dans l'onglet courant. C'est ce qui préserve la
 *   conversation : elle vit dans `sessionStorage`, donc dans l'onglet. Un `target="_blank"`
 *   la perdait — le nouvel onglet, ouvert avec `rel="noopener"`, ne reçoit aucune copie du
 *   sessionStorage de son ouvreur. L'utilisateur cliquait sur le devis qu'il venait de
 *   faire créer et retrouvait un assistant amnésique.
 * - Lien EXTERNE → nouvel onglet, avec `noopener noreferrer`. Là, garder la main sur la
 *   page d'origine est un risque, et il n'y a aucune conversation à préserver.
 */

// Bornée aux schémas http/https : ni `javascript:`, ni `data:`, qui seraient exécutables
// au clic. La classe finale exclut la ponctuation de fin de phrase, pour qu'un point ou
// une parenthèse fermante ne soit pas avalé par le lien.
const URL_PATTERN = /(https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]}])/g;

const LINK_CLASS = 'text-amber-300 underline underline-offset-2 hover:text-amber-200';

/** `window` est absent au rendu serveur : dans le doute, on traite le lien en externe. */
function isInternal(url: string): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return new URL(url, window.location.href).origin === window.location.origin;
    } catch {
        return false;
    }
}

export function linkify(text: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // exec() en boucle sur une regex globale : lastIndex avance à chaque tour.
    URL_PATTERN.lastIndex = 0;

    while ((match = URL_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const url = match[0];
        const key = `${match.index}-${url}`;

        nodes.push(
            isInternal(url) ? (
                <Link key={key} href={url} className={LINK_CLASS}>
                    {url}
                </Link>
            ) : (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    {url}
                </a>
            ),
        );

        lastIndex = match.index + url.length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}
