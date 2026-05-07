import { Link } from '@inertiajs/react';
import { SeoHead } from '@/Components/SeoHead';
import { useState, useEffect } from 'react';
import WelcomeHeader from '@/Components/Welcome/WelcomeHeader';
import WelcomeFooter from '@/Components/Welcome/WelcomeFooter';
import type { Locale } from '@/types/types';
import { PageProps } from '@/types';
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
}

export default function BlogShow({ auth, post }: Props) {
    const [locale, setLocale] = useState<Locale>('fr');
    const [scrolled] = useState(false);

    useEffect(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('landing_locale') : null;
        if (saved === 'en') setLocale('en');
    }, []);

    const getDashboardUrl = () => {
        if (!auth.user) return route('register');
        if (auth.user.role === 'admin_platforme') return route('platform.dashboard');
        return route('register');
    };

    const postTitle = (locale === 'en' && post.title_en) ? post.title_en : post.title_fr;
    const postContent = (locale === 'en' && post.content_en) ? post.content_en : post.content_fr;

    const postExcerpt = (locale === 'en' && post.excerpt_en) ? post.excerpt_en : (post.excerpt_fr ?? postTitle);
    const canonicalUrl = `https://batixpro.com/blog/${post.slug}`;

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
            />
            <div className="min-h-screen bg-[#efe7db]">
                <WelcomeHeader
                    locale={locale}
                    setLocale={setLocale}
                    scrolled={scrolled}
                    getDashboardUrl={getDashboardUrl}
                    isAuthenticated={!!auth.user}
                />

                <main className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
                    {/* Retour */}
                    <a
                        href="/#blog"
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
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
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
                    <article
                        className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-amber-700 prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: postContent }}
                    />

                    {/* Retour bas */}
                    <div className="mt-14 border-t border-[#d8cfbe] pt-8">
                        <a
                            href="/#blog"
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                        >
                            <ArrowLeft className="size-4" />
                            {locale === 'fr' ? 'Tous les articles' : 'All articles'}
                        </a>
                    </div>
                </main>

                <WelcomeFooter footerText={locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'} nav={{ demo: 'Démo', features: locale === 'fr' ? 'Fonctionnalités' : 'Features', pricing: locale === 'fr' ? 'Tarifs' : 'Pricing', faq: 'FAQ', contact: 'Contact' }} />
            </div>
        </>
    );
}
