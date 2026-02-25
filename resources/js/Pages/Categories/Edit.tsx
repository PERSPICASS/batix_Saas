import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';

interface Category {
    id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    order: number;
    is_active: boolean;
}

interface Shop {
    id: number;
    name: string;
}

export default function CategoriesEdit({ category, shops }: PageProps<{ category: Category, shops: Shop[] }>) {
    const route = useRoute();

    const { data, setData, put, processing, errors } = useForm({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || '',
        order: category.order,
        is_active: category.is_active,
    });

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(route('categories.update', { category: category.id }));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Modifier catégorie</h1>}>
            <Head title="Modifier categorie" />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
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

                <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input 
                        type="checkbox"
                        checked={data.is_active} 
                        onChange={(e) => setData('is_active', e.target.checked)} 
                        className="rounded border-white/15 bg-slate-900/70" 
                    />
                    <span>Catégorie active</span>
                </label>

                <div className="flex justify-end gap-2">
                    <Link href={route('categories.index')} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                        Retour
                    </Link>
                    <button 
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                    >
                        {processing ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
