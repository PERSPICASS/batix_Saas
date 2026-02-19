import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Shield, Check } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
}

interface UserPermission {
    id: number;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    shop_id: number | null;
    role: string;
    is_active: boolean;
    permissions: UserPermission[];
}

interface ModulePermission {
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

interface Props {
    user: User;
    shops: Shop[];
}

const MODULES = [
    { key: 'products', label: 'Produits' },
    { key: 'customers', label: 'Clients' },
    { key: 'invoices', label: 'Factures' },
    { key: 'sales', label: 'Ventes' },
    { key: 'stocks', label: 'Stocks' },
    { key: 'inventory', label: 'Inventaires' },
    { key: 'reports', label: 'Rapports' },
];

const ROLES = [
    { value: 'staff', label: 'Personnel' },
    { value: 'cashier', label: 'Caissier' },
    { value: 'manager', label: 'Gestionnaire' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'super_admin', label: 'Super Admin' },
];

export default function UsersEdit({ user, shops }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        shop_id: user.shop_id?.toString() || '',
        role: user.role,
        is_active: user.is_active,
        permissions: user.permissions.map((p) => ({
            module: p.module,
            can_view: p.can_view,
            can_create: p.can_create,
            can_edit: p.can_edit,
            can_delete: p.can_delete,
        })) as ModulePermission[],
    });

    const [selectedModules, setSelectedModules] = useState<string[]>(
        user.permissions.map((p) => p.module)
    );

    const toggleModule = (moduleKey: string) => {
        const isSelected = selectedModules.includes(moduleKey);
        const newSelected = isSelected
            ? selectedModules.filter((m) => m !== moduleKey)
            : [...selectedModules, moduleKey];

        setSelectedModules(newSelected);

        const newPermissions = isSelected
            ? data.permissions.filter((p) => p.module !== moduleKey)
            : [
                  ...data.permissions,
                  {
                      module: moduleKey,
                      can_view: true,
                      can_create: false,
                      can_edit: false,
                      can_delete: false,
                  },
              ];

        setData('permissions', newPermissions);
    };

    const updatePermission = (moduleKey: string, action: keyof Omit<ModulePermission, 'module'>, value: boolean) => {
        const newPermissions = data.permissions.map((p) =>
            p.module === moduleKey ? { ...p, [action]: value } : p
        );
        setData('permissions', newPermissions);
    };

    const getPermission = (moduleKey: string) => {
        return data.permissions.find((p) => p.module === moduleKey);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Modifier utilisateur</h1>}>
            <Head title="Modifier utilisateur" />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    {/* Informations de base */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Informations générales</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    autoFocus
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                                    Adresse email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                            <p className="mb-3 text-sm font-medium text-blue-300">
                                Modifier le mot de passe (optionnel)
                            </p>
                            <p className="mb-4 text-xs text-slate-400">
                                Laissez vide si vous ne souhaitez pas changer le mot de passe
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                        placeholder="Minimum 8 caractères"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password_confirmation"
                                        className="block text-sm font-medium text-slate-200"
                                    >
                                        Confirmer le nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                        placeholder="Confirmer le mot de passe"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-400">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rôle et Boutique */}
                    <div className="space-y-6 border-t border-white/10 pt-6">
                        <h2 className="text-lg font-semibold text-white">Affectation</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shop_id" className="block text-sm font-medium text-slate-200">
                                    Boutique
                                </label>
                                <select
                                    id="shop_id"
                                    value={data.shop_id}
                                    onChange={(e) => setData('shop_id', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="">-- Aucune boutique --</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.shop_id && <p className="mt-1 text-sm text-red-400">{errors.shop_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-200">
                                    Rôle *
                                </label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    {ROLES.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && <p className="mt-1 text-sm text-red-400">{errors.role}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-200">
                                Utilisateur actif
                            </label>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-4 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <Shield className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-white">Permissions des modules</h2>
                        </div>

                        <div className="space-y-3">
                            {MODULES.map((module) => {
                                const isSelected = selectedModules.includes(module.key);
                                const permission = getPermission(module.key);

                                return (
                                    <div key={module.key} className="rounded-lg border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => toggleModule(module.key)}
                                                className="flex items-center gap-3"
                                            >
                                                <div
                                                    className={`flex size-5 items-center justify-center rounded border ${
                                                        isSelected
                                                            ? 'border-amber-300 bg-amber-300'
                                                            : 'border-white/15 bg-slate-900/70'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="size-3 text-slate-950" />}
                                                </div>
                                                <span className="font-medium text-slate-200">{module.label}</span>
                                            </button>

                                            {isSelected && permission && (
                                                <div className="flex items-center gap-4">
                                                    {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map(
                                                        (action) => (
                                                            <label
                                                                key={action}
                                                                className="flex items-center gap-2 text-sm text-slate-300"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permission[action]}
                                                                    onChange={(e) =>
                                                                        updatePermission(
                                                                            module.key,
                                                                            action,
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    className="size-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-slate-950"
                                                                />
                                                                {action === 'can_view' && 'Voir'}
                                                                {action === 'can_create' && 'Créer'}
                                                                {action === 'can_edit' && 'Modifier'}
                                                                {action === 'can_delete' && 'Supprimer'}
                                                            </label>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link
                            href={route('users.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Mise à jour...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
