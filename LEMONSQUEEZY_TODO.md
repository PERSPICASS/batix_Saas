# LemonSqueezy Integration - Checklist TODO

## ✅ Terminé

- [x] Service LemonSqueezy (`app/Services/LemonSqueezyService.php`)
- [x] Modèles de données (`LemonSqueezyOrder`, `LemonSqueezyProduct`)
- [x] Contrôleur LemonSqueezy (`app/Http/Controllers/LemonSqueezyController.php`)
- [x] Routes webhook et checkout
- [x] Migrations de base de données
- [x] Commande Artisan pour synchroniser les produits
- [x] Configuration des services (config/services.php)
- [x] Composant Vue (`LemonSqueezyPayment.tsx`)
- [x] Variables d'environnement (.env)
- [x] Documentation

## 🚀 À faire maintenant

### 1. **Configurer les identifiants LemonSqueezy**
```env
LEMONSQUEEZY_API_KEY=votre_clé
LEMONSQUEEZY_STORE_ID=votre_store_id  # ← À remplir
LEMONSQUEEZY_WEBHOOK_SECRET=votre_secret  # ← À remplir
```

**Ressource**: `LEMONSQUEEZY_SETUP.md` section "Configuration requise"

### 2. **Synchroniser les plans d'abonnement**

```bash
php artisan lemonsqueezy:sync-products
```

Cela crée automatiquement les produits LemonSqueezy depuis votre base de données.

### 3. **Configurer le webhook**

Dans [LemonSqueezy Dashboard](https://app.lemonsqueezy.com):

1. Settings → Webhooks
2. URL: `https://votre-domaine.com/lemonsqueezy/webhook`
3. Événements à cocher:
   - [ ] order_created
   - [ ] order_completed
   - [ ] order_refunded
   - [ ] subscription_created
   - [ ] subscription_cancelled
   - [ ] subscription_expired
4. Copier le secret dans `.env` → `LEMONSQUEEZY_WEBHOOK_SECRET`

### 4. **Ajouter le composant LemonSqueezy à la page Checkout**

Dans `resources/js/Pages/Payment/Checkout.tsx`:

```tsx
import LemonSqueezyPayment from '@/Components/LemonSqueezyPayment';

// À l'intérieur du JSX, ajoutez:
<LemonSqueezyPayment plan={plan} />
```

### 5. **Tester le flux complet**

- [ ] Aller à `/plans/{plan_slug}/checkout`
- [ ] Voir le bouton LemonSqueezy
- [ ] Tester un paiement
- [ ] Vérifier que l'abonnement s'active
- [ ] Vérifier que la facture est créée
- [ ] Vérifier les emails de confirmation

### 6. **Tester le webhook** (optionnel mais recommandé)

```bash
# Via ngrok pour tester en local
ngrok http 8000

# Mettre à jour le webhook URL dans LemonSqueezy avec l'URL ngrok
```

### 7. **Déployer en production**

- [ ] Vérifier que les identifiants sont en production
- [ ] Tester avec des vraies données
- [ ] Monitorer les logs pour les erreurs

## 📋 Fichiers créés

```
app/
├── Services/
│   └── LemonSqueezyService.php
├── Models/
│   ├── LemonSqueezyOrder.php
│   └── LemonSqueezyProduct.php
├── Http/Controllers/
│   └── LemonSqueezyController.php
└── Console/Commands/
    └── SyncLemonSqueezyProducts.php

config/
└── services.php (updated)

database/migrations/
├── 2026_06_25_000001_create_lemonsqueezy_orders_table.php
└── 2026_06_25_000002_create_lemonsqueezy_products_table.php

resources/js/Components/
└── LemonSqueezyPayment.tsx

routes/
└── web.php (updated)

Documentation/
├── LEMONSQUEEZY_INTEGRATION.md
├── LEMONSQUEEZY_SETUP.md
└── LEMONSQUEEZY_TODO.md (ce fichier)
```

## 🔍 Points d'intégration clés

| Component | Fichier | Fonction |
|-----------|---------|----------|
| API Client | `LemonSqueezyService.php` | Communique avec l'API |
| Payment Handler | `LemonSqueezyController@checkout` | Crée les checkouts |
| Webhook Handler | `LemonSqueezyController@webhook` | Traite les paiements |
| Sync Command | `SyncLemonSqueezyProducts.php` | Synchronise les plans |
| UI Component | `LemonSqueezyPayment.tsx` | Affiche le bouton |

## 🐛 Debugging

### Voir les logs LemonSqueezy
```bash
tail -f storage/logs/laravel.log | grep -i lemonsqueezy
```

### Vérifier les ordres
```bash
php artisan tinker
>>> App\Models\LemonSqueezyOrder::latest()->first();
```

### Vérifier la synchronisation
```bash
php artisan tinker
>>> App\Models\LemonSqueezyProduct::all();
```

## 📖 Documentation de référence

- 📄 `LEMONSQUEEZY_INTEGRATION.md` - Guide détaillé
- 🚀 `LEMONSQUEEZY_SETUP.md` - Guide de démarrage
- 🔗 [API LemonSqueezy](https://docs.lemonsqueezy.com)
- 🪝 [Webhooks LemonSqueezy](https://docs.lemonsqueezy.com/api/webhooks)

## 🎯 Prochaines étapes optionnelles

### Phase 2: Améliorations
- [ ] Ajouter support de l'annulation depuis l'admin
- [ ] Dashboard de suivi des paiements LemonSqueezy
- [ ] Email de confirmation de paiement personnalisé
- [ ] Support des remboursements partiels

### Phase 3: Optimisation
- [ ] Caching des produits LemonSqueezy
- [ ] Retry logic pour les webhooks échoués
- [ ] Analytics des conversions de paiement
- [ ] Tests unitaires du service

## ❓ Support

En cas de problème:

1. Vérifiez les logs : `storage/logs/laravel.log`
2. Consultez : `LEMONSQUEEZY_INTEGRATION.md`
3. Vérifiez la configuration `.env`
4. Testez la synchronisation : `php artisan lemonsqueezy:sync-products`

---

**Bon déploiement!** 🚀
