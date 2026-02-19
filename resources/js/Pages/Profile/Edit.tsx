import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { User, Shield, Store, CheckCircle, XCircle } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

interface Permission {
    id: number;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

interface Shop {
    id: number;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
}

interface UserWithDetails {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    shop?: Shop;
    permissions?: Permission[];
}

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const { auth } = usePage().props;
    const user = auth.user as UserWithDetails;

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            super_admin: 'bg-purple-100 text-purple-800',
            admin: 'bg-blue-100 text-blue-800',
            manager: 'bg-green-100 text-green-800',
            cashier: 'bg-yellow-100 text-yellow-800',
            staff: 'bg-gray-100 text-gray-800',
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getRoleLabel = (role: string) => {
        const labels = {
            super_admin: 'Super Administrateur',
            admin: 'Administrateur',
            manager: 'Gérant',
            cashier: 'Caissier',
            staff: 'Personnel',
        };
        return labels[role as keyof typeof labels] || role;
    };

    const getModuleLabel = (module: string) => {
        const labels = {
            products: 'Produits',
            customers: 'Clients',
            invoices: 'Factures',
            sales: 'Ventes',
            stocks: 'Stocks',
            inventory: 'Inventaires',
            reports: 'Rapports',
        };
        return labels[module as keyof typeof labels] || module;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
                    Mon Profil
                </h2>
            }
        >
            <Head title="Profil" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* User Overview Card */}
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 shadow-lg overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0">
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                        <User className="h-12 w-12 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                                        {user.is_active ? (
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-500" />
                                        )}
                                    </div>
                                    <p className="text-slate-300 mb-4">{user.email}</p>
                                    
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                                            <Shield className="h-5 w-5 text-amber-300" />
                                            <span className="text-sm font-medium text-slate-200">Rôle:</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </div>
                                        
                                        {user.shop && (
                                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                                                <Store className="h-5 w-5 text-amber-300" />
                                                <span className="text-sm font-medium text-slate-200">Boutique:</span>
                                                <span className="text-sm text-white font-semibold">{user.shop.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {user.shop && (user.shop.address || user.shop.city || user.shop.phone) && (
                                        <div className="mt-4 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                                            <p className="text-sm text-slate-300">
                                                {user.shop.address && <span>{user.shop.address}</span>}
                                                {user.shop.city && <span className="ml-2">{user.shop.city}</span>}
                                                {user.shop.phone && <span className="ml-4">📞 {user.shop.phone}</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Card */}
                    {user.permissions && user.permissions.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-lg overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-amber-300" />
                                    Mes Permissions
                                </h3>
                                <p className="mt-1 text-sm text-slate-300">
                                    Modules et actions auxquels vous avez accès
                                </p>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.permissions.map((permission) => (
                                        <div
                                            key={permission.id}
                                            className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-amber-300/50 transition-colors"
                                        >
                                            <h4 className="font-semibold text-white mb-3">
                                                {getModuleLabel(permission.module)}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {permission.can_view && (
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        Voir
                                                    </span>
                                                )}
                                                {permission.can_create && (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        Créer
                                                    </span>
                                                )}
                                                {permission.can_edit && (
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                        Modifier
                                                    </span>
                                                )}
                                                {permission.can_delete && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                        Supprimer
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Information Form */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-lg">
                        <div className="p-8">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>
                    </div>

                    {/* Password Form */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-lg">
                        <div className="p-8">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>

                    {/* Delete Account Form */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-lg">
                        <div className="p-8">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
