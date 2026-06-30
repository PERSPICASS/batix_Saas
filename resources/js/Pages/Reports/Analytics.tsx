import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Download, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from '@/utils/route';

interface Shop {
    id: number;
    name: string;
}

interface Props {
    shop: Shop;
}

export default function Analytics({ shop }: Props) {
    const route = useRoute();
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleExport = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('reports.analytics.export', {});

        const token = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (token) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_token';
            input.value = token.content;
            form.appendChild(input);
        }

        const startInput = document.createElement('input');
        startInput.type = 'hidden';
        startInput.name = 'start_date';
        startInput.value = startDate;
        form.appendChild(startInput);

        const endInput = document.createElement('input');
        endInput.type = 'hidden';
        endInput.name = 'end_date';
        endInput.value = endDate;
        form.appendChild(endInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Rapports analytiques</h1>}
        >
            <Head title="Rapports analytiques" />

            <div className="space-y-6">
                {/* Formulaire d'export */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Calendar className="size-5 text-amber-300" /> Générer un rapport
                    </h2>

                    <form onSubmit={handleExport} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Date de fin
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-6 py-2 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="size-4" />
                            {loading ? 'Génération...' : 'Télécharger le rapport'}
                        </button>
                    </form>
                </div>

                {/* Information sur le rapport */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                        <h3 className="font-semibold text-white mb-3">Contenu du rapport</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-300 mt-1">✓</span>
                                <span><strong>Résumé:</strong> KPI clés (CA, factures, devis, conversion)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-300 mt-1">✓</span>
                                <span><strong>Chiffre d'affaires:</strong> Par statut de facture</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-300 mt-1">✓</span>
                                <span><strong>Clients:</strong> Top clients, montants, derniers achats</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-300 mt-1">✓</span>
                                <span><strong>Produits:</strong> Produits les plus vendus</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                        <h3 className="font-semibold text-white mb-3">Autres exports</h3>
                        <div className="space-y-3">
                            <a
                                href={route('invoices.export', {})}
                                className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3 hover:bg-slate-900/70"
                            >
                                <span className="text-slate-300">
                                    <strong>Factures</strong> - Liste complète
                                </span>
                                <Download className="size-4 text-slate-400" />
                            </a>
                            <a
                                href={route('quotes.export', {})}
                                className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3 hover:bg-slate-900/70"
                            >
                                <span className="text-slate-300">
                                    <strong>Devis</strong> - Liste complète
                                </span>
                                <Download className="size-4 text-slate-400" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
                    <p className="text-sm text-amber-100">
                        💡 <strong>Conseil:</strong> Utilisez les rapports analytiques pour suivre votre activité,
                        identifier vos meilleurs clients, et analyser vos tendances de ventes.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
