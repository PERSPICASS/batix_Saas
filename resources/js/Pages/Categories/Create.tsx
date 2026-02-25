import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';

interface Shop {
    id: number;
    name: string;
}

export default function CategoriesCreate({ shops }: PageProps<{ shops: Shop[] }>) {
    const route = useRoute();

    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    const { data, setData, post, processing, errors } = useForm({
        shop_id: activeShop?.id || shops[0]?.id || '',
        name: '',
        description: '',
        color: '#3b82f6',
        icon: '',
        order: 0,
    });

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('categories.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouvelle catégorie</h1>}>
            <Head title="Nouvelle categorie" />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <label className="block space-y-1 text-sm text-slate-200">
                    <span>Boutique *</span>
                    <select 
                        value={data.shop_id} 
                        disabled
                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed"
                    >
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-400">
                        Boutique sélectionnée via le switcher
                    </p>
                    {errors.shop_id && <span className="text-xs text-red-400">{errors.shop_id}</span>}
                </label>

                <label className="block space-y-1 text-sm text-slate-200">
                    <span>Nom *</span>
                    <input 
                        value={data.name} 
                        onChange={(e) => setData('name', e.target.value)} 
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" 
                        required
                    />
                    {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                </label>

                <label className="block space-y-1 text-sm text-slate-200">
                    <span>Description</span>
                    <textarea 
                        value={data.description} 
                        onChange={(e) => setData('description', e.target.value)} 
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" 
                        rows={4} 
                    />
                    {errors.description && <span className="text-xs text-red-400">{errors.description}</span>}
                </label>

                <div className="grid grid-cols-2 gap-4">
                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Couleur</span>
                        <input 
                            type="color"
                            value={data.color} 
                            onChange={(e) => setData('color', e.target.value)} 
                            className="h-10 w-full rounded-lg border border-white/15 bg-slate-900/70" 
                        />
                        {errors.color && <span className="text-xs text-red-400">{errors.color}</span>}
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>Ordre d'affichage</span>
                        <input 
                            type="number"
                            value={data.order} 
                            onChange={(e) => setData('order', parseInt(e.target.value))} 
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" 
                        />
                        {errors.order && <span className="text-xs text-red-400">{errors.order}</span>}
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Link href={route('categories.index')} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                        Annuler
                    </Link>
                    <button 
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
