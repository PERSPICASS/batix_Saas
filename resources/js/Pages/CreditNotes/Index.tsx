import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import Table, { TableActions } from '@/Components/Table';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import Currency from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';

interface CreditNote {
    id: number;
    credit_note_number: string;
    credit_note_date: string;
    reason: string;
    total: string | number;
    customer: { id: number; name: string } | null;
    invoice: { id: number; invoice_number: string } | null;
    shop: { id: number; name: string } | null;
}

interface Paginated {
    data: CreditNote[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    creditNotes: Paginated;
    filters: { search?: string };
}

export default function CreditNotesIndex({ creditNotes, filters }: Props) {
    const route = useRoute();
    const { t, locale } = useLocale();
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

    const handleSearch = () => {
        router.get(route('credit-notes.index'), { search: searchTerm }, { preserveState: true });
    };

    const columns = [
        {
            key: 'credit_note_number',
            label: t.creditNotes.columns.number,
            render: (creditNote: CreditNote) => (
                <span className="font-medium text-slate-900 dark:text-white">{creditNote.credit_note_number}</span>
            ),
        },
        {
            key: 'credit_note_date',
            label: t.creditNotes.columns.date,
            render: (creditNote: CreditNote) =>
                new Date(creditNote.credit_note_date).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR'),
        },
        {
            key: 'invoice',
            label: t.creditNotes.columns.invoice,
            render: (creditNote: CreditNote) =>
                creditNote.invoice ? (
                    <Link
                        href={route('invoices.show', { invoice: creditNote.invoice.id })}
                        className="text-amber-600 hover:underline dark:text-amber-300"
                    >
                        {creditNote.invoice.invoice_number}
                    </Link>
                ) : (
                    '—'
                ),
        },
        {
            key: 'customer',
            label: t.creditNotes.columns.customer,
            render: (creditNote: CreditNote) => creditNote.customer?.name ?? '—',
        },
        {
            key: 'reason',
            label: t.creditNotes.columns.reason,
            render: (creditNote: CreditNote) => creditNote.reason,
        },
        {
            key: 'total',
            label: t.creditNotes.columns.total,
            render: (creditNote: CreditNote) => (
                <span className="font-semibold text-red-600 dark:text-red-400">
                    -<Currency amount={Number(creditNote.total)} />
                </span>
            ),
        },
        {
            key: 'actions',
            label: t.creditNotes.columns.actions,
            align: 'right' as const,
            render: (creditNote: CreditNote) => (
                <TableActions>
                    <Link
                        href={route('credit-notes.show', { credit_note: creditNote.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        <Eye className="size-3.5" /> {t.creditNotes.actions.view}
                    </Link>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.creditNotes.title}</h1>}
        >
            <Head title={t.creditNotes.title} />

            <section className="space-y-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.creditNotes.subtitle}</p>

                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        placeholder={t.creditNotes.filters.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder-slate-500"
                    />
                    <button
                        onClick={handleSearch}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                        {t.common.actions.search}
                    </button>
                </div>

                {creditNotes.data.length === 0 ? (
                    <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        {t.creditNotes.emptyMessage}
                    </p>
                ) : (
                    <Table columns={columns} data={creditNotes.data} />
                )}

                {creditNotes.links && (
                    <div className="flex items-center justify-center gap-1">
                        {creditNotes.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 font-semibold text-slate-950'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
