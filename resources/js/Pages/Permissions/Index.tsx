import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Lock, Shield, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

interface Module {
    [key: string]: string;
}

interface Permission {
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
    role: string;
}

interface Props {
    users: User[];
    selectedUser: User | null;
    modules: Module;
    permissions: { [key: string]: Permission };
}

export default function Index({ users, selectedUser, modules, permissions }: Props) {
    const { t } = useLocale();
    const [permissionsState, setPermissionsState] = useState<{ [key: string]: Permission }>(permissions);

    const handlePermissionChange = (module: string, action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete', value: boolean) => {
        setPermissionsState(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: value
            }
        }));
    };

    const handleSave = () => {
        if (!selectedUser) return;

        const permissionsArray = Object.keys(modules).map(module => ({
            module,
            can_view: permissionsState[module]?.can_view ?? false,
            can_create: permissionsState[module]?.can_create ?? false,
            can_edit: permissionsState[module]?.can_edit ?? false,
            can_delete: permissionsState[module]?.can_delete ?? false,
        }));

        router.patch(route('permissions.update', selectedUser.id), {
            permissions: permissionsArray
        });
    };

    const handleReset = () => {
        if (!selectedUser) return;

        if (confirm('Êtes-vous sûr de vouloir réinitialiser les permissions aux valeurs par défaut ?')) {
            router.post(route('permissions.reset', selectedUser.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                            <Shield className="size-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Gestion des permissions</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Contrôle granulaire des accès par utilisateur</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Permissions" />

            <div className="space-y-6">
                {/* User Selection */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                    <label className="block text-sm font-medium text-slate-300 mb-3">Sélectionner un utilisateur</label>
                    <select
                        value={selectedUser?.id || ''}
                        onChange={(e) => {
                            const userId = e.target.value;
                            if (userId) {
                                router.get(route('permissions.index'), { user_id: userId });
                            }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                        <option value="">-- Choisir un utilisateur --</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.role}) - {user.email}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedUser && (
                    <>
                        {/* User Info */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-slate-900/50">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rôle : <span className="text-slate-300 font-medium">{selectedUser.role}</span></p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Réinitialiser aux défauts
                                </button>
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
                            <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-100">
                                Les super admins ont automatiquement accès à tous les modules. Ce contrôle s'applique uniquement aux managers, caissiers et employés.
                            </p>
                        </div>

                        {/* Permissions Grid */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden dark:border-white/10 dark:bg-slate-900/50">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-white/10">
                                            <th className="text-left py-3 px-4 font-semibold text-slate-300">Module</th>
                                            <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Voir</th>
                                            <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Créer</th>
                                            <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Modifier</th>
                                            <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Supprimer</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(modules).map(([moduleKey, moduleName]) => (
                                            <tr key={moduleKey} className="border-b border-white/5 hover:bg-white/5 transition">
                                                <td className="py-3 px-4 text-sm text-slate-300">{moduleName}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={permissionsState[moduleKey]?.can_view ?? false}
                                                        onChange={(e) => handlePermissionChange(moduleKey, 'can_view', e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={permissionsState[moduleKey]?.can_create ?? false}
                                                        onChange={(e) => handlePermissionChange(moduleKey, 'can_create', e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={permissionsState[moduleKey]?.can_edit ?? false}
                                                        onChange={(e) => handlePermissionChange(moduleKey, 'can_edit', e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={permissionsState[moduleKey]?.can_delete ?? false}
                                                        onChange={(e) => handlePermissionChange(moduleKey, 'can_delete', e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => router.get(route('permissions.index'))}
                                className="px-6 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-slate-800 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition"
                            >
                                Enregistrer les modifications
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
