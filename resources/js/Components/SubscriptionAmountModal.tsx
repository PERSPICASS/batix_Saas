import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtXAF } from '@/utils/platformFormat';

export interface AmountTarget {
    id: number;
    amount: number | string;
    billing_cycle: string | null;
    plan_name?: string | null;
    plan_price?: number | null;
}

/**
 * Prix réellement payé par un compte (partenaire, remise). Le MRR et les
 * renouvellements manuels lisent subscriptions.amount : c'est là qu'un tarif
 * différent de celui du plan doit être saisi.
 */
export default function SubscriptionAmountModal({ target, onClose }: { target: AmountTarget | null; onClose: () => void }) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.accountShow;
    const [amount, setAmount] = useState('');
    const [cycle, setCycle] = useState('monthly');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (target) {
            setAmount(String(Math.round(Number(target.amount))));
            setCycle(target.billing_cycle || 'monthly');
            setErrors({});
        }
    }, [target]);

    const submit = () => {
        if (!target) return;
        router.post(route('platform.active-subscriptions.amount', target.id), { amount, billing_cycle: cycle }, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: onClose,
            onError: (errs) => setErrors(errs as Record<string, string>),
        });
    };

    const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white';

    return (
        <Modal show={target !== null} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tr.amountTitle}</h3>
                {target?.plan_name && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {target.plan_name}
                        {target.plan_price != null && ` · ${tr.planPrice(fmtXAF(target.plan_price, locale))}`}
                    </p>
                )}
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{tr.amountHint}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{tr.amount}</span>
                        <input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
                        <InputError message={errors.amount} />
                    </label>
                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{tr.cycle}</span>
                        <select value={cycle} onChange={(e) => setCycle(e.target.value)} className={input}>
                            <option value="monthly">{t.platformAdmin.cycles.monthly}</option>
                            <option value="yearly">{t.platformAdmin.cycles.yearly}</option>
                        </select>
                        <InputError message={errors.billing_cycle} />
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        {t.platformAdmin.common.cancel}
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                    >
                        {t.platformAdmin.common.save}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
