import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { History, Search, Filter, Eye, Download, User, Clock, Activity, Key } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

interface Activity {
    id: number;
    user: {
        id?: number;
        name: string;
        email: string;
        role: string;
    };
    shop: {
        id?: number;
        name: string;
    };
    action: string;
    action_label: string;
    description: string;
    subject_type: string | null;
    subject_label: string | null;
    subject_id: number | null;
    changes_summary: string | null;
    api_token_name: string | null;
    ip_address: string | null;
    created_at: string;
    created_at_human: string;
}

interface Props {
    activities: {
        data: Activity[];
        links: any[];
        meta: any;
    };
    filters: {
        user_id?: string;
        action?: string;
        subject_type?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
    };
    filterOptions: {
        users: { id: number; name: string; email: string }[];
        actions: { value: string; label: string }[];
        subjectTypes: { value: string; label: string }[];
    };
}

export default function Index({ activities, filters, filterOptions }: Props) {
    const { t } = useLocale();
    const [search, setSearch] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get(route('activity-logs.index'), {
            ...filters,
            search,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(route('activity-logs.index'), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        router.get(route('activity-logs.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
        setSearch('');
    };

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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                            <History className="size-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">{t.activityLogs.title}</h2>
                            <p className="text-sm text-slate-400">{t.activityLogs.subtitle}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={t.activityLogs.title} />

            <div className="space-y-6">
                {/* Search & Filters */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t.activityLogs.filters.searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full rounded-lg border border-white/10 bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white hover:bg-slate-800 transition"
                            >
                                <Filter className="size-4" />
                                <span>{t.activityLogs.filters.filtersButton}</span>
                            </button>
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition"
                            >
                                <Search className="size-4" />
                                <span>{t.common.actions.search}</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t border-white/10 pt-4">
                            {/* User Filter */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.activityLogs.filters.user}</label>
                                <select
                                    value={filters.user_id || ''}
                                    onChange={(e) => handleFilter('user_id', e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">{t.activityLogs.filters.allUsers}</option>
                                    {filterOptions.users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Filter */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.activityLogs.filters.action}</label>
                                <select
                                    value={filters.action || ''}
                                    onChange={(e) => handleFilter('action', e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">{t.activityLogs.filters.allActions}</option>
                                    {filterOptions.actions.map((action: any) => (
                                        <option key={action.value} value={action.value}>
                                            {action.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.activityLogs.filters.type}</label>
                                <select
                                    value={filters.subject_type || ''}
                                    onChange={(e) => handleFilter('subject_type', e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">{t.activityLogs.filters.allTypes}</option>
                                    {filterOptions.subjectTypes.map((type: any) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Button */}
                            <div className="sm:col-span-3 flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-slate-400 hover:text-white transition"
                                >
                                    {t.activityLogs.filters.resetFilters}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Activities List */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50">
                    {activities.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                                <History className="size-8 text-slate-400" />
                            </div>
                            <p className="text-lg font-medium text-slate-300 mb-2">{t.activityLogs.emptyMessage}</p>
                            <p className="text-sm text-slate-400">
                                {t.activityLogs.emptySubtitle}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {activities.data.map((activity) => (
                                <div key={activity.id} className="p-4 hover:bg-white/5 transition">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 shrink-0">
                                            <Activity className="size-5 text-blue-400" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                                                        {activity.action_label}
                                                    </span>
                                                    {activity.subject_label && (
                                                        <span className="text-sm text-slate-400">
                                                            · {activity.subject_label}
                                                        </span>
                                                    )}
                                                    {activity.api_token_name && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-2 py-0.5 text-xs text-amber-300">
                                                            <Key className="size-3" />
                                                            {t.activityLogs.viaApiToken(activity.api_token_name)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                                    {activity.created_at_human}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-300 mb-2">{activity.description}</p>

                                            {activity.changes_summary && (
                                                <p className="text-xs text-slate-400 mb-2">{activity.changes_summary}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="size-3" />
                                                    {activity.user.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {activity.created_at}
                                                </span>
                                                {activity.ip_address && (
                                                    <span>{t.activityLogs.ipLabel}: {activity.ip_address}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {activities.links.length > 3 && (
                        <div className="flex items-center justify-center gap-2 border-t border-white/10 p-4">
                            {activities.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1 rounded text-sm transition ${
                                        link.active
                                            ? 'bg-blue-500 text-white'
                                            : link.url
                                            ? 'text-slate-400 hover:bg-slate-800'
                                            : 'text-slate-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
