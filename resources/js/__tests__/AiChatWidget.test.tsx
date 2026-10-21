import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import AiChatWidget from '@/Components/AiChatWidget';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { auth: { user: { id: 7 } }, activeShop: { id: 3 } } }),
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('ziggy-js', () => ({
    route: (name: string, params: Record<string, unknown> = {}) =>
        `/${name}${params.conversation ? `/${params.conversation}` : ''}`,
}));

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();

vi.mock('axios', () => ({
    default: {
        get: (...args: unknown[]) => get(...args),
        post: (...args: unknown[]) => post(...args),
        delete: (...args: unknown[]) => del(...args),
        isAxiosError: () => false,
    },
}));

/** act() enveloppe l'interaction : sans lui, les mises à jour d'état déclenchées par
 *  les promesses axios tomberaient hors du cycle de rendu et React avertirait. */
async function click(element: Element) {
    await act(async () => {
        fireEvent.click(element);
    });
}

async function type(element: Element, value: string) {
    await act(async () => {
        fireEvent.change(element, { target: { value } });
    });
}

const CONVERSATIONS = {
    data: {
        conversations: [
            { id: 42, title: 'Devis Matthieu Aka', last_message_at: '2026-08-16T10:00:00Z' },
            { id: 43, title: 'Stock pistolets', last_message_at: '2026-08-15T10:00:00Z' },
        ],
    },
};

describe('AiChatWidget', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        get.mockReset();
        post.mockReset();
        del.mockReset();
        get.mockResolvedValue(CONVERSATIONS);
    });

    it('n\'affiche rien sans accès à l\'assistant', () => {
        const { container } = render(<AiChatWidget codeUser="ABC" hasAccess={false} />);

        expect(container.innerHTML).toBe('');
    });

    it('survit à une bascule d\'accès en cours de session', () => {
        // Le garde-fou vit dans un composant sans hook : la bascule monte ou démonte le
        // panneau d'un bloc, au lieu de changer le nombre de hooks rendus.
        const { rerender, container } = render(<AiChatWidget codeUser="ABC" hasAccess />);

        expect(() => rerender(<AiChatWidget codeUser="ABC" hasAccess={false} />)).not.toThrow();
        expect(container.innerHTML).toBe('');
    });

    it('ouvre une modale et liste les conversations enregistrées', async () => {
        render(<AiChatWidget codeUser="ABC" hasAccess />);

        await click(screen.getByLabelText("Ouvrir l'assistant IA"));

        expect(await screen.findByRole('dialog')).toBeTruthy();
        // La liste vient du serveur : c'est ce qui permet de retrouver ses échanges
        // après une déconnexion, ou depuis un autre appareil.
        expect(await screen.findByText('Devis Matthieu Aka')).toBeTruthy();
        expect(screen.getByText('Stock pistolets')).toBeTruthy();
    });

    it('rouvre une conversation en chargeant ses messages', async () => {
        get.mockImplementation((url: string) =>
            url.includes('ai.conversation/42')
                ? Promise.resolve({
                      data: { id: 42, title: 'Devis Matthieu Aka', messages: [{ role: 'assistant', content: 'Devis QTE-1 créé.' }] },
                  })
                : Promise.resolve(CONVERSATIONS),
        );

        render(<AiChatWidget codeUser="ABC" hasAccess />);
        await click(screen.getByLabelText("Ouvrir l'assistant IA"));
        await click(await screen.findByText('Devis Matthieu Aka'));

        expect(await screen.findByText('Devis QTE-1 créé.')).toBeTruthy();
    });

    it('transmet la conversation courante avec chaque message', async () => {
        post.mockResolvedValue({ data: { reply: 'Bien reçu.', conversation_id: 99, title: 'Nouveau' } });

        render(<AiChatWidget codeUser="ABC" hasAccess />);
        await click(screen.getByLabelText("Ouvrir l'assistant IA"));
        await type(await screen.findByPlaceholderText('Votre question...'), 'Bonjour');
        await click(screen.getByLabelText('Envoyer le message'));

        await waitFor(() => expect(post).toHaveBeenCalled());
        // Premier message : aucune conversation encore, le serveur en ouvre une.
        expect(post.mock.calls[0][1]).toEqual({ message: 'Bonjour', conversation_id: null });
        expect(await screen.findByText('Bien reçu.')).toBeTruthy();
    });

    it('ferme la modale avec la touche Échap', async () => {
        render(<AiChatWidget codeUser="ABC" hasAccess />);

        await click(screen.getByLabelText("Ouvrir l'assistant IA"));
        expect(await screen.findByRole('dialog')).toBeTruthy();

        await act(async () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('supprime une conversation et la retire de la liste', async () => {
        del.mockResolvedValue({ data: { deleted: true } });

        render(<AiChatWidget codeUser="ABC" hasAccess />);
        await click(screen.getByLabelText("Ouvrir l'assistant IA"));
        await screen.findByText('Devis Matthieu Aka');

        await click(screen.getByLabelText('Supprimer la conversation Devis Matthieu Aka'));

        await waitFor(() => expect(screen.queryByText('Devis Matthieu Aka')).toBeNull());
        expect(screen.getByText('Stock pistolets')).toBeTruthy();
    });
});
