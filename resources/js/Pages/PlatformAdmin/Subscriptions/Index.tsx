import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { XCircle, RotateCw, Search, Edit, CheckCircle } from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import PaginationLinks from '@/Components/PaginationLinks';
import { useLocale } from '@/contexts/LocaleContext';
import { fmtDate, fmtXAF, toDateInput } from '@/utils/platformFormat';

interface Plan {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    code_user: string;
}

interface Subscription {
    id: number;
    status: string;
    // null tant qu'une demande de paiement manuel n'est pas activée
    started_at: string | null;
    expires_at: string | null;
    cancelled_at: string | null;
    amount: number | string;
    billing_cycle: string | null;
    plan: Plan;
    user: User;
}

interface PaginatedSubscriptions {
    data: Subscription[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    subscriptions: PaginatedSubscriptions;
    plans: Plan[];
    filters: {
        search?: string;
        status?: string;
        plan_id?: string;
    };
}

type Dialog = 'cancel' | 'activate' | 'renew' | 'dates' | null;

const STATUSES = ['active', 'trial', 'pending', 'cancelled', 'expired'];

export default function Index({ subscriptions, plans, filters }: Props) {
    const { t, locale } = useLocale();
    const tr = t.platformAdmin.subscriptions;
    const common = t.platformAdmin.common;
    const statusLabel = (s: string) => t.platformAdmin.statuses[s] ?? s;

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [dialog, setDialog] = useState<Dialog>(null);
    const [selected, setSelected] = useState<Subscription | null>(null);
    const [renewMonths, setRenewMonths] = useState('1');
    const [editDates, setEditDates] = useState({ started_at: '', expires_at: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const applyFilters = (next: Partial<Props['filters']>) => {
        router.get(
            route('platform.active-subscriptions'),
            {
                search: filters.search,
                status: filters.status,
                plan_id: filters.plan_id,
                ...next,
            },
            { preserveState: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm || undefined });
    };

    const open = (kind: Dialog, subscription: Subscription) => {
        setSelected(subscription);
        setErrors({});
        if (kind === 'renew') setRenewMonths('1');
        if (kind === 'dates') {
            setEditDates({
                started_at: toDateInput(subscription.started_at) || new Date().toISOString().slice(0, 10),
                expires_at: toDateInput(subscription.expires_at),
            });
        }
        setDialog(kind);
    };

    const close = () => {
        setDialog(null);
        setSelected(null);
        setErrors({});
    };

    const submit = (routeName: string, data: Record<string, unknown> = {}) => {
        if (!selected) return;
        router.post(route(routeName, selected.id), data as any, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: close,
            onError: (errs) => setErrors(errs as Record<string, string>),
        });
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
        switch (status) {
            case 'active':
                return 'success';
            case 'trial':
            case 'pending':
                return 'warning';
            case 'cancelled':
            case 'expired':
                return 'danger';
            default:
                return 'default';
        }
    };

    const selectClass =
        'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200';
    const inputClass =
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white';
    const outlineButton =
        'inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10';

    const selectedSummary = selected && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {tr.accountLabel} : {selected.user.name}
            <br />
            {tr.planLabel} : {selected.plan.name}
        </p>
    );

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{tr.title}</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tr.subtitle}</p>
                </div>
            }
        >
            <Head title={tr.title} />

            <section className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={tr.searchPlaceholder}
                                className={`${selectClass} w-full pl-10`}
                            />
                        </div>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => applyFilters({ status: e.target.value || undefined })}
                            className={selectClass}
                        >
                            <option value="">{tr.allStatuses}</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{statusLabel(s)}</option>
                            ))}
                        </select>
                        <select
                            value={filters.plan_id || ''}
                            onChange={(e) => applyFilters({ plan_id: e.target.value || undefined })}
                            className={selectClass}
                        >
                            <option value="">{tr.allPlans}</option>
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            {common.search}
                        </button>
                    </form>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">{tr.count(subscriptions.total)}</p>

                <Table
                    data={subscriptions.data}
                    columns={[
                        {
                            key: 'user',
                            label: tr.columns.account,
                            render: (subscription) => (
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900 dark:text-white">{subscription.user.name}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{subscription.user.email}</span>
                                    <span className="text-xs text-slate-500">{common.code}: {subscription.user.code_user}</span>
                                </div>
                            ),
                        },
                        {
                            key: 'plan',
                            label: tr.columns.plan,
                            render: (subscription) => (
                                <span className="text-slate-600 dark:text-slate-300">{subscription.plan.name}</span>
                            ),
                        },
                        {
                            key: 'amount',
                            label: tr.columns.amount,
                            align: 'right',
                            render: (subscription) => (
                                <div className="flex flex-col items-end">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {fmtXAF(subscription.amount, locale)}
                                    </span>
                                    {subscription.billing_cycle && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {t.platformAdmin.cycles[subscription.billing_cycle] ?? subscription.billing_cycle}
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'dates',
                            label: tr.columns.dates,
                            render: (subscription) => (
                                <div className="flex flex-col text-xs">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        {tr.start} : {subscription.started_at ? fmtDate(subscription.started_at, locale) : tr.notStarted}
                                    </span>
                                    {subscription.expires_at && (
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {tr.expires} : {fmtDate(subscription.expires_at, locale)}
                                        </span>
                                    )}
                                    {subscription.cancelled_at && (
                                        <span className="text-red-500 dark:text-red-400">
                                            {tr.cancelledOn} : {fmtDate(subscription.cancelled_at, locale)}
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'status',
                            label: common.status,
                            align: 'center',
                            render: (subscription) => (
                                <TableBadge variant={getStatusVariant(subscription.status)}>
                                    {statusLabel(subscription.status)}
                                </TableBadge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: common.actions,
                            align: 'right',
                            render: (subscription) => (
                                <TableActions>
                                    <button onClick={() => open('dates', subscription)} className={outlineButton}>
                                        <Edit className="size-3.5" /> {tr.dates}
                                    </button>
                                    {subscription.status === 'pending' && (
                                        <TableActionButton variant="success" onClick={() => open('activate', subscription)}>
                                            <CheckCircle className="size-3.5" /> {tr.activate}
                                        </TableActionButton>
                                    )}
                                    {subscription.status === 'active' && (
                                        <>
                                            <button onClick={() => open('renew', subscription)} className={outlineButton}>
                                                <RotateCw className="size-3.5" /> {tr.renew}
                                            </button>
                                            <TableActionButton variant="danger" onClick={() => open('cancel', subscription)}>
                                                <XCircle className="size-3.5" /> {tr.cancelAction}
                                            </TableActionButton>
                                        </>
                                    )}
                                    {subscription.status === 'expired' && (
                                        <button onClick={() => open('renew', subscription)} className={outlineButton}>
                                            <RotateCw className="size-3.5" /> {tr.reactivate}
                                        </button>
                                    )}
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage={tr.empty}
                />

                <PaginationLinks links={subscriptions.links} />
            </section>

            <ConfirmDeleteModal
                show={dialog === 'cancel'}
                title={tr.cancelTitle}
                message={selected ? tr.cancelMessage(selected.user.name, selected.plan.name) : ''}
                confirmText={tr.cancelConfirm}
                processingText={tr.cancelConfirm}
                processing={processing}
                onConfirm={() => submit('platform.active-subscriptions.cancel')}
                onClose={close}
            />

            <ConfirmDeleteModal
                show={dialog === 'activate'}
                title={tr.activateTitle}
                message={selected ? tr.activateMessage(selected.user.name, selected.plan.name) : ''}
                confirmText={tr.activate}
                processingText={tr.activate}
                processing={processing}
                tone="success"
                onConfirm={() => submit('platform.active-subscriptions.activate')}
                onClose={close}
            />

            <Modal show={dialog === 'renew'} onClose={close} maxWidth="md">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr.renewTitle}</h3>
                    {selectedSummary}
                    <label className="mb-1 block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{tr.months}</span>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            value={renewMonths}
                            onChange={(e) => setRenewMonths(e.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <InputError message={errors.months} className="mb-2" />
                    <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{tr.renewHint}</p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={close}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            {common.cancel}
                        </button>
                        <button
                            onClick={() => submit('platform.active-subscriptions.renew', { months: renewMonths })}
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                        >
                            {tr.renew}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={dialog === 'dates'} onClose={close} maxWidth="md">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{tr.editDatesTitle}</h3>
                    {selectedSummary}
                    <div className="mb-4 space-y-4">
                        <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            <span>{tr.startDate}</span>
                            <input
                                type="date"
                                value={editDates.started_at}
                                onChange={(e) => setEditDates({ ...editDates, started_at: e.target.value })}
                                className={inputClass}
                            />
                            <InputError message={errors.started_at} />
                        </label>
                        <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            <span>{tr.expiryDate}</span>
                            <input
                                type="date"
                                value={editDates.expires_at}
                                onChange={(e) => setEditDates({ ...editDates, expires_at: e.target.value })}
                                className={inputClass}
                            />
                            <InputError message={errors.expires_at} />
                            <p className="text-xs text-slate-500 dark:text-slate-400">{tr.noExpiryHint}</p>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={close}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            {common.cancel}
                        </button>
                        <button
                            onClick={() =>
                                submit('platform.active-subscriptions.update-dates', {
                                    started_at: editDates.started_at,
                                    expires_at: editDates.expires_at || null,
                                })
                            }
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                        >
                            {common.save}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
