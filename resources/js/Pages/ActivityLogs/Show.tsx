import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Clock, Zap, MapPin, Globe, Code } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface ActivityLog {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    shop: {
        id: number;
        name: string;
    };
    action: string;
    action_label: string;
    description: string;
    subject_type: string | null;
    subject_label: string | null;
    subject_id: number | null;
    properties: {
        attributes?: Record<string, any>;
        changes?: Record<string, any>;
        type?: string;
        count?: number;
    } | null;
    ip_address: string | null;
    user_agent: string | null;
    method: string | null;
    url: string | null;
    created_at: string;
}

interface Props {
    activity: ActivityLog;
}

export default function Show({ activity }: Props) {
    const { t } = useLocale();
    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            'created': 'text-green-400 bg-green-400/10',
            'updated': 'text-blue-400 bg-blue-400/10',
            'deleted': 'text-red-400 bg-red-400/10',
            'viewed': 'text-slate-400 bg-slate-400/10',
            'login': 'text-emerald-400 bg-emerald-400/10',
            'logout': 'text-orange-400 bg-orange-400/10',
            'lock': 'text-amber-400 bg-amber-400/10',
            'unlock': 'text-green-400 bg-green-400/10',
        };
        return colors[action] || 'text-slate-400 bg-slate-400/10';
    };

    const renderProperties = () => {
        if (!activity.properties) return null;

        if (activity.properties.changes) {
            return (
                <div className="space-y-2">
                    {Object.entries(activity.properties.changes).map(([field, value]: [string, any]) => (
                        <div key={field} className="rounded-lg bg-slate-900/30 p-3">
                            <p className="text-xs font-medium text-slate-400 mb-2">{field}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded bg-red-500/10 p-2">
                                    <p className="text-xs text-slate-500 mb-1">Avant</p>
                                    <p className="text-sm font-mono text-red-400 break-all">{String(value.from ?? '-')}</p>
                                </div>
                                <div className="rounded bg-green-500/10 p-2">
                                    <p className="text-xs text-slate-500 mb-1">Après</p>
                                    <p className="text-sm font-mono text-green-400 break-all">{String(value.to ?? '-')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activity.properties.attributes) {
            return (
                <div className="rounded-lg bg-slate-900/30 p-4">
                    <div className="space-y-2">
                        {Object.entries(activity.properties.attributes).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between items-start border-b border-slate-700/50 pb-2 last:border-0">
                                <span className="text-sm text-slate-400">{key}</span>
                                <span className="text-sm font-mono text-slate-300 max-w-xs text-right break-all">{String(value ?? '-')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activity.properties.type) {
            return (
                <div className="rounded-lg bg-slate-900/30 p-4 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Type</span>
                        <span className="text-sm text-slate-300">{activity.properties.type}</span>
                    </div>
                    {activity.properties.count !== undefined && (
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Nombre</span>
                            <span className="text-sm text-slate-300">{activity.properties.count}</span>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-white">Détail du log</h1>
                </div>
            }
        >
            <Head title="Détail du log d'activité" />

            <div className="max-w-4xl">
                <Link
                    href={route('activity-logs.index')}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
                >
                    <ArrowLeft className="size-4" />
                    Retour à l'historique
                </Link>

                <div className="space-y-6">
                    {/* En-tête avec action et date */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(activity.action)}`}>
                                        {activity.action_label}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{activity.description}</h2>
                                <p className="text-sm text-slate-400">
                                    {new Date(activity.created_at).toLocaleString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Qui et où */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                                <User className="size-5 text-blue-400" />
                                Utilisateur
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Nom</span>
                                    <span className="text-sm text-white font-medium">{activity.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Email</span>
                                    <span className="text-sm text-white font-mono">{activity.user.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Rôle</span>
                                    <span className="text-sm text-slate-300 capitalize">{activity.user.role.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                                <MapPin className="size-5 text-amber-400" />
                                Boutique
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Nom</span>
                                    <span className="text-sm text-white font-medium">{activity.shop.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">ID</span>
                                    <span className="text-sm text-slate-300">{activity.shop.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Objet modifié */}
                    {activity.subject_type && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                                <Zap className="size-5 text-purple-400" />
                                Objet modifié
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Type</span>
                                    <span className="text-sm text-white font-medium">{activity.subject_label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">ID</span>
                                    <span className="text-sm text-slate-300">{activity.subject_id}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Propriétés / Changements */}
                    {activity.properties && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                {activity.properties.changes ? 'Changements' : 'Détails'}
                            </h3>
                            {renderProperties()}
                        </div>
                    )}

                    {/* Métadonnées techniques */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <Code className="size-5 text-green-400" />
                            Métadonnées techniques
                        </h3>
                        <div className="space-y-3">
                            {activity.method && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400 mb-1">Méthode HTTP</p>
                                    <div className="rounded bg-slate-900/50 px-3 py-2">
                                        <p className="text-sm font-mono text-slate-300">{activity.method}</p>
                                    </div>
                                </div>
                            )}
                            {activity.url && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400 mb-1">URL</p>
                                    <div className="rounded bg-slate-900/50 px-3 py-2">
                                        <p className="text-sm font-mono text-slate-300 break-all">{activity.url}</p>
                                    </div>
                                </div>
                            )}
                            {activity.ip_address && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400 mb-1">Adresse IP</p>
                                    <div className="rounded bg-slate-900/50 px-3 py-2">
                                        <p className="text-sm font-mono text-slate-300">{activity.ip_address}</p>
                                    </div>
                                </div>
                            )}
                            {activity.user_agent && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400 mb-1">User Agent</p>
                                    <div className="rounded bg-slate-900/50 px-3 py-2">
                                        <p className="text-sm font-mono text-slate-300 text-xs break-all">{activity.user_agent}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
