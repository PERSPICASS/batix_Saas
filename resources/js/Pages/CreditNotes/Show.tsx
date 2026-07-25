import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Lock, Printer } from 'lucide-react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';

interface Props {
    creditNote: {
        id: number;
        credit_note_number: string;
        credit_note_date: string;
        reason: string;
        notes: string | null;
        subtotal: string | number;
        tax_amount: string | number;
        total: string | number;
        invoice: { id: number; invoice_number: string; total: string | number } | null;
        customer: { id: number; name: string; email?: string | null } | null;
        shop: { id: number; name: string } | null;
        user: { id: number; name: string } | null;
        items: Array<{
            id: number;
            product_name: string;
            quantity: number;
            unit_price: string | number;
            total: string | number;
        }>;
    };
}

export default function ShowCreditNote({ creditNote }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();

    const formattedDate = new Date(creditNote.credit_note_date).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'fr-FR'
    );

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t.creditNotes.show.title.replace(':number', creditNote.credit_note_number)}
                </h1>
            }
        >
            <Head title={t.creditNotes.show.title.replace(':number', creditNote.credit_note_number)} />

            <div className="space-y-4">
                <div className="print:hidden flex flex-wrap items-center gap-3">
                    <Link
                        href={route('credit-notes.index')}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" /> {t.common.actions.back}
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <Printer className="size-4" /> {t.common.actions.print || 'Imprimer'}
                    </button>
                </div>

                <div className="print:hidden flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    <p>{t.creditNotes.show.immutable}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 print:rounded-none print:border-0 print:bg-white">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {creditNote.credit_note_number}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formattedDate}</p>
                            {creditNote.shop && (
                                <p className="mt-2 font-medium text-slate-900 dark:text-slate-200">{creditNote.shop.name}</p>
                            )}
                        </div>
                        <div className="text-right text-sm">
                            {creditNote.invoice && (
                                <p className="text-slate-600 dark:text-slate-400">
                                    {t.creditNotes.show.correctsInvoice}{' '}
                                    <Link
                                        href={route('invoices.show', { invoice: creditNote.invoice.id })}
                                        className="font-medium text-amber-600 hover:underline dark:text-amber-300"
                                    >
                                        {creditNote.invoice.invoice_number}
                                    </Link>
                                </p>
                            )}
                            {creditNote.customer && (
                                <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
                                    {creditNote.customer.name}
                                </p>
                            )}
                            {creditNote.user && (
                                <p className="mt-1 text-slate-500 dark:text-slate-400">
                                    {t.creditNotes.show.issuedBy} {creditNote.user.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10">
                        <p className="text-slate-500 dark:text-slate-400">{t.creditNotes.create.reason}</p>
                        <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{creditNote.reason}</p>
                        {creditNote.notes && (
                            <p className="mt-2 text-slate-600 dark:text-slate-400">{creditNote.notes}</p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="py-2">{t.creditNotes.columns.number}</th>
                                    <th className="py-2 text-right">{t.creditNotes.create.quantityToCredit}</th>
                                    <th className="py-2 text-right">{t.creditNotes.columns.total}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {creditNote.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 text-slate-900 dark:text-slate-200">{item.product_name}</td>
                                        <td className="py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                        <td className="py-3 text-right text-slate-900 dark:text-slate-200">
                                            <Currency amount={Number(item.total)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>{t.invoices.form.subtotal}</span>
                            <span><Currency amount={Number(creditNote.subtotal)} /></span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>{t.invoices.form.tax}</span>
                            <span><Currency amount={Number(creditNote.tax_amount)} /></span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-red-600 dark:border-white/10 dark:text-red-400">
                            <span>{t.creditNotes.create.creditTotal}</span>
                            <span>-<Currency amount={Number(creditNote.total)} /></span>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
