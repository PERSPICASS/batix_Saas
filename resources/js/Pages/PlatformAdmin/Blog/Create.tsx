import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import RichEditor from '@/Components/RichEditor';
import { useLocale } from '@/contexts/LocaleContext';

export default function BlogCreate() {
    const { t } = useLocale();
    const { data, setData, post, processing, errors } = useForm({
        title_fr: '',
        title_en: '',
        excerpt_fr: '',
        excerpt_en: '',
        content_fr: '',
        content_en: '',
        author_name: 'BATIX PRO',
        category: '',
        is_published: false as boolean,
        cover_image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('platform.blog.store'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={t.platformBlog.create.headTitle} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('platform.blog.index')}
                        className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.platformBlog.create.title}</h1>
                        <p className="mt-1 text-sm text-white/60">{t.platformBlog.create.subtitle}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Contenu principal */}
                        <div className="space-y-5 lg:col-span-2">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 dark:border-white/10 dark:bg-white/5">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">{t.platformBlog.form.content}</h2>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label={t.platformBlog.form.titleFr} error={errors.title_fr}>
                                        <input
                                            type="text"
                                            value={data.title_fr}
                                            onChange={e => setData('title_fr', e.target.value)}
                                            placeholder={t.platformBlog.form.titleFrPlaceholder}
                                            className={inputClass(!!errors.title_fr)}
                                        />
                                    </Field>
                                    <Field label={t.platformBlog.form.titleEn} error={errors.title_en}>
                                        <input
                                            type="text"
                                            value={data.title_en}
                                            onChange={e => setData('title_en', e.target.value)}
                                            placeholder={t.platformBlog.form.titleEnPlaceholder}
                                            className={inputClass(false)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label={t.platformBlog.form.excerptFr} error={errors.excerpt_fr}>
                                        <textarea
                                            rows={3}
                                            value={data.excerpt_fr}
                                            onChange={e => setData('excerpt_fr', e.target.value)}
                                            placeholder={t.platformBlog.form.excerptFrPlaceholder}
                                            className={inputClass(false)}
                                        />
                                    </Field>
                                    <Field label={t.platformBlog.form.excerptEn} error={errors.excerpt_en}>
                                        <textarea
                                            rows={3}
                                            value={data.excerpt_en}
                                            onChange={e => setData('excerpt_en', e.target.value)}
                                            placeholder={t.platformBlog.form.excerptEnPlaceholder}
                                            className={inputClass(false)}
                                        />
                                    </Field>
                                </div>

                                <Field label={t.platformBlog.form.contentFr} error={errors.content_fr}>
                                    <RichEditor
                                        value={data.content_fr}
                                        onChange={v => setData('content_fr', v)}
                                        placeholder={t.platformBlog.form.contentFrPlaceholder}
                                        rows={14}
                                    />
                                </Field>

                                <Field label={t.platformBlog.form.contentEn} error={errors.content_en}>
                                    <RichEditor
                                        value={data.content_en}
                                        onChange={v => setData('content_en', v)}
                                        placeholder={t.platformBlog.form.contentEnPlaceholder}
                                        rows={14}
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 dark:border-white/10 dark:bg-white/5">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">{t.platformBlog.form.settings}</h2>

                                <Field label={t.platformBlog.form.author} error={errors.author_name}>
                                    <input
                                        type="text"
                                        value={data.author_name}
                                        onChange={e => setData('author_name', e.target.value)}
                                        className={inputClass(false)}
                                    />
                                </Field>

                                <Field label={t.platformBlog.form.category} error={errors.category}>
                                    <input
                                        type="text"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                        placeholder={t.platformBlog.form.categoryPlaceholder}
                                        className={inputClass(false)}
                                    />
                                </Field>

                                <Field label={t.platformBlog.form.coverImage} error={errors.cover_image as string}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setData('cover_image', e.target.files?.[0] ?? null)}
                                        className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-900"
                                    />
                                </Field>

                                <label className="flex cursor-pointer items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={data.is_published}
                                            onChange={e => setData('is_published', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`h-5 w-9 rounded-full transition ${data.is_published ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                            <div className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${data.is_published ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </div>
                                    </div>
                                    <span className="text-sm text-white/70">{t.platformBlog.form.publishImmediately}</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {processing ? t.platformBlog.create.saving : t.platformBlog.create.submit}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/60">{label}</label>
            {children}
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

function inputClass(hasError: boolean) {
    return `block w-full rounded-xl border ${hasError ? 'border-red-500/60' : 'border-white/10'} bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition`;
}
