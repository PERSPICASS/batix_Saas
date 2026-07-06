import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import axios from 'axios';
import { useRoute } from '@/utils/route';

interface Article {
    id: number;
    name: string;
    status: 'available' | 'sold' | 'archived';
    created_at: string;
}

interface Props {
    productId: number;
    productName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductArticleModal({ productId, productName, isOpen, onClose }: Props) {
    const route = useRoute();
    const [articles, setArticles] = useState<Article[]>([]);
    const [newArticleName, setNewArticleName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadArticles();
        }
    }, [isOpen, productId]);

    const loadArticles = async () => {
        try {
            const response = await axios.get(
                route('articles.list', { productId })
            );
            setArticles(response.data.articles);
        } catch (err) {
            setError('Erreur lors du chargement des articles');
        }
    };

    const handleAddArticle = async () => {
        if (!newArticleName.trim()) {
            setError('Veuillez entrer un nom');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(route('articles.store'), {
                product_id: productId,
                name: newArticleName,
            });

            setArticles([response.data.article, ...articles]);
            setNewArticleName('');
            setSuccess('Article créé');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (articleId: number, newStatus: string) => {
        try {
            const response = await axios.patch(
                route('articles.update-status', { productArticle: articleId }),
                { status: newStatus }
            );

            setArticles(
                articles.map((a) =>
                    a.id === articleId ? response.data.article : a
                )
            );
            setSuccess('Statut mis à jour');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Erreur');
        }
    };

    const handleDeleteArticle = async (articleId: number) => {
        if (!confirm('Confirmer la suppression?')) return;

        try {
            await axios.delete(
                route('articles.destroy', { productArticle: articleId })
            );
            setArticles(articles.filter((a) => a.id !== articleId));
            setSuccess('Article supprimé');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Erreur');
        }
    };

    if (!isOpen) return null;

    const statusColors = {
        available: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
        sold: 'bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
        archived: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };

    const statusLabels = {
        available: '✅ Disponible',
        sold: '✓ Vendu',
        archived: '🗂️ Archivé',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Tag className="size-5 text-amber-500 dark:text-amber-300" />
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Articles
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{productName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-2 text-slate-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                        {success}
                    </div>
                )}

                {/* Add Article */}
                <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-900/40">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Ajouter un article
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newArticleName}
                            onChange={(e) => setNewArticleName(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && handleAddArticle()
                            }
                            placeholder="Ex: Chaise IKEA - Lot février 2024 - Blanche"
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-300 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder-slate-600"
                            disabled={loading}
                        />
                        <button
                            onClick={handleAddArticle}
                            disabled={loading || !newArticleName.trim()}
                            className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                        >
                            <Plus className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Articles List */}
                <div className="max-h-96 space-y-2 overflow-y-auto">
                    {articles.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 dark:text-slate-500">
                            Aucun article
                        </p>
                    ) : (
                        articles.map((article) => (
                            <div
                                key={article.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-900/40"
                            >
                                <div className="flex-1">
                                    <p className="text-slate-800 dark:text-slate-200">{article.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(article.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Status Dropdown */}
                                    <select
                                        value={article.status}
                                        onChange={(e) =>
                                            handleUpdateStatus(article.id, e.target.value)
                                        }
                                        className={`rounded px-3 py-1 text-sm font-medium border-0 focus:outline-none ${
                                            statusColors[article.status]
                                        }`}
                                    >
                                        <option value="available">
                                            {statusLabels.available}
                                        </option>
                                        <option value="sold">
                                            {statusLabels.sold}
                                        </option>
                                        <option value="archived">
                                            {statusLabels.archived}
                                        </option>
                                    </select>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteArticle(article.id)}
                                        className="rounded p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-6 py-2 text-slate-700 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
