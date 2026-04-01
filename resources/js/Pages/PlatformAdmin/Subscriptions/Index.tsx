import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table, { TableActionButton, TableActions, TableBadge } from '@/Components/Table';
import { Calendar, XCircle, RotateCw, Search, Filter, Edit, CheckCircle } from 'lucide-react';
import Currency from '@/Components/Currency';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

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
    started_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    amount: number;
    billing_cycle: string;
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

export default function Index({ subscriptions, plans, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [showEditDatesModal, setShowEditDatesModal] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [renewMonths, setRenewMonths] = useState(1);
    const [editDates, setEditDates] = useState({
        started_at: '',
        expires_at: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('platform.active-subscriptions'),
            { search: searchTerm, status: filters.status, plan_id: filters.plan_id },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            route('platform.active-subscriptions'),
            { search: filters.search, status: status || undefined, plan_id: filters.plan_id },
            { preserveState: true }
        );
    };

    const handlePlanFilter = (planId: string) => {
        router.get(
            route('platform.active-subscriptions'),
            { search: filters.search, status: filters.status, plan_id: planId || undefined },
            { preserveState: true }
        );
    };

    const confirmCancel = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setShowCancelModal(true);
    };

    const handleCancel = () => {
        if (selectedSubscription) {
            router.post(
                route('platform.active-subscriptions.cancel', selectedSubscription.id),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setShowCancelModal(false);
                        setSelectedSubscription(null);
                    },
                }
            );
        }
    };

    const confirmRenew = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setRenewMonths(1);
        setShowRenewModal(true);
    };

    const handleRenew = () => {
        if (selectedSubscription) {
            router.post(
                route('platform.active-subscriptions.renew', selectedSubscription.id),
                { months: renewMonths },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setShowRenewModal(false);
                        setSelectedSubscription(null);
                    },
                }
            );
        }
    };

    const confirmEditDates = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setEditDates({
            started_at: subscription.started_at.split('T')[0],
            expires_at: subscription.expires_at ? subscription.expires_at.split('T')[0] : '',
        });
        setShowEditDatesModal(true);
    };

    const handleEditDates = () => {
        if (selectedSubscription) {
            router.post(
                route('platform.active-subscriptions.update-dates', selectedSubscription.id),
                editDates,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setShowEditDatesModal(false);
                        setSelectedSubscription(null);
                    },
                }
            );
        }
    };

    const confirmActivate = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setShowActivateModal(true);
    };

    const handleActivate = () => {
        if (selectedSubscription) {
            router.post(
                route('platform.active-subscriptions.activate', selectedSubscription.id),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setShowActivateModal(false);
                        setSelectedSubscription(null);
                    },
                }
            );
        }
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

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            active: 'Actif',
            trial: 'Essai',
            pending: 'En attente',
            cancelled: 'Annulé',
            expired: 'Expiré',
        };
        return labels[status] || status;
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-semibold text-white">Abonnements Actifs</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Gérer tous les abonnements des comptes
                    </p>
                </div>
            }
        >
            <Head title="Abonnements Actifs" />

            <section className="space-y-4">
                {/* Filtres */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher par nom ou email..."
                                className="pl-10 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                            />
                        </div>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="trial">Essai</option>
                            <option value="pending">En attente</option>
                            <option value="cancelled">Annulé</option>
                            <option value="expired">Expiré</option>
                        </select>
                        <select
                            value={filters.plan_id || ''}
                            onChange={(e) => handlePlanFilter(e.target.value)}
                            className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                        >
                            <option value="">Tous les plans</option>
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
                            Rechercher
                        </button>
                    </form>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">
                        {subscriptions.total} abonnement{subscriptions.total > 1 ? 's' : ''}
                    </p>
                </div>

                <Table
                    data={subscriptions.data}
                    columns={[
                        {
                            key: 'user',
                            label: 'Compte',
                            render: (subscription) => (
                                <div className="flex flex-col">
                                    <span className="font-medium text-white">{subscription.user.name}</span>
                                    <span className="text-xs text-slate-400">{subscription.user.email}</span>
                                    <span className="text-xs text-slate-500">Code: {subscription.user.code_user}</span>
                                </div>
                            ),
                        },
                        {
                            key: 'plan',
                            label: 'Plan',
                            render: (subscription) => (
                                <span className="text-slate-300">{subscription.plan.name}</span>
                            ),
                        },
                        {
                            key: 'amount',
                            label: 'Montant',
                            align: 'right',
                            render: (subscription) => (
                                <div className="flex flex-col items-end">
                                    <Currency amount={subscription.amount} className="font-semibold text-emerald-400" />
                                    <span className="text-xs text-slate-400">{subscription.billing_cycle}</span>
                                </div>
                            ),
                        },
                        {
                            key: 'dates',
                            label: 'Dates',
                            render: (subscription) => (
                                <div className="flex flex-col text-xs">
                                    <span className="text-slate-300">
                                        Début: {formatDate(subscription.started_at)}
                                    </span>
                                    {subscription.expires_at && (
                                        <span className="text-slate-400">
                                            Expire: {formatDate(subscription.expires_at)}
                                        </span>
                                    )}
                                    {subscription.cancelled_at && (
                                        <span className="text-red-400">
                                            Annulé: {formatDate(subscription.cancelled_at)}
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'status',
                            label: 'Statut',
                            align: 'center',
                            render: (subscription) => (
                                <TableBadge variant={getStatusVariant(subscription.status)}>
                                    {getStatusLabel(subscription.status)}
                                </TableBadge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            align: 'right',
                            render: (subscription) => (
                                <TableActions>
                                    <button
                                        onClick={() => confirmEditDates(subscription)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                                    >
                                        <Edit className="size-3.5" /> Dates
                                    </button>
                                    {subscription.status === 'pending' && (
                                        <TableActionButton
                                            variant="success"
                                            onClick={() => confirmActivate(subscription)}
                                        >
                                            <CheckCircle className="size-3.5" /> Activer
                                        </TableActionButton>
                                    )}
                                    {subscription.status === 'active' && (
                                        <>
                                            <button
                                                onClick={() => confirmRenew(subscription)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                                            >
                                                <RotateCw className="size-3.5" /> Renouveler
                                            </button>
                                            <TableActionButton
                                                variant="danger"
                                                onClick={() => confirmCancel(subscription)}
                                            >
                                                <XCircle className="size-3.5" /> Annuler
                                            </TableActionButton>
                                        </>
                                    )}
                                    {subscription.status === 'expired' && (
                                        <button
                                            onClick={() => confirmRenew(subscription)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                                        >
                                            <RotateCw className="size-3.5" /> Réactiver
                                        </button>
                                    )}
                                </TableActions>
                            ),
                        },
                    ]}
                    emptyMessage="Aucun abonnement trouvé"
                />

                {/* Pagination */}
                {subscriptions.links && (
                    <div className="flex items-center justify-center gap-1">
                        {subscriptions.links.map((link: any, index: number) => (
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

            {/* Modal Annulation */}
            <ConfirmDeleteModal
                show={showCancelModal}
                title="Annuler l'abonnement"
                message={`Êtes-vous sûr de vouloir annuler l'abonnement de "${selectedSubscription?.user.name}" au plan "${selectedSubscription?.plan.name}" ?`}
                onConfirm={handleCancel}
                onClose={() => {
                    setShowCancelModal(false);
                    setSelectedSubscription(null);
                }}
            />

            {/* Modal Activation */}
            <ConfirmDeleteModal
                show={showActivateModal}
                title="Activer l'abonnement"
                message={`Confirmer l'activation de l'abonnement de "${selectedSubscription?.user.name}" au plan "${selectedSubscription?.plan.name}" ?`}
                onConfirm={handleActivate}
                onClose={() => {
                    setShowActivateModal(false);
                    setSelectedSubscription(null);
                }}
            />

            {/* Modal Renouvellement */}
            {showRenewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Renouveler l'abonnement
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Compte: {selectedSubscription?.user.name}
                            <br />
                            Plan: {selectedSubscription?.plan.name}
                        </p>
                        <label className="block space-y-1 text-sm text-slate-200 mb-4">
                            <span>Nombre de mois</span>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={renewMonths}
                                onChange={(e) => setRenewMonths(parseInt(e.target.value))}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRenewModal(false);
                                    setSelectedSubscription(null);
                                }}
                                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRenew}
                                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                Renouveler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modifier les dates */}
            {showEditDatesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Modifier les dates d'abonnement
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Compte: {selectedSubscription?.user.name}
                            <br />
                            Plan: {selectedSubscription?.plan.name}
                        </p>
                        <div className="space-y-4 mb-4">
                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>Date de début</span>
                                <input
                                    type="date"
                                    value={editDates.started_at}
                                    onChange={(e) => setEditDates({ ...editDates, started_at: e.target.value })}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                />
                            </label>
                            <label className="block space-y-1 text-sm text-slate-200">
                                <span>Date d'expiration</span>
                                <input
                                    type="date"
                                    value={editDates.expires_at}
                                    onChange={(e) => setEditDates({ ...editDates, expires_at: e.target.value })}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200"
                                />
                                <p className="text-xs text-slate-400">Laisser vide pour aucune expiration</p>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowEditDatesModal(false);
                                    setSelectedSubscription(null);
                                }}
                                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleEditDates}
                                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
