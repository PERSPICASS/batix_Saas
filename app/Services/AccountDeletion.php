<?php

namespace App\Services;

use App\Models\CreditNote;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Supprimer un compte et tout ce qu'il détient.
 *
 * La base fait déjà l'essentiel : `shops.user_id` est en `onDelete('cascade')`, et presque
 * toutes les tables métier cascadent depuis `shops`. Supprimer le propriétaire emporte donc
 * produits, ventes, factures, clients, mouvements de stock — et les comptes du personnel,
 * dont le `shop_id` cascade aussi.
 *
 * Presque : six clés étrangères ont été déclarées sans `onDelete`, donc en RESTRICT, et
 * bloquent la cascade au lieu de la suivre.
 *
 *   quotes.shop_id            → empêche de supprimer la boutique
 *   quotes.customer_id        → empêche de supprimer les clients
 *   quote_items.product_id    → empêche de supprimer les produits
 *   credit_notes.customer_id  → empêche de supprimer les clients
 *   credit_notes.user_id      → empêche de supprimer le compte lui-même
 *   credit_note_items.invoice_item_id → empêche de supprimer les factures
 *
 * D'où l'ordre ci-dessous, qui n'est pas cosmétique : devis et avoirs partent d'abord, ce qui
 * libère factures, produits et clients ; la cascade de la base fait le reste. Sans ça, la
 * suppression échoue par violation de contrainte sur tout compte ayant déjà émis un devis ou
 * un avoir — c'est-à-dire la plupart.
 *
 * Corriger ces six contraintes serait plus propre qu'un ordre de suppression à maintenir,
 * mais c'est une migration qui réécrit des tables sur les trois moteurs (sqlite en test,
 * mysql en dev, pgsql en prod) : à faire à part, pas dans le chemin d'une suppression de
 * compte.
 */
class AccountDeletion
{
    /**
     * Supprimer le compte et ses boutiques, en une transaction.
     *
     * Tout ou rien : un compte à demi supprimé laisserait des boutiques sans propriétaire,
     * et un `users.shop_id` pointant dans le vide rend un utilisateur invisible et
     * indélébile côté interface.
     */
    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            $shopIds = $user->shops()->pluck('id');

            if ($shopIds->isNotEmpty()) {
                $this->releaseBlockingRecords($shopIds);

                Shop::whereIn('id', $shopIds)->delete();
            }

            // Les avoirs rédigés par ce compte dans une boutique qui ne lui appartient pas
            // (personnel d'un autre compte) restent en RESTRICT sur `credit_notes.user_id`.
            CreditNote::where('user_id', $user->id)->delete();

            $user->delete();
        });
    }

    /**
     * Retirer les enregistrements dont les contraintes RESTRICT bloqueraient la cascade.
     *
     * Les lignes filles suivent d'elles-mêmes : `quote_items.quote_id` et
     * `credit_note_items.credit_note_id` sont, elles, en cascade.
     *
     * Piège : la table `quotes` porte une colonne `deleted_at`, mais le modèle Quote
     * n'utilise pas SoftDeletes — la ligne est donc réellement retirée, et la contrainte
     * libérée. Ajouter le trait à Quote ou à CreditNote casserait cette suppression en
     * silence : un soft delete laisse la ligne en place, donc la contrainte aussi.
     * DeleteAccountTest est le garde-fou.
     */
    private function releaseBlockingRecords(iterable $shopIds): void
    {
        CreditNote::whereIn('shop_id', $shopIds)->delete();
        Quote::whereIn('shop_id', $shopIds)->delete();
    }
}
