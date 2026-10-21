import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { countryName } from '@/i18n/countries';

export interface PhoneCountry {
    iso: string;
    name: string;
    dialCode: string;
}

/**
 * Liste des pays du sélecteur téléphone.
 *
 * Construite à partir des pays connus de libphonenumber-js — ainsi chaque entrée a
 * forcément un indicatif et un numéro analysable — puis nommée via la même source
 * ISO que le profil et les boutiques. Aucune liste écrite à la main : une liste
 * codée en dur finit toujours par exclure un client réel.
 */
export function buildPhoneCountries(lang: 'en' | 'fr'): PhoneCountry[] {
    return getCountries()
        .map(iso => ({
            iso,
            name: countryName(iso, lang),
            dialCode: `+${getCountryCallingCode(iso)}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
}

export interface NormalizedPhone {
    /** Chiffres nationaux, sans indicatif ni préfixe d'appel national. */
    nationalNumber: string;
    /** Code ISO alpha-2 réellement retenu — peut différer du pays sélectionné. */
    country: string;
    international: string;
    valid: boolean;
}

/**
 * Normalise un numéro pour les prestataires de paiement : code pays ISO alpha-2,
 * numéro national et représentation internationale E.164.
 *
 * C'est libphonenumber qui décide du préfixe d'appel national, pays par pays : le
 * `0` de `0612345678` saute en France, celui de `0700000000` reste en Côte
 * d'Ivoire. Un `replace(/\D/g, '')` uniforme enverrait un numéro faux dans l'un
 * des deux cas — et le paiement échouerait sans que personne comprenne pourquoi.
 *
 * Retourne `null` si le numéro n'est pas analysable, pour que l'appelant puisse
 * bloquer l'envoi plutôt que de laisser le prestataire répondre 422.
 */
export function normalizePhone(input: string, iso: string): NormalizedPhone | null {
    if (!input.trim()) {
        return null;
    }

    const parsed = parsePhoneNumberFromString(input, iso as never);

    if (!parsed) {
        return null;
    }

    return {
        nationalNumber: parsed.nationalNumber,
        country: parsed.country ?? iso,
        international: parsed.number,
        valid: parsed.isValid(),
    };
}
