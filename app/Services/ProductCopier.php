<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;

/**
 * Retrouver un produit dans une autre boutique du compte, ou l'y créer.
 *
 * Partagé par la copie de catalogue (ShopController::transferProducts) et les transferts de
 * stock (StockTransferService) : une même référence doit être reconnue de la même façon,
 * sinon un transfert créerait un doublon de ce que la copie avait déjà recréé.
 */
class ProductCopier
{
    /** Une même catégorie revient sur des centaines de produits : une requête par nom. */
    private array $categoryIdsByName = [];

    /**
     * L'équivalent de la catégorie du produit dans la boutique de destination.
     *
     * Rapproché par nom : les catégories sont propres à chaque boutique, donc l'identifiant
     * de la source n'y a aucun sens. Null si elle n'existe pas là-bas — mieux vaut un
     * produit sans catégorie qu'un produit rangé chez le voisin.
     */
    private function matchingCategoryIn(Shop $target, Product $source): ?int
    {
        if (!$source->category) {
            return null;
        }

        // Une même catégorie revient sur des centaines de produits : une requête par nom.
        $name = $source->category->name;

        if (!array_key_exists($name, $this->categoryIdsByName[$target->id] ?? [])) {
            $this->categoryIdsByName[$target->id][$name] = Category::where('shop_id', $target->id)
                ->where('name', $name)
                ->value('id');
        }

        return $this->categoryIdsByName[$target->id][$name];
    }

    /**
     * Le produit déjà présent dans la boutique de destination, s'il y est.
     *
     * Le SKU d'abord, puis le couple NOM + MARQUE — pas le nom seul. Le nom seul faisait
     * passer pour des doublons tous les produits homonymes : sur un catalogue de 3048
     * références n'ayant que 1031 noms distincts, la copie n'en créait que 1031.
     * Nom + marque est aussi ce sur quoi les imports rapprochent leurs lignes.
     *
     * Le niveau compte également : une déclinaison « Rouge 5L » n'est pas la même sous deux
     * peintures différentes, d'où la comparaison du parent côté destination.
     */
    public function existingProductIn(Shop $target, Product $source, ?int $targetParentId): ?Product
    {
        if ($source->sku) {
            $bySku = Product::where('shop_id', $target->id)->where('sku', $source->sku)->first();

            if ($bySku) {
                return $bySku;
            }
        }

        return Product::where('shop_id', $target->id)
            ->where('name', $source->name)
            // `where('brand', null)` ne rapproche jamais rien en SQL : il faut whereNull.
            ->when($source->brand === null, fn ($q) => $q->whereNull('brand'))
            ->when($source->brand !== null, fn ($q) => $q->where('brand', $source->brand))
            ->when($targetParentId === null, fn ($q) => $q->whereNull('parent_id'))
            ->when($targetParentId !== null, fn ($q) => $q->where('parent_id', $targetParentId))
            ->first();
    }

    /**
     * Le produit correspondant dans la boutique de destination, créé au besoin.
     *
     * Le parent est résolu AVANT de chercher l'existant : c'est lui qui situe une
     * déclinaison, et une déclinaison ne peut de toute façon pas être créée sans lui.
     *
     * @return array{0: Product, 1: bool} Le produit, et s'il vient d'être créé.
     */
    public function copyInto(Shop $target, Product $source): array
    {
        $targetParentId = null;

        if ($source->parent_id && $source->parent) {
            [$parent] = $this->copyInto($target, $source->parent);
            $targetParentId = $parent->id;
        }

        if ($existing = $this->existingProductIn($target, $source, $targetParentId)) {
            return [$existing, false];
        }

        return [Product::create([
            'shop_id' => $target->id,
            'parent_id' => $targetParentId,
            'has_variations' => $source->has_variations,
            // La catégorie est rattachée à une boutique : recopier l'identifiant de la
            // source ferait pointer le produit vers la catégorie d'une AUTRE boutique.
            'category_id' => $this->matchingCategoryIn($target, $source),
            'name' => $source->name,
            'sku' => $source->sku,
            'description' => $source->description,
            'brand' => $source->brand,
            'unit' => $source->unit,
            'purchase_price' => $source->purchase_price,
            'average_cost' => $source->average_cost,
            'selling_price' => $source->selling_price,
            'tax_rate' => $source->tax_rate,
            'min_stock_alert' => $source->min_stock_alert,
            'stock_quantity' => 0,
            'track_stock' => true,
            'is_active' => true,
        ]), true];
    }
}
