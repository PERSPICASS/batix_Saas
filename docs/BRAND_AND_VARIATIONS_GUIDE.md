# Guide: Marque et Déclinaisons de Produits

## Vue d'ensemble

Ce guide explique comment utiliser les nouvelles fonctionnalités de marque et de déclinaisons de produits dans Batix SaaS.

## 1. Marque (Brand)

### Description
Le champ "Marque" permet d'identifier le fabricant ou la marque d'un produit.

### Utilisation
- **Création/Édition de produit** : Le champ "Marque" apparaît après "Sous-catégorie"
- **Import Excel** : La colonne "Marque" peut être utilisée (alias acceptés : `marque`, `brand`)
- **Export Excel** : La marque est incluse dans l'export

### Exemples
- Bosch, Makita, DeWalt (outillage)
- Seigneurie, Valentine (peinture)
- Fischer, Hilti (fixations)

## 2. Déclinaisons de Produits

### Concept Simplifié
Les déclinaisons permettent de gérer un même produit décliné en plusieurs versions (différentes tailles, couleurs, contenances...).

**Chaque déclinaison a :**
- Son propre **nom** (ex: "Peinture Seigneurie - Blanc 5L")
- Son propre **prix d'achat et de vente**
- Son propre **stock**
- Un **SKU et code-barres** générés automatiquement

### Exemple Concret

```
PRODUIT : Peinture Acrylique Seigneurie (Prix de base: 15,000 FCFA)
├── Déclinaison : Peinture Seigneurie - Blanc 5L   (Prix: 15,000 FCFA, Stock: 25)
├── Déclinaison : Peinture Seigneurie - Blanc 10L  (Prix: 28,000 FCFA, Stock: 12)
├── Déclinaison : Peinture Seigneurie - Ivoire 5L  (Prix: 16,000 FCFA, Stock: 8)
└── Déclinaison : Peinture Seigneurie - Ivoire 10L (Prix: 30,000 FCFA, Stock: 5)
```

### Comment ajouter des déclinaisons

1. **Allez dans la liste des Produits**
2. **Cliquez sur "Déclinaisons"** à côté du produit souhaité
3. **Cliquez sur "Ajouter une déclinaison"**
4. **Remplissez le formulaire** :
   - Nom de la déclinaison
   - Prix d'achat
   - Prix de vente
   - Stock initial
5. **Cliquez sur "Créer"**

### Fonctionnalités pratiques

- **Suggestions de noms** : Des suggestions rapides (1L, 5L, 10L, Petit, Moyen, Grand)
- **Duplication** : Dupliquez une déclinaison existante pour créer rapidement une variante
- **Stock total** : Voir le stock cumulé de toutes les déclinaisons
- **Activation/Désactivation** : Désactivez une déclinaison sans la supprimer

## 3. Quand utiliser les déclinaisons ?

| Situation | Utiliser déclinaisons ? |
|-----------|------------------------|
| Même produit, différentes tailles/couleurs/volumes | ✅ OUI |
| Produits complètement différents | ❌ NON (créer des produits séparés) |
| Un seul format disponible | ❌ NON (pas besoin) |

### Exemples d'utilisation

| Produit | Déclinaisons possibles |
|---------|----------------------|
| Peinture acrylique | 1L, 5L, 10L, 20L |
| Tuyau PVC | 25mm-2m, 25mm-4m, 32mm-2m, 32mm-4m |
| Câble électrique | 1.5mm², 2.5mm², 4mm², 6mm² |
| Ciment | 25kg, 50kg |
| Vis à bois | 4x40mm, 5x50mm, 6x60mm |

## 4. Base de données

### Colonnes ajoutées à `products`
| Colonne | Type | Description |
|---------|------|-------------|
| brand | varchar | Marque du produit |
| parent_id | bigint | ID du produit parent (pour les déclinaisons) |
| has_variations | boolean | Indique si le produit a des déclinaisons |

## 5. Routes

| Action | URL |
|--------|-----|
| Liste des déclinaisons | `/{code}/produits/{product}/variations` |
| Créer une déclinaison | POST `/{code}/produits/{product}/variations` |
| Modifier une déclinaison | PATCH `/{code}/produits/{product}/variations/{id}` |
| Supprimer une déclinaison | DELETE `/{code}/produits/{product}/variations/{id}` |

---

*Documentation mise à jour le 25 février 2026*
