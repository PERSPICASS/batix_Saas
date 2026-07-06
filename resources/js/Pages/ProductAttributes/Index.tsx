import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { PageProps } from '@/types';
import { useRoute } from '@/utils/route';
import { FormEventHandler, useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { useLocale } from '@/contexts/LocaleContext';

interface AttributeValue {
    id: number;
    value: string;
    slug: string;
    order: number;
}

interface Attribute {
    id: number;
    name: string;
    slug: string;
    order: number;
    values: AttributeValue[];
}

export default function ProductAttributesIndex({ attributes }: PageProps<{ attributes: Attribute[] }>) {
    const { t } = useLocale();
    const route = useRoute();
    const [expandedAttributes, setExpandedAttributes] = useState<number[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [addingValueTo, setAddingValueTo] = useState<Attribute | null>(null);
    const [editingValue, setEditingValue] = useState<{ attribute: Attribute; value: AttributeValue } | null>(null);
    const [deleteAttrModal, setDeleteAttrModal] = useState<{ show: boolean; attribute: Attribute | null }>({ show: false, attribute: null });
    const [deleteValueModal, setDeleteValueModal] = useState<{ show: boolean; value: AttributeValue | null }>({ show: false, value: null });
    const [deleting, setDeleting] = useState(false);

    const toggleExpanded = (id: number) => {
        setExpandedAttributes(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Formulaire pour ajouter un attribut
    const addForm = useForm({
        name: '',
        order: 0,
    });

    // Formulaire pour modifier un attribut
    const editForm = useForm({
        name: '',
        order: 0,
    });

    // Formulaire pour ajouter une valeur
    const valueForm = useForm({
        value: '',
        order: 0,
    });

    // Formulaire pour modifier une valeur
    const editValueForm = useForm({
        value: '',
        order: 0,
    });

    const handleAddAttribute: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post(route('product-attributes.store'), {
            onSuccess: () => {
                setShowAddModal(false);
                addForm.reset();
            },
        });
    };

    const handleEditAttribute: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingAttribute) return;
        editForm.patch(route('product-attributes.update', { attribute: editingAttribute.id }), {
            onSuccess: () => {
                setEditingAttribute(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteAttribute = (attribute: Attribute) => {
        setDeleteAttrModal({ show: true, attribute });
    };

    const confirmDeleteAttribute = () => {
        if (!deleteAttrModal.attribute) return;
        setDeleting(true);
        router.delete(route('product-attributes.destroy', { attribute: deleteAttrModal.attribute.id }), {
            onSuccess: () => {
                setDeleteAttrModal({ show: false, attribute: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const handleAddValue: FormEventHandler = (e) => {
        e.preventDefault();
        if (!addingValueTo) return;
        valueForm.post(route('product-attributes.add-value', { attribute: addingValueTo.id }), {
            onSuccess: () => {
                setAddingValueTo(null);
                valueForm.reset();
            },
        });
    };

    const handleEditValue: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingValue) return;
        editValueForm.patch(route('product-attributes.update-value', { value: editingValue.value.id }), {
            onSuccess: () => {
                setEditingValue(null);
                editValueForm.reset();
            },
        });
    };

    const handleDeleteValue = (value: AttributeValue) => {
        setDeleteValueModal({ show: true, value });
    };

    const confirmDeleteValue = () => {
        if (!deleteValueModal.value) return;
        setDeleting(true);
        router.delete(route('product-attributes.destroy-value', { value: deleteValueModal.value.id }), {
            onSuccess: () => {
                setDeleteValueModal({ show: false, value: null });
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const openEditAttribute = (attribute: Attribute) => {
        editForm.setData({ name: attribute.name, order: attribute.order });
        setEditingAttribute(attribute);
    };

    const openEditValue = (attribute: Attribute, value: AttributeValue) => {
        editValueForm.setData({ value: value.value, order: value.order });
        setEditingValue({ attribute, value });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900 dark:text-white">Attributs de produits</h1>}>
            <Head title="Attributs de produits" />
            
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Gérez les attributs de variation de vos produits (couleur, taille, poids, etc.)
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
                    >
                        <Plus className="size-4" /> Nouvel attribut
                    </button>
                </div>

                {/* Liste des attributs */}
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
                    {attributes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Tags className="size-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucun attribut</p>
                            <p className="text-sm">Créez des attributs pour gérer les variations de vos produits.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700">
                            {attributes.map((attribute) => (
                                <div key={attribute.id}>
                                    {/* En-tête de l'attribut */}
                                    <div className="flex items-center justify-between p-4 hover:bg-slate-700/30">
                                        <button
                                            onClick={() => toggleExpanded(attribute.id)}
                                            className="flex items-center gap-3 flex-1"
                                        >
                                            {expandedAttributes.includes(attribute.id) ? (
                                                <ChevronDown className="size-5 text-slate-500 dark:text-slate-400" />
                                            ) : (
                                                <ChevronRight className="size-5 text-slate-500 dark:text-slate-400" />
                                            )}
                                            <div className="text-left">
                                                <h3 className="font-medium text-slate-900 dark:text-white">{attribute.name}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {attribute.values.length} valeur{attribute.values.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setAddingValueTo(attribute)}
                                                className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-700 rounded"
                                                title="Ajouter une valeur"
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditAttribute(attribute)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"
                                                title={t.common.actions.edit || "Modifier"}
                                            >
                                                <Pencil className="size-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAttribute(attribute)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                                                title={t.common.actions.delete || "Supprimer"}
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Valeurs de l'attribut */}
                                    {expandedAttributes.includes(attribute.id) && (
                                        <div className="bg-slate-800/80 border-t border-slate-700 p-4 pl-12">
                                            {attribute.values.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">
                                                    Aucune valeur définie. Ajoutez des valeurs pour cet attribut.
                                                </p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {attribute.values.map((value) => (
                                                        <div
                                                            key={value.id}
                                                            className="group inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1.5 text-sm"
                                                        >
                                                            <span className="text-slate-900 dark:text-white">{value.value}</span>
                                                            <button
                                                                onClick={() => openEditValue(attribute, value)}
                                                                className="ml-1 p-0.5 text-slate-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Pencil className="size-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteValue(value)}
                                                                className="p-0.5 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="size-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Modal: Ajouter un attribut */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Nouvel attribut</h2>
                        <form onSubmit={handleAddAttribute} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nom de l'attribut
                                </label>
                                <input
                                    type="text"
                                    value={addForm.data.name}
                                    onChange={(e) => addForm.setData('name', e.target.value)}
                                    placeholder="Ex: Couleur, Taille, Poids..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    autoFocus
                                />
                                {addForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-400">{addForm.errors.name}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Modifier un attribut */}
            {editingAttribute && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Modifier l'attribut</h2>
                        <form onSubmit={handleEditAttribute} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nom de l'attribut
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    autoFocus
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-400">{editForm.errors.name}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingAttribute(null)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Ajouter une valeur */}
            {addingValueTo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Ajouter une valeur à "{addingValueTo.name}"
                        </h2>
                        <form onSubmit={handleAddValue} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Valeur
                                </label>
                                <input
                                    type="text"
                                    value={valueForm.data.value}
                                    onChange={(e) => valueForm.setData('value', e.target.value)}
                                    placeholder="Ex: Rouge, XL, 500g..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    autoFocus
                                />
                                {valueForm.errors.value && (
                                    <p className="mt-1 text-sm text-red-400">{valueForm.errors.value}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddingValueTo(null)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={valueForm.processing}
                                    className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Modifier une valeur */}
            {editingValue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Modifier la valeur</h2>
                        <form onSubmit={handleEditValue} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Valeur
                                </label>
                                <input
                                    type="text"
                                    value={editValueForm.data.value}
                                    onChange={(e) => editValueForm.setData('value', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    autoFocus
                                />
                                {editValueForm.errors.value && (
                                    <p className="mt-1 text-sm text-red-400">{editValueForm.errors.value}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingValue(null)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={editValueForm.processing}
                                    className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de suppression attribut */}
            <ConfirmDeleteModal
                show={deleteAttrModal.show}
                onClose={() => setDeleteAttrModal({ show: false, attribute: null })}
                onConfirm={confirmDeleteAttribute}
                message={`Êtes-vous sûr de vouloir supprimer l'attribut "${deleteAttrModal.attribute?.name}" et toutes ses valeurs ?`}
                processing={deleting}
            />

            {/* Modal de suppression valeur */}
            <ConfirmDeleteModal
                show={deleteValueModal.show}
                onClose={() => setDeleteValueModal({ show: false, value: null })}
                onConfirm={confirmDeleteValue}
                message={`Êtes-vous sûr de vouloir supprimer la valeur "${deleteValueModal.value?.value}" ?`}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
