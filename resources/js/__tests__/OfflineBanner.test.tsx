import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import OfflineBanner from '@/Components/OfflineBanner';

vi.mock('@/contexts/LocaleContext', () => ({
    useLocale: () => ({
        t: {
            layout: {
                offline: {
                    title: 'Hors ligne',
                    message: 'Vous consultez les dernières données enregistrées.',
                    restored: 'Connexion rétablie',
                },
            },
        },
    }),
}));

function setOnline(value: boolean) {
    Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => value,
    });
}

describe('OfflineBanner', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setOnline(true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('stays out of the way while the connection is fine', () => {
        render(<OfflineBanner />);

        expect(screen.queryByRole('status')).toBeNull();
    });

    it('warns that the data on screen is cached once the connection drops', () => {
        render(<OfflineBanner />);

        act(() => {
            setOnline(false);
            window.dispatchEvent(new Event('offline'));
        });

        // The warning is the whole point: a stale "stock: 12" read as current is worse
        // than an error page.
        expect(screen.getByRole('status')).toBeTruthy();
        expect(screen.getByText('Hors ligne')).toBeTruthy();
        expect(screen.getByText(/dernières données enregistrées/)).toBeTruthy();
    });

    it('confirms recovery, then gets out of the way on its own', () => {
        render(<OfflineBanner />);

        act(() => {
            setOnline(false);
            window.dispatchEvent(new Event('offline'));
        });

        act(() => {
            setOnline(true);
            window.dispatchEvent(new Event('online'));
        });

        expect(screen.getByText('Connexion rétablie')).toBeTruthy();
        // The offline warning must be gone, not merely recoloured.
        expect(screen.queryByText('Hors ligne')).toBeNull();

        act(() => {
            vi.advanceTimersByTime(4100);
        });

        expect(screen.queryByRole('status')).toBeNull();
    });

    it('renders nothing when navigator is absent, as during SSR', () => {
        // The layout is server-rendered: reading navigator.onLine at render time would
        // crash the SSR pass and take the whole page down.
        const original = Object.getOwnPropertyDescriptor(window, 'navigator');
        // @ts-expect-error — deliberately simulating the SSR global
        delete window.navigator;

        expect(() => render(<OfflineBanner />)).not.toThrow();

        if (original) Object.defineProperty(window, 'navigator', original);
    });
});
