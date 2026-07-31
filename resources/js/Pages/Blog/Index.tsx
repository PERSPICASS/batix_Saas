import { Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SeoHead } from '@/Components/SeoHead';
import { PageProps } from '@/types';
import type { Locale } from '@/types/types';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import { breadcrumbSchema } from '@/utils/seoSchemas';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Post {
    id: number;
    slug: string;
    title_fr: string;
    title_en: string | null;
    excerpt_fr: string | null;
    excerpt_en: string | null;
    cover_image: string | null;
    author_name: string;
    category: string | null;
    published_at: string | null;
}

interface Props extends PageProps {
    posts: Post[];
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function BlogIndex({ auth, appUrl, posts, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);
    const isFr = locale === 'fr';

    const getTitle = (post: Post) => (locale === 'en' && post.title_en) ? post.title_en : post.title_fr;
    const getExcerpt = (post: Post) => (locale === 'en' && post.excerpt_en) ? post.excerpt_en : post.excerpt_fr;

    const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[];
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const filtered = activeCategory ? posts.filter(p => p.category === activeCategory) : posts;

    const canonicalUrl = localeLinks[locale];

    const seoTitle = isFr ? 'Blog – Conseils quincaillerie' : 'Blog – Hardware Store Tips';
    const seoDescription = isFr
        ? 'Conseils pratiques pour gérer une quincaillerie : stock, caisse, multi-boutiques et rentabilité.'
        : 'Practical advice for running a hardware store: stock, POS, multi-store management and profitability.';

    // ItemList : annonce les articles listés ici, dans l'ordre affiché. Non filtré par
    // catégorie — le filtre est un état client, alors que le balisage doit décrire la
    // page telle qu'un crawler la reçoit.
    const blogSchema = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: `${seoTitle} | BATIX PRO`,
        description: seoDescription,
        url: canonicalUrl,
        inLanguage: isFr ? 'fr-FR' : 'en-US',
        publisher: { '@id': `${appUrl}/#organization` },
        blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: getTitle(post),
            url: isFr ? `${appUrl}/blog/${post.slug}` : `${appUrl}/en/blog/${post.slug}`,
            ...(post.published_at ? { datePublished: post.published_at } : {}),
            author: { '@type': 'Person', name: post.author_name },
        })),
    };

    const breadcrumb = breadcrumbSchema(appUrl, [{ name: 'Blog', item: canonicalUrl }]);

    return (
        <>
            <SeoHead
                title={seoTitle}
                description={seoDescription}
                canonical={canonicalUrl}
                ogLocale={isFr ? 'fr_FR' : 'en_US'}
                hreflangAlternates={[
                    { locale: 'fr', href: localeLinks.fr },
                    { locale: 'en', href: localeLinks.en },
                    { locale: 'x-default', href: localeLinks.fr },
                ]}
                jsonLd={[blogSchema, breadcrumb]}
            />

            <PublicLayout
                locale={locale}
                localeLinks={localeLinks}
                isAuthenticated={!!auth.user}
                getDashboardUrl={getDashboardUrl}
            >
                <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                    {/* En-tête */}
                    <div className="mb-12">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terre-700">
                            {locale === 'fr' ? 'Ressources' : 'Resources'}
                        </p>
                        <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
                            {locale === 'fr' ? 'Blog & Conseils' : 'Blog & Tips'}
                        </h1>
                        <p className="mt-3 max-w-2xl text-base text-slate-600">
                            {locale === 'fr'
                                ? 'Conseils pratiques, actualités et guides pour mieux gérer votre quincaillerie au quotidien.'
                                : 'Practical tips, news and guides to better manage your hardware store day to day.'}
                        </p>

                        {categories.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                        activeCategory === null
                                            ? 'bg-terre-600 text-white'
                                            : 'bg-white border border-gray-200 text-slate-600 hover:border-terre-300'
                                    }`}
                                >
                                    {locale === 'fr' ? 'Tous' : 'All'}
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                            activeCategory === cat
                                                ? 'bg-terre-600 text-white'
                                                : 'bg-white border border-gray-200 text-slate-600 hover:border-terre-300'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Grille */}
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-slate-500">
                            <p>{locale === 'fr' ? 'Aucun article dans cette catégorie.' : 'No articles in this category.'}</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((post) => (
                                <Link
                                    key={post.id}
                                    href={route('blog.show', post.slug)}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {post.cover_image ? (
                                        <img
                                            src={`/storage/${post.cover_image}`}
                                            alt={getTitle(post)}
                                            className="h-44 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-44 items-center justify-center bg-terre-50 text-4xl">🔧</div>
                                    )}

                                    <div className="flex flex-1 flex-col gap-3 p-5">
                                        {post.category && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-terre-700">
                                                <Tag className="size-3" />
                                                {post.category}
                                            </div>
                                        )}

                                        <h2 className="text-base font-semibold leading-snug text-slate-900 transition group-hover:text-terre-700">
                                            {getTitle(post)}
                                        </h2>

                                        {getExcerpt(post) && (
                                            <p className="line-clamp-2 text-sm text-slate-600">{getExcerpt(post)}</p>
                                        )}

                                        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <User className="size-3" />
                                                {post.author_name}
                                            </span>
                                            {post.published_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {new Date(post.published_at).toLocaleDateString(
                                                        locale === 'fr' ? 'fr-FR' : 'en-US',
                                                        { year: 'numeric', month: 'short', day: 'numeric' }
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 text-sm font-medium text-terre-700">
                                            {locale === 'fr' ? "Lire l'article" : 'Read more'}
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </PublicLayout>
        </>
    );
}
