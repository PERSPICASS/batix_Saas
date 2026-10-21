/**
 * État d'affichage de l'assistant, conservé le temps de l'onglet.
 *
 * Ne contient plus AUCUN contenu de conversation : les messages vivent en base depuis
 * qu'ils doivent survivre à la déconnexion et suivre l'utilisateur d'un appareil à
 * l'autre. Il ne reste ici qu'un pointeur — panneau ouvert ou non, et quelle
 * conversation était affichée.
 *
 * Ce pointeur reste néanmoins nécessaire : aucune page n'utilise le layout persistant
 * d'Inertia, donc chaque navigation démonte le widget et son `useState`. Sans lui, le
 * panneau se refermerait à chaque changement de menu.
 *
 * La clé est portée par l'utilisateur ET la boutique : sur un poste partagé, deux
 * comptes ne se retrouvent pas sur le fil de l'autre, et changer de boutique change de
 * contexte — l'assistant force la boutique courante sur chaque appel d'outil.
 */

export interface AiChatSession {
    isOpen: boolean;
    conversationId: number | null;
}

const KEY_PREFIX = 'batixpro.aichat.';

function storageKey(userId: number | string | null, shopId: number | string | null): string {
    return `${KEY_PREFIX}${userId ?? 'anon'}.${shopId ?? 'noshop'}`;
}

/** sessionStorage peut lever (mode privé Safari, quota) : jamais au prix de la page. */
function safeSession(): Storage | null {
    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
}

export function loadAiChatSession(
    userId: number | string | null,
    shopId: number | string | null,
): AiChatSession {
    const empty: AiChatSession = { isOpen: false, conversationId: null };
    const store = safeSession();
    if (!store) return empty;

    try {
        const raw = store.getItem(storageKey(userId, shopId));
        if (!raw) return empty;

        const parsed = JSON.parse(raw) as Partial<AiChatSession> | null;
        if (typeof parsed !== 'object' || parsed === null) return empty;

        return {
            isOpen: parsed.isOpen === true,
            // Le stockage peut dater d'une version antérieure du widget : on ne garde
            // qu'un entier, seule forme exploitable.
            conversationId:
                typeof parsed.conversationId === 'number' && Number.isInteger(parsed.conversationId)
                    ? parsed.conversationId
                    : null,
        };
    } catch {
        return empty;
    }
}

export function saveAiChatSession(
    userId: number | string | null,
    shopId: number | string | null,
    session: AiChatSession,
): void {
    const store = safeSession();
    if (!store) return;

    try {
        store.setItem(storageKey(userId, shopId), JSON.stringify(session));
    } catch {
        // Quota dépassé : l'état reste vivant en mémoire pour cette page.
    }
}

/**
 * Efface les pointeurs de l'onglet, quel que soit le compte. Appelé à la déconnexion.
 *
 * Les conversations elles-mêmes ne sont pas touchées : elles sont en base et
 * l'utilisateur les retrouvera à sa prochaine connexion — c'est précisément l'objet du
 * passage au stockage serveur.
 */
export function clearAiChatSession(): void {
    const store = safeSession();
    if (!store) return;

    try {
        const keys: string[] = [];
        for (let i = 0; i < store.length; i++) {
            const key = store.key(i);
            if (key?.startsWith(KEY_PREFIX)) keys.push(key);
        }
        keys.forEach((key) => store.removeItem(key));
    } catch {
        // Rien à faire : ne jamais bloquer une déconnexion.
    }
}
