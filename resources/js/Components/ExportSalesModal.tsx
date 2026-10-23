import Modal from '@/Components/Modal';
import { useLocale } from '@/contexts/LocaleContext';
import { useRoute } from '@/utils/route';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { periodOf, type PeriodPreset } from '@/utils/salesExportPeriod';

type Preset = PeriodPreset | 'custom';

/**
 * Export Excel des ventes en deux clics : choisir une période (Aujourd'hui par défaut),
 * télécharger. Indépendant des filtres de la liste.
 */
export default function ExportSalesModal({ show, onClose }: { show: boolean; onClose: () => void }) {
    const route = useRoute();
    const { t } = useLocale();
    const [preset, setPreset] = useState<Preset>('today');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const presets: PeriodPreset[] = ['today', 'yesterday', 'week', 'month', 'lastMonth'];
    // Calculé seulement fenêtre ouverte : jamais en SSR.
    const period = !show ? null : preset === 'custom' ? (from ? { from, to } : null) : periodOf(preset);
    const customInvalid = preset === 'custom' && Boolean(from && to && to < from);
    const href = period && !customInvalid
        ? route('sales.export', { date_from: period.from, ...(period.to ? { date_to: period.to } : {}) })
        : null;

    const choice = (active: boolean) =>
        `rounded-lg border px-3 py-2 text-sm transition ${active
            ? 'border-amber-300 bg-amber-100 font-semibold text-amber-800 dark:border-amber-300/50 dark:bg-amber-300/10 dark:text-amber-300'
            : 'border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5'}`;

    const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white';

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.sales.export.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.sales.export.subtitle}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    {presets.map(p => (
                        <button key={p} type="button" onClick={() => setPreset(p)} className={choice(preset === p)}>
                            {t.sales.export.presets[p]}
                        </button>
                    ))}
                    <button type="button" onClick={() => setPreset('custom')} className={choice(preset === 'custom')}>
                        {t.sales.export.presets.custom}
                    </button>
                </div>

                {preset === 'custom' && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t.sales.filters.dateFrom}</label>
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={input} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                {t.sales.filters.dateTo} <span className="text-slate-400">({t.sales.export.optional})</span>
                            </label>
                            <input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className={input} />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5">
                        {t.sales.export.cancel}
                    </button>
                    {href ? (
                        // Téléchargement de fichier : un lien plein, pas une visite Inertia.
                        <a href={href} onClick={onClose} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                            <Download className="size-4" /> {t.sales.export.download}
                        </a>
                    ) : (
                        <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-slate-400 dark:bg-white/10">
                            <Download className="size-4" /> {t.sales.export.download}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
