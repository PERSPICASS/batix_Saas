import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { Calculator, FileText, Plus, Trash2 } from 'lucide-react';

type InvoiceLine = {
    id: number;
    label: string;
    quantity: string;
    unitPrice: string;
};

export default function InvoicesCreate() {
    const [form, setForm] = useState({
        customer: '',
        date: '',
        dueDate: '',
        status: 'Brouillon',
        note: '',
    });

    const [lines, setLines] = useState<InvoiceLine[]>([
        { id: 1, label: '', quantity: '1', unitPrice: '' },
    ]);

    const subtotal = useMemo(
        () =>
            lines.reduce((sum, line) => {
                const qty = Number(line.quantity || 0);
                const price = Number(line.unitPrice || 0);
                return sum + qty * price;
            }, 0),
        [lines],
    );

    const tax = subtotal * 0.2;
    const total = subtotal + tax;

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const addLine = () => {
        setLines((prev) => [
            ...prev,
            {
                id: Date.now(),
                label: '',
                quantity: '1',
                unitPrice: '',
            },
        ]);
    };

    const removeLine = (id: number) => {
        setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-white">Nouvelle facture</h1>}
        >
            <Head title="Nouvelle facture" />

            <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 xl:col-span-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-white">
                            <FileText className="size-5 text-amber-200" />
                            <h2 className="text-lg font-semibold">Informations facture</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1 text-sm text-slate-200">
                                <span>Client</span>
                                <input
                                    value={form.customer}
                                    onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                    placeholder="Nom du client"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-200">
                                <span>Statut</span>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                >
                                    <option>Brouillon</option>
                                    <option>En attente</option>
                                    <option>Payee</option>
                                </select>
                            </label>

                            <label className="space-y-1 text-sm text-slate-200">
                                <span>Date</span>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-200">
                                <span>Date d'echeance</span>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Lignes de facture</h2>
                            <button
                                type="button"
                                onClick={addLine}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                            >
                                <Plus className="size-3.5" />
                                Ajouter ligne
                            </button>
                        </div>

                        <div className="space-y-3">
                            {lines.map((line, index) => (
                                <div key={line.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-900/60 p-3 md:grid-cols-12">
                                    <label className="space-y-1 text-xs text-slate-300 md:col-span-6">
                                        <span>Designation #{index + 1}</span>
                                        <input
                                            value={line.label}
                                            onChange={(e) =>
                                                setLines((prev) =>
                                                    prev.map((item) =>
                                                        item.id === line.id
                                                            ? { ...item, label: e.target.value }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm"
                                            placeholder="Ex: Marteau Pro"
                                        />
                                    </label>

                                    <label className="space-y-1 text-xs text-slate-300 md:col-span-2">
                                        <span>Qte</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={line.quantity}
                                            onChange={(e) =>
                                                setLines((prev) =>
                                                    prev.map((item) =>
                                                        item.id === line.id
                                                            ? { ...item, quantity: e.target.value }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm"
                                        />
                                    </label>

                                    <label className="space-y-1 text-xs text-slate-300 md:col-span-3">
                                        <span>Prix unitaire (€)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.unitPrice}
                                            onChange={(e) =>
                                                setLines((prev) =>
                                                    prev.map((item) =>
                                                        item.id === line.id
                                                            ? { ...item, unitPrice: e.target.value }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm"
                                        />
                                    </label>

                                    <div className="flex items-end md:col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => removeLine(line.id)}
                                            className="w-full rounded-lg border border-rose-300/30 px-3 py-2 text-rose-200 transition hover:bg-rose-300/10"
                                        >
                                            <Trash2 className="mx-auto size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <label className="space-y-1 text-sm text-slate-200">
                            <span>Note interne</span>
                            <textarea
                                value={form.note}
                                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                                rows={4}
                                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                                placeholder="Informations supplementaires..."
                            />
                        </label>
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-orange-300/10 to-transparent p-5 xl:sticky xl:top-24">
                    <div className="mb-4 flex items-center gap-2 text-amber-100">
                        <Calculator className="size-5" />
                        <h2 className="text-lg font-semibold">Resume</h2>
                    </div>

                    <div className="space-y-2 text-sm text-slate-200">
                        <div className="flex justify-between">
                            <span>Sous-total</span>
                            <span>{subtotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                            <span>TVA (20%)</span>
                            <span>{tax.toFixed(2)} €</span>
                        </div>
                        <div className="mt-3 border-t border-white/15 pt-3 text-base font-semibold text-white">
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span>{total.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 space-y-2">
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                        >
                            Enregistrer (UI)
                        </button>
                        <Link
                            href={route('invoices.index')}
                            className="block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 transition hover:bg-white/10"
                        >
                            Annuler
                        </Link>
                    </div>
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
