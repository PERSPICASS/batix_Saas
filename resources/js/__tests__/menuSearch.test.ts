import { describe, expect, it } from 'vitest';
import { translations } from '@/i18n';

/**
 * The sidebar search, as the layout performs it.
 *
 * The menu grew long enough that nobody scans it by eye any more. What makes the search
 * usable here is that accents must not matter: "depot" has to find "Dépôts", which is the
 * first thing anyone types.
 *
 * It searches the CURRENT language only. The labels are the ones on screen, so that is what
 * the user is looking for — an English interface searches English, a French one French.
 */

const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const search = (needle: string, locale: 'fr' | 'en' = 'fr') => {
    const labels = Object.values(translations[locale].nav) as string[];
    const folded = fold(needle.trim());

    return labels.filter((label) => fold(label).includes(folded));
};

describe('sidebar menu search', () => {
    it('ignores accents', () => {
        expect(search('depot')).toContain(translations.fr.nav.depots);
        expect(search('categorie')).toContain(translations.fr.nav.categories);
    });

    it('ignores case', () => {
        expect(search('PRODUITS')).toContain(translations.fr.nav.products);
    });

    it('searches the English labels when the interface is English', () => {
        expect(search('settings', 'en')).toContain(translations.en.nav.settings);
    });

    /** And does not reach into the other language: the labels on screen are French. */
    it('does not match an English word against a French interface', () => {
        expect(search('settings', 'fr')).toEqual([]);
    });

    it('returns nothing for a word that matches no menu', () => {
        expect(search('zzzzz')).toEqual([]);
    });

    /** An empty box must not hide the menu — the layout skips filtering entirely. */
    it('matches everything on an empty needle', () => {
        const all = Object.values(translations.fr.nav).length;

        expect(search('')).toHaveLength(all);
    });
});
