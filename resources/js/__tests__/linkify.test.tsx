import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { linkify } from '@/utils/linkify';

// Le composant Link d'Inertia est rendu en <a data-inertia> : on distingue ainsi une
// navigation interne (qui reste dans l'onglet, donc conserve la conversation) d'un lien
// externe classique.
vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
        <a href={href} className={className} data-inertia="true">
            {children}
        </a>
    ),
}));

function renderText(text: string) {
    return render(<div>{linkify(text)}</div>);
}

describe('linkify', () => {
    it('laisse un texte sans URL intact', () => {
        const { container } = renderText('Le devis QTE-202608-001 est en brouillon.');

        expect(container.textContent).toBe('Le devis QTE-202608-001 est en brouillon.');
        expect(container.querySelector('a')).toBeNull();
    });

    it('garde un lien interne dans l\'onglet courant', () => {
        // C'est ce qui préserve la conversation : elle vit dans sessionStorage, donc dans
        // l'onglet. Un target="_blank" avec noopener ouvrirait un onglet sans historique.
        renderText(`Devis créé : ${window.location.origin}/WS2N6V5DM4/devis/42`);

        const link = screen.getByRole('link');
        expect(link.getAttribute('data-inertia')).toBe('true');
        expect(link.getAttribute('target')).toBeNull();
    });

    it('ouvre un lien externe dans un nouvel onglet, sans main sur la page d\'origine', () => {
        renderText('Voir https://exemple-externe.test/page');

        const link = screen.getByRole('link');
        expect(link.getAttribute('data-inertia')).toBeNull();
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('n\'altère pas le texte autour du lien', () => {
        const { container } = renderText(
            `Devis créé : QTE-202608-001\n${window.location.origin}/x/devis/42\nIl reste à valider.`,
        );

        expect(container.textContent).toContain('QTE-202608-001');
        expect(container.textContent).toContain('Il reste à valider.');
    });

    it('exclut la ponctuation finale du lien', () => {
        renderText(`Ouvre ${window.location.origin}/x/devis/42, puis valide.`);

        expect(screen.getByRole('link').getAttribute('href')).toBe(`${window.location.origin}/x/devis/42`);
    });

    it('ignore les schémas exécutables', () => {
        // Un contenu venu du modèle ne doit jamais produire un lien cliquable capable
        // d'exécuter du script.
        const { container } = renderText('javascript:alert(1) et data:text/html;base64,AAAA');

        expect(container.querySelector('a')).toBeNull();
    });

    it('rend plusieurs liens dans un même message', () => {
        renderText(
            `Devis ${window.location.origin}/x/devis/1 et facture https://externe.test/f/2 créés.`,
        );

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute('data-inertia')).toBe('true');
        expect(links[1].getAttribute('target')).toBe('_blank');
    });
});
