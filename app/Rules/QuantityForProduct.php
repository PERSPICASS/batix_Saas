<?php

namespace App\Rules;

use App\Models\Product;
use App\Support\Unit;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;

/**
 * Une quantité a au plus 3 décimales, et aucune si le produit se vend à la pièce.
 *
 * À combiner avec `numeric` et la borne voulue (`gt:0` pour une ligne, `min:0` pour un
 * comptage) :
 *
 *   'items.*.quantity' => ['required', 'numeric', 'gt:0', new QuantityForProduct]
 *       // le produit est lu dans le `product_id` voisin (items.3.product_id)
 *   'quantity' => ['required', 'numeric', 'gt:0', QuantityForProduct::of($product)]
 *   'stock_quantity' => ['nullable', 'numeric', 'min:0', QuantityForProduct::forUnit($unit)]
 *
 * Sans produit (ligne libre d'une facture, produit introuvable), seule la précision est
 * vérifiée : l'appartenance du produit à la boutique reste l'affaire de ses propres règles.
 */
class QuantityForProduct implements DataAwareRule, ValidationRule
{
    private array $data = [];

    /** @var array<int|string, Product|null> */
    private array $products = [];

    public function __construct(
        private readonly ?Product $product = null,
        private readonly ?string $unit = null,
    ) {}

    public static function of(?Product $product): self
    {
        return new self($product);
    }

    /** Le stock saisi sur la fiche produit, avant même que le produit existe. */
    public static function forUnit(?string $unit): self
    {
        return new self(unit: $unit ?? 'piece');
    }

    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_numeric($value)) {
            return;
        }

        if (Unit::round($value) != (float) $value) {
            $fail(__('validation.quantity_precision', ['precision' => Unit::PRECISION]));

            return;
        }

        if (floor((float) $value) == (float) $value) {
            return;
        }

        if ($this->unit !== null) {
            if (! Unit::isDivisible($this->unit)) {
                $fail(__('validation.quantity_whole_unit'));
            }

            return;
        }

        $product = $this->product ?? $this->siblingProduct($attribute);

        if ($product && ! $product->isDivisible()) {
            $fail(__('validation.quantity_whole', ['product' => $product->name]));
        }
    }

    private function siblingProduct(string $attribute): ?Product
    {
        $prefix = str_contains($attribute, '.') ? substr($attribute, 0, strrpos($attribute, '.') + 1) : '';
        $productId = Arr::get($this->data, $prefix.'product_id');

        if (! is_numeric($productId)) {
            return null;
        }

        // Une même instance valide toutes les lignes d'un panier : une requête par produit.
        return $this->products[$productId] ??= Product::query()->whereKey($productId)->first(['id', 'name', 'unit']);
    }
}
