import { describe, expect, it } from 'vitest';
import { buildPhoneCountries, normalizePhone } from '@/utils/phone';

/**
 * Ce que ces tests gardent : Chariow reçoit `phone.country_code` (ISO) et
 * `phone.number` séparément, et le numéro doit être national — sans indicatif ni
 * préfixe d'appel. Le piège est que ce préfixe dépend du pays, donc un
 * `replace(/\D/g, '')` uniforme paraît marcher jusqu'au premier client étranger.
 */
describe('normalizePhone', () => {
    it('drops the trunk prefix where the country uses one', () => {
        const fr = normalizePhone('0612345678', 'FR');

        expect(fr?.valid).toBe(true);
        // Le 0 initial ne fait pas partie du numéro international.
        expect(fr?.nationalNumber).toBe('612345678');
        expect(fr?.international).toBe('+33 6 12 34 56 78');
    });

    it('keeps the leading zero where it belongs to the number', () => {
        const ci = normalizePhone('0700000000', 'CI');

        expect(ci?.valid).toBe(true);
        // La Côte d'Ivoire est passée à 10 chiffres : le 0 est significatif.
        expect(ci?.nationalNumber).toBe('0700000000');
    });

    it('accepts a number already written in international form', () => {
        const sn = normalizePhone('+221770000000', 'SN');

        expect(sn?.valid).toBe(true);
        expect(sn?.country).toBe('SN');
        expect(sn?.nationalNumber).toBe('770000000');
    });

    it('trusts the typed international prefix over the selected country', () => {
        // Client sénégalais qui a oublié de changer le sélecteur resté sur la CI.
        const mismatch = normalizePhone('+221770000000', 'CI');

        expect(mismatch?.country).toBe('SN');
        expect(mismatch?.nationalNumber).toBe('770000000');
    });

    it('tolerates spaces and punctuation', () => {
        expect(normalizePhone('07 00 00 00 00', 'CI')?.nationalNumber).toBe('0700000000');
        expect(normalizePhone('(06) 12-34-56-78', 'FR')?.nationalNumber).toBe('612345678');
    });

    it('reports an implausible number as invalid instead of sending it', () => {
        expect(normalizePhone('123', 'CI')?.valid).toBe(false);
        expect(normalizePhone('00', 'FR')?.valid).toBe(false);
    });

    it('returns null on empty input', () => {
        expect(normalizePhone('', 'CI')).toBeNull();
        expect(normalizePhone('   ', 'FR')).toBeNull();
    });
});

describe('buildPhoneCountries', () => {
    it('covers far more than the West African markets', () => {
        const list = buildPhoneCountries('fr');
        const isos = list.map(c => c.iso);

        // La régression que ça garde : une liste écrite à la main excluait tout
        // client hors des 9 pays prévus.
        expect(list.length).toBeGreaterThan(200);
        for (const iso of ['CI', 'SN', 'FR', 'CA', 'BE', 'CM', 'CD', 'MG', 'US']) {
            expect(isos).toContain(iso);
        }
    });

    it('gives every entry a name and a dial code', () => {
        for (const country of buildPhoneCountries('fr')) {
            expect(country.name.trim()).not.toBe('');
            expect(country.dialCode).toMatch(/^\+\d+$/);
        }
    });

    it('localises names and sorts on them', () => {
        const fr = buildPhoneCountries('fr');
        const en = buildPhoneCountries('en');

        expect(fr.find(c => c.iso === 'DE')?.name).toBe('Allemagne');
        expect(en.find(c => c.iso === 'DE')?.name).toBe('Germany');

        const names = fr.map(c => c.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'fr')));
    });
});
