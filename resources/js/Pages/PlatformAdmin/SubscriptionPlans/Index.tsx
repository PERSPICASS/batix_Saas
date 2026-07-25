import React, { useState } from 'react';
import { showToast } from '@/utils/toast';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Currency from '@/Components/Currency';
import { useLocale } from '@/contexts/LocaleContext';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    max_shops: number;
    max_users: number;
    features: string[] | null;
    is_active: boolean;
    subscriptions_count: number;
    formatted_price: string;
    shop_limit_text: string;
    created_at: string;
}

interface PaginatedPlans {
    data: SubscriptionPlan[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    plans: PaginatedPlans;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ plans }: Props) {
    const { t } = useLocale();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

    const togglePlanStatus = (plan: SubscriptionPlan) => {
        router.post(route('platform.subscriptions.toggle', plan.id), {}, {
            preserveScroll: true,
        });
    };

    const confirmDelete = (plan: SubscriptionPlan) => {
        if (plan.subscriptions_count > 0) {
            showToast('warning', t.platformSubscriptionPlans.index.cannotDeleteWithSubscriptions);
            return;
        }
        setPlanToDelete(plan);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (planToDelete) {
            router.delete(route('platform.subscriptions.destroy', planToDelete.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setPlanToDelete(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.platformSubscriptionPlans.index.title}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {t.platformSubscriptionPlans.index.subtitle}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={t.platformSubscriptionPlans.index.title} />

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t.platformSubscriptionPlans.index.planCount(plans.total)}
                    </p>
                    <Link
                        href={route('platform.subscriptions.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> {t.platformSubscriptionPlans.index.newPlan}
                    </Link>
                </div>

                <Table
                    data={plans.data}
                    columns={[
                        {
                            key: 'name',
                            label: t.platformSubscriptionPlans.index.columns.plan,
                            render: (plan) => (
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900 dark:text-white">{plan.name}</span>
                                    {plan.description && (
                                        <span className="text-xs text-slate-400 mt-0.5">
                                            {plan.description}
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'price',
                            label: t.platformSubscriptionPlans.index.columns.price,
                            align: 'right',
                            render: (plan) => (
                                <Currency amount={plan.price} className="font-semibold text-emerald-400" />
                            ),
                        },
                        {
                            key: 'limits',
                            label: t.platformSubscriptionPlans.index.columns.limits,
                            render: (plan) => (
                                <div className="flex flex-col text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">{plan.shop_limit_text}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {plan.max_users === -1 ? t.platformSubscriptionPlans.index.unlimitedUsers : t.platformSubscriptionPlans.index.usersCount(plan.max_users)}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            key: 'subscriptions_count',
                            label: t.platformSubscriptionPlans.index.columns.subscriptions,
                            align: 'center',
                            render: (plan) => (
                                <span className="text-slate-600 dark:text-slate-300">{plan.subscriptions_count}</span>
                            ),
                        },
                        {
                            key: 'is_active',
                            label: t.platformSubscriptionPlans.index.columns.status,
                            align: 'center',
                            render: (plan) => (
                                <button
                                    onClick={() => togglePlanStatus(plan)}
                                    className="inline-block"
                                >
                                    <TableBadge variant={plan.is_active ? 'success' : 'danger'}>
                                        {plan.is_active ? t.platformSubscriptionPlans.index.active : t.platformSubscriptionPlans.index.inactive}
                                    </TableBadge>
                                </button>
                            ),
                        },
                        {
                            key: 'actions',
                            label: t.platformSubscriptionPlans.index.columns.actions,
                            align: 'right',
                            render: (plan) => (
                                <TableActions>
                                    <Link
                                        href={route('platform.subscriptions.edit', plan.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                                    >
                                        <Pencil className="size-3.5" /> {t.platformSubscriptionPlans.index.edit}
                                    </Link>
                                    <TableActionButton
                                        variant="danger"
                                        onClick={() => confirmDelete(plan)}
                                    >
                                        <Trash2 className="size-3.5" /> {t.platformSubscriptionPlans.index.delete}
                                    </TableActionButton>
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage={t.platformSubscriptionPlans.index.emptyMessage}
                />

                {/* Pagination */}
                {plans.links && (
                    <div className="flex items-center justify-center gap-1">
                        {plans.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                preserveState
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-amber-300 text-slate-950 font-semibold'
                                        : 'border border-white/15 text-slate-200 hover:bg-white/10'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </section>

            <ConfirmDeleteModal
                show={showDeleteModal}
                title={t.platformSubscriptionPlans.index.deleteTitle}
                message={t.platformSubscriptionPlans.index.deleteMessage(planToDelete?.name)}
                onConfirm={handleDelete}
                onClose={() => {
                    setShowDeleteModal(false);
                    setPlanToDelete(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
