/**
 * Exemple de composant React utilisant les nouvelles routes personnalisées
 * 
 * Ce fichier montre comment utiliser les helpers de route dans un composant React
 */

import { Head, Link, router } from '@inertiajs/react';
import { UserLink, useUserRoute, useCurrentShop, useRouteParams } from '@/utils/route';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Product {
    id: number;
    name: string;
    price: number;
    slug: string;
}

interface ProductListProps extends PageProps {
    products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
    // Hook pour générer des routes facilement
    const buildRoute = useUserRoute();
    
    // Accéder à la boutique actuelle
    const shop = useCurrentShop();
    
    // Accéder aux paramètres de route
    const routeParams = useRouteParams();
    
    console.log('Code utilisateur:', routeParams.code_user);
    console.log('Boutique:', shop?.name);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Produits - {shop?.name}
                    </h2>
                    
                    {/* Méthode 1: UserLink component */}
                    <UserLink
                        route="products.create"
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Ajouter un produit
                    </UserLink>
                </div>
            }
        >
            <Head title="Produits" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="grid gap-4">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="border p-4 rounded hover:bg-gray-50"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    {product.name}
                                                </h3>
                                                <p className="text-gray-600">
                                                    {product.price} €
                                                </p>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {/* Méthode 2: Link avec useUserRoute hook */}
                                                <Link
                                                    href={buildRoute('products.show', {
                                                        product: product.id
                                                    })}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Voir
                                                </Link>
                                                
                                                {/* Méthode 3: UserLink avec params */}
                                                <UserLink
                                                    route="products.edit"
                                                    params={{ product: product.id }}
                                                    className="text-green-600 hover:underline"
                                                >
                                                    Modifier
                                                </UserLink>
                                                
                                                {/* Méthode 4: Bouton avec action */}
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Supprimer ce produit?')) {
                                                            // Utilisation du helper pour DELETE request
                                                            router.delete(
                                                                buildRoute('products.destroy', {
                                                                    product: product.id
                                                                })
                                                            );
                                                        }
                                                    }}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Navigation */}
                            <div className="mt-6 flex gap-4">
                                <UserLink
                                    route="dashboard"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    ← Retour au tableau de bord
                                </UserLink>
                                
                                <UserLink
                                    route="categories.index"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    Gérer les catégories
                                </UserLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
