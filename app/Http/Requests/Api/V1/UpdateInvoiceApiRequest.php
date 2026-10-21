<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Modification d'une facture en brouillon.
 *
 * Ni `status` ni `shop_id` : l'émission reste un geste humain, et déplacer une facture
 * de boutique invaliderait son client, ses lignes et sa numérotation. Le contrôleur
 * refuse par ailleurs toute facture qui n'est plus un brouillon.
 *
 * Les lignes REMPLACENT les précédentes ; ajouter un produit suppose de renvoyer la
 * liste complète, comme le fait le formulaire web.
 */
class UpdateInvoiceApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // La boutique de référence est celle de la facture, jamais celle envoyée par
        // l'appelant : sinon un client d'une autre boutique passerait la validation.
        $shopId = $this->route('invoice')?->shop_id;

        return [
            'customer_id' => [
                'sometimes',
                'required',
                Rule::exists('customers', 'id')->where('shop_id', $shopId),
            ],
            'invoice_date' => 'required|date',
            'due_date' => 'sometimes|nullable|date|after_or_equal:invoice_date',
            'payment_method' => 'sometimes|nullable|in:cash,card,transfer,check,mobile',
            'discount_amount' => 'sometimes|nullable|numeric|min:0',
            'notes' => 'sometimes|nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'nullable',
                Rule::exists('products', 'id')->where('shop_id', $shopId),
            ],
            'items.*.product_name' => 'required|string',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ];
    }
}
