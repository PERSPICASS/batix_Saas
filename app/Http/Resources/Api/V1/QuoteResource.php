<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use App\Http\Resources\Api\V1\Concerns\LinksToApp;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    use LinksToApp;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'quote_number' => $this->quote_number,
            // Lien vers la page du devis dans l'application, pour que l'assistant IA
            // puisse y renvoyer l'utilisateur sans avoir à deviner une URL.
            'web_url' => $this->appDocumentUrl('quotes.show', 'quote', $this->id),
            'quote_date' => $this->quote_date?->toIso8601String(),
            'expiry_date' => $this->expiry_date?->toIso8601String(),
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ] : null),
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'total' => (float) $this->total,
            'notes' => $this->notes,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'article_name' => $item->article_name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'tax_rate' => (float) $item->tax_rate,
                'line_total' => (float) $item->line_total,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
