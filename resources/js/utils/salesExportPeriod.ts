/** Les périodes rapides de l'export des ventes (ExportSalesModal). */

export type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth';

// AAAA-MM-JJ dans le fuseau de l'appareil (toISOString passerait en UTC).
const ymd = (d: Date) => d.toLocaleDateString('en-CA');

export function periodOf(preset: PeriodPreset): { from: string; to: string } {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    switch (preset) {
        case 'today':
            return { from: ymd(today), to: ymd(today) };
        case 'yesterday': {
            const d = new Date(y, m, today.getDate() - 1);
            return { from: ymd(d), to: ymd(d) };
        }
        case 'week': {
            // La semaine commence le lundi.
            const monday = new Date(y, m, today.getDate() - ((today.getDay() + 6) % 7));
            return { from: ymd(monday), to: ymd(today) };
        }
        case 'month':
            return { from: ymd(new Date(y, m, 1)), to: ymd(today) };
        case 'lastMonth':
            return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
    }
}
