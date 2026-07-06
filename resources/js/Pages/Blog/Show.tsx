import { SeoHead } from '@/Components/SeoHead';
import PublicLayout from '@/Layouts/PublicLayout';
import type { Locale } from '@/types/types';
import { PageProps } from '@/types';
import { useDashboardUrl } from '@/hooks/useDashboardUrl';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';

interface Post {
    id: number;
    slug: string;
    title_fr: string;
    title_en: string | null;
    excerpt_fr: string | null;
    excerpt_en: string | null;
    content_fr: string;
    content_en: string | null;
    cover_image: string | null;
    author_name: string;
    category: string | null;
    published_at: string | null;
}

interface Props extends PageProps {
    post: Post;
    locale: Locale;
    localeLinks: Record<Locale, string>;
}

export default function BlogShow({ auth, post, locale, localeLinks }: Props) {
    const getDashboardUrl = useDashboardUrl(auth);

    const postTitle = (locale === 'en' && post.title_en) ? post.title_en : post.title_fr;
    const postContent = (locale === 'en' && post.content_en) ? post.content_en : post.content_fr;

    const postExcerpt = (locale === 'en' && post.excerpt_en) ? post.excerpt_en : (post.excerpt_fr ?? postTitle);
    const canonicalUrl = localeLinks[locale];

    return (
        <>
            <SeoHead
                title={postTitle}
                description={postExcerpt}
                ogImage={post.cover_image ? `https://batixpro.com/storage/${post.cover_image}` : undefined}
                ogLocale={locale === 'fr' ? 'fr_FR' : 'en_US'}
                canonical={canonicalUrl}
                ogType="article"
                publishedAt={post.published_at ?? undefined}
                author={post.author_name}
                hreflangAlternates={[
                    { locale: 'fr', href: localeLinks.fr },
                    { locale: 'en', href: localeLinks.en },
                    { locale: 'x-default', href: localeLinks.fr },
                ]}
            />

            <PublicLayout
                locale={locale}
                localeLinks={localeLinks}
                isAuthenticated={!!auth.user}
                getDashboardUrl={getDashboardUrl}
            >
                <main className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
                    {/* Retour */}
                    <a
                        href={route('blog.index')}
                        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
                    >
                        <ArrowLeft className="size-4" />
                        {locale === 'fr' ? 'Retour au blog' : 'Back to blog'}
                    </a>

                    {/* Cover */}
                    {post.cover_image && (
                        <img
                            src={`/storage/${post.cover_image}`}
                            alt={postTitle}
                            className="mb-8 w-full rounded-2xl object-cover shadow"
                            style={{ maxHeight: '420px' }}
                        />
                    )}

                    {/* Meta */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        {post.category && (
                            <span className="flex items-center gap-1 rounded-full bg-terre-50 px-3 py-1 text-xs font-medium text-terre-700">
                                <Tag className="size-3" />
                                {post.category}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <User className="size-4" />
                            {post.author_name}
                        </span>
                        {post.published_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="size-4" />
                                {new Date(post.published_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </span>
                        )}
                    </div>

                    {/* Titre */}
                    <h1 className="mb-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                        {postTitle}
                    </h1>

                    {/* Contenu */}
                    <style>{`
                        .blog-content h2 {
                            font-size: 1.5rem;
                            font-weight: 700;
                            color: #0f172a;
                            margin-top: 2.5rem;
                            margin-bottom: 1rem;
                            padding-bottom: 0.5rem;
                            border-bottom: 2px solid #D69A6B;
                        }
                        .blog-content h3 {
                            font-size: 1.15rem;
                            font-weight: 700;
                            color: #1e293b;
                            margin-top: 2rem;
                            margin-bottom: 0.75rem;
                        }
                        .blog-content p {
                            color: #334155;
                            line-height: 1.85;
                            margin-bottom: 1.25rem;
                            font-size: 1rem;
                        }
                        .blog-content ul {
                            list-style: none;
                            padding: 0;
                            margin: 0 0 1.5rem 0;
                            display: flex;
                            flex-direction: column;
                            gap: 0.6rem;
                        }
                        .blog-content ul li {
                            display: flex;
                            align-items: flex-start;
                            gap: 0.6rem;
                            color: #334155;
                            line-height: 1.7;
                        }
                        .blog-content ul li::before {
                            content: '';
                            display: block;
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: #B06333;
                            flex-shrink: 0;
                            margin-top: 0.5rem;
                        }
                        .blog-content strong {
                            color: #0f172a;
                            font-weight: 700;
                        }
                        .blog-content a {
                            color: #7E4024;
                            text-decoration: underline;
                        }
                        .blog-content a:hover {
                            color: #5C2F1B;
                        }
                    `}</style>
                    <article
                        className="blog-content"
                        dangerouslySetInnerHTML={{ __html: postContent }}
                    />

                    {/* Retour bas */}
                    <div className="mt-14 border-t border-gray-200 pt-8">
                        <a
                            href={route('blog.index')}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                        >
                            <ArrowLeft className="size-4" />
                            {locale === 'fr' ? 'Tous les articles' : 'All articles'}
                        </a>
                    </div>
                </main>
            </PublicLayout>
        </>
    );
}
