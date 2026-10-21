import { describe, expect, it, vi } from 'vitest';
import { onToast, showToast } from '@/utils/toast';

/**
 * ToastContainer could only display flash messages coming back from the server, so client
 * code had no way to report anything — hence the scattered alert() calls, which block the
 * whole tab, ignore the theme, and demand a click to say something as small as "add a
 * product first".
 *
 * A browser event rather than a React context, deliberately: it works from code with no
 * access to hooks — an axios interceptor, an Inertia error handler.
 */
describe('toast bus', () => {
    it('delivers a message to a subscriber', () => {
        const seen: Array<{ type: string; message: string }> = [];
        const stop = onToast((detail) => seen.push(detail));

        showToast('error', 'Import échoué');

        expect(seen).toEqual([{ type: 'error', message: 'Import échoué' }]);
        stop();
    });

    it('delivers to every subscriber', () => {
        const first = vi.fn();
        const second = vi.fn();
        const stopFirst = onToast(first);
        const stopSecond = onToast(second);

        showToast('info', 'Deux fois');

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
        stopFirst();
        stopSecond();
    });

    it('stops delivering once unsubscribed', () => {
        const handler = vi.fn();
        const stop = onToast(handler);

        stop();
        showToast('success', 'Personne n\'écoute');

        expect(handler).not.toHaveBeenCalled();
    });

    /**
     * Successive toasts must all arrive: the container assigns ids from a ref precisely
     * because its subscription is registered once and would otherwise freeze the counter
     * it captured, giving two toasts the same React key.
     */
    it('delivers successive messages', () => {
        const seen: string[] = [];
        const stop = onToast(({ message }) => seen.push(message));

        showToast('warning', 'un');
        showToast('warning', 'deux');
        showToast('warning', 'trois');

        expect(seen).toEqual(['un', 'deux', 'trois']);
        stop();
    });
});
