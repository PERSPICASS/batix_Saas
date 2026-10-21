# Intégration LemonSqueezy

Ce guide explique comment configurer et utiliser LemonSqueezy comme solution de paiement pour les abonnements.

## Configuration

### 1. Ajouter les variables d'environnement

Dans votre fichier `.env`, ajoutez:

```env
# LemonSqueezy Payment Platform
LEMONSQUEEZY_API_KEY=votre_api_key
LEMONSQUEEZY_STORE_ID=votre_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=votre_webhook_secret
```

### 2. Obtenir les identifiants

1. Créez un compte sur [LemonSqueezy](https://app.lemonsqueezy.com)
2. Accédez aux paramètres API pour générer une clé API
3. Copiez votre Store ID depuis les paramètres du magasin
4. Générez un secret webhook pour valider les webhooks entrants

## Configuration des Webhooks

### Configuration dans LemonSqueezy

1. Allez dans **Settings** → **Webhooks**
2. Ajoutez une nouvelle URL webhook: `https://votre-domaine.com/lemonsqueezy/webhook`
3. Sélectionnez les événements à recevoir:
   - `order_created`
   - `order_completed`
   - `order_refunded`
   - `subscription_created`
   - `subscription_cancelled`
   - `subscription_expired`
4. Copiez le secret et ajoutez-le à `LEMONSQUEEZY_WEBHOOK_SECRET` dans `.env`

## Synchronisation des Produits

### Via Commande Artisan

```bash
php artisan lemonsqueezy:sync-products
```

Cette commande va:
1. Lire tous les plans d'abonnement actifs
2. Créer automatiquement les produits correspondants dans LemonSqueezy
3. Créer les variantes mensuelles pour chaque produit
4. Enregistrer les mappages dans la base de données

### Via Route Admin

Vous pouvez aussi synchroniser via l'interface admin:

```
POST /platform-admin/lemonsqueezy/sync-products
```

## Flux de Paiement

### 1. Initier un paiement

L'utilisateur clique sur le bouton "Payer avec LemonSqueezy" pour un plan spécifique:

```
POST /lemonsqueezy/checkout/{plan}
```

### 2. Redirection vers LemonSqueezy

Le client est redirigé vers le checkout LemonSqueezy pour effectuer le paiement.

### 3. Webhook de confirmation

Une fois le paiement complété, LemonSqueezy envoie un webhook `order_completed` qui:
1. Met à jour le statut de la commande à "paid"
2. Active automatiquement l'abonnement de l'utilisateur
3. Crée une facture dans le système

## Événements Webhook

### order_created
Créé lors de la création de la commande sur LemonSqueezy.

### order_completed
Appelé après le paiement réussi. Met automatiquement à jour:
- Statut de la commande LemonSqueezy
- Statut de l'abonnement utilisateur
- Crée/met à jour l'enregistrement d'abonnement

### order_refunded
Appelé lors d'un remboursement. Met à jour le statut de la commande.

### subscription_created
Appelé lors de la création d'une souscription récurrente.

### subscription_cancelled
Appelé lors de l'annulation d'une souscription. Annule automatiquement l'abonnement utilisateur.

### subscription_expired
Appelé lors de l'expiration d'une souscription. Met à jour le statut à "expired".

## Modèles de Données

### LemonSqueezyOrder
Enregistre chaque tentative de paiement via LemonSqueezy:
- `user_id` - Utilisateur qui effectue le paiement
- `subscription_plan_id` - Plan d'abonnement visé
- `subscription_id` - Abonnement créé après paiement
- `lemon_order_id` - ID de la commande chez LemonSqueezy
- `lemon_subscription_id` - ID de la souscription récurrente
- `checkout_id` - ID du checkout
- `amount` - Montant en EUR
- `status` - pending, paid, failed, refunded
- `order_data` - Données complètes de la commande (JSON)
- `metadata` - Métadonnées supplémentaires (JSON)

### LemonSqueezyProduct
Mappe les plans d'abonnement aux produits LemonSqueezy:
- `subscription_plan_id` - Plan d'abonnement
- `lemon_product_id` - ID du produit chez LemonSqueezy
- `lemon_variant_id` - ID de la variante (abonnement mensuel)
- `name`, `description`, `price` - Informations du produit
- `product_data` - Données complètes du produit (JSON)
- `variant_data` - Données complètes de la variante (JSON)

## Intégration avec le Système d'Abonnement

Lorsqu'un paiement LemonSqueezy est réussi:

1. Une facture est créée automatiquement
2. Un enregistrement `Subscription` est créé/mis à jour
3. Les informations de paiement sont enregistrées dans `LemonSqueezyOrder`
4. L'utilisateur reçoit un email de confirmation

## Gestion des Erreurs

Tous les appels API sont loggés. Vérifiez les logs:
```bash
tail -f storage/logs/laravel.log | grep "LemonSqueezy"
```

## Transition vers Production

### Avant de passer en production:

1. Testez avec un compte LemonSqueezy de test
2. Vérifiez que les webhooks se reçoivent correctement
3. Testez le flux complet de paiement
4. Validez les emails de confirmation
5. Testez l'annulation et le remboursement

### Migration depuis d'autres solutions:

Le système supporte plusieurs méthodes de paiement en parallèle:
- LemonSqueezy
- Jèko
- PawaPay
- Paiement manuel

Les utilisateurs peuvent payer avec n'importe quelle méthode.

## Dépannage

### Webhook non reçu
- Vérifiez que `LEMONSQUEEZY_WEBHOOK_SECRET` est correct
- Vérifiez que l'URL du webhook est correcte et accessible publiquement
- Vérifiez les logs de LemonSqueezy

### Abonnement non activé après paiement
- Vérifiez que le webhook `order_completed` est configuré
- Vérifiez les logs Laravel pour les erreurs de traitement
- Testez manuellement en appelant le webhook via Postman

### Produits non synchronisés
```bash
php artisan lemonsqueezy:sync-products
```

Vérifiez les erreurs dans les logs.

## Support

Pour les problèmes LemonSqueezy, consultez:
- [Documentation API LemonSqueezy](https://docs.lemonsqueezy.com)
- Logs Laravel dans `storage/logs/laravel.log`
