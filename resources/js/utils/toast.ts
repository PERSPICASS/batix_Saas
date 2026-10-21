/**
 * Émettre un toast depuis n'importe où dans l'application.
 *
 * `ToastContainer` ne savait afficher que les messages flash renvoyés par le serveur : le
 * code client n'avait aucun moyen de signaler quoi que ce soit, d'où les `alert()`
 * disséminés — qui bloquent l'onglet entier, ignorent le thème et ne se referment qu'à la
 * main pour dire parfois une simple validation de formulaire.
 *
 * Le passage par un événement du navigateur, plutôt qu'un contexte React, est délibéré :
 * il fonctionne aussi depuis le code hors React — un intercepteur axios, un gestionnaire
 * d'erreur Inertia — qui n'a pas accès aux hooks.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastDetail {
    type: ToastType;
    message: string;
}

const TOAST_EVENT = 'batix:toast';

export function showToast(type: ToastType, message: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { type, message } }));
}

/**
 * Abonne un gestionnaire aux toasts et renvoie de quoi se désabonner.
 */
export function onToast(handler: (detail: ToastDetail) => void): () => void {
    const listener = (event: Event) => handler((event as CustomEvent<ToastDetail>).detail);

    window.addEventListener(TOAST_EVENT, listener);

    return () => window.removeEventListener(TOAST_EVENT, listener);
}
