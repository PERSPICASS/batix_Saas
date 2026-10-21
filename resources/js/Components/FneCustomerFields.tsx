import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * `shops.country` est un nom localisé, pas un code ISO : « Côte d'Ivoire »,
 * « Côte-d'Ivoire » (libellé français d'i18n-iso-countries), « Ivory Coast »…
 * Même comparaison que Shop::isInCoteDIvoire() côté serveur.
 */
export function isCoteDIvoire(country: string | null | undefined): boolean {
    const letters = (country ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');

    return ['cotedivoire', 'ivorycoast', 'ci', 'civ'].includes(letters);
}

export type FneTemplate = 'B2C' | 'B2B' | 'B2G';

interface Props {
    template: FneTemplate;
    ncc: string;
    onTemplateChange: (value: FneTemplate) => void;
    onNccChange: (value: string) => void;
    errors: { fne_template?: string; ncc?: string };
}

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white';

/** Ce que la DGI demande du client sur une facture FNE : son type, et son NCC s'il est une entreprise. */
export default function FneCustomerFields({ template, ncc, onTemplateChange, onNccChange, errors }: Props) {
    const { t } = useLocale();
    const c = t.fne.customer;

    return (
        <>
            <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                <span>{c.type}</span>
                <select value={template} onChange={(e) => onTemplateChange(e.target.value as FneTemplate)} className={inputClass}>
                    <option value="B2C">{c.B2C}</option>
                    <option value="B2B">{c.B2B}</option>
                    <option value="B2G">{c.B2G}</option>
                </select>
                <InputError message={errors.fne_template} />
            </label>

            <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                <span>{c.ncc}</span>
                <input value={ncc} onChange={(e) => onNccChange(e.target.value)} maxLength={30} className={inputClass} />
                {template === 'B2B' && <p className="text-xs text-slate-500 dark:text-slate-400">{c.nccHelp}</p>}
                <InputError message={errors.ncc} />
            </label>
        </>
    );
}
