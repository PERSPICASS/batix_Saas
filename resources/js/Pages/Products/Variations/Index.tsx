import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Copy, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { PageProps } from '@/types';
import Table, { TableActions, TableActionButton, TableBadge } from '@/Components/Table';
import Currency from '@/Components/Currency';
import { useRoute } from '@/utils/route';
import { FormEventHandler, useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface Variation {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    is_active: boolean;
}

interface Product {
    id: number;
    name: string;
    brand: string | null;
    sku: string | null;
    selling_price: number;
    purchase_price: number;
    category: { id: number; name: string } | null;
}

interface Props extends PageProps {
    product: Product;
    variations: Variation[];
}

export default function VariationsIndex({ product, variations }: Props) {
    const { t } = useLocale();
    const route = useRoute();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; variation: Variation | null }>({ show: false, variation: null });
    const [deleting, setDeleting] = useState(false);

    // Formulaire simplifié - juste nom, prix et stock
    const addForm = useForm({
        name: '',
        purchase_price: product.purchase_price.toString(),
        selling_price: product.selling_price.toString(),
        stock_quantity: '0',
    });

    const editForm = useForm({
        name: '',
        purchase_price: '',
        selling_price: '',
        stock_quantity: '',
        is_active: true,
    });

    const handleAddVariation: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post(route('products.variations.store', { product: product.id }), {
            onSuccess: () => {
                setShowAddModal(false);
                addForm.reset();
                addForm.setData({
                    name: '',
                    purchase_price: product.purchase_price.toString(),
                    selling_price: product.selling_price.toString(),
                    stock_quantity: '0',
                });
            },
        });
    };

    const handleEditVariation: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingVariation) return;
        editForm.patch(route('products.variations.update', { product: product.id, variation: editingVariation.id }), {
            onSuccess: () => {
                setEditingVariation(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteVariation = (variation: Variation) => {
        setDeleteModal({ show: true, variation });
    };

    const confirmDelete = () => {
        if (!deleteModal.variation) return;
        setDeleting(true);
        router.delete(route('products.variations.destroy', { product: product.id, variation: deleteModal.variation.id }), {
            onSuccess: () => {
                setDeleteModal({ show: false, variation: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const openEditModal = (variation: Variation) => {
        editForm.setData({
            name: variation.name,
            purchase_price: variation.purchase_price.toString(),
            selling_price: variation.selling_price.toString(),
            stock_quantity: variation.stock_quantity.toString(),
            is_active: variation.is_active,
        });
        setEditingVariation(variation);
    };

    // Dupliquer une variation
    const duplicateVariation = (variation: Variation) => {
        addForm.setData({
            name: variation.name + ' (copie)',
            purchase_price: variation.purchase_price.toString(),
            selling_price: variation.selling_price.toString(),
            stock_quantity: '0',
        });
        setShowAddModal(true);
    };

    // Suggestions de noms basées sur le produit
    const nameSuggestions = [
        `${product.name} - 1L`,
        `${product.name} - 5L`,
        `${product.name} - 10L`,
        `${product.name} - Petit`,
        `${product.name} - Moyen`,
        `${product.name} - Grand`,
    ];

    const columns = [
        {
            key: 'name',
            label: 'Déclinaison',
            render: (variation: Variation) => (
                <div>
                    <div className="font-medium text-white">{variation.name}</div>
                    {variation.sku && (
                        <div className="text-xs text-slate-500 font-mono">{variation.sku}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'purchase_price',
            label: 'Prix achat',
            align: 'right' as const,
            render: (variation: Variation) => (
                <span className="text-slate-400">
                    <Currency amount={variation.purchase_price} />
                </span>
            ),
        },
        {
            key: 'selling_price',
            label: 'Prix vente',
            align: 'right' as const,
            render: (variation: Variation) => <Currency amount={variation.selling_price} />,
        },
        {
            key: 'stock_quantity',
            label: 'Stock',
            align: 'center' as const,
            render: (variation: Variation) => (
                <span className={variation.stock_quantity <= 0 ? 'text-red-400' : ''}>
                    {variation.stock_quantity}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Statut',
            align: 'center' as const,
            render: (variation: Variation) => (
                <TableBadge variant={variation.is_active ? 'success' : 'danger'}>
                    {variation.is_active ? 'Actif' : 'Inactif'}
                </TableBadge>
            ),
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (variation: Variation) => (
                <TableActions>
                    <TableActionButton onClick={() => duplicateVariation(variation)}>
                        <Copy className="size-3.5" />
                    </TableActionButton>
                    <TableActionButton onClick={() => openEditModal(variation)}>
                        <Pencil className="size-3.5" />
                    </TableActionButton>
                    <TableActionButton
                        variant="danger"
                        onClick={() => handleDeleteVariation(variation)}
                    >
                        <Trash2 className="size-3.5" />
                    </TableActionButton>
                </TableActions>
            ),
        },
    ];

    // Calcul du stock total
    const totalStock = variations.reduce((sum, v) => sum + v.stock_quantity, 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('products.index')}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                        title="Retour aux produits"
                    >
                        <ArrowLeft className="size-5 text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-white">Déclinaisons</h1>
                    </div>
                </div>
            }
        >
            <Head title={`Déclinaisons - ${product.name}`} />

            <section className="space-y-6">
                {/* Carte produit parent - simplifiée */}
                <div className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex size-14 items-center justify-center rounded-xl bg-amber-300/10 border border-amber-300/20">
                                <Layers className="size-7 text-amber-300" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{product.name}</h2>
                                <p className="text-sm text-slate-400">
                                    {product.brand && <span>{product.brand} • </span>}
                                    {product.category?.name || 'Sans catégorie'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                                <Currency amount={product.selling_price} />
                            </div>
                            <p className="text-xs text-slate-500">Prix de base</p>
                        </div>
                    </div>
                    
                    {/* Stats rapides */}
                    <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-300">{variations.length}</div>
                            <div className="text-xs text-slate-400">Déclinaison{variations.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{totalStock}</div>
                            <div className="text-xs text-slate-400">Stock total</div>
                        </div>
                    </div>
                </div>

                {/* Bouton d'ajout */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 transition shadow-lg shadow-amber-300/20"
                    >
                        <Plus className="size-4" /> Ajouter une déclinaison
                    </button>
                </div>

                {/* Liste des variations */}
                {variations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/30 p-12 text-center">
                        <Layers className="size-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Aucune déclinaison</h3>
                        <p className="text-slate-400 mb-6 max-w-md mx-auto">
                            Ajoutez des déclinaisons pour gérer différentes versions de ce produit 
                            (ex: différentes tailles, couleurs ou contenances).
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                        >
                            <Plus className="size-4" /> Créer ma première déclinaison
                        </button>
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={variations}
                    />
                )}
            </section>

            {/* Modal: Ajouter - Ultra simplifié */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-xl bg-slate-800 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white">Nouvelle déclinaison</h2>
                            <button 
                                onClick={() => setShowAddModal(false)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddVariation} className="p-5 space-y-5">
                            {/* Nom avec suggestions */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nom de la déclinaison
                                </label>
                                <input
                                    type="text"
                                    value={addForm.data.name}
                                    onChange={(e) => addForm.setData('name', e.target.value)}
                                    placeholder={`Ex: ${product.name} - 5L`}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    autoFocus
                                />
                                {/* Suggestions rapides */}
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {nameSuggestions.slice(0, 3).map((suggestion, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => addForm.setData('name', suggestion)}
                                            className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition"
                                        >
                                            {suggestion.replace(product.name + ' - ', '')}
                                        </button>
                                    ))}
                                </div>
                                {addForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-400">{addForm.errors.name}</p>
                                )}
                            </div>

                            {/* Prix côte à côte */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Prix d'achat
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={addForm.data.purchase_price}
                                        onChange={(e) => addForm.setData('purchase_price', e.target.value)}
                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Prix de vente
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={addForm.data.selling_price}
                                        onChange={(e) => addForm.setData('selling_price', e.target.value)}
                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    />
                                </div>
                            </div>

                            {/* Stock */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Stock initial
                                </label>
                                <input
                                    type="number"
                                    value={addForm.data.stock_quantity}
                                    onChange={(e) => addForm.setData('stock_quantity', e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                />
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing || !addForm.data.name}
                                    className="flex-1 rounded-lg bg-amber-300 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                                >
                                    {addForm.processing ? 'Création...' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Modifier */}
            {editingVariation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-xl bg-slate-800 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white">Modifier</h2>
                            <button 
                                onClick={() => setEditingVariation(null)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditVariation} className="p-5 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Prix d'achat
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={editForm.data.purchase_price}
                                        onChange={(e) => editForm.setData('purchase_price', e.target.value)}
                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Prix de vente
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={editForm.data.selling_price}
                                        onChange={(e) => editForm.setData('selling_price', e.target.value)}
                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Stock
                                </label>
                                <input
                                    type="number"
                                    value={editForm.data.stock_quantity}
                                    onChange={(e) => editForm.setData('stock_quantity', e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.data.is_active}
                                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                    className="size-5 rounded border-slate-600 bg-slate-700 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-300">Déclinaison active (visible à la vente)</span>
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingVariation(null)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="flex-1 rounded-lg bg-amber-300 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50 transition"
                                >
                                    {editForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de suppression */}
            <ConfirmDeleteModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, variation: null })}
                onConfirm={confirmDelete}
                message={`Êtes-vous sûr de vouloir supprimer la déclinaison "${deleteModal.variation?.name}" ?`}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
