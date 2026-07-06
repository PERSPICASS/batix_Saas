import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Category { id: number; name: string }
interface Subcategory { id: number; category_id: number; name: string; description: string | null }
interface Props { subcategory: Subcategory; categories: Category[] }

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
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.categories.form.editSubTitle}</h1>}>
            <Head title={t.categories.form.editSubTitle} />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                    <div>
                        <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t.categories.form.parentCategory}
                        </label>
                        <select
                            id="category_id"
                            value={data.category_id}
                            onChange={(e) => setData('category_id', Number(e.target.value))}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200"
                        >
                            <option value="">{t.common.form.selectOption}</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.category_id} />
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t.common.form.name}
                        </label>
                        <input type="text" id="name" value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t.common.form.description}
                        </label>
                        <textarea id="description" value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200" />
                        <InputError message={errors.description} />
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10 pt-4">
                        <Link href={route('subcategories.index')}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
                            {t.common.form.cancel}
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50">
                            {processing ? t.common.form.saving : t.common.form.save}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
