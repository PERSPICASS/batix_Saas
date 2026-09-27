import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, BadgeCheck, PlugZap, Save } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';
import { useRoute } from '@/utils/route';

/** Ce que SettingsController::fneSettings() envoie pour la boutique active. */
export interface FneSettings {
    shop_id: number;
    shop_name: string;
    available: boolean;
    enabled: boolean;
    active: boolean;
    environment: 'test' | 'prod';
    has_api_key: boolean;
    base_url: string | null;
    establishment: string | null;
    point_of_sale: string | null;
    zero_rate_code: 'TVAC' | 'TVAD';
    balance_sticker: number | null;
    sticker_warning: boolean;
    test_url: string;
}

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200';
const helpClass = 'mt-1 text-xs text-slate-500 dark:text-slate-400';

/**
 * Réglages FNE de la boutique active — un formulaire à part : ils sont propres à une
 * boutique (établissement / point de vente DGI), là où le reste de la page vaut pour
 * tout le compte. La clé API n'est jamais renvoyée au navigateur.
 */
export default function FneSettingsCard({ fne }: { fne: FneSettings }) {
    const route = useRoute();
    const { t } = useLocale();
    const s = t.fne.settings;
    const [testing, setTesting] = useState(false);

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        fne_enabled: fne.enabled,
        fne_environment: fne.environment,
        fne_api_key: '',
        fne_base_url: fne.base_url ?? '',
        fne_establishment: fne.establishment ?? '',
        fne_point_of_sale: fne.point_of_sale ?? '',
        fne_zero_rate_code: fne.zero_rate_code,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.fne.update'), {
            preserveScroll: true,
            onSuccess: () => setData('fne_api_key', ''),
        });
    };

    const testKey = () => {
        setTesting(true);
        router.post(route('settings.fne.test'), {}, { preserveScroll: true, onFinish: () => setTesting(false) });
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5"
        >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <BadgeCheck className="size-5 text-amber-300" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h2>
                </div>
                <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fne.active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-gray-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                    }`}
                >
                    {fne.active ? s.active : s.inactive}
                </span>
            </div>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">{s.intro}</p>
            <p className="mb-5 text-sm font-medium text-slate-700 dark:text-slate-300">
                {s.forShop.replace(':name', fne.shop_name)}
            </p>

            {fne.balance_sticker !== null && (
                <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                    {s.stickers.replace(':count', String(fne.balance_sticker))}
                </p>
            )}
            {fne.sticker_warning && (
                <p className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {s.stickerWarning}
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.fne_enabled}
                        onChange={(e) => setData('fne_enabled', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    {s.enabled}
                </label>

                <div>
                    <label htmlFor="fne_environment" className={labelClass}>{s.environment}</label>
                    <select
                        id="fne_environment"
                        value={data.fne_environment}
                        onChange={(e) => setData('fne_environment', e.target.value as 'test' | 'prod')}
                        className={inputClass}
                    >
                        <option value="test">{s.environmentTest}</option>
                        <option value="prod">{s.environmentProd}</option>
                    </select>
                    {data.fne_environment === 'test' && (
                        <p className={helpClass}>{s.testUrlHelp.replace(':url', fne.test_url)}</p>
                    )}
                    <InputError message={errors.fne_environment} />
                </div>

                <div>
                    <label htmlFor="fne_api_key" className={labelClass}>{s.apiKey}</label>
                    <input
                        type="password"
                        id="fne_api_key"
                        autoComplete="off"
                        value={data.fne_api_key}
                        onChange={(e) => setData('fne_api_key', e.target.value)}
                        className={inputClass}
                    />
                    <p className={helpClass}>{fne.has_api_key ? s.apiKeyKeep : s.apiKeyMissing}</p>
                    <InputError message={errors.fne_api_key} />
                </div>

                {data.fne_environment === 'prod' && (
                    <div className="md:col-span-2">
                        <label htmlFor="fne_base_url" className={labelClass}>{s.baseUrl}</label>
                        <input
                            type="url"
                            id="fne_base_url"
                            value={data.fne_base_url}
                            onChange={(e) => setData('fne_base_url', e.target.value)}
                            placeholder="https://"
                            className={inputClass}
                        />
                        <p className={helpClass}>{s.baseUrlHelp}</p>
                        <InputError message={errors.fne_base_url} />
                    </div>
                )}

                <div>
                    <label htmlFor="fne_establishment" className={labelClass}>{s.establishment}</label>
                    <input
                        type="text"
                        id="fne_establishment"
                        value={data.fne_establishment}
                        onChange={(e) => setData('fne_establishment', e.target.value)}
                        className={inputClass}
                    />
                    <p className={helpClass}>{s.establishmentHelp}</p>
                    <InputError message={errors.fne_establishment} />
                </div>

                <div>
                    <label htmlFor="fne_point_of_sale" className={labelClass}>{s.pointOfSale}</label>
                    <input
                        type="text"
                        id="fne_point_of_sale"
                        value={data.fne_point_of_sale}
                        onChange={(e) => setData('fne_point_of_sale', e.target.value)}
                        className={inputClass}
                    />
                    <p className={helpClass}>{s.establishmentHelp}</p>
                    <InputError message={errors.fne_point_of_sale} />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="fne_zero_rate_code" className={labelClass}>{s.zeroRate}</label>
                    <select
                        id="fne_zero_rate_code"
                        value={data.fne_zero_rate_code}
                        onChange={(e) => setData('fne_zero_rate_code', e.target.value as 'TVAC' | 'TVAD')}
                        className={inputClass}
                    >
                        <option value="TVAD">{s.zeroRateTVAD}</option>
                        <option value="TVAC">{s.zeroRateTVAC}</option>
                    </select>
                    <InputError message={errors.fne_zero_rate_code} />
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {recentlySuccessful && <span className="text-sm text-green-500">✓</span>}
                <button
                    type="button"
                    onClick={testKey}
                    disabled={testing || !fne.has_api_key}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                >
                    <PlugZap className="size-4" /> {s.test}
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
                >
                    <Save className="size-4" /> {s.save}
                </button>
            </div>
        </form>
    );
}
