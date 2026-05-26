import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Mail, Shield, Store } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import SubscriptionBanner, { useSubscriptionLimits } from '@/Components/SubscriptionBanner';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: string;
    is_active: boolean;
    shop: Shop | null;
    created_at: string;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    users: PaginatedUsers;
    canCreateUser: boolean;
    remainingUsers: number;
}

const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_platforme: 'Admin Plateforme',
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    cashier: 'Caissier',
    staff: 'Personnel',
};

const roleColors: Record<string, 'default' | 'success' | 'info' | 'warning' | 'danger'> = {
    super_admin: 'danger',
    admin_platforme: 'danger',
    admin: 'info',
    manager: 'info',
    cashier: 'warning',
    staff: 'success',
};

export default function UsersIndex({ users, canCreateUser, remainingUsers }: Props) {
    const route = useRoute();
    const subscription = useSubscriptionLimits();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            setIsDeleting(true);
            router.delete(route('users.destroy', { user: userToDelete.id }), {
                onFinish: () => {
                    setIsDeleting(false);
                    setShowDeleteDialog(false);
                    setUserToDelete(null);
                },
            });
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nom',
            render: (user: User) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/20 text-sm font-semibold text-amber-300">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (user: User) => (
                <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="size-4" />
                    {user.email}
                </div>
            ),
        },
        {
            key: 'shop',
            label: 'Boutique',
            render: (user: User) => (
                <div className="flex items-center gap-2 text-slate-300">
                    {user.shop ? (
                        <>
                            <Store className="size-4" />
                            {user.shop.name}
                        </>
                    ) : (
                        <span className="text-slate-500">-</span>
                    )}
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Rôle',
            align: 'center' as const,
            render: (user: User) => (
                <TableBadge variant={roleColors[user.role] || 'info'}>
                    <Shield className="size-3" />
                    {roleLabels[user.role] || user.role}
                </TableBadge>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            align: 'center' as const,
            render: (user: User) => (
                <TableBadge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (user: User) => (
                <TableActions>
                    <Link
                        href={route('users.edit', { user: user.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Pencil className="size-3.5" /> Modifier
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDeleteClick(user)}>
                        <Trash2 className="size-3.5" /> Supprimer
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Utilisateurs</h1>}>
            <Head title="Utilisateurs" />

            <section className="space-y-6">
                {/* Bannière d'abonnement */}
                {subscription && <SubscriptionBanner type="users" />}

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-300">
                            Gérez les comptes utilisateurs et leurs permissions
                        </p>
                        {!canCreateUser && remainingUsers === 0 && (
                            <p className="mt-1 text-xs text-amber-400">
                                Limite atteinte. Passez à un plan supérieur pour ajouter des utilisateurs.
                            </p>
                        )}
                        {remainingUsers > 0 && (
                            <p className="mt-1 text-xs text-slate-400">
                                {remainingUsers} utilisateur{remainingUsers > 1 ? 's' : ''} restant{remainingUsers > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <Link
                        href={canCreateUser ? route('users.create') : '#'}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                            canCreateUser
                                ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        onClick={(e) => {
                            if (!canCreateUser) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <Plus className="size-4" /> Nouvel utilisateur
                    </Link>
                </div>

                <Table columns={columns} data={users.data} emptyMessage="Aucun utilisateur trouvé" />

                {users.links && (
                    <div className="flex items-center justify-center gap-1">
                        {users.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
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

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.name}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                type="danger"
                isProcessing={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
