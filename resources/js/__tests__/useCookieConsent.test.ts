import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const STORAGE_KEY = 'batix_cookie_consent';

describe('useCookieConsent', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('reports no consent for a first-time visitor', async () => {
        const { result } = renderHook(() => useCookieConsent());

        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.consent).toBeNull();
    });

    /**
     * Analytics are gated on `consent === 'granted'`, so the initial render must not
     * claim a decision before localStorage has been read — otherwise the banner
     * flashes, or worse, analytics fire without consent.
     */
    it('withholds a decision until the stored value has been read', () => {
        window.localStorage.setItem(STORAGE_KEY, 'granted');

        const { result } = renderHook(() => useCookieConsent());

        expect(result.current.consent === null || result.current.ready).toBe(true);
    });

    it.each(['granted', 'denied'] as const)('restores a stored "%s" choice', async (value) => {
        window.localStorage.setItem(STORAGE_KEY, value);

        const { result } = renderHook(() => useCookieConsent());

        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.consent).toBe(value);
    });

    it('ignores a stored value that is not a valid choice', async () => {
        window.localStorage.setItem(STORAGE_KEY, 'maybe');

        const { result } = renderHook(() => useCookieConsent());

        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.consent).toBeNull();
    });

    it('persists a choice so it survives a reload', async () => {
        const { result } = renderHook(() => useCookieConsent());
        await waitFor(() => expect(result.current.ready).toBe(true));

        act(() => result.current.setConsent('granted'));

        expect(result.current.consent).toBe('granted');
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe('granted');

        const { result: reloaded } = renderHook(() => useCookieConsent());
        await waitFor(() => expect(reloaded.current.ready).toBe(true));
        expect(reloaded.current.consent).toBe('granted');
    });

    it('lets a visitor withdraw consent they previously gave', async () => {
        window.localStorage.setItem(STORAGE_KEY, 'granted');

        const { result } = renderHook(() => useCookieConsent());
        await waitFor(() => expect(result.current.ready).toBe(true));

        act(() => result.current.setConsent('denied'));

        expect(result.current.consent).toBe('denied');
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe('denied');
    });
});
