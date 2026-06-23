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
