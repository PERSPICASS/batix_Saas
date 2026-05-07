import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import RichEditor from '@/Components/RichEditor';

export default function BlogCreate() {
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
            <Head title="Nouvel article — Blog" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('platform.blog.index')}
                        className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Nouvel article</h1>
                        <p className="mt-1 text-sm text-white/60">Rédigez et publiez un article de blog</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Contenu principal */}
                        <div className="space-y-5 lg:col-span-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Contenu</h2>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="Titre (FR) *" error={errors.title_fr}>
                                        <input
                                            type="text"
                                            value={data.title_fr}
                                            onChange={e => setData('title_fr', e.target.value)}
                                            placeholder="Titre en français"
                                            className={inputClass(!!errors.title_fr)}
                                        />
                                    </Field>
                                    <Field label="Titre (EN)" error={errors.title_en}>
                                        <input
                                            type="text"
                                            value={data.title_en}
                                            onChange={e => setData('title_en', e.target.value)}
                                            placeholder="Title in English"
                                            className={inputClass(false)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="Extrait (FR)" error={errors.excerpt_fr}>
                                        <textarea
                                            rows={3}
                                            value={data.excerpt_fr}
                                            onChange={e => setData('excerpt_fr', e.target.value)}
                                            placeholder="Résumé court en français..."
                                            className={inputClass(false)}
                                        />
                                    </Field>
                                    <Field label="Extrait (EN)" error={errors.excerpt_en}>
                                        <textarea
                                            rows={3}
                                            value={data.excerpt_en}
                                            onChange={e => setData('excerpt_en', e.target.value)}
                                            placeholder="Short summary in English..."
                                            className={inputClass(false)}
                                        />
                                    </Field>
                                </div>

                                <Field label="Contenu (FR) *" error={errors.content_fr}>
                                    <RichEditor
                                        value={data.content_fr}
                                        onChange={v => setData('content_fr', v)}
                                        placeholder="Contenu de l'article en français..."
                                        rows={14}
                                    />
                                </Field>

                                <Field label="Contenu (EN)" error={errors.content_en}>
                                    <RichEditor
                                        value={data.content_en}
                                        onChange={v => setData('content_en', v)}
                                        placeholder="Article content in English..."
                                        rows={14}
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Paramètres</h2>

                                <Field label="Auteur" error={errors.author_name}>
                                    <input
                                        type="text"
                                        value={data.author_name}
                                        onChange={e => setData('author_name', e.target.value)}
                                        className={inputClass(false)}
                                    />
                                </Field>

                                <Field label="Catégorie" error={errors.category}>
                                    <input
                                        type="text"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                        placeholder="ex. Conseils, Actualités..."
                                        className={inputClass(false)}
                                    />
                                </Field>

                                <Field label="Image de couverture" error={errors.cover_image as string}>
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
                                    <span className="text-sm text-white/70">Publier immédiatement</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {processing ? 'Enregistrement...' : 'Créer l\'article'}
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
