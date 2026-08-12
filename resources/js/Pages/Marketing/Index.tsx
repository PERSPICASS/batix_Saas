import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Megaphone, MessageCircleMore, Target, Users } from 'lucide-react';

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
    source: string;
    status: string;
};

type Content = {
    id: number;
    title?: string | null;
    channel: string;
    format: string;
    status: string;
    body: string;
};

type Props = {
    campaigns: Campaign[];
    contents: Content[];
    leads: Lead[];
    stats: {
        campaigns: number;
        draft_contents: number;
        leads: number;
        qualified_leads: number;
    };
};

export default function Index({ campaigns, contents, leads, stats }: Props) {
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

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">BATIX Growth</h1>}>
            <Head title="BATIX Growth" />

            <section className="space-y-6">
                <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/15 via-orange-300/5 to-transparent p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Agent marketing digital</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Transformer l'audience en démos puis en clients BatixPro.</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-300">MVP avec validation humaine : campagnes, contenus, prospects et suivi commercial. Les connexions Meta et WhatsApp seront branchées ensuite sur cette base.</p>
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
                            campaignForm.post(route('marketing.campaigns.store'), { preserveScroll: true, onSuccess: () => campaignForm.reset('name', 'daily_budget') });
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
                            <button disabled={campaignForm.processing} className="rounded-xl bg-amber-300 px-4 py-3 font-semibold text-slate-950">Créer la campagne</button>
                        </div>
                    </form>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            leadForm.post(route('marketing.leads.store'), { preserveScroll: true, onSuccess: () => leadForm.reset('name', 'phone', 'company', 'business_type', 'notes') });
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
                            <textarea className="rounded-xl border-white/10 bg-slate-900 text-white" rows={2} placeholder="Notes" value={leadForm.data.notes} onChange={(e) => leadForm.setData('notes', e.target.value)} />
                            <button disabled={leadForm.processing} className="rounded-xl bg-amber-300 px-4 py-3 font-semibold text-slate-950">Enregistrer le prospect</button>
                        </div>
                    </form>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="font-semibold text-white">Campagnes récentes</h3>
                        <div className="mt-4 space-y-3">{campaigns.length ? campaigns.map((campaign) => <div key={campaign.id} className="rounded-xl bg-slate-900/70 p-3"><p className="font-medium text-white">{campaign.name}</p><p className="mt-1 text-xs text-slate-400">{campaign.channel} · {campaign.status}</p></div>) : <p className="text-sm text-slate-400">Aucune campagne.</p>}</div>
                    </article>
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="font-semibold text-white">Prospects récents</h3>
                        <div className="mt-4 space-y-3">{leads.length ? leads.map((lead) => <div key={lead.id} className="rounded-xl bg-slate-900/70 p-3"><p className="font-medium text-white">{lead.name}</p><p className="mt-1 text-xs text-slate-400">{lead.company || lead.phone} · {lead.source}</p></div>) : <p className="text-sm text-slate-400">Aucun prospect.</p>}</div>
                    </article>
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="font-semibold text-white">Contenus</h3>
                        <div className="mt-4 space-y-3">{contents.length ? contents.map((content) => <div key={content.id} className="rounded-xl bg-slate-900/70 p-3"><p className="font-medium text-white">{content.title || content.format}</p><p className="mt-1 text-xs text-slate-400">{content.channel} · {content.status}</p></div>) : <p className="text-sm text-slate-400">La génération de contenu arrive dans l'étape suivante.</p>}</div>
                    </article>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
