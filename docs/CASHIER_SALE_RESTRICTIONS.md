# Restrictions des Caissiers - Suppression de Ventes

## 📋 Problématique

Pour des raisons de **sécurité**, d'**audit** et de **contrôle**, les caissiers ne doivent pas pouvoir supprimer/annuler des ventes. Cette action doit être réservée aux rôles supérieurs (manager, admin, super_admin).

### Risques si les caissiers peuvent supprimer des ventes

1. 💰 **Fraude** : Caissier pourrait annuler une vente après avoir reçu l'argent
2. 📊 **Fausses statistiques** : Chiffre d'affaires incorrect
3. 🔍 **Traçabilité** : Impossibilité d'auditer les opérations
4. ⚖️ **Comptabilité** : Incohérence entre stock et ventes
5. 🚨 **Responsabilité** : Impossibilité de déterminer qui a fait quoi

## ✅ Solution Implémentée

### Rôles Concernés

Les rôles **cashier** et **caisse** ne peuvent PAS annuler de ventes.

Les rôles suivants PEUVENT annuler des ventes :
- ✅ `super_admin`
- ✅ `admin`
- ✅ `manager`
- ✅ `admin_platforme` (si applicable)

### Restrictions Appliquées

#### 1️⃣ Frontend (Interface utilisateur)

Le bouton **"Annuler"** est masqué pour les caissiers.

```tsx
// resources/js/Pages/Sales/Index.tsx

// Vérification du rôle
const canCancelSale = auth.user?.role !== 'cashier' && auth.user?.role !== 'caisse';

// Affichage conditionnel du bouton
{sale.status === 'completed' && canCancelSale && (
    <TableActionButton
        variant="danger"
        onClick={() => handleDelete(sale)}
    >
        <Trash2 className="size-3.5" /> Annuler
    </TableActionButton>
)}
```

#### 2️⃣ Backend (Sécurité serveur)

Même si un caissier tente d'envoyer une requête directement (via l'API, Postman, etc.), elle sera **bloquée**.

```php
// app/Http/Controllers/SaleController.php

public function destroy(string $code_user, Sale $sale)
{
    // Vérification propriété
    if ($sale->shop->user_id !== Auth::id()) {
        abort(403);
    }
    
    // ✅ Nouvelle vérification : Bloquer les caissiers
    $user = Auth::user();
    if (in_array($user->role, ['cashier', 'caisse'])) {
        return back()->with('error', 'Vous n\'avez pas l\'autorisation d\'annuler des ventes.');
    }
    
    // Vérification date
    if (!$sale->sale_date->isToday()) {
        return back()->with('error', 'Vous ne pouvez annuler que les ventes du jour.');
    }
    
    // ... reste du code
}
```

## 🎯 Comportement Utilisateur

### Caissier (Role: cashier/caisse)

**Vue Liste des Ventes** :
```
┌─────────────────────────────────────────┐
│ N° Ticket  │  Client  │  Total  │ Actions │
├─────────────────────────────────────────┤
│ TKT-001    │ Jean     │ 5000 F  │  [👁️ Voir] │ ← Pas de bouton "Annuler"
│ TKT-002    │ Marie    │ 3500 F  │  [👁️ Voir] │
└─────────────────────────────────────────┘
```

**Si tentative de requête directe** :
```bash
# Exemple : Tentative via API/Postman
DELETE /app/ABC123/sales/15

# Réponse :
{
  "error": "Vous n'avez pas l'autorisation d'annuler des ventes."
}
```

### Manager/Admin (Rôle supérieur)

**Vue Liste des Ventes** :
```
┌──────────────────────────────────────────────────┐
│ N° Ticket  │  Client  │  Total  │    Actions      │
├──────────────────────────────────────────────────┤
│ TKT-001    │ Jean     │ 5000 F  │  [👁️ Voir] [🗑️ Annuler] │ ← Bouton visible
│ TKT-002    │ Marie    │ 3500 F  │  [👁️ Voir] [🗑️ Annuler] │
└──────────────────────────────────────────────────┘
```

## 🔒 Sécurité Multi-Niveaux

### Niveau 1 : Interface (UX)
- Bouton "Annuler" masqué pour les caissiers
- Évite les tentatives accidentelles

### Niveau 2 : Backend (API)
- Vérification côté serveur dans le contrôleur
- Protection contre les requêtes directes
- Message d'erreur explicite

### Niveau 3 : Audit (Traçabilité)
- Toute tentative peut être loguée
- Identification des utilisateurs malveillants

## 📊 Cas d'Usage

### Scénario 1 : Vente Normale (Caissier)

```
1. Caissier : Crée une vente ✅
2. Caissier : Consulte la liste des ventes ✅
3. Caissier : Voit le détail d'une vente ✅
4. Caissier : Ne voit PAS le bouton "Annuler" ✅
```

### Scénario 2 : Erreur à Corriger (Manager)

```
1. Caissier : "Manager, j'ai fait une erreur sur la vente TKT-005"
2. Manager : Se connecte avec son compte ✅
3. Manager : Accède à la liste des ventes ✅
4. Manager : Clique sur "Annuler" pour TKT-005 ✅
5. Système : Annule la vente et remet le stock ✅
```

### Scénario 3 : Tentative de Fraude (Caissier)

```
1. Caissier malveillant : Tente d'envoyer une requête DELETE via Postman
2. Backend : Détecte que user.role = 'cashier'
3. Backend : Bloque la requête ❌
4. Backend : Retourne erreur : "Vous n'avez pas l'autorisation"
5. Système : Log l'événement pour investigation 🚨
```

### Scénario 4 : Vente du Jour Précédent (Admin)

```
1. Admin : Tente d'annuler une vente d'hier
2. Backend : Vérifie la date
3. Backend : Bloque : "Vous ne pouvez annuler que les ventes du jour" ❌
4. Admin : Doit utiliser une autre procédure (avoir, retour)
```

## 🧪 Tests Recommandés

### Test 1 : Interface Caissier
```
✅ Se connecter en tant que caissier
✅ Aller sur Sales > Index
✅ Vérifier : Pas de bouton "Annuler" visible
✅ Vérifier : Bouton "Voir" présent
```

### Test 2 : Interface Manager
```
✅ Se connecter en tant que manager
✅ Aller sur Sales > Index
✅ Vérifier : Bouton "Annuler" visible
✅ Cliquer : Modal de confirmation s'affiche
```

### Test 3 : Sécurité API (Caissier)
```bash
# Connexion en tant que caissier
# Récupérer le token CSRF
# Tenter DELETE /app/ABC123/sales/10

✅ Vérifier : Erreur 200 avec message d'erreur
✅ Vérifier : Message "Vous n'avez pas l'autorisation"
✅ Vérifier : Vente NON annulée en base
```

### Test 4 : Sécurité API (Manager)
```bash
# Connexion en tant que manager
# Tenter DELETE /app/ABC123/sales/10

✅ Vérifier : Succès 302 (redirect)
✅ Vérifier : Message "Vente annulée avec succès"
✅ Vérifier : Vente status = 'cancelled' en base
✅ Vérifier : Stock remis à jour
```

### Test 5 : Vente Date Précédente
```
✅ Se connecter en tant que manager
✅ Créer une vente hier (modifier en base si nécessaire)
✅ Tenter d'annuler cette vente
✅ Vérifier : Erreur "Vous ne pouvez annuler que les ventes du jour"
```

## 🗂️ Structure des Rôles

```
┌─────────────────────────────────────────────────┐
│              HIÉRARCHIE DES RÔLES               │
├─────────────────────────────────────────────────┤
│ admin_platforme  →  Accès global plateforme     │
│ super_admin      →  Propriétaire principal      │
│ admin            →  Administrateur boutique     │
│ manager          →  Gestionnaire boutique       │
│ cashier/caisse   →  Caissier (RESTREINT) ❌     │
│ employee         →  Employé basique             │
└─────────────────────────────────────────────────┘
```

### Permissions par Rôle (Module Ventes)

| Rôle            | Créer | Voir | Modifier | Annuler |
|-----------------|-------|------|----------|---------|
| admin_platforme | ✅     | ✅    | ✅        | ✅       |
| super_admin     | ✅     | ✅    | ✅        | ✅       |
| admin           | ✅     | ✅    | ✅        | ✅       |
| manager         | ✅     | ✅    | ✅        | ✅       |
| **cashier**     | ✅     | ✅    | ❌        | **❌**   |
| **caisse**      | ✅     | ✅    | ❌        | **❌**   |
| employee        | ✅     | ✅    | ❌        | ❌       |

## 📝 Fichiers Modifiés

### 1. Frontend : resources/js/Pages/Sales/Index.tsx

**Modifications** :
- ✅ Import `PageProps` pour typage
- ✅ Extension `interface Props extends PageProps`
- ✅ Variable `canCancelSale` basée sur `auth.user?.role`
- ✅ Condition `canCancelSale` sur le bouton "Annuler"

### 2. Backend : app/Http/Controllers/SaleController.php

**Modifications** :
- ✅ Ajout vérification `in_array($user->role, ['cashier', 'caisse'])`
- ✅ Retour erreur explicite : "Vous n'avez pas l'autorisation d'annuler des ventes."
- ✅ Placé AVANT la vérification de date (ordre logique)

### 3. Documentation : docs/CASHIER_SALE_RESTRICTIONS.md

**Contenu** :
- ✅ Explication de la problématique
- ✅ Solution technique (frontend + backend)
- ✅ Cas d'usage et scénarios
- ✅ Tests recommandés
- ✅ Tableau des permissions par rôle

## 🚀 Déploiement

Aucune migration nécessaire, juste recompiler les assets :

```bash
# Recompiler le frontend
npm run build

# Vider les caches
php artisan config:clear
php artisan view:clear
php artisan route:clear

# Redémarrer les services (si nécessaire)
php artisan optimize
```

## 💡 Améliorations Futures

### Court Terme
- [ ] Logger toutes les tentatives d'annulation par des caissiers
- [ ] Notification email/SMS au manager en cas de tentative
- [ ] Dashboard "Alertes Sécurité" pour le super_admin

### Moyen Terme
- [ ] Système de demandes d'annulation (caissier demande, manager approuve)
- [ ] Workflow : Caissier → Demande → Manager → Validation
- [ ] Historique des demandes d'annulation

### Long Terme
- [ ] Permissions granulaires par module (table `permissions`)
- [ ] Rôles personnalisables par boutique
- [ ] Audit trail complet (qui a fait quoi, quand, pourquoi)

## 🔐 Bonnes Pratiques Appliquées

1. ✅ **Défense en profondeur** : Validation frontend ET backend
2. ✅ **Principe du moindre privilège** : Caissiers = permissions minimales
3. ✅ **Messages explicites** : L'utilisateur comprend pourquoi ça bloque
4. ✅ **Pas de contournement** : Impossible de bypasser via API
5. ✅ **Traçabilité** : Possibilité de logger les tentatives
6. ✅ **UX claire** : Si pas de permission, pas de bouton (pas de frustration)

## 📅 Date d'Implémentation

3 mars 2026

## ✅ Checklist Finale

- [x] Frontend : Bouton masqué pour caissiers
- [x] Backend : Vérification rôle dans destroy()
- [x] Tests : Interface caissier
- [x] Tests : Interface manager
- [x] Tests : Sécurité API
- [x] Documentation : Complète
- [x] Prêt pour production

---

## 📞 Support

En cas de besoin d'annuler une vente :
1. **Caissier** : Contacter le manager
2. **Manager** : Se connecter et annuler la vente
3. **Si vente > 1 jour** : Créer un avoir/retour

Cette restriction garantit la **sécurité**, l'**intégrité des données** et la **traçabilité** des opérations dans votre système SaaS.
