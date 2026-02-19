# 💰 Système de Gestion de Devise et TVA

## 📋 Vue d'ensemble

Ce système permet de gérer de manière centralisée la devise et le taux de TVA pour toute l'application. Les paramètres définis dans la page **Paramètres** (`/parametres`) affectent automatiquement tout le projet.

---

## 🔧 Configuration Backend (Laravel)

### Helpers Disponibles

Les helpers sont automatiquement chargés via `composer.json` et disponibles partout dans Laravel.

#### 1. `get_shop_settings()`

Récupère les paramètres de la boutique de l'utilisateur actuel.

```php
$shop = get_shop_settings();
// Retourne: Shop | null
```

#### 2. `format_currency(float $amount, ?string $currency = null)`

Formate un montant en devise.

```php
echo format_currency(1234.56);
// Résultat: "$ 1 234,56" (si devise = USD)
// Résultat: "1 234,56 CFA" (si devise = XOF)

// Ou avec une devise spécifique
echo format_currency(1234.56, 'EUR');
// Résultat: "€ 1 234,56"
```

#### 3. `get_currency_symbol(?string $currency = null)`

Récupère le symbole de la devise.

```php
echo get_currency_symbol();
// Résultat: "$" ou "€" ou "CFA"

echo get_currency_symbol('EUR');
// Résultat: "€"
```

#### 4. `calculate_tax(float $price, ?float $taxRate = null)`

Calcule le montant de la TVA.

```php
$tax = calculate_tax(100);
// Si taux par défaut = 20%, résultat: 20.00

$tax = calculate_tax(100, 15);
// Résultat: 15.00
```

#### 5. `price_with_tax(float $price, ?float $taxRate = null)`

Calcule le prix TTC.

```php
$priceWithTax = price_with_tax(100);
// Si taux par défaut = 20%, résultat: 120.00

$priceWithTax = price_with_tax(100, 15);
// Résultat: 115.00
```

### Exemples d'utilisation dans les contrôleurs

```php
use Illuminate\Support\Facades\Inertia;

class InvoiceController extends Controller
{
    public function show(Invoice $invoice)
    {
        $invoice->load('items');
        
        // Calculer les totaux avec TVA
        $subtotal = $invoice->items->sum('amount');
        $tax = calculate_tax($subtotal);
        $total = $subtotal + $tax;
        
        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'subtotal_formatted' => format_currency($subtotal),
            'tax_formatted' => format_currency($tax),
            'total_formatted' => format_currency($total),
        ]);
    }
}
```

---

## 🎨 Frontend React/TypeScript

### Composant Currency

Affiche un montant formaté selon la devise de la boutique.

```tsx
import Currency from '@/Components/Currency';

function ProductCard({ product }) {
    return (
        <div>
            <h3>{product.name}</h3>
            <p>Prix: <Currency amount={product.price} /></p>
        </div>
    );
}
```

**Props:**
- `amount` (number, required) - Le montant à formater
- `className` (string, optional) - Classes CSS additionnelles

### Hook useShopSettings()

Accède aux paramètres de la boutique et fournit des fonctions utilitaires.

```tsx
import { useShopSettings } from '@/Components/Currency';

function InvoiceTotal() {
    const { 
        currency, 
        currencySymbol, 
        defaultTaxRate,
        formatCurrency, 
        calculateTax, 
        priceWithTax 
    } = useShopSettings();
    
    const subtotal = 1000;
    const tax = calculateTax(subtotal);
    const total = priceWithTax(subtotal);
    
    return (
        <div>
            <p>Devise: {currency} ({currencySymbol})</p>
            <p>TVA par défaut: {defaultTaxRate}%</p>
            <p>Sous-total: {formatCurrency(subtotal)}</p>
            <p>TVA: {formatCurrency(tax)}</p>
            <p>Total TTC: {formatCurrency(total)}</p>
        </div>
    );
}
```

**Retourne:**
```typescript
{
    currency: string;              // 'USD', 'EUR', ou 'XOF'
    currencySymbol: string;        // '$', '€', ou 'CFA'
    defaultTaxRate: number;        // Taux de TVA par défaut (ex: 20)
    invoicePrefix: string;         // Préfixe des factures (ex: 'INV')
    
    formatCurrency: (amount: number) => string;
    calculateTax: (price: number, customRate?: number) => number;
    priceWithTax: (price: number, customRate?: number) => number;
}
```

### Exemples complets

#### Tableau de produits

```tsx
import Currency from '@/Components/Currency';

const columns = [
    {
        key: 'name',
        label: 'Produit',
        render: (product) => product.name,
    },
    {
        key: 'price',
        label: 'Prix',
        align: 'right',
        render: (product) => <Currency amount={product.price} />,
    },
];
```

#### Détail de facture

```tsx
import { useShopSettings } from '@/Components/Currency';

function InvoiceDetail({ invoice }) {
    const { formatCurrency, calculateTax, defaultTaxRate } = useShopSettings();
    
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
                <span>TVA ({defaultTaxRate}%):</span>
                <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
                <span>Total TTC:</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>
    );
}
```

#### Formulaire de prix avec TVA

```tsx
import { useState } from 'react';
import { useShopSettings } from '@/Components/Currency';

function PriceForm() {
    const { formatCurrency, priceWithTax, defaultTaxRate } = useShopSettings();
    const [priceHT, setPriceHT] = useState(0);
    
    const priceTTC = priceWithTax(priceHT);
    
    return (
        <div className="space-y-4">
            <div>
                <label>Prix HT</label>
                <input
                    type="number"
                    value={priceHT}
                    onChange={(e) => setPriceHT(Number(e.target.value))}
                    step="0.01"
                />
            </div>
            <div className="text-slate-300">
                TVA ({defaultTaxRate}%): {formatCurrency(priceTTC - priceHT)}
            </div>
            <div className="text-white font-bold">
                Prix TTC: {formatCurrency(priceTTC)}
            </div>
        </div>
    );
}
```

---

## 🔄 Comment ça fonctionne

### 1. Configuration dans Paramètres

L'utilisateur configure dans `/parametres`:
- **Devise**: USD, EUR, ou XOF
- **Taux de TVA par défaut**: Ex: 20%

### 2. Backend (Laravel)

Les helpers PHP lisent automatiquement ces paramètres depuis la boutique de l'utilisateur connecté.

```php
// Dans n'importe quel contrôleur
$formatted = format_currency(1234.56);
```

### 3. Frontend (React)

Les paramètres sont partagés via Inertia (`HandleInertiaRequests`) et accessibles dans `usePage().props.shopSettings`.

```tsx
// Dans n'importe quel composant
import Currency from '@/Components/Currency';
<Currency amount={price} />
```

---

## 📊 Formats de devise

| Devise | Symbole | Format           | Exemple           |
|--------|---------|------------------|-------------------|
| USD    | $       | $ 1 234,56      | $ 1 234,56       |
| EUR    | €       | € 1 234,56      | € 1 234,56       |
| XOF    | CFA     | 1 234,56 CFA    | 1 234,56 CFA     |

---

## ✅ Avantages

1. **Centralisation**: Un seul endroit pour changer la devise
2. **Cohérence**: Tous les prix affichés utilisent la même devise
3. **Facilité**: Pas besoin de passer la devise partout
4. **TVA automatique**: Calculs de TVA centralisés
5. **Internationalisation**: Facile d'ajouter de nouvelles devises

---

## 🚀 Prochaines étapes

Pour utiliser ce système dans vos pages:

1. **Backend**: Utilisez les helpers `format_currency()`, `calculate_tax()`, etc.
2. **Frontend**: Importez `<Currency>` ou `useShopSettings()`
3. **Configuration**: Tout se fait dans `/parametres`

Enjoy! 💰
