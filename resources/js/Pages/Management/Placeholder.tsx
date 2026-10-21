import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Construction, ArrowRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function Placeholder({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    const { t } = useLocale();

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>}
        >
            <Head title={title} />

            <section className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="inline-flex rounded-xl bg-amber-300/15 p-3 text-amber-200">
                    <Construction className="size-6" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
                <p className="mt-2 max-w-2xl text-slate-300">{description}</p>

                <div className="mt-6 rounded-xl border border-dashed border-white/20 bg-slate-900/50 p-5 text-sm text-slate-300">
                    {t.management.placeholder.body}
                </div>

                <button
                    type="button"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                    {t.management.placeholder.addComponents}
                    <ArrowRight className="size-4" />
                </button>
            </section>
        </AuthenticatedLayout>
    );
}
