# 🌍 Guide Complet des Traductions i18n

## Vue d'ensemble
Le projet utilise un système i18n structuré avec:
- Fichiers TypeScript dans `/resources/js/i18n/` pour les clés de traduction
- Pattern `useLocale()` hook dans les composants React
- Support bi-langue: FR et EN

## Structure des Fichiers i18n

```typescript
export const resourceName = {
    fr: {
        title: 'Titre en français',
        columns: { name: 'Nom', email: 'Email' },
        status: { draft: 'Brouillon', sent: 'Envoyée' },
        actions: { new: 'Nouveau', edit: 'Modifier' },
        form: { 
            createTitle: 'Créer ressource',
            editTitle: 'Modifier ressource',
            fieldLabel: 'Champ'
        },
        filters: { searchPlaceholder: 'Rechercher...' },
        emptyMessage: 'Aucune donnée trouvée'
    },
    en: {
        // Same structure with English translations
    }
} as const;
```

## Traduction d'une Page - Checklist

### 1. Préparer le fichier i18n
- [ ] Vérifier que `resources/js/i18n/resourceName.ts` existe
- [ ] Ajouter les clés manquantes (title, form, actions, etc.)
- [ ] Ajouter les traductions anglaises correspondantes
- [ ] Mettre à jour `/resources/js/i18n/index.ts` pour importer

### 2. Traduire le composant
- [ ] Importer: `import { useLocale } from '@/contexts/LocaleContext';`
- [ ] Utiliser: `const { t, locale } = useLocale();`
- [ ] Remplacer tous les textes hardcodés par `t.resource.key`
- [ ] Utiliser `locale` pour le formatage de dates: `new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')`

### 3. Patterns Courants

#### Titres et En-têtes
```tsx
<h1>{t.sales.title}</h1>
<Head title={t.sales.title} />
```

#### Labels de formulaire
```tsx
<label>{t.sales.form.customerLabel}</label>
<InputLabel value={t.sales.form.dateLabel} />
```

#### Actions/Boutons
```tsx
<button>{t.common.actions.save}</button>
<Link href="...">{t.common.actions.back}</Link>
```

#### Statuts
```tsx
{t.sales.status[record.status]} {/* 'draft', 'completed', etc. */}
```

#### Messages vides/erreurs
```tsx
{records.length === 0 && <p>{t.sales.emptyMessage}</p>}
```

## Pages Traduites (Modèles de Référence)

### ✅ RecurringInvoices (Complet)
- Voir: `resources/js/Pages/RecurringInvoices/Index.tsx`
- Voir: `resources/js/i18n/recurringInvoices.ts`
- Pattern: Utilise `t.recurringInvoices.*` pour tous les textes

### ✅ Invoices (Partiel)
- Voir: `resources/js/Pages/Invoices/Show.tsx`
- Voir: `resources/js/i18n/invoices.ts`

## Ressources à Traduire - Par Priorité

### 🔴 HAUTE PRIORITÉ
1. **Sales/Show** - Page très visitée
2. **Purchases/Create, Edit, Show** - Processus complet
3. **Customers/Create, Edit, Show** - Données critiques
4. **Suppliers/Create, Edit, Show** - Données critiques

### 🟠 MOYENNE PRIORITÉ
5. Expenses
6. Products variations
7. Inventory management
8. Stock movements

### 🟡 BASSE PRIORITÉ
9. PlatformAdmin pages
10. Settings
11. ActivityLogs
12. Reports/Analytics

## Commandes Utiles

```bash
# Identifier pages avec texte français hardcodé
grep -r "Ajouter\|Modifier\|Créer\|Supprimer\|Retour\|Annuler" resources/js/Pages/ | grep -v i18n | head -20

# Chercher un texte spécifique
grep -r "Texto français" resources/js/Pages/ --include="*.tsx"

# Vérifier couverture i18n d'une ressource
grep "t\." resources/js/Pages/ResourceName/*.tsx | wc -l
```

## Points Clés à Retenir

1. **Pas de texte hardcodé** - Tout ce qui est visible doit être traduit
2. **Locale aware** - Utiliser `locale` pour dates/nombres/formats
3. **Cohérence** - Utiliser les mêmes clés pour les même concepts
4. **Fallback** - Utiliser `t.common.*` pour actions/statuts courants
5. **Documentation** - Les clés de traduction sont auto-documentées

## Exemple Complet de Traduction

### Avant (Hardcodé)
```tsx
<div>
    <h1>Nouvelle Vente</h1>
    <form>
        <label>Client *</label>
        <button>Ajouter</button>
        <button>Enregistrer</button>
    </form>
</div>
```

### Après (Traduit)
```tsx
const { t } = useLocale();

<div>
    <h1>{t.sales.form.createTitle}</h1>
    <form>
        <label>{t.sales.form.customer}</label>
        <button>{t.sales.actions.add}</button>
        <button>{t.common.actions.save}</button>
    </form>
</div>
```

## Support i18n Existant

✅ Fichiers i18n complets:
- common, invoices, quotes, recurringInvoices, purchases, sales, customers, suppliers, products, users, etc.

✅ Hooks et contextes:
- `useLocale()` - Accès aux traductions
- `LocaleContext` - Fournit `t` et `locale`

## Questions Fréquentes

**Q: Comment savoir quelle clé utiliser?**
A: Regarder dans le fichier i18n correspondant (`resources/js/i18n/resourceName.ts`)

**Q: Et si une traduction n'existe pas?**
A: L'ajouter au fichier i18n avec les versions FR et EN

**Q: Comment formater les dates?**
A: `new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')`

**Q: Peut-on mélanger traductions et texte hardcodé?**
A: Non, c'est incohérent. Traduire le tout ou rien.
