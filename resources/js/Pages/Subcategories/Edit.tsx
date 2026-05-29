import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';

interface Category {
    id: number;
    name: string;
}

interface Subcategory {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
}

interface Props {
    subcategory: Subcategory;
    categories: Category[];
}

export default function SubcategoriesEdit({ subcategory, categories }: Props) {
    const { t } = useLocale();
    const route = useRoute();

    const { data, setData, put, processing, errors } = useForm({
        category_id: subcategory.category_id,
        name: subcategory.name,
        description: subcategory.description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('subcategories.update', { sous_category: subcategory.id }));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">Modifier sous-catégorie</h1>}>
            <Head title="Modifier sous-catégorie" />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div>
                        <label htmlFor="category_id" className="block text-sm font-medium text-slate-200">
                            Catégorie parente *
                        </label>
                        <select
                            id="category_id"
                            value={data.category_id}
                            onChange={(e) => setData('category_id', Number(e.target.value))}
                            className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        >
                            <option value="">Sélectionner une catégorie</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="mt-1 text-sm text-red-400">{errors.category_id}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                            Nom de la sous-catégorie *
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder="Ex: Tournevis"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-200">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder="Description de la sous-catégorie"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Link
                            href={route('subcategories.index')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
