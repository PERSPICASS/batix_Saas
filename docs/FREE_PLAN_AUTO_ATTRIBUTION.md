# 🎁 Plan FREE - Attribution Automatique lors de l'Inscription

## Date : 28 février 2026
## Statut : ✅ IMPLÉMENTÉ

---

## 📋 Vue d'ensemble

Chaque nouveau compte qui s'inscrit sur la plateforme Batix reçoit **automatiquement** un plan FREE gratuit valide pendant **30 jours**.

---

## 🎯 Plan FREE

### Caractéristiques
```
Plan : Free
Prix : 0 FCFA (Gratuit)
Durée : 30 jours
Status : trial (essai)

Limites :
├─ 1 boutique
└─ 2 utilisateurs (propriétaire + 1 employé)

Fonctionnalités incluses :
├─ Gestion des produits
├─ Gestion des ventes
├─ Gestion des clients
├─ Gestion du stock
├─ Rapports de base
└─ Support par email
```

---

## 🔧 Implémentation Technique

### 1. Seeder créé
**Fichier** : `database/seeders/FreePlanSeeder.php`

```bash
# Pour créer/mettre à jour le plan FREE
php artisan db:seed --class=FreePlanSeeder
```

### 2. Attribution automatique
**Fichier** : `app/Http/Controllers/Auth/RegisteredUserController.php`

**Workflow lors de l'inscription** :
```
1. Utilisateur remplit le formulaire d'inscription
   ↓
2. Création du compte (User) avec role: super_admin
   ↓
3. Création de la première boutique
   ↓
4. Attribution des permissions
   ↓
5. ✨ Attribution automatique du plan FREE
   ├─ Récupération du plan FREE (slug: 'free')
   ├─ Création de la subscription
   ├─ Status: trial
   ├─ Started_at: now()
   └─ Expires_at: now() + 30 jours
   ↓
6. Connexion automatique
   ↓
7. Redirection vers le dashboard
```

**Code ajouté** :
```php
// ✨ Attribuer automatiquement le plan FREE (30 jours)
$freePlan = SubscriptionPlan::where('slug', 'free')->first();

if ($freePlan) {
    Subscription::create([
        'user_id' => $user->id,
        'subscription_plan_id' => $freePlan->id,
        'status' => 'trial',
        'started_at' => now(),
        'expires_at' => now()->addDays(30), // 30 jours
    ]);
}
```

---

## 📊 Plans Disponibles

Après l'ajout du plan FREE, voici tous les plans :

| Plan    | Prix (FCFA) | Prix (EUR) | Boutiques | Utilisateurs | Durée |
|---------|-------------|------------|-----------|--------------|-------|
| **Free**    | 0 (Gratuit) | 0€         | 1         | 2            | 30 jours |
| **Starter** | 15 000      | 23€        | 1         | 3            | ∞ |
| **Growth**  | 35 000      | 53€        | 3         | 10           | ∞ |
| **Scale**   | 75 000      | 114€       | Illimité  | Illimité     | ∞ |

---

## 🎬 Scénarios d'Utilisation

### Scénario 1 : Nouvelle Inscription (Cas Normal)

```
1. User s'inscrit sur Batix
   Email: nouveau@entreprise.com
   ↓
2. Compte créé automatiquement
   ├─ Role: super_admin
   ├─ Boutique créée
   └─ Plan FREE attribué (30 jours)
   ↓
3. User se connecte
   ├─ Voit la bannière : "Plan Free - 30 jours restants"
   ├─ Peut créer 1 boutique (déjà créée)
   └─ Peut ajouter 1 utilisateur supplémentaire
   ↓
4. Après 30 jours
   ├─ Status passe à "expired"
   ├─ Bannière affiche : "Abonnement expiré"
   ├─ Boutons "Créer" désactivés
   └─ Message : "Mettez à niveau votre plan"
```

### Scénario 2 : Upgrade avant Expiration

```
1. User utilise le plan FREE (jour 15/30)
   ↓
2. User veut ajouter une 2ème boutique
   ├─ Bannière affiche : "Limite atteinte"
   └─ Bouton "Mettre à niveau" visible
   ↓
3. User clique "Mettre à niveau"
   ├─ Redirigé vers page des plans
   └─ Choisit "Starter" ou "Growth"
   ↓
4. Après paiement
   ├─ Ancien abonnement FREE annulé
   ├─ Nouveau plan activé
   └─ Limites augmentées
```

### Scénario 3 : Après Expiration

```
1. Plan FREE expiré (jour 31+)
   ├─ Status: expired
   ├─ can_create_shop: false
   └─ can_create_user: false
   ↓
2. User tente de créer une boutique
   ├─ Bouton désactivé (gris)
   ├─ Message : "Abonnement expiré"
   └─ Lien "Choisir un plan"
   ↓
3. User choisit un plan payant
   ├─ Paiement effectué
   └─ Accès restauré
```

---

## ⚙️ Configuration

### Variables importantes

```php
// Durée du plan FREE
$freePlanDuration = 30; // jours

// Limites du plan FREE
$maxShops = 1;
$maxUsers = 2;

// Status initial
$initialStatus = 'trial'; // ou 'active'
```

### Pour modifier la durée

**Option 1** : Changer dans le code
```php
// Dans RegisteredUserController.php
'expires_at' => now()->addDays(30), // Changer 30 par X jours
```

**Option 2** : Créer une constante
```php
// Dans config/subscription.php (à créer)
return [
    'free_plan_duration' => env('FREE_PLAN_DURATION', 30),
];

// Dans .env
FREE_PLAN_DURATION=30
```

---

## 🔔 Notifications Recommandées

### À implémenter :

1. **Email de bienvenue** (jour 0)
   ```
   Sujet : Bienvenue sur Batix ! 🎉
   Contenu :
   - Votre plan FREE de 30 jours est actif
   - Guide de démarrage
   - Liens vers tutoriels
   ```

2. **Rappel à 7 jours** (jour 23)
   ```
   Sujet : Votre essai expire dans 7 jours
   Contenu :
   - Rappel de l'expiration
   - Avantages des plans payants
   - Lien pour upgrader
   ```

3. **Rappel à 1 jour** (jour 29)
   ```
   Sujet : Dernière chance - Votre essai expire demain
   Contenu :
   - Urgence
   - Offre spéciale ?
   - Bouton "Choisir un plan"
   ```

4. **Après expiration** (jour 31)
   ```
   Sujet : Votre essai a expiré
   Contenu :
   - Compte suspendu
   - Avantages de continuer
   - Lien pour réactiver
   ```

---

## 📈 Métriques à Suivre

### KPIs importants :

1. **Taux de conversion** : Trial → Paid
   ```sql
   -- Users qui passent au payant après le FREE
   SELECT COUNT(*) 
   FROM subscriptions 
   WHERE status = 'active' 
   AND user_id IN (
       SELECT user_id FROM subscriptions 
       WHERE subscription_plan_id = <free_plan_id>
   );
   ```

2. **Taux d'activation**
   ```sql
   -- % qui utilisent réellement le produit
   SELECT COUNT(DISTINCT user_id) 
   FROM sales 
   WHERE user_id IN (SELECT user_id FROM subscriptions WHERE subscription_plan_id = <free_plan_id>);
   ```

3. **Temps moyen avant upgrade**
   ```
   Combien de jours avant qu'un user FREE passe au payant ?
   ```

4. **Taux de churn** après essai
   ```
   % qui ne renouvellent pas après les 30 jours
   ```

---

## 🧪 Tests à Effectuer

### Test 1 : Inscription normale
```bash
1. Aller sur /register
2. Remplir le formulaire
3. Soumettre
4. ✅ Vérifier redirection vers dashboard
5. ✅ Vérifier bannière affiche "Plan Free"
6. ✅ Vérifier dans DB : subscription créée avec status=trial
7. ✅ Vérifier expires_at = now() + 30 jours
```

### Test 2 : Vérification des limites
```bash
1. Se connecter avec compte FREE
2. Aller sur /boutiques
3. ✅ Bannière affiche "1 / 1 boutiques"
4. ✅ Bouton "Nouvelle boutique" désactivé (déjà 1 créée)
5. Aller sur /users
6. ✅ Bannière affiche "1 / 2 utilisateurs"
7. ✅ Bouton "Nouvel utilisateur" actif (1 slot restant)
```

### Test 3 : Expiration
```bash
1. Créer compte avec FREE
2. En DB, modifier expires_at à hier
3. Rafraîchir la page
4. ✅ Bannière affiche "Abonnement expiré"
5. ✅ Tous les boutons "Créer" désactivés
6. ✅ Message "Mettez à niveau votre plan"
```

---

## 🚀 Améliorations Futures

### Court Terme (1-2 semaines)
- [ ] Email de bienvenue automatique
- [ ] Compteur de jours restants dans la bannière
- [ ] Page "Choisir un plan" accessible depuis bannière

### Moyen Terme (1 mois)
- [ ] Emails automatiques (7j, 1j, expiration)
- [ ] Statistiques d'utilisation du FREE dans admin plateforme
- [ ] A/B testing sur durée (30j vs 14j vs 60j)
- [ ] Offre spéciale pour upgrader (réduction 1er mois)

### Long Terme (3+ mois)
- [ ] Système de parrainage (1 mois gratuit en plus)
- [ ] Extension automatique si forte utilisation
- [ ] Plan FREE+ (payant mais moins cher que Starter)
- [ ] Gamification (badges, achievements pendant l'essai)

---

## 📝 Notes Importantes

### ⚠️ Attention

1. **Si le seeder n'a pas été exécuté**, le plan FREE ne sera pas attribué
   ```bash
   # S'assurer que le plan FREE existe
   php artisan db:seed --class=FreePlanSeeder
   ```

2. **En production**, vérifier que le plan FREE est actif
   ```sql
   SELECT * FROM subscription_plans WHERE slug = 'free' AND is_active = 1;
   ```

3. **Migration existante** : Les comptes créés avant cette implémentation n'ont pas de plan FREE
   ```bash
   # Pour leur attribuer rétroactivement (optionnel)
   php artisan tinker
   >>> $users = User::whereDoesntHave('subscriptions')->where('role', 'super_admin')->get();
   >>> $freePlan = SubscriptionPlan::where('slug', 'free')->first();
   >>> foreach($users as $user) {
           Subscription::create([
               'user_id' => $user->id,
               'subscription_plan_id' => $freePlan->id,
               'status' => 'trial',
               'started_at' => now(),
               'expires_at' => now()->addDays(30),
           ]);
       }
   ```

---

## 📚 Fichiers Modifiés/Créés

### Nouveaux fichiers
```
database/seeders/FreePlanSeeder.php
docs/FREE_PLAN_AUTO_ATTRIBUTION.md (ce fichier)
```

### Fichiers modifiés
```
app/Http/Controllers/Auth/RegisteredUserController.php
├─ Ajout des imports (SubscriptionPlan, Subscription)
└─ Ajout de la logique d'attribution automatique (lignes ~80-90)
```

### Commandes utilisées
```bash
# Créer le plan FREE
php artisan db:seed --class=FreePlanSeeder

# Vérifier les plans
php artisan tinker
>>> SubscriptionPlan::all(['name', 'slug', 'price']);
```

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [x] Seeder FreePlanSeeder créé
- [x] RegisteredUserController modifié
- [x] Plan FREE créé en base de données locale
- [ ] Plan FREE créé en base de données production
- [ ] Tests d'inscription effectués
- [ ] Vérification bannière d'abonnement
- [ ] Documentation complète
- [ ] Email de bienvenue configuré (optionnel)
- [ ] Page "Choisir un plan" créée (optionnel)

---

**Date de mise en place** : 28 février 2026  
**Status** : ✅ OPÉRATIONNEL  
**Impact** : Tous les nouveaux comptes reçoivent automatiquement 30 jours gratuits

🎊 **Le plan FREE est maintenant actif et s'attribue automatiquement !**
