import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { AlertTriangle, ArrowUpRight, Package, Store, Wallet } from 'lucide-react';

const kpis = [
    {
        label: 'CA du jour',
        value: '14 280€',
        trend: '+12.4%',
        icon: Wallet,
    },
    {
        label: 'Boutiques actives',
        value: '5 / 5',
        trend: 'Plan Growth',
        icon: Store,
    },
    {
        label: 'Produits en stock',
        value: '8 412',
        trend: '+231',
        icon: Package,
    },
    {
        label: 'Alertes critiques',
        value: '12',
        trend: 'A traiter',
        icon: AlertTriangle,
    },
];

const recentEvents = [
    {
        title: 'Rupture imminente',
        description: 'Vis 6x80 - Boutique Batix Central',
        time: 'Il y a 8 min',
    },
    {
        title: 'Nouvelle vente comptoir',
        description: 'Ticket #Q-19482 - 325€',
        time: 'Il y a 14 min',
    },
    {
        title: 'Transfert de stock valide',
        description: 'Batix Nord vers Batix Central',
        time: 'Il y a 31 min',
    },
    {
        title: 'Nouvel utilisateur ajoute',
        description: 'Amina K. - Role: Caissier',
        time: 'Il y a 55 min',
    },
];

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Dashboard</h1>}
        >
            <Head title="Dashboard" />

            <section className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((kpi) => (
                        <article
                            key={kpi.label}
                            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-slate-300">{kpi.label}</p>
                                <div className="rounded-lg bg-amber-300/15 p-2 text-amber-200">
                                    <kpi.icon className="size-4" />
                                </div>
                            </div>
                            <p className="mt-3 text-3xl font-bold text-white">{kpi.value}</p>
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300">
                                <ArrowUpRight className="size-3.5" />
                                {kpi.trend}
                            </p>
                        </article>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl xl:col-span-2">
                        <h2 className="text-lg font-semibold text-white">Performance hebdomadaire</h2>
                        <p className="mt-1 text-sm text-slate-300">
                            Suivi des ventes sur les 7 derniers jours.
                        </p>

                        <div className="mt-6 grid grid-cols-7 gap-2">
                            {[38, 52, 47, 68, 58, 75, 64].map((height, index) => (
                                <div key={index} className="flex flex-col items-center gap-2">
                                    <div className="flex h-40 w-full items-end rounded-lg bg-slate-900/60 p-1">
                                        <div
                                            className="w-full rounded-md bg-gradient-to-t from-amber-300 to-orange-300"
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">J{index + 1}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="text-lg font-semibold text-white">Activite recente</h2>
                        <ul className="mt-4 space-y-3">
                            {recentEvents.map((event) => (
                                <li
                                    key={event.title + event.time}
                                    className="rounded-xl border border-white/10 bg-slate-900/70 p-3"
                                >
                                    <p className="text-sm font-medium text-white">{event.title}</p>
                                    <p className="mt-1 text-xs text-slate-300">{event.description}</p>
                                    <p className="mt-2 text-[11px] text-slate-400">{event.time}</p>
                                </li>
                            ))}
                        </ul>
                    </article>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
