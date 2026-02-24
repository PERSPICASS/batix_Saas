# 📊 Système de Génération Automatique de Code-barres

## Date: 24 février 2026

## Vue d'ensemble

Le système génère automatiquement des **codes-barres EAN-13** valides pour chaque nouveau produit créé. Le SKU est également généré automatiquement si non fourni.

---

## 🔢 Format du Code-barres EAN-13

### Structure (13 chiffres):

```
2 XXXXXX YYYY C
│   │     │   │
│   │     │   └─ Chiffre de contrôle (1 chiffre)
│   │     └───── Numéro de produit (4 chiffres)
│   └─────────── Code entreprise (6 chiffres)
└─────────────── Préfixe usage interne (1 chiffre = '2')
```

### Exemple:
`2 384726 9152 3`
- `2`: Usage interne (non attribué par GS1)
- `384726`: Code entreprise aléatoire
- `9152`: Numéro de produit
- `3`: Chiffre de contrôle (calculé avec l'algorithme EAN-13)

---

## 🚀 Fonctionnalités

### 1. Génération Automatique au Backend

**Fichier**: `app/Http/Controllers/ProductController.php`

```php
// Méthode store()
if (empty($validated['barcode'])) {
    $validated['barcode'] = $this->generateUniqueBarcode();
}

if (empty($validated['sku'])) {
    $validated['sku'] = 'SKU-' . strtoupper(substr(uniqid(), -8));
}
```

**Caractéristiques**:
- ✅ Code-barres **unique** garanti (vérification en base de données)
- ✅ Format **EAN-13 valide** avec checksum correct
- ✅ Génération **automatique** si le champ est vide
- ✅ Possibilité de fournir un code personnalisé

### 2. Aperçu Côté Frontend

**Fichier**: `resources/js/Pages/Products/Create.tsx`

**Bouton "Aperçu"**:
- Génère un code-barres **temporaire** pour visualisation
- Le code final sera régénéré côté serveur lors de la sauvegarde
- Utilise le même algorithme EAN-13

```tsx
const generateTempBarcode = () => {
    const prefix = '2';
    const company = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const product = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode12 = prefix + company + product;
    
    // Calculer le checksum EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode12[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    
    setData('barcode', barcode12 + checksum);
};
```

---

## 📝 Utilisation

### Création d'un Produit

1. **Option 1: Génération Automatique** (Recommandé)
   - Laissez le champ "Code-barres" vide
   - Le système génère automatiquement un code EAN-13 valide
   - ✅ Code unique garanti

2. **Option 2: Aperçu**
   - Cliquez sur le bouton "Aperçu" 🔄
   - Visualisez un code-barres temporaire
   - Le code final sera régénéré lors de la sauvegarde

3. **Option 3: Code Personnalisé**
   - Entrez votre propre code-barres
   - Le système l'utilisera tel quel
   - ⚠️ Assurez-vous qu'il est unique

### Modification d'un Produit

- Le code-barres **n'est pas régénéré** lors de la modification
- Vous pouvez le modifier manuellement si nécessaire
- Le SKU reste également inchangé

---

## 🔐 Algorithme de Checksum EAN-13

### Méthode PHP:

```php
private function calculateEAN13Checksum(string $barcode12): int
{
    $sum = 0;
    for ($i = 0; $i < 12; $i++) {
        $digit = (int)$barcode12[$i];
        // Positions impaires (0, 2, 4...) : x1
        // Positions paires (1, 3, 5...) : x3
        $sum += ($i % 2 === 0) ? $digit : $digit * 3;
    }
    
    $checksum = (10 - ($sum % 10)) % 10;
    return $checksum;
}
```

### Exemple de Calcul:

Pour `238472691523`:
```
Position: 0  1  2  3  4  5  6  7  8  9  10 11
Chiffre:  2  3  8  4  7  2  6  9  1  5  2  3
Poids:    1  3  1  3  1  3  1  3  1  3  1  3
Produit:  2  9  8  12 7  6  6  27 1  15 2  9

Somme = 2 + 9 + 8 + 12 + 7 + 6 + 6 + 27 + 1 + 15 + 2 + 9 = 104
Checksum = (10 - (104 % 10)) % 10 = (10 - 4) % 10 = 6
```

Code-barres final: `2384726915236`

---

## ✅ Validité des Codes

### Préfixes EAN-13:

- **0-1**: USA, Canada (UPC)
- **2**: Usage interne / magasin (notre cas)
- **30-37**: France
- **40-44**: Allemagne
- **45-49**: Japon
- **50**: Royaume-Uni
- **690-695**: Chine
- **etc.**

Notre système utilise le préfixe **`2`** pour indiquer des codes internes non enregistrés auprès de GS1.

---

## 🎯 Avantages

✅ **Automatique** - Pas besoin de saisir manuellement  
✅ **Unique** - Vérification en base de données  
✅ **Valide** - Format EAN-13 conforme  
✅ **Flexible** - Possibilité de codes personnalisés  
✅ **Compatible** - Peut être scanné par des lecteurs de codes-barres  
✅ **Permanent** - Ne change pas lors de la modification du produit

---

## 📊 SKU Automatique

### Format:
`SKU-XXXXXXXX`

### Exemple:
`SKU-A7B2C9F1`

**Caractéristiques**:
- Basé sur `uniqid()` PHP (timestamp + random)
- 8 caractères alphanumériques en majuscules
- Généré uniquement si le champ est vide
- Peut être personnalisé manuellement

---

## 🧪 Tests Recommandés

### Test 1: Création avec génération auto
```
1. Aller sur /products/create
2. Remplir le formulaire SANS code-barres
3. Sauvegarder
4. Vérifier qu'un code EAN-13 a été généré
```

### Test 2: Aperçu frontend
```
1. Aller sur /products/create
2. Cliquer sur "Aperçu"
3. Vérifier qu'un code de 13 chiffres s'affiche
4. Cliquer plusieurs fois → codes différents
```

### Test 3: Code personnalisé
```
1. Entrer manuellement "1234567890123"
2. Sauvegarder
3. Vérifier que le code est conservé tel quel
```

### Test 4: Unicité
```
1. Créer 100 produits successivement
2. Vérifier qu'aucun code-barres n'est dupliqué
```

### Test 5: Modification
```
1. Modifier un produit existant
2. Vérifier que le code-barres ne change pas
3. Vérifier que le SKU ne change pas
```

---

## 🔄 Évolutions Futures Possibles

- [ ] Intégration avec une API GS1 pour des codes officiels
- [ ] Génération de codes QR en plus des codes-barres
- [ ] Export des codes-barres en format imprimable (PDF)
- [ ] Scanner de codes-barres pour vérification
- [ ] Historique des codes-barres générés
- [ ] Support d'autres formats (Code 128, QR Code, etc.)
- [ ] Personnalisation du préfixe par boutique

---

## 📚 Références

- [EAN-13 Wikipedia](https://fr.wikipedia.org/wiki/EAN_13)
- [GS1 France](https://www.gs1.fr/)
- [Algorithme de checksum EAN](https://www.gs1.org/services/how-calculate-check-digit-manually)
