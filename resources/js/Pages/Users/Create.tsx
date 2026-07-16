import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

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
    currentUserRole: string;
    modules: Record<string, string>;
}

const ROLE_KEYS = ['staff', 'cashier', 'manager', 'admin', 'super_admin', 'admin_platforme'];

export default function UsersCreate({ shops, currentUserRole, modules }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const isSuperAdmin = currentUserRole === 'super_admin';

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
            : [...data.permissions, { module: moduleKey, can_view: true, can_create: false, can_edit: false, can_delete: false }];
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

    const moduleLabels = t.users.modules as Record<string, string>;
    const roleLabels = t.users.roles as Record<string, string>;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.users.form.newTitle}</h1>}>
            <Head title={t.users.form.newTitle} />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.common.form.generalInfo}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.common.form.fullName}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.common.form.emailRequired}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.common.form.password}
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                    placeholder={t.common.form.passwordMin}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.common.form.passwordConfirm}
                                </label>
                                <input
                                    type="password"
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-sm text-red-400">{errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-gray-200 dark:border-white/10 pt-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.common.form.assignment}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shop_id" className={`block text-sm font-medium ${isSuperAdmin ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {t.common.misc.shop}
                                </label>
                                <select
                                    id="shop_id"
                                    value={data.shop_id}
                                    onChange={(e) => setData('shop_id', e.target.value)}
                                    disabled={!isSuperAdmin}
                                    className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
                                        isSuperAdmin
                                            ? 'border-white/15 bg-slate-900/70 text-slate-200 focus:border-amber-300 focus:ring-amber-300'
                                            : 'border-slate-600 bg-slate-800/50 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    {/* Seul un super admin possède ses boutiques au lieu d'y appartenir :
                                        pour tout autre rôle, une boutique est obligatoire, sans quoi
                                        l'utilisateur n'est rattaché à aucun compte. */}
                                    <option value="">
                                        {data.role === 'super_admin' ? t.common.form.noShop : t.common.form.selectShop}
                                    </option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                                {!isSuperAdmin && <p className="mt-1 text-xs text-slate-500">{t.common.form.shopAssignHint}</p>}
                                <InputError message={errors.shop_id} />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t.common.form.role}
                                </label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                                >
                                    {ROLE_KEYS.map((key) => (
                                        <option key={key} value={key}>{roleLabels[key] || key}</option>
                                    ))}
                                </select>
                                <InputError message={errors.role} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-gray-300 bg-white text-amber-300 focus:ring-amber-300 focus:ring-offset-white dark:border-white/15 dark:bg-slate-900/70 dark:focus:ring-offset-slate-950"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t.common.form.activeUser}
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <Shield className="size-5 text-amber-300" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.common.form.modulePermissions}</h2>
                        </div>

                        <div className="space-y-3">
                            {Object.keys(modules).map((key) => {
                                const isSelected = selectedModules.includes(key);
                                const permission = getPermission(key);

                                return (
                                    <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => toggleModule(key)}
                                                className="flex items-center gap-3"
                                            >
                                                <div className={`flex size-5 items-center justify-center rounded border ${
                                                    isSelected ? 'border-amber-300 bg-amber-300' : 'border-white/15 bg-slate-900/70'
                                                }`}>
                                                    {isSelected && <Check className="size-3 text-slate-950" />}
                                                </div>
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{moduleLabels[key] || modules[key]}</span>
                                            </button>

                                            {isSelected && permission && (
                                                <div className="flex items-center gap-4">
                                                    {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((action) => (
                                                        <label key={action} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            <input
                                                                type="checkbox"
                                                                checked={permission[action]}
                                                                onChange={(e) => updatePermission(key, action, e.target.checked)}
                                                                className="size-4 rounded border-gray-300 bg-white text-amber-300 focus:ring-amber-300 focus:ring-offset-white dark:border-white/15 dark:bg-slate-900/70 dark:focus:ring-offset-slate-950"
                                                            />
                                                            {t.users.permActions[action]}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10 pt-4">
                        <Link
                            href={route('users.index')}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                            {t.common.form.cancel}
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? t.common.form.creating : t.common.form.createUser}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
