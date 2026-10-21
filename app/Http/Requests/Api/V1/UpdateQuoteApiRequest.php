<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Modification d'un devis en brouillon.
 *
 * `status` est volontairement absent, comme à la création : l'API prépare, l'humain
 * envoie. Le contrôleur refuse par ailleurs tout devis qui n'est plus un brouillon —
 * c'est la règle de l'application, pas une restriction propre à l'IA.
 *
 * Les lignes REMPLACENT les précédentes. Ajouter un produit suppose donc de renvoyer la
 * liste complète : c'est ce que fait déjà le formulaire web, et une sémantique d'ajout
 * incrémental rendrait impossible la suppression d'une ligne.
 *
 * La boutique n'est pas modifiable : déplacer un devis d'une boutique à l'autre
 * invaliderait son client, ses produits et sa numérotation d'un seul coup. Le shop_id
 * imposé par l'assistant sert uniquement à vérifier qu'il travaille au bon endroit.
 */
class UpdateQuoteApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // La boutique de référence est celle du devis, jamais celle envoyée par
        // l'appelant : sinon un client d'une autre boutique passerait la validation.
        $shopId = $this->route('quote')?->shop_id;

        return [
            'customer_id' => [
                'sometimes',
                'required',
                Rule::exists('customers', 'id')->where('shop_id', $shopId),
            ],
            'quote_date' => 'required|date',
            'expiry_date' => 'required|date|after:quote_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $shopId),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'sometimes|nullable|string',
            'terms' => 'sometimes|nullable|string',
        ];
    }
}
