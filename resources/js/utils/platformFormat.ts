// Formatage de l'espace admin plateforme. Tous les montants y sont en FCFA
// (prix des plans, abonnements, charges converties) : ne pas passer par
// <Currency>, qui lit la devise de la boutique active — il n'y en a pas pour
// un admin plateforme, et il retombait sur le dollar.

export const intlLocale = (locale: string) => (locale === 'en' ? 'en-US' : 'fr-FR');

export const fmtNumber = (n: number | string | null | undefined, locale: string) =>
    Math.round(Number(n ?? 0)).toLocaleString(intlLocale(locale));

export const fmtXAF = (n: number | string | null | undefined, locale: string) =>
    `${fmtNumber(n, locale)} FCFA`;

/** Valeur courte pour les axes de graphiques : 1,2 M · 15 k. */
export const fmtCompact = (n: number, locale: string) =>
    new Intl.NumberFormat(intlLocale(locale), { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** « 2026-10 » → « oct. 2026 ». */
export const fmtMonth = (ym: string, locale: string) => {
    const [y, m] = ym.split('-').map(Number);
    if (!y || !m) return ym;
    return new Date(y, m - 1, 1).toLocaleDateString(intlLocale(locale), { month: 'short', year: 'numeric' });
};

export const fmtDate = (iso: string | null | undefined, locale: string) => {
    if (!iso) return '—';
    // « 2026-10-15 12:00:00 » (Laravel) n'est pas de l'ISO strict pour Safari.
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(intlLocale(locale), { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Partie date (YYYY-MM-DD) d'une valeur pour un <input type="date">. */
export const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');
