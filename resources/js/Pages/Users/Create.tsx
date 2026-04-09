import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { useRoute } from '@/utils/route';

interface Shop {
    id: number;
    name: string;
}

interface ModulePermission {
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

interface Props {
    shops: Shop[];
}

const MODULES = [
    { key: 'shops', label: 'Boutiques' },
    { key: 'products', label: 'Produits' },
    { key: 'categories', label: 'Catégories & Sous-catégories' },
    { key: 'stocks', label: 'Stocks' },
    { key: 'inventory', label: 'Inventaires' },
    { key: 'sales', label: 'Ventes' },
    { key: 'purchases', label: 'Achats' },
    { key: 'expenses', label: 'Dépenses' },
    { key: 'suppliers', label: 'Fournisseurs' },
    { key: 'customers', label: 'Clients' },
    { key: 'invoices', label: 'Factures' },
    { key: 'users', label: 'Utilisateurs' },
    { key: 'reports', label: 'Rapports' },
];

const ROLES = [
    { value: 'staff', label: 'Personnel' },
    { value: 'cashier', label: 'Caissier' },
    { value: 'manager', label: 'Gestionnaire' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin_platforme', label: 'Admin Plateforme' },
];

export default function UsersCreate({ shops }: Props) {
    const route = useRoute();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        shop_id: '',
        role: 'staff',
        is_active: true,
        permissions: [] as ModulePermission[],
    });

    const [selectedModules, setSelectedModules] = useState<string[]>([]);

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
        post(route('users.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouvel utilisateur</h1>}>
            <Head title="Nouvel utilisateur" />

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
                                    placeholder="Ex: Ahmed Benali"
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
                                    placeholder="exemple@email.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                                    Mot de passe *
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
                                    Confirmer le mot de passe *
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
                                    <div
                                        key={module.key}
                                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                                    >
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
                            {processing ? 'Création...' : "Créer l'utilisateur"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
