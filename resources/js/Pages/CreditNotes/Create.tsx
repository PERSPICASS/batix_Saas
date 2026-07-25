import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Info } from 'lucide-react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import InputError from '@/Components/InputError';
import { useLocale } from '@/contexts/LocaleContext';
import { useMemo, useState } from 'react';

interface Item {
    id: number;
    product_name: string;
    quantity: number;
    quantity_credited: number;
    quantity_creditable: number;
    unit_price: string | number;
    tax_rate: string | number;
}

interface Props {
    invoice: {
        id: number;
        invoice_number: string;
        status: string;
        total: string | number;
        credited_total: number;
        net_total: number;
        customer: { id: number; name: string };
        items: Item[];
    };
}

export default function CreateCreditNote({ invoice }: Props) {
    const route = useRoute();
    const { t } = useLocale();

    // Quantité à créditer par ligne de facture. 0 = ligne non reprise dans l'avoir.
    const [quantities, setQuantities] = useState<Record<number, number>>(
        Object.fromEntries(invoice.items.map((item) => [item.id, 0]))
    );

    const { data, setData, post, processing, errors, transform } = useForm({
        reason: '',
        notes: '',
    });

    const selected = useMemo(
        () =>
            invoice.items
                .filter((item) => (quantities[item.id] ?? 0) > 0)
                .map((item) => ({ invoice_item_id: item.id, quantity: quantities[item.id] })),
        [invoice.items, quantities]
    );

    const creditTotal = useMemo(
        () =>
            invoice.items.reduce(
                (sum, item) => sum + Number(item.unit_price) * (quantities[item.id] ?? 0),
                0
            ),
        [invoice.items, quantities]
    );

    const setQuantity = (item: Item, raw: string) => {
        const value = Number(raw);
        // Borné au créditable : le serveur refuse de toute façon, autant ne pas laisser
        // saisir un nombre qui sera rejeté.
        const clamped = Number.isNaN(value) ? 0 : Math.max(0, Math.min(item.quantity_creditable, value));

        setQuantities((current) => ({ ...current, [item.id]: clamped }));
    };

    const creditEverything = () => {
        setQuantities(Object.fromEntries(invoice.items.map((item) => [item.id, item.quantity_creditable])));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Les quantités vivent dans leur propre état plutôt que dans le formulaire, parce
        // que chaque ligne se saisit indépendamment ; `transform` les rattache à l'envoi.
        transform((formData) => ({ ...formData, items: selected }));
        post(route('credit-notes.store', { invoice: invoice.id }));
    };

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t.creditNotes.create.title} — {t.creditNotes.create.forInvoice.replace(':number', invoice.invoice_number)}
                </h1>
            }
        >
            <Head title={t.creditNotes.create.title} />

            <div className="space-y-4">
                <Link
                    href={route('invoices.show', { invoice: invoice.id })}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                    <ArrowLeft className="size-4" /> {t.common.actions.back}
                </Link>

                <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>{t.creditNotes.create.explanation}</p>
                </div>

                {invoice.items.length === 0 ? (
                    <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        {t.creditNotes.create.noCreditableLines}
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.creditNotes.create.reason} *
                                    </label>
                                    <input
                                        id="reason"
                                        type="text"
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        placeholder={t.creditNotes.create.reasonPlaceholder}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    />
                                    <InputError message={errors.reason} className="mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.creditNotes.create.notes}
                                    </label>
                                    <input
                                        id="notes"
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold text-slate-900 dark:text-white">{t.creditNotes.create.lines}</h2>
                                <button
                                    type="button"
                                    onClick={creditEverything}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                                >
                                    {t.creditNotes.actions.selectAll}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="py-2">{t.creditNotes.columns.number}</th>
                                            <th className="py-2 text-right">{t.creditNotes.create.invoiced}</th>
                                            <th className="py-2 text-right">{t.creditNotes.create.alreadyCredited}</th>
                                            <th className="py-2 text-right">{t.creditNotes.create.creditable}</th>
                                            <th className="py-2 text-right">{t.creditNotes.create.quantityToCredit}</th>
                                            <th className="py-2 text-right">{t.creditNotes.columns.total}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 text-slate-900 dark:text-slate-200">{item.product_name}</td>
                                                <td className="py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                                <td className="py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity_credited}</td>
                                                <td className="py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity_creditable}</td>
                                                <td className="py-3 text-right">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={item.quantity_creditable}
                                                        value={quantities[item.id] ?? 0}
                                                        onChange={(e) => setQuantity(item, e.target.value)}
                                                        className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                                    />
                                                </td>
                                                <td className="py-3 text-right text-slate-900 dark:text-slate-200">
                                                    <Currency amount={Number(item.unit_price) * (quantities[item.id] ?? 0)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-white/10">
                                <span className="font-semibold text-slate-900 dark:text-white">{t.creditNotes.create.creditTotal}</span>
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                    -<Currency amount={creditTotal} />
                                </span>
                            </div>

                            {selected.length === 0 && (
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.creditNotes.create.nothingSelected}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={processing || selected.length === 0}
                                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t.creditNotes.actions.issue}
                            </button>
                            <Link
                                href={route('invoices.show', { invoice: invoice.id })}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                {t.common.actions.cancel}
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
