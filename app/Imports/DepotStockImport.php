<?php

namespace App\Imports;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class DepotStockImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    protected Depot $depot;
    protected array $shopIds;
    protected int $defaultShopId;
    protected array $importedCount = ['created' => 0, 'updated' => 0, 'products_created' => 0, 'errors' => 0];
    protected array $errors = [];

    public function __construct(Depot $depot, array $shopIds, int $defaultShopId)
    {
        $this->depot         = $depot;
        $this->shopIds       = $shopIds;
        $this->defaultShopId = $defaultShopId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            try {
                // maatwebsite wraps the whole import in one DB transaction (config/excel.php
                // 'transactions.handler' => 'db'). On Postgres, a single failed query (e.g. a
                // duplicate slug) poisons that entire transaction — every subsequent query,
                // even unrelated SELECTs for later rows, then fails with "current transaction
                // is aborted", and the whole import silently rolls back to nothing at commit
                // time. Wrapping each row in its own DB::transaction() creates a savepoint
                // (Laravel does this automatically for nested transactions), so one bad row
                // only rolls back that row instead of the rest of the file.
                DB::transaction(function () use ($row, $index) {
                    $this->processRow($row->toArray(), $index + 2);
                });
            } catch (\Exception $e) {
                $this->errors[] = "Ligne " . ($index + 2) . " : " . $e->getMessage();
                $this->importedCount['errors']++;
                Log::error("Import stock dépôt ligne " . ($index + 2) . ": " . $e->getMessage());
            }
        }
    }

    protected function processRow(array $data, int $rowNumber): void
    {
        $sku           = $this->clean($this->get($data, ['sku', 'reference', 'ref', 'code']));
        $barcode       = $this->clean($this->get($data, ['code_barres', 'barcode', 'ean']));
        $name          = $this->clean($this->get($data, ['nom', 'name', 'produit', 'product']));
        $brand         = $this->clean($this->get($data, ['marque', 'brand', 'fabricant']));
        $quantity      = (int) $this->get($data, ['quantite', 'quantity', 'qte', 'qty', 'stock'], 0);
        $minAlert      = $this->get($data, ['stock_minimum', 'stock_min', 'min_stock', 'seuil', 'alerte'], null);
        $purchasePrice = $this->get($data, ['prix_achat', 'purchase_price', 'prix_d_achat', 'cout', 'cost'], null);

        // Ignorer les lignes vraiment vides
        if ($quantity <= 0 && $minAlert === null && !$sku && !$barcode && !$name) {
            return;
        }

        // Le nom est obligatoire pour créer un nouveau produit
        if (!$sku && !$barcode && !$name) {
            throw new \Exception("Ligne {$rowNumber} : au moins un identifiant (sku, code-barres ou nom) est requis.");
        }

        // 1. Chercher le produit existant dans les boutiques accessibles
        $product = null;

        if ($sku) {
            $product = Product::whereIn('shop_id', $this->shopIds)->where('sku', $sku)->first();
        }
        if (!$product && $barcode) {
            $product = Product::whereIn('shop_id', $this->shopIds)->where('barcode', $barcode)->first();
        }
        // Le nom seul ne suffit pas : deux produits différents partagent souvent le même
        // nom sous des marques différentes (ex. "Perceuse 500W" Bosch vs Makita) — la marque
        // fait partie du critère de correspondance dès qu'elle est renseignée, sinon des
        // lignes distinctes finissent par s'écraser les unes les autres (cf. ProductsImport).
        if (!$product && $name) {
            $nameQuery = Product::whereIn('shop_id', $this->shopIds)->where('name', $name);
            if ($brand) {
                $nameQuery->where('brand', $brand);
            } else {
                $nameQuery->whereNull('brand');
            }
            $product = $nameQuery->first();
        }
        // Chercher aussi par slug généré automatiquement pour éviter les doublons
        if (!$product && $name) {
            $slug = Str::slug($name);
            $slugQuery = Product::whereIn('shop_id', $this->shopIds)->where('slug', $slug);
            if ($brand) {
                $slugQuery->where('brand', $brand);
            } else {
                $slugQuery->whereNull('brand');
            }
            $product = $slugQuery->first();
        }

        // 2. Si introuvable, créer le produit dans la boutique par défaut
        if (!$product) {
            if (!$name) {
                throw new \Exception("Produit introuvable (SKU: {$sku}, code-barres: {$barcode}) et aucun nom fourni pour le créer.");
            }

            // Une création qui échoue laisse remonter l'exception : la ligne est alors
            // signalée et annulée par son propre savepoint (cf. collection()), sans
            // toucher aux autres. Il y avait ici un rattrapage « le slug existe déjà,
            // réutilisons ce produit » : il retrouvait le produit par slug seul, donc
            // renvoyait celui d'une AUTRE marque portant le même nom et fusionnait
            // silencieusement leurs stocks. Il est devenu inutile quand la contrainte
            // unique (shop_id, slug) a été supprimée le 2026-07-04 (même raison que
            // dans ProductsImport, qui ne l'a plus non plus) — mieux vaut refuser
            // bruyamment une ligne que corrompre un stock.
            $product = Product::create([
                'name'           => $name,
                'sku'            => $sku ?? ('SKU-' . strtoupper(substr(uniqid(), -8))),
                'brand'          => $brand,
                'shop_id'        => $this->defaultShopId,
                'stock_quantity' => 0,
                'selling_price'  => 0,
                'purchase_price' => $purchasePrice !== null ? (float) $purchasePrice : 0,
                'unit'           => 'Pièce',
                'is_active'      => false,
                'track_stock'    => true,
            ]);

            $this->importedCount['products_created']++;
        }

        // 3. Mettre à jour ou créer l'entrée depot_products
        $depotProduct = DepotProduct::where('depot_id', $this->depot->id)
            ->where('product_id', $product->id)
            ->first();

        if ($depotProduct) {
            if ($quantity > 0) {
                $depotProduct->increment('quantity', $quantity);
            }
            $updates = [];
            if ($minAlert !== null) {
                $updates['min_stock_alert'] = (int) $minAlert;
            }
            if ($purchasePrice !== null) {
                $updates['purchase_price'] = (float) $purchasePrice;
            }
            if (!empty($updates)) {
                $depotProduct->update($updates);
            }
            $this->importedCount['updated']++;
        } else {
            DepotProduct::create([
                'depot_id'        => $this->depot->id,
                'product_id'      => $product->id,
                'quantity'        => max(0, $quantity),
                'min_stock_alert' => $minAlert !== null ? (int) $minAlert : 0,
                'purchase_price'  => $purchasePrice !== null ? (float) $purchasePrice : 0,
            ]);
            $this->importedCount['created']++;
        }
    }

    protected function get(array $data, array $keys, $default = null)
    {
        foreach ($keys as $key) {
            foreach ([$key, strtolower($key), str_replace(' ', '_', strtolower($key))] as $k) {
                if (isset($data[$k]) && $data[$k] !== null && $data[$k] !== '') {
                    return $data[$k];
                }
            }
        }
        return $default;
    }

    protected function clean($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return trim((string) $value);
    }

    public function getImportedCount(): array
    {
        return $this->importedCount;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
