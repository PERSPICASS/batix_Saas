<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Mêmes règles que SaleController::store() (formulaire web) — la création
 * elle-même passe par le même SaleCreationService, donc les deux chemins
 * calculent des totaux identiques.
 */
class StoreSaleApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $shopId = $this->input('shop_id');

        return [
            'shop_id' => 'required|exists:shops,id',
            // Client et produits doivent appartenir à la boutique visée. Un simple
            // `exists:` acceptait l'id d'un autre compte : la vente aurait cité son
            // client et déstocké ses produits.
            'customer_id' => [
                'nullable',
                Rule::exists('customers', 'id')->where('shop_id', $shopId),
            ],
            'payment_method' => 'required|in:cash,card,transfer,check,mobile,multiple,credit',
            'amount_paid' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $shopId),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }
}
