import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Category {
    id: number;
    name: string;
    shop: {
        id: number;
        name: string;
    };
}

export default function SubcategoriesCreate({ categories }: PageProps<{ categories: Category[] }>) {
    const { t } = useLocale();
    const route = useRoute();

    const { data, setData, post, processing, errors } = useForm({
        category_id: categories[0]?.id || '',
        name: '',
        description: '',
        order: 0,
    });

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('subcategories.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Nouvelle sous-catégorie</h1>}>
            <Head title="Nouvelle sous categorie" />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <label className="block space-y-1 text-sm text-slate-200">
                    <span>Catégorie parente *</span>
                    <select 
                        value={data.category_id} 
                        onChange={(e) => setData('category_id', e.target.value)} 
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                        required
                    >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name} ({category.shop.name})
                            </option>
                        ))}
                    </select>
                    {errors.category_id && <span className="text-xs text-red-400">{errors.category_id}</span>}
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

                <div className="flex justify-end gap-2">
                    <Link href={route('subcategories.index')} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
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
