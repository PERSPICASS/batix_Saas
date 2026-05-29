import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Mail, Shield, Store } from 'lucide-react';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { useState } from 'react';
import { useRoute } from '@/utils/route';
import SubscriptionBanner, { useSubscriptionLimits } from '@/Components/SubscriptionBanner';
import { useLocale } from '@/contexts/LocaleContext';

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
    const { t } = useLocale();
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
            label: t.users.columns.name,
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
            label: t.users.columns.email,
            render: (user: User) => (
                <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="size-4" />
                    {user.email}
                </div>
            ),
        },
        {
            key: 'shop',
            label: t.users.columns.shop,
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
            label: t.users.columns.role,
            align: 'center' as const,
            render: (user: User) => (
                <TableBadge variant={roleColors[user.role] || 'info'}>
                    <Shield className="size-3" />
                    {(t.users.roles as Record<string, string>)[user.role] || user.role}
                </TableBadge>
            ),
        },
        {
            key: 'status',
            label: t.users.columns.status,
            align: 'center' as const,
            render: (user: User) => (
                <TableBadge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? t.common.status.active : t.common.status.inactive}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: t.users.columns.actions,
            align: 'right' as const,
            render: (user: User) => (
                <TableActions>
                    <Link
                        href={route('users.edit', { user: user.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                        <Pencil className="size-3.5" /> {t.users.actions.edit}
                    </Link>
                    <TableActionButton variant="danger" onClick={() => handleDeleteClick(user)}>
                        <Trash2 className="size-3.5" /> {t.users.actions.delete}
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.users.title}</h1>}>
            <Head title={t.users.title} />

            <section className="space-y-6">
                {subscription && <SubscriptionBanner type="users" />}

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-300">{t.users.subtitle}</p>
                        {!canCreateUser && remainingUsers === 0 && (
                            <p className="mt-1 text-xs text-amber-400">{t.users.limitReached}</p>
                        )}
                        {remainingUsers > 0 && (
                            <p className="mt-1 text-xs text-slate-400">{t.users.remaining(remainingUsers)}</p>
                        )}
                    </div>
                    <Link
                        href={canCreateUser ? route('users.create') : '#'}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                            canCreateUser
                                ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        onClick={(e) => { if (!canCreateUser) e.preventDefault(); }}
                    >
                        <Plus className="size-4" /> {t.users.actions.new}
                    </Link>
                </div>

                <Table columns={columns} data={users.data} emptyMessage={t.users.emptyMessage} />

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
                title={t.users.deleteTitle}
                message={t.users.deleteMessage(userToDelete?.name ?? '')}
                type="danger"
                isProcessing={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
