import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Bot,
    Copy,
    Megaphone,
    MessageCircleMore,
    Sparkles,
    Target,
    Users,
} from 'lucide-react';
import { useState } from 'react';

type Campaign = {
    id: number;
    name: string;
    channel: string;
    status: string;
    objective: string;
};

type Lead = {
    id: number;
    name: string;
    phone: string;
    company?: string | null;
    business_type?: string | null;
    source: string;
    status: string;
    score: number;
    ai_summary?: string | null;
    ai_next_action?: string | null;
    whatsapp_script?: string | null;
    scored_at?: string | null;
};

type Content = {
    id: number;
    title?: string | null;
    hook?: string | null;
    cta?: string | null;
    channel: string;
    format: string;
    status: string;
    body: string;
};

type Props = {
    campaigns: Campaign[];
    contents: Content[];
    leads: Lead[];
    aiConfigured: boolean;
    stats: {
        campaigns: number;
        draft_contents: number;
        leads: number;
        qualified_leads: number;
    };
};

export default function Index({ campaigns, contents, leads, aiConfigured, stats }: Props) {
    const [runningAction, setRunningAction] = useState<string | null>(null);
    const [copiedLead, setCopiedLead] = useState<number | null>(null);

    const campaignForm = useForm({
        name: '',
        channel: 'facebook',
        objective: 'Générer des conversations WhatsApp qualifiées pour une démonstration BatixPro.',
        audience: 'Gérants de quincailleries, commerces, grossistes et distributeurs.',
        offer: 'Démonstration gratuite de BatixPro.',
        daily_budget: '',
    });

    const leadForm = useForm({
        name: '',
        phone: '',
        company: '',
        business_type: '',
        source: 'whatsapp',
        marketing_campaign_id: '',
        notes: '',
    });

    const cards = [
        { label: 'Campagnes', value: stats.campaigns, icon: Megaphone },
        { label: 'Contenus brouillon', value: stats.draft_contents, icon: MessageCircleMore },
        { label: 'Prospects', value: stats.leads, icon: Users },
        { label: 'Prospects qualifiés', value: stats.qualified_leads, icon: Target },
    ];

    const runAiAction = (key: string, url: string) => {
        setRunningAction(key);
        router.post(url, {}, {
            preserveScroll: true,
            onFinish: () => setRunningAction(null),
        });
    };

    const copyWhatsApp = async (lead: Lead) => {
        if (!lead.whatsapp_script) return;
        await navigator.clipboard.writeText(lead.whatsapp_script);
        setCopiedLead(lead.id);
        window.setTimeout(() => setCopiedLead(null), 1600);
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">BATIX Growth</h1>}>
            <Head title="BATIX Growth" />

            <section className="space-y-6">
                <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/15 via-orange-300/5 to-transparent p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Agent marketing digital</p>
                            <h2 className="mt-2 text-2xl font-bold text-white">Transformer l'audience en démos puis en clients BatixPro.</h2>
                            <p className="mt-2 max-w-3xl text-sm text-slate-300">L'IA prépare les contenus et les réponses commerciales. Rien n'est publié ni envoyé sans validation humaine.</p>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${aiConfigured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-orange-400/30 bg-orange-400/10 text-orange-200'}`}>
                            <Bot className="size-4" />
                            {aiConfigured ? 'Moteur IA configuré' : 'OPENAI_API_KEY à configurer'}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <article key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-300">{card.label}</p>
                                <card.icon className="size-5 text-amber-300" />
                            </div>
                            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
                        </article>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            campaignForm.post(route('marketing.campaigns.store'), {
                                preserveScroll: true,
                                onSuccess: () => campaignForm.reset('name', 'daily_budget'),
                            });
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6"
                    >
                        <h3 className="text-lg font-semibold text-white">Nouvelle campagne</h3>
                        <div className="mt-4 grid gap-4">
                            <input className="rounded-xl border-white/10 bg-slate-900 text-white" placeholder="Nom de campagne" value={campaignForm.data.name} onChange={(e) => campaignForm.setData('name', e.target.value)} />
                            <select className="rounded-xl border-white/10 bg-slate-900 text-white" value={campaignForm.data.channel} onChange={(e) => campaignForm.setData('channel', e.target.value)}>
                                <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option>
                            </select>
                            <textarea className="rounded-xl border-white/10 bg-slate-900 text-white" rows={3} value={campaignForm.data.objective} onChange={(e) => campaignForm.setData('objective', e.target.value)} />
                            <textarea className="rounded-xl border-white/10 bg-slate-900 text-white" rows={3} value={campaignForm.data.audience} onChange={(e) => campaignForm.setData('audience', e.target.value)} />
                            <textarea className="rounded-xl border-white/10 bg-slate-900 text-white" rows={2} value={campaignForm.data.offer} onChange={(e) => campaignForm.setData('offer', e.target.value)} />
                            <input className="rounded-xl border-white/10 bg-slate-900 text-white" type="number" min="0" placeholder="Budget journalier FCFA" value={campaignForm.data.daily_budget} onChange={(e) => campaignForm.setData('daily_budget', e.target.value)} />
                            <button disabled={campaignForm.processing} className="rounded-xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Créer la campagne</button>
                        </div>
                    </form>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            leadForm.post(route('marketing.leads.store'), {
                                preserveScroll: true,
                                onSuccess: () => leadForm.reset('name', 'phone', 'company', 'business_type', 'notes'),
                            });
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6"
                    >
                        <h3 className="text-lg font-semibold text-white">Ajouter un prospect</h3>
                        <div className="mt-4 grid gap-4">
                            <input className="rounded-xl border-white/10 bg-slate-900 text-white" placeholder="Nom" value={leadForm.data.name} onChange={(e) => leadForm.setData('name', e.target.value)} />
                            <input className="rounded-xl border-white/10 bg-slate-900 text-white" placeholder="Téléphone / WhatsApp" value={leadForm.data.phone} onChange={(e) => leadForm.setData('phone', e.target.value)} />
                            <input className="rounded-xl border-white/10 bg-slate-900 text-white" placeholder="Entreprise" value={leadForm.data.company} onChange={(e) => leadForm.setData('company', e.target.value)} />
                            <input className="rounded-xl border-white/10 bg-slate-900 text-white" placeholder="Type d'activité" value={leadForm.data.business_type} onChange={(e) => leadForm.setData('business_type', e.target.value)} />
                            <select className="rounded-xl border-white/10 bg-slate-900 text-white" value={leadForm.data.source} onChange={(e) => leadForm.setData('source', e.target.value)}>
                                <option value="whatsapp">WhatsApp</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option><option value="manual">Manuel</option>
                            </select>
                            <select className="rounded-xl border-white/10 bg-slate-900 text-white" value={leadForm.data.marketing_campaign_id} onChange={(e) => leadForm.setData('marketing_campaign_id', e.target.value)}>
                                <option value="">Aucune campagne</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                            </select>
                            <textarea className="rounded-xl border-white/10 bg-slate-900 text-white" rows={2} placeholder="Notes : besoin, nombre de boutiques, méthode actuelle..." value={leadForm.data.notes} onChange={(e) => leadForm.setData('notes', e.target.value)} />
                            <button disabled={leadForm.processing} className="rounded-xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Enregistrer le prospect</button>
                        </div>
                    </form>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-5 text-amber-300" />
                            <h3 className="font-semibold text-white">Campagnes & génération IA</h3>
                        </div>
                        <div className="mt-4 space-y-3">
                            {campaigns.length ? campaigns.map((campaign) => {
                                const key = `campaign-${campaign.id}`;
                                return (
                                    <div key={campaign.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                        <p className="font-medium text-white">{campaign.name}</p>
                                        <p className="mt-1 text-xs text-slate-400">{campaign.channel} · {campaign.status}</p>
                                        <p className="mt-2 text-sm text-slate-300">{campaign.objective}</p>
                                        <button
                                            type="button"
                                            disabled={!aiConfigured || runningAction === key}
                                            onClick={() => runAiAction(key, route('marketing.campaigns.generate', campaign.id))}
                                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Sparkles className="size-4" />
                                            {runningAction === key ? 'Génération...' : 'Générer 3 contenus'}
                                        </button>
                                    </div>
                                );
                            }) : <p className="text-sm text-slate-400">Aucune campagne.</p>}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="font-semibold text-white">Prospects & qualification IA</h3>
                        <div className="mt-4 space-y-4">
                            {leads.length ? leads.map((lead) => {
                                const key = `lead-${lead.id}`;
                                return (
                                    <div key={lead.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-white">{lead.name}</p>
                                                <p className="mt-1 text-xs text-slate-400">{lead.company || lead.phone} · {lead.source} · {lead.status}</p>
                                            </div>
                                            <div className="rounded-lg bg-white/5 px-2.5 py-1 text-sm font-semibold text-amber-200">{lead.score}/100</div>
                                        </div>

                                        {lead.ai_summary && <p className="mt-3 text-sm text-slate-300">{lead.ai_summary}</p>}
                                        {lead.ai_next_action && <p className="mt-2 text-xs text-emerald-300">Action : {lead.ai_next_action}</p>}

                                        {lead.whatsapp_script && (
                                            <div className="mt-3 rounded-lg border border-emerald-300/15 bg-emerald-300/5 p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Message WhatsApp proposé</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{lead.whatsapp_script}</p>
                                                <button type="button" onClick={() => copyWhatsApp(lead)} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-200 hover:text-white">
                                                    <Copy className="size-3.5" />{copiedLead === lead.id ? 'Copié' : 'Copier le message'}
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            disabled={!aiConfigured || runningAction === key}
                                            onClick={() => runAiAction(key, route('marketing.leads.score', lead.id))}
                                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/30 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Bot className="size-4" />
                                            {runningAction === key ? 'Analyse...' : lead.scored_at ? 'Requalifier avec l’IA' : 'Qualifier avec l’IA'}
                                        </button>
                                    </div>
                                );
                            }) : <p className="text-sm text-slate-400">Aucun prospect.</p>}
                        </div>
                    </article>
                </div>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="font-semibold text-white">Contenus en validation</h3>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        {contents.length ? contents.map((content) => (
                            <div key={content.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{content.channel} · {content.format}</p>
                                <p className="mt-2 font-semibold text-white">{content.title || content.format}</p>
                                {content.hook && <p className="mt-2 text-sm font-medium text-slate-200">{content.hook}</p>}
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{content.body}</p>
                                {content.cta && <p className="mt-3 text-sm font-medium text-emerald-300">CTA : {content.cta}</p>}
                                <p className="mt-3 text-xs text-slate-500">Statut : {content.status} — validation humaine requise.</p>
                            </div>
                        )) : <p className="text-sm text-slate-400">Crée une campagne puis clique sur « Générer 3 contenus ».</p>}
                    </div>
                </article>
            </section>
        </AuthenticatedLayout>
    );
}
