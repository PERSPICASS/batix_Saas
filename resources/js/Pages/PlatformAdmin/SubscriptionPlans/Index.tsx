import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Currency from '@/Components/Currency';

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

    const togglePlanStatus = (plan: SubscriptionPlan) => {
        router.post(route('platform.subscriptions.toggle', plan.id), {}, {
            preserveScroll: true,
        });
    };

    const confirmDelete = (plan: SubscriptionPlan) => {
        if (plan.subscriptions_count > 0) {
            alert('Impossible de supprimer un plan avec des abonnements actifs.');
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
                        <h1 className="text-xl font-semibold text-white">Plans d'Abonnement</h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Gérer les plans et leurs fonctionnalités
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Plans d'Abonnement" />

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">
                        {plans.total} plan{plans.total > 1 ? 's' : ''}
                    </p>
                    <Link
                        href={route('platform.subscriptions.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouveau plan
                    </Link>
                </div>

                <Table
                    data={plans.data}
                    columns={[
                        {
                            key: 'name',
                            label: 'Plan',
                            render: (plan) => (
                                <div className="flex flex-col">
                                    <span className="font-medium text-white">{plan.name}</span>
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
                            label: 'Prix',
                            align: 'right',
                            render: (plan) => (
                                <Currency amount={plan.price} className="font-semibold text-emerald-400" />
                            ),
                        },
                        {
                            key: 'limits',
                            label: 'Limites',
                            render: (plan) => (
                                <div className="flex flex-col text-sm">
                                    <span className="text-slate-300">{plan.shop_limit_text}</span>
                                    <span className="text-xs text-slate-400">
                                        {plan.max_users === -1 ? 'Utilisateurs illimités' : `${plan.max_users} utilisateurs`}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            key: 'subscriptions_count',
                            label: 'Abonnements',
                            align: 'center',
                            render: (plan) => (
                                <span className="text-slate-300">{plan.subscriptions_count}</span>
                            ),
                        },
                        {
                            key: 'is_active',
                            label: 'Statut',
                            align: 'center',
                            render: (plan) => (
                                <button
                                    onClick={() => togglePlanStatus(plan)}
                                    className="inline-block"
                                >
                                    <TableBadge variant={plan.is_active ? 'success' : 'danger'}>
                                        {plan.is_active ? 'Actif' : 'Inactif'}
                                    </TableBadge>
                                </button>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            align: 'right',
                            render: (plan) => (
                                <TableActions>
                                    <Link
                                        href={route('platform.subscriptions.edit', plan.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                                    >
                                        <Pencil className="size-3.5" /> Modifier
                                    </Link>
                                    <TableActionButton
                                        variant="danger"
                                        onClick={() => confirmDelete(plan)}
                                    >
                                        <Trash2 className="size-3.5" /> Supprimer
                                    </TableActionButton>
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage="Aucun plan d'abonnement trouvé"
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
                title="Supprimer le plan"
                message={`Êtes-vous sûr de vouloir supprimer le plan "${planToDelete?.name}" ? Cette action est irréversible.`}
                onConfirm={handleDelete}
                onClose={() => {
                    setShowDeleteModal(false);
                    setPlanToDelete(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
