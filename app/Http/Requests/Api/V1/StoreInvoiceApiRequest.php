<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Sous-ensemble volontairement restreint des règles de InvoiceController::store()
 * (formulaire web).
 *
 * `status` est absent, et le contrôleur force `draft` : une facture est une pièce
 * comptable, dont la numérotation ne se reprend pas (voir Invoice::generateInvoiceNumber,
 * qui compte `withTrashed()`). L'API — donc l'assistant IA — ne peut qu'en préparer le
 * brouillon ; l'émission, qui déstocke la marchandise et fige le document, reste un
 * geste humain dans l'application.
 *
 * Corollaire : aucune ligne ne peut porter de `product_article_id`, car marquer un
 * article sérialisé comme vendu est un effet de bord que le brouillon ne doit pas avoir.
 */
class StoreInvoiceApiRequest extends FormRequest
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
            'customer_id' => [
                'required',
                Rule::exists('customers', 'id')->where('shop_id', $shopId),
            ],
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'payment_method' => 'nullable|in:cash,card,transfer,check,mobile',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
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
