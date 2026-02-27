# Dashboard Admin Plateforme - Graphiques et Visualisations

## 📊 Vue d'ensemble

Le dashboard de l'administration plateforme a été amélioré avec des graphiques interactifs et des visualisations de données avancées utilisant la bibliothèque **Recharts**.

## ✨ Fonctionnalités ajoutées

### 1. KPIs Principaux (Cards en haut)
- **Comptes totaux** - Nombre total de comptes super_admin
- **Boutiques actives** - Ratio des boutiques actives sur le total
- **Abonnements actifs** - Nombre d'abonnements actifs
- **Revenus mensuels** - Total des revenus en XAF

### 2. Statistiques des Abonnements
Section dédiée affichant:
- **Actifs** - Abonnements en cours (vert)
- **Essai** - Abonnements en période d'essai (bleu)
- **Expirés** - Abonnements expirés (orange)
- **Annulés** - Abonnements annulés (rouge)

### 3. Graphiques Interactifs

#### A. Évolution des Comptes (Area Chart)
- **Type**: Graphique en aires (Area Chart)
- **Couleur**: Amber (#f59e0b)
- **Données**: Nombre de nouveaux comptes par mois (6 derniers mois)
- **Axe X**: Mois (format "Mois Année")
- **Axe Y**: Nombre de comptes

#### B. Évolution des Boutiques (Area Chart)
- **Type**: Graphique en aires (Area Chart)
- **Couleur**: Emerald/Vert (#10b981)
- **Données**: Nombre de nouvelles boutiques par mois (6 derniers mois)
- **Axe X**: Mois (format "Mois Année")
- **Axe Y**: Nombre de boutiques

#### C. Répartition par Plan (Pie Chart)
- **Type**: Diagramme circulaire (Pie Chart)
- **Couleurs**: Palette de 5 couleurs (amber, blue, emerald, purple, orange)
- **Données**: Distribution des abonnements actifs par plan
- **Labels**: Nom du plan + pourcentage
- **Légende**: Liste avec nom du plan et revenus en XAF

#### D. Évolution des Revenus (Bar Chart)
- **Type**: Graphique en barres (Bar Chart)
- **Couleur**: Purple (#a855f7)
- **Données**: Revenus par mois (6 derniers mois)
- **Axe X**: Mois (format "Mois Année")
- **Axe Y**: Montant en XAF

### 4. Actions Rapides
4 cartes cliquables pour naviguer vers:
- **Comptes** → Liste des comptes
- **Boutiques** → Liste des boutiques
- **Plans** → Gestion des plans d'abonnement
- **Abonnements** → Gestion des abonnements actifs

### 5. Sections d'Activité Récente
Deux colonnes affichant:
- **Comptes récents** (5 derniers)
- **Boutiques récentes** (5 dernières)

## 🔧 Modifications techniques

### Backend (PlatformAdminController.php)

#### Nouvelles données calculées:
```php
// Statistiques des abonnements
$activeSubscriptions = Subscription::where('status', 'active')->count();
$trialSubscriptions = Subscription::where('status', 'trial')->count();
$expiredSubscriptions = Subscription::where('status', 'expired')->count();
$cancelledSubscriptions = Subscription::where('status', 'cancelled')->count();

// Revenus réels depuis les abonnements
$monthlyRevenue = Subscription::whereIn('status', ['active', 'trial'])->sum('amount');

// Évolution sur 6 mois
$accountsGrowth // Nouveaux comptes par mois
$shopsGrowth    // Nouvelles boutiques par mois
$revenueGrowth  // Revenus par mois

// Répartition par plan
$subscriptionsByPlan // Nombre et revenus par plan
```

#### Structure de données retournée:
```php
'stats' => [
    'total_accounts',
    'total_shops',
    'active_shops',
    'total_users',
    'monthly_revenue',
    'active_subscriptions',
    'trial_subscriptions',
    'expired_subscriptions',
    'cancelled_subscriptions',
],
'charts' => [
    'accounts_growth' => [['month' => 'Oct 2025', 'count' => 5], ...],
    'shops_growth' => [['month' => 'Oct 2025', 'count' => 8], ...],
    'subscriptions_by_plan' => [['name' => 'Starter', 'count' => 10, 'revenue' => 150000], ...],
    'revenue_growth' => [['month' => 'Oct 2025', 'revenue' => 350000], ...],
]
```

### Frontend (Dashboard.tsx)

#### Dépendances ajoutées:
```bash
npm install recharts
```

#### Composants Recharts utilisés:
- `ResponsiveContainer` - Container responsive
- `AreaChart` - Graphique en aires
- `BarChart` - Graphique en barres
- `PieChart` - Diagramme circulaire
- `Line`, `Bar`, `Pie`, `Area` - Éléments de graphique
- `XAxis`, `YAxis` - Axes
- `CartesianGrid` - Grille
- `Tooltip` - Info-bulles
- `Cell` - Cellules pour couleurs personnalisées

#### Custom Tooltip:
```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-white/10 bg-slate-900 p-3 shadow-lg">
                <p className="text-sm text-slate-400">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-semibold text-white">
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};
```

## 🎨 Design et Style

### Palette de couleurs:
```typescript
const COLORS = {
    primary: '#f59e0b',    // amber
    secondary: '#3b82f6',  // blue
    success: '#10b981',    // emerald
    danger: '#ef4444',     // red
    warning: '#f97316',    // orange
    purple: '#a855f7',     // purple
};
```

### Caractéristiques du design:
- **Containers**: `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl`
- **Grille responsive**: Grid layout avec breakpoints
- **Tooltips personnalisés**: Fond sombre avec bordure subtile
- **Animations**: Hover effects sur les cartes d'action
- **Gradients**: Dégradés pour les aires des graphiques

## 📈 Calculs et Métriques

### Période d'analyse:
- **6 derniers mois** pour tous les graphiques temporels
- Utilisation de `Carbon` pour les dates

### Formules:
```php
// Comptes par mois
User::where('role', 'super_admin')
    ->whereYear('created_at', $year)
    ->whereMonth('created_at', $month)
    ->count()

// Revenus par mois
Subscription::whereYear('started_at', $year)
    ->whereMonth('started_at', $month)
    ->whereIn('status', ['active', 'trial'])
    ->sum('amount')

// Répartition par plan
Subscription::with('plan')
    ->whereIn('status', ['active', 'trial'])
    ->get()
    ->groupBy('plan_id')
```

## 🔐 Sécurité

- **Vérification du rôle**: Seuls les `admin_platforme` peuvent accéder
- **Protection des routes**: Middleware auth
- **Filtrage des données**: Seules les données pertinentes sont exposées

## 📱 Responsivité

Le dashboard est entièrement responsive:
- **Mobile**: 1 colonne, graphiques empilés
- **Tablet**: 2 colonnes pour les graphiques
- **Desktop**: 2 ou 4 colonnes selon la section

### Breakpoints:
- `sm:grid-cols-2` - Small devices (640px+)
- `lg:grid-cols-4` - Large devices (1024px+)

## 🚀 Performance

### Optimisations:
1. **Requêtes optimisées** - Pas de N+1, utilisation de `with()`
2. **Eager loading** - Relations chargées en une seule requête
3. **Calculs côté serveur** - Agrégations SQL
4. **Pagination** - Pour les listes récentes (limite à 5 items)

## 🧪 Testing

Pour tester le dashboard avec des données:
```bash
php artisan db:seed --class=SubscriptionPlanSeeder
php artisan db:seed --class=SubscriptionTestSeeder
```

## 📝 Notes

- Les graphiques s'adaptent automatiquement à la taille du container
- Les tooltips affichent les valeurs formatées avec séparateurs de milliers
- Les couleurs sont cohérentes avec le design system de la plateforme
- Les données sont mises à jour en temps réel à chaque chargement de la page

## 🔄 Évolutions possibles

1. **Filtres temporels** - Permettre de changer la période d'analyse
2. **Export PDF** - Générer des rapports
3. **Graphiques supplémentaires** - Taux de conversion, churn rate, etc.
4. **Comparaison** - Comparer avec la période précédente
5. **Alertes** - Notifications pour les métriques critiques
6. **Refresh automatique** - Mise à jour toutes les X minutes
7. **Drill-down** - Cliquer sur un graphique pour plus de détails

## 📚 Documentation Recharts

Pour plus d'informations sur les graphiques:
- [Recharts Documentation](https://recharts.org/en-US/)
- [AreaChart](https://recharts.org/en-US/api/AreaChart)
- [BarChart](https://recharts.org/en-US/api/BarChart)
- [PieChart](https://recharts.org/en-US/api/PieChart)
