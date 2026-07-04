<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use App\Models\Subcategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ProductsImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    protected int $shopId;
    protected array $importedCount = ['created' => 0, 'updated' => 0, 'errors' => 0];
    protected array $errors = [];

    public function __construct(int $shopId)
    {
        $this->shopId = $shopId;
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
                    $this->processRow($row, $index + 2);
                });
            } catch (\Exception $e) {
                $this->errors[] = "Ligne " . ($index + 2) . ": " . $e->getMessage();
                $this->importedCount['errors']++;
                Log::error("Import produit ligne " . ($index + 2) . ": " . $e->getMessage());
            }
        }
    }

    protected function processRow(Collection $row, int $rowNumber): void
    {
        // Convertir en array pour accès plus facile
        $data = $row->toArray();
        
        // Debug: Log les clés disponibles (première ligne seulement)
        if ($rowNumber === 2) {
            Log::info("Import produits - Clés Excel détectées: " . implode(', ', array_keys($data)));
            Log::info("Import produits - Valeurs ligne 2: " . json_encode($data, JSON_UNESCAPED_UNICODE));
        }
        
        // Récupérer le nom avec plusieurs alias possibles
        $name = $this->getValue($data, ['nom', 'name', 'produit', 'product']);
        
        if (empty($name)) {
            // Ligne vide ou sans nom, on skip silencieusement
            return;
        }

        // Chercher la catégorie par nom
        $categoryId = null;
        $categoryName = $this->getValue($data, ['categorie', 'category', 'catégorie', 'cat']);
        if ($categoryName) {
            $category = Category::where('shop_id', $this->shopId)
                ->where(function($q) use ($categoryName) {
                    $q->where('name', $categoryName)
                      ->orWhere('name', 'like', "%{$categoryName}%");
                })
                ->first();
            $categoryId = $category?->id;
        }

        // Chercher la sous-catégorie par nom
        $subcategoryId = null;
        $subcategoryName = $this->getValue($data, ['sous_categorie', 'sous-categorie', 'subcategory', 'souscategorie']);
        if ($subcategoryName && $categoryId) {
            $subcategory = Subcategory::where('category_id', $categoryId)
                ->where(function($q) use ($subcategoryName) {
                    $q->where('name', $subcategoryName)
                      ->orWhere('name', 'like', "%{$subcategoryName}%");
                })
                ->first();
            $subcategoryId = $subcategory?->id;
        }

        // Récupérer le code-barres et SKU du fichier
        $barcode = $this->cleanValue($this->getValue($data, ['code_barres', 'code-barres', 'barcode', 'codebarres', 'ean']));
        $skuFromFile = $this->cleanValue($this->getValue($data, ['sku', 'reference', 'ref', 'code']));
        
        // Récupérer les prix (plusieurs formats possibles)
        $purchasePrice = $this->parseNumber($this->getValue($data, [
            'prix_achat', 'prix_dachat', 'prixachat', 'purchase_price', 
            'cout', 'coût', 'prix achat', 'achat'
        ]));
        
        $sellingPrice = $this->parseNumber($this->getValue($data, [
            'prix_vente', 'prix_de_vente', 'prixvente', 'selling_price', 
            'prix', 'vente', 'prix vente', 'pv'
        ]));

        // Récupérer l'unité (valeur par défaut: Pièce)
        $unit = $this->cleanValue($this->getValue($data, ['unite', 'unit', 'unité', 'uom'])) ?? 'Pièce';

        // Récupérer la marque
        $brand = $this->cleanValue($this->getValue($data, ['marque', 'brand', 'fabricant']));

        // Récupérer le stock
        $stockQty = (int) $this->getValue($data, ['stock', 'quantite', 'quantity', 'qte', 'qty'], 0);
        $minStock = $this->getValue($data, ['stock_minimum', 'stock_min', 'min_stock', 'seuil']);

        // Préparer les données du produit
        $productData = [
            'name' => trim($name),
            'shop_id' => $this->shopId,
            'category_id' => $categoryId,
            'subcategory_id' => $subcategoryId,
            'sku' => $skuFromFile,
            'barcode' => $barcode,
            'brand' => $brand,
            'description' => $this->cleanValue($this->getValue($data, ['description', 'desc', 'details'])),
            'unit' => $unit,
            'purchase_price' => $purchasePrice,
            'selling_price' => $sellingPrice,
            'stock_quantity' => $stockQty,
            'min_stock_alert' => $minStock ? (int) $minStock : null,
            'track_stock' => $this->parseBoolean($this->getValue($data, ['suivi_stock', 'track_stock', 'suivistock'], true)),
            'is_active' => $this->parseBoolean($this->getValue($data, ['actif', 'is_active', 'active'], true)),
        ];

        // Chercher un produit existant par SKU, code-barres ou nom
        $existingProduct = null;
        
        if (!empty($productData['sku'])) {
            $existingProduct = Product::where('shop_id', $this->shopId)
                ->where('sku', $productData['sku'])
                ->first();
        }
        
        if (!$existingProduct && !empty($productData['barcode'])) {
            $existingProduct = Product::where('shop_id', $this->shopId)
                ->where('barcode', $productData['barcode'])
                ->first();
        }
        
        // Recherche par nom si pas trouvé par SKU/code-barres
        if (!$existingProduct) {
            $existingProduct = Product::where('shop_id', $this->shopId)
                ->where('name', $productData['name'])
                ->first();
        }

        if ($existingProduct) {
            // Mise à jour - ne pas écraser le barcode/sku existants si les nouveaux sont vides
            if (empty($productData['barcode'])) {
                unset($productData['barcode']);
            }
            if (empty($productData['sku'])) {
                unset($productData['sku']);
            }
            $existingProduct->update($productData);
            $this->importedCount['updated']++;
        } else {
            // Générer le SKU automatiquement si non fourni
            if (empty($productData['sku'])) {
                $productData['sku'] = 'SKU-' . strtoupper(substr(uniqid(), -8));
            }
            
            // Création du produit
            $product = Product::create($productData);
            
            // Générer le code-barres automatiquement si non fourni ou invalide
            if (empty($barcode) || !preg_match('/^\d{13}$/', $barcode)) {
                $product->barcode = $this->generateBarcodeWithPrice(
                    $product->id,
                    $categoryId,
                    $sellingPrice
                );
                $product->save();
            }
            
            $this->importedCount['created']++;
        }
    }

    /**
     * Récupère une valeur en essayant plusieurs clés possibles
     */
    protected function getValue(array $data, array $keys, $default = null)
    {
        foreach ($keys as $key) {
            // Essayer la clé telle quelle
            if (isset($data[$key]) && $data[$key] !== null && $data[$key] !== '') {
                return $data[$key];
            }
            
            // Essayer avec underscore à la place des espaces
            $keyUnderscore = str_replace(' ', '_', $key);
            if (isset($data[$keyUnderscore]) && $data[$keyUnderscore] !== null && $data[$keyUnderscore] !== '') {
                return $data[$keyUnderscore];
            }
            
            // Essayer en lowercase
            $keyLower = strtolower($key);
            if (isset($data[$keyLower]) && $data[$keyLower] !== null && $data[$keyLower] !== '') {
                return $data[$keyLower];
            }
        }
        return $default;
    }

    protected function cleanValue($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return trim((string) $value);
    }

    protected function parseNumber($value): float
    {
        if ($value === null || $value === '') {
            return 0;
        }
        // Nettoyer les espaces et remplacer virgule par point
        $value = str_replace([' ', ','], ['', '.'], (string) $value);
        // Supprimer tout sauf chiffres et point
        $value = preg_replace('/[^0-9.]/', '', $value);
        return (float) $value;
    }

    protected function parseBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (bool) $value;
        }
        if ($value === null) {
            return true; // Par défaut actif
        }
        $value = strtolower(trim((string) $value));
        return in_array($value, ['oui', 'yes', 'true', '1', 'vrai', 'actif', 'active', 'o', 'y']);
    }

    /**
     * Génère un code-barres EAN-13 avec catégorie, ID produit et prix encodés.
     */
    protected function generateBarcodeWithPrice(int $productId, ?int $categoryId, float $price): string
    {
        $prefix = '2';
        $categoryPart = str_pad((string)(($categoryId ?? 0) % 100), 2, '0', STR_PAD_LEFT);
        $productPart = str_pad((string)($productId % 100000), 5, '0', STR_PAD_LEFT);
        $priceHundreds = (int)min(floor($price / 100), 9999);
        $pricePart = str_pad((string)$priceHundreds, 4, '0', STR_PAD_LEFT);
        
        $barcode12 = $prefix . $categoryPart . $productPart . $pricePart;
        $checksum = $this->calculateEAN13Checksum($barcode12);
        
        return $barcode12 . $checksum;
    }

    /**
     * Calcule le chiffre de contrôle EAN-13.
     */
    protected function calculateEAN13Checksum(string $barcode12): int
    {
        if (strlen($barcode12) !== 12 || !ctype_digit($barcode12)) {
            throw new \InvalidArgumentException('Barcode must be exactly 12 digits');
        }
        
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int)$barcode12[$i];
            $sum += ($i % 2 === 0) ? $digit : $digit * 3;
        }
        
        return (10 - ($sum % 10)) % 10;
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
