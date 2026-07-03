import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';
import { useLocale } from '@/contexts/LocaleContext';
import InputError from '@/Components/InputError';

interface Shop { id: number; name: string }

export default function CategoriesCreate({ shops }: PageProps<{ shops: Shop[] }>) {
    const { t } = useLocale();
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
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-white">{t.categories.form.newTitle}</h1>}>
            <Head title={t.categories.form.newTitle} />
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <label className="block space-y-1 text-sm text-slate-200">
                    <span>{t.common.form.shopField}</span>
                    <select value={data.shop_id} disabled
                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed">
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-400">{t.common.form.shopHint}</p>
                    <InputError message={errors.shop_id} />
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

                <div className="grid grid-cols-2 gap-4">
                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.common.form.color}</span>
                        <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)}
                            className="h-10 w-full rounded-lg border border-white/15 bg-slate-900/70" />
                        <InputError message={errors.color} />
                    </label>

                    <label className="block space-y-1 text-sm text-slate-200">
                        <span>{t.categories.form.displayOrder}</span>
                        <input type="number" value={data.order} onChange={(e) => setData('order', parseInt(e.target.value))}
                            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2" />
                        <InputError message={errors.order} />
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Link href={route('categories.index')}
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
