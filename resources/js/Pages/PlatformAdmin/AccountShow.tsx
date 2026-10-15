import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Power, FlaskConical, Package, Pencil, ExternalLink, ShieldCheck, MailCheck, MailWarning } from 'lucide-react';
import Table, { TableActions, TableBadge } from '@/Components/Table';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import SubscriptionAmountModal, { AmountTarget } from '@/Components/SubscriptionAmountModal';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtDate, fmtNumber, fmtXAF } from '@/utils/platformFormat';

interface Account {
    id: number;
    name: string;
    email: string;
    code_user: string;
    country: string | null;
    is_active: boolean;
    is_demo: boolean;
    email_verified: boolean;
    two_factor_enabled: boolean;
    created_at: string | null;
    last_activity_at: string | null;
}

interface Stats {
    shops: number;
    staff: number;
    products: number;
    customers: number;
    sales_30d: number;
    revenue_30d: number;
    last_sale_at: string | null;
}

interface ShopRow {
    id: number;
    name: string;
    city: string | null;
    country: string | null;
    currency: string | null;
    is_active: boolean;
    products_count: number;
    customers_count: number;
    sales_30d: number;
    revenue_30d: number;
    created_at: string | null;
}

interface StaffRow {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    shop: string | null;
    created_at: string | null;
}

interface SubscriptionRow {
    id: number;
    plan: string | null;
    plan_price: number | null;
    status: string;
    amount: number;
    billing_cycle: string | null;
    monthly_amount: number;
    started_at: string | null;
    expires_at: string | null;
    cancelled_at: string | null;
    is_current: boolean;
}

interface InvoiceRow {
    id: number;
    number: string;
    total: number;
    status: string;
    payment_method: string | null;
    issued_at: string | null;
    paid_at: string | null;
}

interface Props {
    account: Account;
    stats: Stats;
    shops: ShopRow[];
    staff: StaffRow[];
    subscriptions: SubscriptionRow[];
    invoices: InvoiceRow[];
}

const card = 'rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5';

export default function AccountShow({ account, stats, shops, staff, subscriptions, invoices }: Props) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.accountShow;
    const common = t.platformAdmin.common;
    const statuses = t.platformAdmin.statuses;
    const [confirmToggle, setConfirmToggle] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [amountTarget, setAmountTarget] = useState<AmountTarget | null>(null);

    const toggleStatus = () =>
        router.post(route('platform.accounts.toggle', account.id), {}, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                setConfirmToggle(false);
            },
        });

    const toggleDemo = () => router.post(route('platform.accounts.toggle-demo', account.id), {}, { preserveScroll: true });

    const statusVariant = (s: string): 'success' | 'warning' | 'danger' | 'default' =>
        s === 'active' ? 'success' : s === 'trial' || s === 'pending' ? 'warning' : s === 'cancelled' || s === 'expired' ? 'danger' : 'default';

    const statCards: [string, string][] = [
        [tr.stats.shops, fmtNumber(stats.shops, locale)],
        [tr.stats.staff, fmtNumber(stats.staff, locale)],
        [tr.stats.products, fmtNumber(stats.products, locale)],
        [tr.stats.customers, fmtNumber(stats.customers, locale)],
        [tr.stats.sales30, fmtNumber(stats.sales_30d, locale)],
        [tr.stats.revenue30, fmtNumber(stats.revenue_30d, locale)],
        [tr.stats.lastSale, stats.last_sale_at ? fmtDate(stats.last_sale_at, locale) : tr.never],
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Link href={route('platform.accounts')} className="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300">
                            {tr.back}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{account.name}</h1>
                            <TableBadge variant={account.is_active ? 'success' : 'danger'}>
                                {account.is_active ? common.active : t.platformAdmin.accounts.suspended}
                            </TableBadge>
                            {account.is_demo && <TableBadge variant="warning">{t.platformAdmin.accounts.demo}</TableBadge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {account.email} · {common.code} {account.code_user}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={toggleDemo}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                            title={t.platformAdmin.accounts.demoHint}
                        >
                            <FlaskConical className="size-4" /> {account.is_demo ? tr.unmarkDemo : tr.markDemo}
                        </button>
                        <button
                            onClick={() => setConfirmToggle(true)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white ${
                                account.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            <Power className="size-4" /> {account.is_active ? common.suspend : common.reactivate}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={tr.headTitle(account.name)} />

            <div className="space-y-6">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <span>{account.created_at ? tr.since(fmtDate(account.created_at, locale)) : ''}</span>
                    <span>
                        {tr.lastActivity} : {account.last_activity_at ? fmtDate(account.last_activity_at, locale) : tr.never}
                    </span>
                    {account.country && <span>{tr.country} : {account.country}</span>}
                    <span className="inline-flex items-center gap-1">
                        {account.email_verified ? <MailCheck className="size-4 text-emerald-500" /> : <MailWarning className="size-4 text-orange-500" />}
                        {account.email_verified ? tr.emailVerified : tr.emailNotVerified}
                    </span>
                    {account.two_factor_enabled && (
                        <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="size-4 text-emerald-500" /> {tr.twoFactor}
                        </span>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    {statCards.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                        </div>
                    ))}
                </div>

                <section className={card}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{tr.subscriptionsTitle}</h2>
                        <Link
                            href={route('platform.active-subscriptions', { search: account.email })}
                            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300"
                        >
                            {tr.manageSubscriptions} <ExternalLink className="size-3.5" />
                        </Link>
                    </div>
                    <Table
                        data={subscriptions}
                        emptyMessage={tr.noSubscriptions}
                        columns={[
                            {
                                key: 'plan',
                                label: tr.columns.plan,
                                render: (s: SubscriptionRow) => (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-900 dark:text-white">{s.plan ?? common.unknown}</span>
                                        {s.is_current && <TableBadge variant="info">{tr.current}</TableBadge>}
                                    </div>
                                ),
                            },
                            {
                                key: 'amount',
                                label: tr.columns.amount,
                                render: (s: SubscriptionRow) => {
                                    const negotiated =
                                        s.plan_price != null && s.billing_cycle === 'monthly' && Math.round(s.amount) !== Math.round(s.plan_price);
                                    return (
                                        <div>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {fmtXAF(s.amount, locale)} {s.billing_cycle === 'yearly' ? tr.perYearShort : tr.perMonthShort}
                                            </span>
                                            {negotiated && (
                                                <p className="text-xs text-amber-600 dark:text-amber-300">
                                                    {tr.negotiated} · {tr.planPrice(fmtXAF(s.plan_price!, locale))}
                                                </p>
                                            )}
                                        </div>
                                    );
                                },
                            },
                            {
                                key: 'period',
                                label: tr.columns.period,
                                render: (s: SubscriptionRow) => (
                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                        {fmtDate(s.started_at, locale)} → {fmtDate(s.cancelled_at ?? s.expires_at, locale)}
                                    </span>
                                ),
                            },
                            {
                                key: 'status',
                                label: common.status,
                                render: (s: SubscriptionRow) => (
                                    <TableBadge variant={statusVariant(s.status)}>{statuses[s.status] ?? s.status}</TableBadge>
                                ),
                            },
                            {
                                key: 'actions',
                                label: common.actions,
                                align: 'right' as const,
                                render: (s: SubscriptionRow) => (
                                    <TableActions>
                                        <button
                                            onClick={() =>
                                                setAmountTarget({
                                                    id: s.id,
                                                    amount: s.amount,
                                                    billing_cycle: s.billing_cycle,
                                                    plan_name: s.plan,
                                                    plan_price: s.plan_price,
                                                })
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                                        >
                                            <Pencil className="size-3.5" /> {tr.editAmount}
                                        </button>
                                    </TableActions>
                                ),
                            },
                        ]}
                    />
                </section>

                <section className={card}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{tr.invoicesTitle}</h2>
                    <Table
                        data={invoices}
                        emptyMessage={tr.noInvoices}
                        columns={[
                            { key: 'number', label: tr.columns.number, render: (i: InvoiceRow) => <span className="font-mono text-xs">{i.number}</span> },
                            { key: 'date', label: tr.columns.date, render: (i: InvoiceRow) => fmtDate(i.paid_at ?? i.issued_at, locale) },
                            {
                                key: 'total',
                                label: tr.columns.total,
                                render: (i: InvoiceRow) => <span className="font-semibold">{fmtXAF(i.total, locale)}</span>,
                            },
                            { key: 'method', label: tr.columns.method, render: (i: InvoiceRow) => i.payment_method ?? common.unknown },
                            {
                                key: 'status',
                                label: common.status,
                                render: (i: InvoiceRow) => (
                                    <TableBadge variant={i.status === 'paid' ? 'success' : i.status === 'pending' ? 'warning' : 'danger'}>
                                        {tr.invoiceStatus[i.status] ?? i.status}
                                    </TableBadge>
                                ),
                            },
                        ]}
                    />
                </section>

                <section className={card}>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{tr.shopsTitle}</h2>
                    <p className="mb-4 text-xs text-slate-500">{tr.revenueNote}</p>
                    <Table
                        data={shops}
                        emptyMessage={t.platformAdmin.shops.empty}
                        columns={[
                            {
                                key: 'name',
                                label: tr.columns.name,
                                render: (s: ShopRow) => (
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                                        <p className="text-xs text-slate-500">{[s.city, s.country].filter(Boolean).join(', ')}</p>
                                    </div>
                                ),
                            },
                            { key: 'products', label: tr.columns.products, render: (s: ShopRow) => fmtNumber(s.products_count, locale) },
                            { key: 'sales', label: tr.columns.sales30, render: (s: ShopRow) => fmtNumber(s.sales_30d, locale) },
                            {
                                key: 'revenue',
                                label: tr.columns.revenue30,
                                render: (s: ShopRow) => `${fmtNumber(s.revenue_30d, locale)}${s.currency ? ` ${s.currency}` : ''}`,
                            },
                            {
                                key: 'status',
                                label: common.status,
                                render: (s: ShopRow) => (
                                    <TableBadge variant={s.is_active ? 'success' : 'danger'}>
                                        {s.is_active ? common.activeFem : t.platformAdmin.shops.suspended}
                                    </TableBadge>
                                ),
                            },
                            {
                                key: 'actions',
                                label: common.actions,
                                align: 'right' as const,
                                render: (s: ShopRow) => (
                                    <Link
                                        href={route('platform.shops.products', s.id)}
                                        className="inline-flex rounded-lg p-2 text-blue-600 hover:bg-blue-500/10 dark:text-blue-300"
                                        title={t.platformAdmin.shops.viewProducts}
                                    >
                                        <Package className="size-4" />
                                    </Link>
                                ),
                            },
                        ]}
                    />
                </section>

                <section className={card}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{tr.staffTitle}</h2>
                    <Table
                        data={staff}
                        emptyMessage={tr.noStaff}
                        columns={[
                            {
                                key: 'name',
                                label: tr.columns.name,
                                render: (u: StaffRow) => (
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                                        <p className="text-xs text-slate-500">{u.email}</p>
                                    </div>
                                ),
                            },
                            { key: 'role', label: tr.columns.role, render: (u: StaffRow) => u.role },
                            { key: 'shop', label: tr.columns.shop, render: (u: StaffRow) => u.shop ?? common.unknown },
                            {
                                key: 'status',
                                label: common.status,
                                render: (u: StaffRow) => (
                                    <TableBadge variant={u.is_active ? 'success' : 'danger'}>
                                        {u.is_active ? common.active : common.inactive}
                                    </TableBadge>
                                ),
                            },
                        ]}
                    />
                </section>
            </div>

            <SubscriptionAmountModal target={amountTarget} onClose={() => setAmountTarget(null)} />

            <ConfirmDeleteModal
                show={confirmToggle}
                onClose={() => setConfirmToggle(false)}
                onConfirm={toggleStatus}
                title={account.is_active ? t.platformAdmin.accounts.confirmSuspendTitle : t.platformAdmin.accounts.confirmReactivateTitle}
                message={
                    account.is_active
                        ? t.platformAdmin.accounts.confirmSuspend(account.name)
                        : t.platformAdmin.accounts.confirmReactivate(account.name)
                }
                confirmText={account.is_active ? common.suspend : common.reactivate}
                processingText={account.is_active ? common.suspend : common.reactivate}
                tone={account.is_active ? 'danger' : 'success'}
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
