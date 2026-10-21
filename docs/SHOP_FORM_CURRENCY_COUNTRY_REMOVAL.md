# Suppression des champs Devise et Pays des formulaires de boutique et paramètres

**Date:** 28 février 2026  
**Statut:** ✅ Terminé

## Contexte

Les champs **Devise (Currency)** et **Pays (Country)** étaient présents dans les formulaires de création et modification des boutiques, **ainsi que dans les paramètres**, alors qu'ils ne sont pas nécessaires dans l'architecture actuelle de l'application.

### Raisons de la suppression

1. **Champ Pays (Country):**
   - Non utilisé fonctionnellement dans l'application
   - Aucun impact sur les factures, tickets ou calculs
   - Information purement descriptive sans traitement métier
   - Créait de la confusion inutile

2. **Champ Devise (Currency):**
   - Déjà géré globalement dans les Paramètres au niveau du compte
   - Présence dans les formulaires de boutiques créait une duplication
   - Pour les super_admin, s'applique à toutes les boutiques du compte
   - Configuration centralisée plus cohérente

Cette suppression simplifie l'interface et élimine la redondance tout en conservant la gestion de la devise dans les Paramètres.

## Modifications effectuées

### 1. Frontend - Formulaire de création (`resources/js/Pages/Shops/Create.tsx`)

**Suppressions:**
- Champ `country` retiré du formulaire `useForm`
- Champ `currency` retiré du formulaire `useForm`
- Suppression de l'input "Pays" du formulaire
- Suppression du select "Devise" du formulaire
- Adaptation de la grille de 3 colonnes à 2 colonnes pour `city` et `postal_code`

**Avant:**
```tsx
const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Maroc',      // ❌ Retiré
    phone: '',
    email: '',
    tax_id: '',
    currency: 'USD',       // ❌ Retiré
});
```

**Après:**
```tsx
const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    tax_id: '',
});
```

### 2. Frontend - Formulaire d'édition (`resources/js/Pages/Shops/Edit.tsx`)

**Suppressions:**
- Champ `country` retiré de l'interface `Shop`
- Champ `currency` retiré de l'interface `Shop`
- Champ `country` retiré du formulaire `useForm`
- Champ `currency` retiré du formulaire `useForm`
- Suppression de l'input "Pays" du formulaire
- Suppression du select "Devise" du formulaire
- Adaptation de la grille de 3 colonnes à 2 colonnes pour `city` et `postal_code`

**Interface Shop - Avant:**
```tsx
interface Shop {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;           // ❌ Retiré
    phone: string | null;
    email: string | null;
    tax_id: string | null;
    currency: string;          // ❌ Retiré
    is_active: boolean;
}
```

**Interface Shop - Après:**
```tsx
interface Shop {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    tax_id: string | null;
    is_active: boolean;
}
```

### 3. Backend - Contrôleur (`app/Http/Controllers/ShopController.php`)

**Méthode `store()` - Suppressions:**
- Règle de validation `'country' => 'nullable|string|max:255'` retirée
- Règle de validation `'currency' => 'nullable|string|max:3'` retirée

**Méthode `update()` - Suppressions:**
- Règle de validation `'country' => 'nullable|string|max:255'` retirée
- Règle de validation `'currency' => 'nullable|string|max:3'` retirée

**Validation - Avant:**
```php
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'description' => 'nullable|string',
    'address' => 'nullable|string|max:255',
    'city' => 'nullable|string|max:255',
    'postal_code' => 'nullable|string|max:20',
    'country' => 'nullable|string|max:255',     // ❌ Retiré
    'phone' => 'nullable|string|max:20',
    'email' => 'nullable|email|max:255',
    'tax_id' => 'nullable|string|max:50',
    'currency' => 'nullable|string|max:3',      // ❌ Retiré
]);
```

**Validation - Après:**
```php
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'description' => 'nullable|string',
    'address' => 'nullable|string|max:255',
    'city' => 'nullable|string|max:255',
    'postal_code' => 'nullable|string|max:20',
    'phone' => 'nullable|string|max:20',
    'email' => 'nullable|email|max:255',
    'tax_id' => 'nullable|string|max:50',
]);
```

## Impact sur l'application

### ✅ Avantages

1. **Interface plus claire** - Formulaires simplifiés sans champs redondants
2. **Cohérence** - Un seul endroit pour gérer devise et pays (Settings)
3. **Moins de confusion** - Les utilisateurs ne se demandent plus où modifier ces paramètres
4. **Maintenance facilitée** - Moins de code à maintenir

### ⚠️ Points à noter

- Les champs `country` et `currency` **restent dans la base de données** (table `shops`)
- Ces champs sont maintenant gérés **uniquement via les Paramètres**
- Pour le `super_admin`, modifier les paramètres met à jour **toutes les boutiques** du compte
- Pour les autres rôles, cela met à jour **leur boutique active**

## Gestion actuelle de ces paramètres

Les paramètres de devise et pays sont gérés dans :

📍 **Page:** `resources/js/Pages/Settings/Index.tsx`  
📍 **Contrôleur:** `app/Http/Controllers/SettingsController.php`

**Comportement:**
- **Super Admin:** Modification appliquée à toutes les boutiques du compte
- **Autres rôles:** Modification appliquée à leur boutique active uniquement

## Tests recommandés

- [ ] Créer une nouvelle boutique → Vérifier que le formulaire n'affiche plus les champs devise et pays
- [ ] Modifier une boutique existante → Vérifier que le formulaire n'affiche plus les champs devise et pays
- [ ] Modifier les paramètres → Vérifier que devise et pays sont bien appliqués à toutes les boutiques
- [ ] Afficher une facture → Vérifier que la devise s'affiche correctement
- [ ] Afficher un ticket de vente → Vérifier que les informations sont correctes

## Fichiers modifiés

| Fichier | Type | Modifications |
|---------|------|---------------|
| `resources/js/Pages/Shops/Create.tsx` | Frontend | Suppression des champs currency et country du formulaire |
| `resources/js/Pages/Shops/Edit.tsx` | Frontend | Suppression des champs currency et country du formulaire et de l'interface |
| `app/Http/Controllers/ShopController.php` | Backend | Suppression des règles de validation pour currency et country |

## Conclusion

Cette modification améliore l'expérience utilisateur en éliminant la redondance et en centralisant la gestion des paramètres de devise dans un seul endroit : **les Paramètres du compte**. Le champ pays a été complètement retiré car il n'était pas utilisé fonctionnellement.

Les utilisateurs ont maintenant une interface plus claire et cohérente, sans confusion sur l'endroit où modifier la devise.

---

**Documentation connexe:**
- [CURRENCY_SYSTEM_GUIDE.md](./CURRENCY_SYSTEM_GUIDE.md) - Guide complet du système de devises
- [SHOP_FORM_FIELDS_FIX.md](./SHOP_FORM_FIELDS_FIX.md) - Corrections précédentes des formulaires de boutique
- [EMAIL_VERIFICATION_OTP_SYSTEM.md](./EMAIL_VERIFICATION_OTP_SYSTEM.md) - Système de vérification email par code OTP
