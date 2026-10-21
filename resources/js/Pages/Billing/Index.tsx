import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import Table, { TableBadge, TableActions, TableActionButton } from '@/Components/Table';
import { useLocale } from '@/contexts/LocaleContext';
import { AlertTriangle, Crown, Receipt, CreditCard, X, Download, RefreshCw } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Invoice {
    id: number;
    invoice_number: string;
    plan_name: string;
    billing_cycle: string | null;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    correspondent: string | null;
    msisdn: string | null;
    issued_at: string | null;
    paid_at: string | null;
    expires_at: string | null;
}

interface Deposit {
    id: number;
    deposit_id: string;
    plan_name: string;
    billing_cycle: string;
    amount: number;
    currency: string;
    correspondent: string;
    msisdn: string;
    status: string;
    created_at: string;
    completed_at: string | null;
}

interface CurrentSubscription {
    plan_name: string | null;
    plan_slug: string | null;
    billing_cycle: string | null;
    status: string;
    expires_at: string | null;
    days_left: number | null;
}

interface Props extends PageProps {
    invoices: Invoice[];
    deposits: Deposit[];
    currentSubscription: CurrentSubscription | null;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function fmt(amount: number, currency: string) {
    return amount.toLocaleString('fr-FR') + ' ' + currency;
}

function cycleLabel(cycle: string | null) {
    if (cycle === 'yearly') return 'Annuel';
    if (cycle === 'monthly') return 'Mensuel';
    return cycle ?? '—';
}

function methodLabel(method: string, correspondent: string | null) {
    if (method === 'pawapay' && correspondent) return correspondent.replace(/_/g, ' ');
    return method?.replace(/_/g, ' ') ?? '—';
}

function depositStatusBadge(status: string, t: any) {
    const map: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'default'; label: string }> = {
        COMPLETED:         { variant: 'success',  label: t.billing.status.completed },
        ACCEPTED:          { variant: 'info',     label: t.billing.status.accepted },
        INITIATED:         { variant: 'warning',  label: t.billing.status.initiated },
        SUBMITTED:         { variant: 'warning',  label: t.billing.status.submitted },
        FAILED:            { variant: 'danger',   label: t.billing.status.failed },
        REJECTED:          { variant: 'danger',   label: t.billing.status.rejected },
        DUPLICATE_IGNORED: { variant: 'default',  label: t.billing.status.duplicate },
    };
    const s = map[status] ?? { variant: 'default' as const, label: status };
    return <TableBadge variant={s.variant}>{s.label}</TableBadge>;
}

/* ── Invoice modal ──────────────────────────────────────────────────────── */

function InvoiceModal({ inv, codeUser, onClose, t }: { inv: Invoice; codeUser: string; onClose: () => void; t: any }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">{t.billing.invoice.title}</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{inv.invoice_number}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {inv.status === 'paid' && (
                            <a
                                href={`/${codeUser}/billing/invoices/${inv.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                            >
                                <Download className="size-3.5" /> {t.billing.invoice.download}
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="grid grid-cols-2 gap-px bg-white/5 overflow-hidden rounded-b-xl">
                    {[
                        [t.billing.invoice.number,       inv.invoice_number],
                        [t.billing.invoice.plan,         inv.plan_name],
                        [t.billing.invoice.cycle,        cycleLabel(inv.billing_cycle)],
                        [t.billing.invoice.amount,       fmt(inv.amount, inv.currency)],
                        [t.billing.invoice.method,       methodLabel(inv.payment_method, inv.correspondent)],
                        inv.msisdn ? [t.billing.invoicesList.columns.msisdn, '+' + inv.msisdn] : null,
                        [t.billing.invoice.issuedAt,     inv.issued_at ?? '—'],
                        [t.billing.invoice.paidAt,       inv.paid_at ?? '—'],
                        inv.expires_at ? [t.billing.invoice.expiresAt, inv.expires_at] : null,
                    ].filter(Boolean).map((row) => { const [label, value] = row as [string, string]; return (
                        <div key={label} className="bg-slate-900 px-5 py-3.5">
                            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                            <p className={`text-sm font-medium text-white ${label === t.billing.invoice.amount ? 'text-amber-300 font-bold' : ''}`}>{value}</p>
                        </div>
                    ); })}
                </div>
            </div>
        </div>
    );
}

/* ── Main ───────────────────────────────────────────────────────────────── */

export default function BillingIndex({ auth, invoices, deposits, currentSubscription }: Props) {
    const { t } = useLocale();
    const [tab, setTab] = useState<'invoices' | 'deposits'>('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const codeUser = auth.user?.code_user ?? '';

    const totalPaid = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

    /* ── Colonnes factures ── */
    const invoiceColumns = [
        {
            key: 'invoice_number',
            label: t.billing.invoicesList.columns.number,
            render: (inv: Invoice) => (
                <span className="font-medium text-amber-300">{inv.invoice_number}</span>
            ),
        },
        {
            key: 'plan_name',
            label: t.billing.invoicesList.columns.plan,
            render: (inv: Invoice) => (
                <div>
                    <p className="text-slate-700 dark:text-slate-200">{inv.plan_name}</p>
                    <p className="text-xs text-slate-500">{cycleLabel(inv.billing_cycle)}</p>
                </div>
            ),
        },
        {
            key: 'payment_method',
            label: t.billing.invoicesList.columns.method,
            render: (inv: Invoice) => (
                <span className="text-slate-600 dark:text-slate-300">{methodLabel(inv.payment_method, inv.correspondent)}</span>
            ),
        },
        {
            key: 'issued_at',
            label: t.billing.invoicesList.columns.date,
            render: (inv: Invoice) => <span className="text-slate-500 dark:text-slate-400">{inv.issued_at ?? '—'}</span>,
        },
        {
            key: 'status',
            label: t.billing.invoicesList.columns.status,
            render: (inv: Invoice) => (
                <TableBadge variant={inv.status === 'paid' ? 'success' : 'danger'}>
                    {inv.status === 'paid' ? t.billing.invoicesList.paid : t.billing.invoicesList.unpaid}
                </TableBadge>
            ),
        },
        {
            key: 'amount',
            label: t.billing.invoicesList.columns.amount,
            align: 'right' as const,
            render: (inv: Invoice) => (
                <span className="font-semibold text-slate-900 dark:text-white">{fmt(inv.amount, inv.currency)}</span>
            ),
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (inv: Invoice) => (
                <TableActions>
                    <TableActionButton onClick={() => setSelectedInvoice(inv)}>
                        <Receipt className="size-3.5" /> {t.billing.invoicesList.view}
                    </TableActionButton>
                    {inv.status === 'paid' && (
                        <a
                            href={`/${codeUser}/billing/invoices/${inv.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                        >
                            <Download className="size-3.5" /> {t.billing.invoicesList.download}
                        </a>
                    )}
                </TableActions>
            ),
        },
    ];

    /* ── Colonnes paiements ── */
    const depositColumns = [
        {
            key: 'created_at',
            label: t.billing.invoicesList.columns.date,
            render: (d: Deposit) => <span className="text-slate-500 dark:text-slate-400">{d.created_at}</span>,
        },
        {
            key: 'plan_name',
            label: t.billing.invoicesList.columns.plan,
            render: (d: Deposit) => (
                <div>
                    <p className="text-slate-700 dark:text-slate-200">{d.plan_name}</p>
                    <p className="text-xs text-slate-500">{cycleLabel(d.billing_cycle)}</p>
                </div>
            ),
        },
        {
            key: 'correspondent',
            label: t.billing.invoicesList.columns.operator,
            render: (d: Deposit) => (
                <span className="text-slate-600 dark:text-slate-300">{d.correspondent.replace(/_/g, ' ')}</span>
            ),
        },
        {
            key: 'msisdn',
            label: t.billing.invoicesList.columns.msisdn,
            render: (d: Deposit) => <span className="text-slate-500 dark:text-slate-400">+{d.msisdn}</span>,
        },
        {
            key: 'amount',
            label: t.billing.invoicesList.columns.amount,
            align: 'right' as const,
            render: (d: Deposit) => (
                <span className="font-semibold text-slate-900 dark:text-white">{fmt(d.amount, d.currency)}</span>
            ),
        },
        {
            key: 'status',
            label: t.billing.invoicesList.columns.status,
            align: 'right' as const,
            render: (d: Deposit) => depositStatusBadge(d.status, t),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.billing.title}</h1>}>
            <Head title={t.billing.title} />

            <section className="space-y-6">

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.billing.stats.totalInvoices}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{invoices.length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.billing.stats.totalPaid}</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">{fmt(totalPaid, 'XOF')}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.billing.stats.mobilePayments}</p>
                        <p className="mt-1 text-2xl font-bold text-blue-400">{deposits.length}</p>
                    </div>
                </div>

                {/* Abonnement actuel */}
                {currentSubscription ? (
                    <div className={`rounded-xl border p-5 ${
                        currentSubscription.days_left !== null && currentSubscription.days_left <= 1
                            ? 'border-rose-500/30 bg-rose-500/10'
                            : currentSubscription.days_left !== null && currentSubscription.days_left <= 7
                            ? 'border-amber-400/30 bg-amber-400/10'
                            : 'border-white/10 bg-white/5'
                    }`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/15">
                                    <Crown className="size-5 text-amber-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.billing.subscription.current}</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currentSubscription.plan_name ?? '—'}</p>
                                    <p className="text-xs text-slate-500">{cycleLabel(currentSubscription.billing_cycle)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {currentSubscription.expires_at && (
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.billing.subscription.expires}</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">{currentSubscription.expires_at}</p>
                                        {currentSubscription.days_left !== null && currentSubscription.days_left <= 7 && (
                                            <p className={`flex items-center gap-1 text-xs font-medium ${
                                                currentSubscription.days_left <= 1 ? 'text-rose-400' : 'text-amber-400'
                                            }`}>
                                                <AlertTriangle className="size-3" />
                                                {currentSubscription.days_left <= 0
                                                    ? t.billing.subscription.expired
                                                    : currentSubscription.days_left === 1
                                                    ? t.billing.subscription.expiresTomorrow
                                                    : t.billing.subscription.daysLeft(currentSubscription.days_left)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Link
                                    href={currentSubscription.plan_slug
                                        ? `/plans/${currentSubscription.plan_slug}/checkout`
                                        : '/plans'}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
                                >
                                    <RefreshCw className="size-4" />
                                    {t.billing.subscription.renew}
                                </Link>

                                <Link
                                    href="/plans"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                                >
                                    {t.billing.subscription.changePlan}
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                        <Crown className="mx-auto mb-3 size-8 text-slate-500" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">{t.billing.subscription.noSubscription}</p>
                        <p className="mt-1 text-sm text-slate-500">{t.billing.subscription.noSubscriptionText}</p>
                        <Link
                            href="/plans"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
                        >
                            {t.billing.subscription.seePlans}
                        </Link>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
                    <button
                        type="button"
                        onClick={() => setTab('invoices')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'invoices' ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                        <Receipt className="size-4" /> {t.billing.invoicesList.tabs.invoices}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('deposits')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'deposits' ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                        <CreditCard className="size-4" /> {t.billing.invoicesList.tabs.deposits}
                    </button>
                </div>

                {/* Tables */}
                {tab === 'invoices' && (
                    <Table
                        columns={invoiceColumns}
                        data={invoices}
                        emptyMessage={t.billing.invoicesList.empty}
                    />
                )}

                {tab === 'deposits' && (
                    <Table
                        columns={depositColumns}
                        data={deposits}
                        emptyMessage={t.billing.deposits.emptyMessage}
                    />
                )}

            </section>

            {/* Modal facture */}
            {selectedInvoice && (
                <InvoiceModal inv={selectedInvoice} codeUser={codeUser} onClose={() => setSelectedInvoice(null)} t={t} />
            )}
        </AuthenticatedLayout>
    );
}
