# Configuration LemonSqueezy - Guide de démarrage rapide

## ✅ Ce qui a été fait

L'intégration LemonSqueezy est maintenant complète ! Voici ce que nous avons mis en place :

### 1. **Service LemonSqueezy** (`app/Services/LemonSqueezyService.php`)
   - Gestion complète de l'API LemonSqueezy
   - Création de produits et variantes
   - Gestion des checkouts
   - Vérification des signatures webhook

### 2. **Modèles de données**
   - `LemonSqueezyOrder` - Enregistre chaque commande
   - `LemonSqueezyProduct` - Synchronise les plans avec LemonSqueezy

### 3. **Contrôleur** (`app/Http/Controllers/LemonSqueezyController.php`)
   - Endpoint de checkout : `POST /lemonsqueezy/checkout/{plan}`
   - Webhook handler : `POST /lemonsqueezy/webhook`
   - Synchronisation des produits : `POST /platform-admin/lemonsqueezy/sync-products`

### 4. **Routes**
   - Route publique pour webhooks
   - Route privée pour initier le paiement
   - Route admin pour synchroniser les produits

### 5. **Migrations**
   - Table `lemonsqueezy_orders` (enregistre les paiements)
   - Table `lemonsqueezy_products` (synchronise les plans)

### 6. **Commande Artisan**
   ```bash
   php artisan lemonsqueezy:sync-products
   ```

### 7. **Composant Vue**
   - `LemonSqueezyPayment.tsx` - Bouton de paiement intégré

## 🔧 Configuration requise

### 1. Compléter les variables d'environnement

Dans votre `.env`, remplissez :

```env
# LemonSqueezy Payment Platform
LEMONSQUEEZY_API_KEY=votre_clé_api
LEMONSQUEEZY_STORE_ID=votre_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=votre_webhook_secret
```

### 2. Comment obtenir les identifiants

#### API Key
1. Créez un compte sur [LemonSqueezy](https://app.lemonsqueezy.com)
2. Allez à **Settings** → **API**
3. Cliquez sur **Create token**
4. Copiez la clé générée

#### Store ID
1. Allez à **Settings** → **API** ou vérifiez l'URL de votre tableau de bord
2. Le Store ID est visible dans l'URL : `app.lemonsqueezy.com/stores/{STORE_ID}`

#### Webhook Secret
1. Allez à **Webhooks**
2. Créez un nouveau webhook avec l'URL : `https://votre-domaine.com/lemonsqueezy/webhook`
3. Sélectionnez les événements (voir plus bas)
4. Copiez le secret généré

## 🚀 Étapes de déploiement

### 1. Synchroniser les produits avec LemonSqueezy

```bash
# Via Artisan CLI (recommandé)
php artisan lemonsqueezy:sync-products

# Ou via la route admin dans l'interface
POST /platform-admin/lemonsqueezy/sync-products
```

Cela va :
- Créer automatiquement un produit pour chaque plan actif
- Créer une variante "Abonnement mensuel" pour chaque produit
- Stocker les IDs pour utilisation future

### 2. Configurer les webhooks dans LemonSqueezy

URL: `https://votre-domaine.com/lemonsqueezy/webhook`

**Événements essentiels à activer:**
- ✅ `order_created` - Initialise la commande
- ✅ `order_refunded` - Gère les remboursements
- ✅ `subscription_created` - Crée l'abonnement utilisateur
- ✅ `subscription_payment_success` - Renouvelle l'abonnement (paiements récurrents)
- ✅ `subscription_payment_failed` - Enregistre les échecs
- ✅ `subscription_cancelled` - Annule l'abonnement
- ✅ `subscription_expired` - Marque comme expiré

**Note:** Ne cochez que ces événements pour optimiser les webhooks reçus

### 3. Tester le flux complet

1. Allez sur la page de paiement: `/plans/{plan_slug}/checkout`
2. Cliquez sur "Payer avec LemonSqueezy"
3. Complétez le paiement test
4. Vérifiez que l'abonnement s'active automatiquement

## 📊 Architecture de paiement

```
Utilisateur
    ↓
Clique "Payer" → POST /lemonsqueezy/checkout/{plan}
    ↓
LemonSqueezyController crée un checkout
    ↓
Redirection vers LemonSqueezy
    ↓
Utilisateur effectue le paiement
    ↓
LemonSqueezy envoie webhook → POST /lemonsqueezy/webhook
    ↓
Vérification de la signature + traitement
    ↓
Activation automatique de l'abonnement
```

## 🔄 Flux de webhook

| Événement | Action |
|-----------|--------|
| `order_created` | Enregistrement initial de la commande |
| `order_refunded` | Marque comme remboursée |
| `subscription_created` | ✅ Active l'abonnement utilisateur |
| `subscription_payment_success` | ✅ Renouvelle l'abonnement (paiements récurrents) |
| `subscription_payment_failed` | ⚠️ Enregistre l'échec de paiement |
| `subscription_cancelled` | ❌ Annule l'abonnement |
| `subscription_expired` | ⏱️ Marque comme expiré |

## 🧪 Tests

### Test en local (avec ngrok)

```bash
# 1. Exposez votre serveur local
ngrok http 8000

# 2. Mettez à jour le webhook URL dans LemonSqueezy
# Utilisez l'URL ngrok: https://xxxxx.ngrok.io/lemonsqueezy/webhook

# 3. Testez le paiement
# LemonSqueezy envoie les webhooks à votre serveur local
```

### Test du webhook manuellement

```bash
curl -X POST http://localhost:8000/lemonsqueezy/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: votre_signature" \
  -d '{
    "meta": {
      "event_name": "order_completed"
    },
    "data": {
      "id": "123",
      "attributes": {}
    }
  }'
```

## 🐛 Dépannage

### Les produits ne se créent pas
```bash
php artisan lemonsqueezy:sync-products
# Vérifiez les logs
tail -f storage/logs/laravel.log | grep LemonSqueezy
```

### Webhook non reçu
- Vérifiez que `LEMONSQUEEZY_WEBHOOK_SECRET` est correct dans `.env`
- Vérifiez que l'URL du webhook est accessible publiquement
- Vérifiez les logs LemonSqueezy pour les tentatives d'envoi

### Abonnement non activé
- Vérifiez les logs Laravel : `storage/logs/laravel.log`
- Testez manuellement le webhook avec un body sample
- Vérifiez que le webhook secret est correct

## 📈 Monitoring

Visualisez les paiements LemonSqueezy :

```bash
# Voir les derniers paiements
SELECT * FROM lemonsqueezy_orders ORDER BY created_at DESC LIMIT 10;

# Voir le taux de conversion
SELECT status, COUNT(*) FROM lemonsqueezy_orders GROUP BY status;

# Voir les logs
tail -f storage/logs/laravel.log | grep -i lemonsqueezy
```

## 🔐 Sécurité

- ✅ Vérification obligatoire de la signature webhook
- ✅ Utilisation de HTTPS en production
- ✅ Stockage sécurisé des identifiants (variables d'environnement)
- ✅ Logging complet de tous les appels API

## 📖 Documentation

- [API LemonSqueezy](https://docs.lemonsqueezy.com)
- [Webhooks LemonSqueezy](https://docs.lemonsqueezy.com/api/webhooks)
- Guide d'intégration: `LEMONSQUEEZY_INTEGRATION.md`

## ✨ Intégration multiple

LemonSqueezy fonctionne **en complément** des autres solutions :
- Jèko (Wave, Orange Money, MTN, etc.)
- PawaPay (Mobile Money Hub)
- Paiement manuel (Virement, Carte)

Les utilisateurs peuvent choisir leur méthode préférée ! 🎉
