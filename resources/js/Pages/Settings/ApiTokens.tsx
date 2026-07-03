import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import ConfirmDialog from '@/Components/ConfirmDialog';

interface ApiToken {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

interface Props {
    tokens: ApiToken[];
    availableAbilities: string[];
}

export default function ApiTokens({ tokens, availableAbilities }: Props) {
    const { t, locale } = useLocale();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
    const { props } = usePage();
    const flash = props.flash as { plainTextToken?: string | null } | undefined;

    const [revealedToken, setRevealedToken] = useState<string | null>(flash?.plainTextToken ?? null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (flash?.plainTextToken) {
            setRevealedToken(flash.plainTextToken);
        }
    }, [flash?.plainTextToken]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        expires_in_days: '',
        abilities: [] as string[],
    });

    const resources = ['products', 'customers', 'sales', 'invoices', 'stock-movements'] as const;

    const toggleAbility = (ability: string) => {
        setData('abilities', data.abilities.includes(ability)
            ? data.abilities.filter((a) => a !== ability)
            : [...data.abilities, ability]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('api-tokens.store'), {
            preserveScroll: true,
            onSuccess: () => reset('name', 'expires_in_days', 'abilities'),
        });
    };

    const [tokenToRevoke, setTokenToRevoke] = useState<ApiToken | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);

    const handleRevokeClick = (token: ApiToken) => {
        setTokenToRevoke(token);
    };

    const handleConfirmRevoke = () => {
        if (!tokenToRevoke) return;
        setIsRevoking(true);
        router.delete(route('api-tokens.destroy', tokenToRevoke.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsRevoking(false);
                setTokenToRevoke(null);
            },
        });
    };

    const copyToken = () => {
        if (!revealedToken) return;
        navigator.clipboard.writeText(revealedToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">{t.apiTokens.title}</h1>}
        >
            <Head title={t.apiTokens.title} />

            <div className="max-w-3xl space-y-6">
                <p className="text-sm text-slate-300">{t.apiTokens.subtitle}</p>

                {/* Révélation unique du token en clair */}
                {revealedToken && (
                    <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-5 space-y-3">
                        <div className="flex items-start gap-2 text-amber-200">
                            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{t.apiTokens.revealWarning}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950 px-3 py-2">
                            <code className="flex-1 overflow-x-auto text-xs text-amber-200 whitespace-nowrap">{revealedToken}</code>
                            <button
                                type="button"
                                onClick={copyToken}
                                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 transition"
                            >
                                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                {copied ? t.apiTokens.copied : t.apiTokens.copy}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRevealedToken(null)}
                            className="text-xs text-slate-400 hover:text-white transition"
                        >
                            {t.apiTokens.dismiss}
                        </button>
                    </div>
                )}

                {/* Création d'un nouveau token */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                        <Plus className="size-4 text-amber-300" />
                        {t.apiTokens.createTitle}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.apiTokens.nameLabel}</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t.apiTokens.namePlaceholder}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                            </div>
                            <div className="sm:w-52">
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.apiTokens.expiryLabel}</label>
                                <select
                                    value={data.expires_in_days}
                                    onChange={(e) => setData('expires_in_days', e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-white focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                >
                                    <option value="">{t.apiTokens.expiryNever}</option>
                                    <option value="30">{t.apiTokens.expiryDays(30)}</option>
                                    <option value="90">{t.apiTokens.expiryDays(90)}</option>
                                    <option value="365">{t.apiTokens.expiryDays(365)}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.apiTokens.scopesLabel}</label>
                            <p className="mb-2 text-xs text-slate-500">{t.apiTokens.scopesHint}</p>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {resources.map((resource) => (
                                    <div key={resource} className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
                                        <p className="mb-2 text-xs font-semibold text-slate-200">{t.apiTokens.resources[resource]}</p>
                                        <div className="flex gap-4">
                                            {(['read', 'write'] as const).map((mode) => {
                                                const ability = `${resource}:${mode}`;
                                                if (!availableAbilities.includes(ability)) return null;
                                                return (
                                                    <label key={mode} className="flex items-center gap-1.5 text-xs text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.abilities.includes(ability)}
                                                            onChange={() => toggleAbility(ability)}
                                                            className="rounded border-white/20 bg-slate-800 text-amber-300 focus:ring-amber-300"
                                                        />
                                                        {mode === 'read' ? t.apiTokens.read : t.apiTokens.write}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {data.abilities.length === 0 && (
                                <p className="mt-2 text-xs text-amber-300/80">{t.apiTokens.noScopesSelected}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || data.abilities.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                        >
                            <Plus className="size-4" />
                            {t.apiTokens.createButton}
                        </button>
                    </form>
                </div>

                {/* Liste des tokens existants */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden">
                    {tokens.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <Key className="size-12 text-slate-400 mb-4" />
                            <p className="text-lg font-medium text-slate-300 mb-2">{t.apiTokens.emptyTitle}</p>
                            <p className="text-sm text-slate-400">{t.apiTokens.emptySubtitle}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {tokens.map((token) => (
                                <div key={token.id} className="flex items-center justify-between gap-4 p-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Key className="size-4 text-amber-300 shrink-0" />
                                            <p className="text-sm font-semibold text-white truncate">{token.name}</p>
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {token.abilities.includes('*') ? (
                                                <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] text-amber-300">{t.apiTokens.fullAccess}</span>
                                            ) : (
                                                token.abilities.map((ability) => (
                                                    <span key={ability} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">{ability}</span>
                                                ))
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                            <span>
                                                {t.apiTokens.createdAt}: {new Date(token.created_at).toLocaleDateString(dateLocale)}
                                            </span>
                                            <span>
                                                {t.apiTokens.lastUsed}: {token.last_used_at
                                                    ? new Date(token.last_used_at).toLocaleDateString(dateLocale)
                                                    : t.apiTokens.neverUsed}
                                            </span>
                                            {token.expires_at && (
                                                <span>
                                                    {t.apiTokens.expiresAt}: {new Date(token.expires_at).toLocaleDateString(dateLocale)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRevokeClick(token)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-300/10 transition"
                                    >
                                        <Trash2 className="size-3.5" />
                                        {t.apiTokens.revoke}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                show={tokenToRevoke !== null}
                onClose={() => setTokenToRevoke(null)}
                onConfirm={handleConfirmRevoke}
                title={t.apiTokens.revoke}
                message={t.apiTokens.revokeConfirm(tokenToRevoke?.name ?? '')}
                confirmText={t.apiTokens.revoke}
                type="danger"
                isProcessing={isRevoking}
            />
        </AuthenticatedLayout>
    );
}
