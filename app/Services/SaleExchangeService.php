<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Support\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * L'échange : le client rapporte des articles d'une vente et repart avec d'autres.
 *
 * Tout tient en une transaction — les retours sur la vente d'origine ET la vente de
 * remplacement. Un caissier qui abandonne en cours de route n'a donc rien enregistré : il
 * n'existe jamais d'avoir « en suspens » à rattraper.
 *
 * L'avoir vaut ce que la boutique doit réellement rendre (SaleReturnService::record) : sur
 * une vente à crédit pas encore réglée, rendre un article efface la dette, pas plus.
 */
class SaleExchangeService
{
    /**
     * @param  array<int, array{sale_item_id: int, quantity: float, reason: string}>  $lines
     * @param  array  $saleData  les champs d'une vente (cf. SaleCreationService::create)
     */
    public static function exchange(Sale $original, array $lines, array $saleData, Shop $shop, User $user): Sale
    {
        return DB::transaction(function () use ($original, $lines, $saleData, $shop, $user) {
            // Verrouillée : un retour simple saisi au même instant ne doit pas rendre deux
            // fois le même article.
            $original = Sale::whereKey($original->id)->lockForUpdate()->firstOrFail();
            self::assertExchangeable($original, $shop);

            $credit = 0.0;
            $returns = [];

            foreach ($lines as $line) {
                $item = $original->items()->find($line['sale_item_id']);
                if (!$item) {
                    throw ValidationException::withMessages(['lines' => "Cet article n'appartient pas à la vente {$original->ticket_number}."]);
                }

                [$return, , $owedBack] = SaleReturnService::record(
                    $original, $item, Unit::round((float) $line['quantity']), 'exchange', $line['reason'],
                    "Échange", $user
                );
                $credit += $owedBack;
                $returns[] = $return;
            }

            $sale = SaleCreationService::create($saleData + [
                'exchanged_sale_id' => $original->id,
                'exchange_credit' => round($credit, 2),
                // Par défaut, le client de la vente d'origine : c'est son avoir qui sert.
                'customer_id' => $saleData['customer_id'] ?? $original->customer_id,
            ], $shop);

            foreach ($returns as $return) {
                $return->update(['replacement_sale_id' => $sale->id]);
                ActivityLogger::message('create', 'return_created', [
                    'product' => $return->saleItem->product_name,
                    'qty' => $return->quantity_returned,
                ], $return);
            }

            ActivityLogger::message('update', 'sale_exchanged', [
                'original' => $original->ticket_number,
                'replacement' => $sale->ticket_number,
                'credit' => number_format($credit, 0, ',', ' '),
            ], $original);

            return $sale;
        });
    }

    public static function assertExchangeable(Sale $original, Shop $shop): void
    {
        $error = match (true) {
            $original->shop_id !== $shop->id => "Un échange se fait dans la boutique de la vente d'origine.",
            in_array($original->status, ['cancelled', 'returned'], true) => "Cette vente est annulée ou entièrement retournée : il n'y a plus rien à échanger.",
            default => null,
        };

        if ($error) {
            throw ValidationException::withMessages(['lines' => $error]);
        }
    }
}
