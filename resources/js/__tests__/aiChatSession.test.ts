import { describe, it, expect, beforeEach } from 'vitest';
import { loadAiChatSession, saveAiChatSession, clearAiChatSession } from '@/utils/aiChatSession';

describe('aiChatSession', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    it('rend le pointeur au même utilisateur et à la même boutique', () => {
        saveAiChatSession(7, 3, { isOpen: true, conversationId: 42 });

        expect(loadAiChatSession(7, 3)).toEqual({ isOpen: true, conversationId: 42 });
    });

    it('part fermé quand rien n\'a été enregistré', () => {
        expect(loadAiChatSession(7, 3)).toEqual({ isOpen: false, conversationId: null });
    });

    it('ne rend pas le pointeur d\'un autre utilisateur sur le même poste', () => {
        saveAiChatSession(7, 3, { isOpen: true, conversationId: 42 });

        expect(loadAiChatSession(8, 3).conversationId).toBeNull();
    });

    it('sépare les boutiques d\'un même utilisateur', () => {
        // L'assistant force la boutique courante sur chaque appel d'outil : rouvrir le
        // fil d'une autre boutique afficherait des réponses sans rapport avec l'écran.
        saveAiChatSession(7, 3, { isOpen: true, conversationId: 42 });

        expect(loadAiChatSession(7, 4).conversationId).toBeNull();
    });

    it('ne conserve aucun contenu de conversation', () => {
        saveAiChatSession(7, 3, { isOpen: true, conversationId: 42 });

        // Les messages vivent en base. Les stocker aussi côté navigateur laisserait des
        // noms de clients et des prix dans l'onglet, sans rien apporter.
        const raw = window.sessionStorage.getItem('batixpro.aichat.7.3') ?? '';
        expect(raw).not.toContain('content');
        expect(raw).not.toContain('message');
    });

    it('ignore une entrée corrompue plutôt que de casser le widget', () => {
        window.sessionStorage.setItem('batixpro.aichat.7.3', '{ceci n\'est pas du JSON');

        expect(loadAiChatSession(7, 3)).toEqual({ isOpen: false, conversationId: null });
    });

    it('écarte un identifiant de conversation mal formé', () => {
        window.sessionStorage.setItem(
            'batixpro.aichat.7.3',
            JSON.stringify({ isOpen: true, conversationId: 'quarante-deux' }),
        );

        expect(loadAiChatSession(7, 3).conversationId).toBeNull();
    });

    it('efface les pointeurs de l\'onglet à la déconnexion', () => {
        saveAiChatSession(7, 3, { isOpen: true, conversationId: 42 });
        saveAiChatSession(8, 4, { isOpen: true, conversationId: 43 });
        window.sessionStorage.setItem('autre.cle', 'à conserver');

        clearAiChatSession();

        expect(loadAiChatSession(7, 3).conversationId).toBeNull();
        expect(loadAiChatSession(8, 4).conversationId).toBeNull();
        expect(window.sessionStorage.getItem('autre.cle')).toBe('à conserver');
    });
});
