import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Category {
    id: number; name: string; description: string | null;
    color: string; icon: string | null; order: number; is_active: boolean;
}
interface Shop { id: number; name: string }

export default function CategoriesEdit({ category, shops }: PageProps<{ category: Category, shops: Shop[] }>) {
    const { t } = useLocale();
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
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t.categories.form.editTitle}</h1>}>
            <Head title={t.categories.form.editTitle} />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <span>{t.common.form.name}</span>
                    <input value={data.name} onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" required />
                    <InputError message={errors.name} />
                </label>

                <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <span>{t.common.form.description}</span>
                    <textarea value={data.description} onChange={(e) => setData('description', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" rows={4} />
                    <InputError message={errors.description} />
                </label>

                <div className="grid grid-cols-2 gap-4">
                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{t.common.form.color}</span>
                        <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)}
                            className="h-10 w-full rounded-lg border border-white/15 bg-slate-900/70" />
                        <InputError message={errors.color} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-700 dark:text-slate-200">
                        <span>{t.categories.form.displayOrder}</span>
                        <input type="number" value={data.order} onChange={(e) => setData('order', parseInt(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-slate-900/70 dark:text-white" />
                        <InputError message={errors.order} />
                    </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)}
                        className="rounded border-white/15 bg-slate-900/70" />
                    <span>{t.common.status.active}</span>
                </label>

                <div className="flex justify-end gap-2">
                    <Link href={route('categories.index')}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                        {t.common.actions.back}
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
