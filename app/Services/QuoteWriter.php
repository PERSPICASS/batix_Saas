<?php

namespace App\Services;

use App\Models\ProductArticle;
use App\Models\Quote;
use App\Models\Shop;
use App\Support\ConcurrencySafe;
use App\Traits\ResolvesTaxRate;
use Illuminate\Support\Facades\DB;

/**
 * Écritures sur un devis — création et modification — partagées par le formulaire web
 * et l'API v1.
 *
 * Extrait de QuoteController pour la même raison que SaleCreationService : les totaux et
 * le taux de taxe d'un devis touché par l'assistant IA doivent être calculés exactement
 * comme ceux d'un devis saisi à la main. Deux implémentations auraient fini par diverger,
 * et un devis converti en facture propage l'écart dans une pièce comptable.
 *
 * Le devis naît toujours en `draft`, et seul un `draft` se modifie — c'est la règle de
 * l'application (voir QuoteController::update côté web), pas une restriction propre à
 * l'IA. Le service ne vérifie pas ce statut lui-même : les appelants le font, chacun avec
 * la réponse qui convient à son transport (redirection ou code HTTP).
 */
class QuoteWriter
{
    use ResolvesTaxRate;

    /**
     * @param  array{customer_id: int, user_id?: int|null, quote_date: string, expiry_date: string, notes?: string|null, terms?: string|null, items: array<int, array>}  $data
     */
    public static function create(array $data, Shop $shop): Quote
    {
        return (new self)->runCreate($data, $shop);
    }

    /**
     * Remplace le contenu d'un devis existant. Les lignes fournies REMPLACENT les
     * précédentes : ajouter un produit suppose donc de renvoyer la liste complète.
     *
     * @param  array{customer_id?: int, quote_date: string, expiry_date: string, notes?: string|null, terms?: string|null, items: array<int, array>}  $data
     */
    public static function update(Quote $quote, array $data): Quote
    {
        return (new self)->runUpdate($quote, $data);
    }

    private function runCreate(array $data, Shop $shop): Quote
    {
        [$subtotal, $taxAmount, $total] = $this->totalsFor($data['items'], $shop);

        // quote_number est généré à partir du dernier numéro connu : deux devis créés au
        // même instant peuvent calculer le même candidat. Le retry régénère un numéro frais
        // à chaque tentative (via Quote::generateNumber, rappelé dans la closure) plutôt que
        // de perdre le devis sur une violation de contrainte brute.
        return ConcurrencySafe::retryOnDuplicate(function () use ($shop, $data, $subtotal, $taxAmount, $total) {
            return DB::transaction(function () use ($shop, $data, $subtotal, $taxAmount, $total) {
                $quote = Quote::create([
                    'shop_id' => $shop->id,
                    'customer_id' => $data['customer_id'],
                    'user_id' => $data['user_id'] ?? null,
                    'quote_number' => Quote::generateNumber($shop->id),
                    'quote_date' => $data['quote_date'],
                    'expiry_date' => $data['expiry_date'],
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total' => $total,
                    'notes' => $data['notes'] ?? null,
                    'terms' => $data['terms'] ?? null,
                    'status' => 'draft',
                ]);

                $this->syncItems($quote, $data['items'], $shop);

                return $quote;
            });
        });
    }

    private function runUpdate(Quote $quote, array $data): Quote
    {
        $shop = $quote->shop;
        [$subtotal, $taxAmount, $total] = $this->totalsFor($data['items'], $shop);

        return DB::transaction(function () use ($quote, $data, $shop, $subtotal, $taxAmount, $total) {
            // array_key_exists et non `??` : le formulaire web envoie `notes => null`
            // pour VIDER le champ. Avec `??`, ce null retomberait sur l'ancienne valeur
            // et la note resterait affichée alors que l'utilisateur vient de l'effacer.
            // Clé absente = champ inchangé ; clé présente à null = champ vidé.
            $quote->update([
                'customer_id' => array_key_exists('customer_id', $data) ? $data['customer_id'] : $quote->customer_id,
                'quote_date' => $data['quote_date'],
                'expiry_date' => $data['expiry_date'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $quote->notes,
                'terms' => array_key_exists('terms', $data) ? $data['terms'] : $quote->terms,
            ]);

            // Le numéro et le statut ne sont jamais touchés : un devis garde son identité
            // à travers ses révisions, et son envoi reste un geste humain.
            $quote->items()->delete();
            $this->syncItems($quote, $data['items'], $shop);

            return $quote->refresh();
        });
    }

    /**
     * @param  array<int, array>  $items
     * @return array{0: float, 1: float, 2: float}  subtotal, taxe, total
     */
    private function totalsFor(array $items, ?Shop $shop): array
    {
        $subtotal = collect($items)->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

        // Chaque ligne porte son propre taux (produit, sinon boutique) : un taux global
        // appliqué au sous-total ne collerait plus dès que deux lignes diffèrent, et le
        // total du devis contredirait le détail de ses lignes.
        $taxAmount = $this->taxAmountFor($items, $shop);

        return [$subtotal, $taxAmount, $subtotal + $taxAmount];
    }

    /** @param  array<int, array>  $items */
    private function syncItems(Quote $quote, array $items, ?Shop $shop): void
    {
        foreach ($items as $item) {
            // Marquer l'article comme vendu si fourni
            if (! empty($item['product_article_id'])) {
                ProductArticle::find($item['product_article_id'])?->markAsSold();
            }

            $quote->items()->create([
                'product_id' => $item['product_id'],
                'product_article_id' => $item['product_article_id'] ?? null,
                'article_name' => $item['article_name'] ?? null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'line_total' => $item['quantity'] * $item['unit_price'],
                // Le taux du produit d'abord, comme le fait déjà SaleCreationService,
                // puis le taux configuré de la boutique.
                'tax_rate' => $this->taxRateFor($item['product_id'] ?? null, $shop),
            ]);
        }
    }
}
