import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import frLocale from 'i18n-iso-countries/langs/fr.json';

// Register locales
countries.registerLocale(enLocale);
countries.registerLocale(frLocale);

// Get sorted country names for each language
const getCountriesList = (lang: 'en' | 'fr'): string[] => {
    return Object.values(countries.getNames(lang)).sort();
};

export const countriesI18n = {
    fr: {
        label: 'Pays',
        placeholder: '-- Sélectionner un pays --',
        list: getCountriesList('fr'),
    },
    en: {
        label: 'Country',
        placeholder: '-- Select a country --',
        list: getCountriesList('en'),
    },
} as const;

/** Nom localisé d'un pays à partir de son code ISO alpha-2. */
export const countryName = (alpha2: string, lang: 'en' | 'fr'): string =>
    countries.getName(alpha2, lang) ?? alpha2;

/**
 * Code ISO alpha-2 à partir d'un nom de pays.
 *
 * `users.country` stocke un nom localisé saisi au moment de l'inscription, pas un
 * code : la langue d'alors n'est pas forcément celle d'aujourd'hui, on essaie donc
 * les deux avant d'abandonner.
 */
export const countryAlpha2 = (name: string | null | undefined, lang: 'en' | 'fr'): string | null => {
    if (!name) return null;

    const other = lang === 'fr' ? 'en' : 'fr';

    return countries.getAlpha2Code(name, lang) ?? countries.getAlpha2Code(name, other) ?? null;
};
