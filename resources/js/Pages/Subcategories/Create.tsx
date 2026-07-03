import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Category {
    id: number;
    name: string;
    shop: { id: number; name: string };
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
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.categories.form.newSubTitle}</h1>}>
            <Head title={t.categories.form.newSubTitle} />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.categories.form.parentCategory}</span>
                    <select value={data.category_id} onChange={(e) => setData('category_id', e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" required>
                        <option value="">{t.common.form.selectOption}</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name} {category.shop ? `(${category.shop.name})` : ''}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.category_id} />
                </label>

                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.common.form.name}</span>
                    <input value={data.name} onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" required />
                    <InputError message={errors.name} />
                </label>

                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.common.form.description}</span>
                    <textarea value={data.description} onChange={(e) => setData('description', e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" rows={4} />
                    <InputError message={errors.description} />
                </label>

                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.categories.form.displayOrder}</span>
                    <input type="number" value={data.order} onChange={(e) => setData('order', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                    <InputError message={errors.order} />
                </label>

                <div className="flex justify-end gap-2">
                    <Link href={route('subcategories.index')}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                        {t.common.form.cancel}
                    </Link>
                    <button type="submit" disabled={processing}
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">
                        {processing ? t.common.form.saving : t.common.form.save}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
