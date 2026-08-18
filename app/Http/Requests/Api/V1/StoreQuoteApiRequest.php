<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Mêmes règles que QuoteController::store() (formulaire web) — la création passe par
 * le même QuoteWriter, donc les deux chemins chiffrent le devis à l'identique.
 *
 * Différence volontaire : `status` n'est pas acceptable ici. Un devis créé par l'API
 * (donc par l'assistant IA) naît toujours en brouillon ; c'est un humain qui l'envoie
 * au client depuis l'application.
 */
class StoreQuoteApiRequest extends FormRequest
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
            // Le client doit appartenir à la boutique visée : sans ce filtre, un
            // customer_id d'une autre boutique du compte passerait la validation et
            // le devis citerait un tiers étranger à la boutique.
            'customer_id' => [
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
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ];
    }
}
