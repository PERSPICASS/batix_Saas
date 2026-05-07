import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface Post {
    id: number;
    slug: string;
    title_fr: string;
    title_en: string | null;
    cover_image: string | null;
    author_name: string;
    category: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
}

interface Props {
    posts: Post[];
}

export default function BlogAdminIndex({ posts }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(route('platform.blog.destroy', deleteId), {
            onFinish: () => setDeleteId(null),
        });
    };

    const handleToggle = (id: number) => {
        router.post(route('platform.blog.toggle', id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Blog — Gestion des articles" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Blog</h1>
                        <p className="mt-1 text-sm text-white/60">Gestion des articles publiés sur le site</p>
                    </div>
                    <Link
                        href={route('platform.blog.create')}
                        className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
                    >
                        <Plus className="size-4" />
                        Nouvel article
                    </Link>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {posts.length === 0 ? (
                        <div className="py-16 text-center text-white/40">
                            Aucun article. <Link href={route('platform.blog.create')} className="text-amber-400 underline">Créer le premier</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-white">
                                <thead className="border-b border-white/10 text-white/60">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Article</th>
                                        <th className="px-4 py-3 text-left">Catégorie</th>
                                        <th className="px-4 py-3 text-left">Auteur</th>
                                        <th className="px-4 py-3 text-center">Statut</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-white/5 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {post.cover_image ? (
                                                        <img
                                                            src={`/storage/${post.cover_image}`}
                                                            alt=""
                                                            className="size-10 rounded-lg object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-xl">🔧</div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium leading-tight">{post.title_fr}</p>
                                                        {post.title_en && (
                                                            <p className="text-xs text-white/40 mt-0.5">{post.title_en}</p>
                                                        )}
                                                        <p className="text-xs text-white/30 mt-0.5">{post.created_at}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-white/60">
                                                {post.category ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-white/60">
                                                {post.author_name}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggle(post.id)}
                                                    title={post.is_published ? 'Dépublier' : 'Publier'}
                                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition"
                                                    style={{
                                                        background: post.is_published ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                                                        color: post.is_published ? '#34d399' : '#9ca3af',
                                                    }}
                                                >
                                                    {post.is_published
                                                        ? <><ToggleRight className="size-3.5" /> Publié</>
                                                        : <><ToggleLeft className="size-3.5" /> Brouillon</>}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <a
                                                        href={route('blog.show', post.slug)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Voir sur le site"
                                                        className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                                                    >
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                    <Link
                                                        href={route('platform.blog.edit', post.id)}
                                                        title="Modifier"
                                                        className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-amber-400"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteId(post.id)}
                                                        title="Supprimer"
                                                        className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-red-400"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                show={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Supprimer l'article"
                message="Cette action est irréversible. L'article sera définitivement supprimé."
            />
        </AuthenticatedLayout>
    );
}
