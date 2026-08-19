import { describe, it, expect } from 'vitest';
import { subprocessors } from '@/i18n/subprocessors';

const locales = ['fr', 'en'] as const;

/**
 * This list is the published GDPR sub-processor disclosure, so a processor missing
 * from it is a compliance gap rather than a cosmetic one. Sentry was added to the
 * app on 2026-07-07 without being declared here.
 */
describe('subprocessor disclosure', () => {
    it.each(locales)('declares Sentry in %s', (locale) => {
        const names = subprocessors[locale].map((s) => s.name);

        expect(names.some((name) => name.includes('Sentry'))).toBe(true);
    });

    it.each(locales)('declares every service the app actually sends data to, in %s', (locale) => {
        const names = subprocessors[locale].map((s) => s.name).join(' | ');

        for (const expected of ['Sentry', 'Paddle', 'Moneroo', 'LemonSqueezy', 'PawaPay', 'Jèko', 'Brevo', 'Google Analytics']) {
            expect(names).toContain(expected);
        }
    });

    it.each(locales)('keeps both locales in step in %s', (locale) => {
        expect(subprocessors[locale]).toHaveLength(subprocessors.fr.length);
    });

    it.each(locales)('describes what each processor receives in %s', (locale) => {
        for (const entry of subprocessors[locale]) {
            expect(entry.name.trim()).not.toBe('');
            expect(entry.role.trim()).not.toBe('');
            expect(entry.data.trim()).not.toBe('');
        }
    });

    /**
     * The Sentry entry promises no name or email is attached, which only holds while
     * SentryContext keeps `send_default_pii` off. Kept in sync by SentryContextTest.
     */
    it.each(locales)('does not overclaim what Sentry receives in %s', (locale) => {
        const sentry = subprocessors[locale].find((s) => s.name.includes('Sentry'));

        expect(sentry).toBeDefined();
        expect(sentry!.data.toLowerCase()).toMatch(/email/);
    });
});
