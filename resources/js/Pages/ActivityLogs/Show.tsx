import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Clock, Zap, MapPin, Globe, Code, Key } from 'lucide-react';
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
    api_token_name: string | null;
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
    const { t, locale } = useLocale();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
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
                                    <p className="text-xs text-slate-500 mb-1">{t.activityLogs.show.before}</p>
                                    <p className="text-sm font-mono text-red-400 break-all">{String(value.old ?? '-')}</p>
                                </div>
                                <div className="rounded bg-green-500/10 p-2">
                                    <p className="text-xs text-slate-500 mb-1">{t.activityLogs.show.after}</p>
                                    <p className="text-sm font-mono text-green-400 break-all">{String(value.new ?? '-')}</p>
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
                                <span className="text-sm text-slate-500 dark:text-slate-400">{key}</span>
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
                        <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.type}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{activity.properties.type}</span>
                    </div>
                    {activity.properties.count !== undefined && (
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.count}</span>
                            <span className="text-sm text-slate-600 dark:text-slate-300">{activity.properties.count}</span>
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
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.activityLogs.show.pageTitle}</h1>
                </div>
            }
        >
            <Head title={t.activityLogs.show.headTitle} />

            <div className="max-w-4xl">
                <Link
                    href={route('activity-logs.index')}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
                >
                    <ArrowLeft className="size-4" />
                    {t.activityLogs.show.backToHistory}
                </Link>

                <div className="space-y-6">
                    {/* En-tête avec action et date */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(activity.action)}`}>
                                        {activity.action_label}
                                    </span>
                                    {activity.api_token_name && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-300">
                                            <Key className="size-3.5" />
                                            {t.activityLogs.viaApiToken(activity.api_token_name)}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{activity.description}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(activity.created_at).toLocaleString(dateLocale, {
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
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                <User className="size-5 text-blue-400" />
                                {t.activityLogs.show.userSection}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.name}</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-medium">{activity.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.email}</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-mono">{activity.user.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.role}</span>
                                    <span className="text-sm text-slate-300 capitalize">{activity.user.role.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                <MapPin className="size-5 text-amber-400" />
                                {t.activityLogs.show.shopSection}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.name}</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-medium">{activity.shop.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.id}</span>
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{activity.shop.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Objet modifié */}
                    {activity.subject_type && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                <Zap className="size-5 text-purple-400" />
                                {t.activityLogs.show.subjectSection}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.type}</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-medium">{activity.subject_label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t.activityLogs.show.id}</span>
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{activity.subject_id}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Propriétés / Changements */}
                    {activity.properties && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                {activity.properties.changes ? t.activityLogs.show.changesTitle : t.activityLogs.show.detailsTitle}
                            </h3>
                            {renderProperties()}
                        </div>
                    )}

                    {/* Métadonnées techniques */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            <Code className="size-5 text-green-400" />
                            {t.activityLogs.show.technicalMetadata}
                        </h3>
                        <div className="space-y-3">
                            {activity.method && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.activityLogs.show.httpMethod}</p>
                                    <div className="rounded bg-gray-100 px-3 py-2 dark:bg-slate-900/50">
                                        <p className="text-sm font-mono text-slate-300">{activity.method}</p>
                                    </div>
                                </div>
                            )}
                            {activity.url && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.activityLogs.show.url}</p>
                                    <div className="rounded bg-gray-100 px-3 py-2 dark:bg-slate-900/50">
                                        <p className="text-sm font-mono text-slate-300 break-all">{activity.url}</p>
                                    </div>
                                </div>
                            )}
                            {activity.ip_address && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.activityLogs.ipLabel}</p>
                                    <div className="rounded bg-gray-100 px-3 py-2 dark:bg-slate-900/50">
                                        <p className="text-sm font-mono text-slate-300">{activity.ip_address}</p>
                                    </div>
                                </div>
                            )}
                            {activity.user_agent && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.activityLogs.show.userAgent}</p>
                                    <div className="rounded bg-gray-100 px-3 py-2 dark:bg-slate-900/50">
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
