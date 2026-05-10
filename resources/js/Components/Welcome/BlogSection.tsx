import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Tag, User } from 'lucide-react';
import { fadeUp, stagger } from '../../types/data';
import type { Locale } from '../../types/types';

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

interface BlogSectionProps {
    locale: Locale;
    posts?: Post[];
}

export default function BlogSection({ locale, posts = [] }: BlogSectionProps) {
    const safePosts = posts ?? [];

    const getTitle = (post: Post) => (locale === 'en' && post.title_en) ? post.title_en : post.title_fr;
    const getExcerpt = (post: Post) => (locale === 'en' && post.excerpt_en) ? post.excerpt_en : post.excerpt_fr;

    return (
        <motion.section
            id="blog"
            className="w-full scroll-mt-24 bg-[#efe7db] py-16 md:py-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.05 }}
            variants={stagger}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* En-tête */}
                <motion.div className="mb-10" variants={fadeUp}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                        {locale === 'fr' ? 'Ressources' : 'Resources'}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                        {locale === 'fr' ? 'Blog & Conseils' : 'Blog & Tips'}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base text-slate-600">
                        {locale === 'fr'
                            ? 'Conseils pratiques, actualités et guides pour mieux gérer votre quincaillerie au quotidien.'
                            : 'Practical tips, news and guides to better manage your hardware store day to day.'}
                    </p>
                </motion.div>

                {safePosts.length === 0 ? (
                    <motion.div
                        variants={fadeUp}
                        className="rounded-2xl border border-dashed border-[#c8bfaf] bg-white/40 py-16 text-center text-slate-500"
                    >
                        <p className="text-base">
                            {locale === 'fr' ? 'Bientôt disponible — nos premiers articles arrivent.' : 'Coming soon — our first articles are on the way.'}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                        variants={stagger}
                    >
                        {safePosts.map((post) => (
                            <motion.div key={post.id} variants={fadeUp}>
                                <Link
                                    href={route('blog.show', post.slug)}
                                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#d8cfbe] bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {post.cover_image ? (
                                        <img
                                            src={`/storage/${post.cover_image}`}
                                            alt={getTitle(post)}
                                            className="h-44 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-44 items-center justify-center bg-amber-100 text-4xl">
                                            🔧
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col gap-3 p-5">
                                        {post.category && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
                                                <Tag className="size-3" />
                                                {post.category}
                                            </div>
                                        )}

                                        <h3 className="text-base font-semibold leading-snug text-slate-900 transition group-hover:text-amber-700">
                                            {getTitle(post)}
                                        </h3>

                                        {getExcerpt(post) && (
                                            <p className="line-clamp-2 text-sm text-slate-600">
                                                {getExcerpt(post)}
                                            </p>
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

                                        <div className="flex items-center gap-1 text-sm font-medium text-amber-700">
                                            {locale === 'fr' ? "Lire l'article" : 'Read more'}
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {safePosts.length > 0 && (
                    <motion.div className="mt-10 text-center" variants={fadeUp}>
                        <Link
                            href={route('blog.index')}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#d8cfbe] bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
                        >
                            {locale === 'fr' ? 'Voir tous les articles' : 'View all articles'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </motion.section>
    );
}
