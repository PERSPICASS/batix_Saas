<?php

namespace App\Services;

use App\Models\CreditNote;
use App\Models\DepotProduct;
use App\Models\Product;
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
 * Presque : sept clés étrangères sont en RESTRICT et bloquent la cascade au lieu de la suivre.
 *
 *   quotes.shop_id            → empêche de supprimer la boutique
 *   quotes.customer_id        → empêche de supprimer les clients
 *   quote_items.product_id    → empêche de supprimer les produits
 *   credit_notes.customer_id  → empêche de supprimer les clients
 *   credit_notes.user_id      → empêche de supprimer le compte lui-même
 *   credit_note_items.invoice_item_id → empêche de supprimer les factures
 *   depot_products.product_id → empêche de supprimer les produits
 *
 * Les six premières ont été déclarées sans `onDelete`, donc en RESTRICT par défaut. La
 * septième l'est délibérément : `depot_products.product_id` était en cascade à la création,
 * une migration l'a réécrite en RESTRICT pour qu'on ne puisse pas supprimer un produit encore
 * stocké quelque part. Bonne règle au guichet, mais elle vaut aussi contre la cascade d'une
 * suppression de compte, qu'elle bloquait sur toute boutique ayant un jour approvisionné un
 * dépôt.
 *
 * D'où l'ordre ci-dessous, qui n'est pas cosmétique : devis, avoirs et lignes de dépôt partent
 * d'abord, ce qui libère factures, produits et clients ; la cascade de la base fait le reste.
 * Sans ça, la suppression échoue par violation de contrainte sur tout compte ayant déjà émis
 * un devis ou un avoir — c'est-à-dire la plupart.
 *
 * Corriger ces contraintes serait plus propre qu'un ordre de suppression à maintenir,
 * mais c'est une migration qui réécrit des tables sur les deux moteurs (pgsql en dev comme en
 * prod, sqlite en test) : à faire à part, pas dans le chemin d'une suppression de compte.
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
            }

            // Avant les boutiques, et non après : supprimer une boutique emporte en cascade
            // les utilisateurs qui y sont rattachés, propriétaire compris — et
            // `credit_notes.user_id` étant en RESTRICT, un avoir rédigé ailleurs bloquerait
            // cette cascade au lieu de la suivre.
            CreditNote::where('user_id', $user->id)->delete();

            if ($shopIds->isNotEmpty()) {
                Shop::whereIn('id', $shopIds)->delete();
            }

            // Le plus souvent déjà supprimé par la cascade de `users.shop_id` ci-dessus ;
            // reste nécessaire pour un compte sans boutique.
            $user->delete();
        });
    }

    /**
     * Supprimer une seule boutique, en préservant le compte qui la détient.
     *
     * Même travail de déblocage que pour un compte, plus une précaution qui n'a pas lieu
     * d'être dans l'autre cas : `users.shop_id` est en `onDelete('cascade')`, donc supprimer
     * une boutique supprime les comptes qui y sont rattachés. Pour le personnel c'est le
     * comportement voulu — un employé appartient à sa boutique. Pour le propriétaire, non :
     * il perdrait son compte, ses autres boutiques et son abonnement en supprimant une
     * succursale. Il est donc déplacé avant, vers une autre de ses boutiques s'il en a.
     */
    public function deleteShop(Shop $shop): void
    {
        DB::transaction(function () use ($shop) {
            $this->releaseBlockingRecords([$shop->id]);
            $this->moveOwnerOff($shop);

            $shop->delete();
        });
    }

    /**
     * Détacher le propriétaire de la boutique qu'il s'apprête à supprimer.
     *
     * `shop_id` à null s'il n'en a pas d'autre : c'est l'état d'un compte qui n'a pas encore
     * créé sa boutique, que l'onboarding sait reprendre (ShopController::createInitial).
     */
    private function moveOwnerOff(Shop $shop): void
    {
        $owner = $shop->user;

        if (!$owner || $owner->shop_id !== $shop->id) {
            return;
        }

        $owner->update([
            'shop_id' => Shop::where('user_id', $owner->id)->whereKeyNot($shop->id)->value('id'),
        ]);
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
     *
     * Les lignes de dépôt se retirent par les produits, pas par le dépôt : un dépôt appartient
     * au compte (`depots.user_id`), pas à une boutique. Supprimer une succursale ne le
     * supprime donc pas — seul son stock des produits qui disparaissent avec elle s'en va.
     */
    private function releaseBlockingRecords(iterable $shopIds): void
    {
        CreditNote::whereIn('shop_id', $shopIds)->delete();
        Quote::whereIn('shop_id', $shopIds)->delete();

        DepotProduct::whereIn(
            'product_id',
            Product::whereIn('shop_id', $shopIds)->select('id')
        )->delete();
    }
}
