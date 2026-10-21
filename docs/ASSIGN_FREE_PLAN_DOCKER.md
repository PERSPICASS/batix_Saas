# 🐳 Attribution du Plan FREE en Production (Docker)

## 📋 Guide d'Utilisation

### ⭐ Méthode Recommandée : Commande Artisan

#### 1. Se connecter au serveur de production
```bash
ssh root@srv1329410.hstgr.io
cd /opt/batix/apps/dev/batix_Saas
```

#### 2. Exécuter la commande
```bash
docker compose exec app php artisan subscription:assign-free azeezsemiu07@gmail.com
```

#### Sortie Attendue :
```
=== Attribution du Plan FREE ===
Email: azeezsemiu07@gmail.com

✓ Utilisateur trouvé:
  ID: 3
  Nom: Azeez Semiu
  Email: azeezsemiu07@gmail.com
  Rôle: super_admin
  Créé le: 2026-02-25 10:30:00

✓ Aucun abonnement actif trouvé

✓ Plan FREE trouvé:
  ID: 4
  Nom: FREE
  Durée: 30 jours

✅ Abonnement FREE créé avec succès !
  ID: 5
  Status: trial
  Début: 2026-02-28 16:00:00
  Expiration: 2026-03-30 16:00:00
  Jours restants: 30

🎉 L'utilisateur peut maintenant se connecter et profiter de son essai gratuit !
```

#### Avantages :
- ✅ Plus simple et fiable
- ✅ Gestion automatique des erreurs
- ✅ Confirmation interactive si abonnement existant
- ✅ Pas besoin de modifier un fichier script
- ✅ Fonctionne même si le container s'appelle différemment

---

### Méthode Alternative 1 : Via le Script PHP

> ⚠️ **Note** : Cette méthode peut avoir des problèmes avec les balises PHP dans Tinker. Préférer la commande Artisan ci-dessus.

#### 1. Modifier l'email dans le script
```bash
# Éditer le fichier assign_free_plan.php
# Ligne 9 : $email = 'azeezsemiu07@gmail.com';
```

#### 2. Exécuter avec Docker
```bash
# Depuis votre serveur de production
docker exec -i <nom_du_container_laravel> php artisan tinker < assign_free_plan.php
```

---

### Méthode Alternative 2 : Commande Tinker Directe

#### 1. Entrer dans le container
```bash
docker exec -it <nom_du_container_laravel> bash
```

#### 2. Lancer Tinker
```bash
php artisan tinker
```

#### 3. Exécuter le code PHP
```php
$email = 'azeezsemiu07@gmail.com';
$user = \App\Models\User::where('email', $email)->first();

if (!$user) {
    echo "Utilisateur non trouvé\n";
    exit;
}

// Vérifier s'il a déjà un abonnement
$existingSubscription = $user->activeSubscription();
if ($existingSubscription) {
    echo "A déjà un abonnement: " . $existingSubscription->plan->name . "\n";
    exit;
}

// Récupérer le plan FREE
$freePlan = \App\Models\SubscriptionPlan::where('slug', 'free')->first();

if (!$freePlan) {
    echo "Plan FREE non trouvé\n";
    exit;
}

// Créer l'abonnement
$subscription = \App\Models\Subscription::create([
    'user_id' => $user->id,
    'subscription_plan_id' => $freePlan->id,
    'status' => 'trial',
    'amount' => 0,
    'started_at' => now(),
    'expires_at' => now()->addDays(30),
]);

echo "✅ Plan FREE attribué! ID: " . $subscription->id . "\n";
echo "Expire le: " . $subscription->expires_at . "\n";
```

#### 4. Sortir de Tinker
```php
exit
```

---

### Méthode 3 : Commande Artisan Personnalisée (Avancé)

#### 1. Créer une commande Artisan
```bash
docker exec -it <nom_du_container> php artisan make:command AssignFreePlan
```

#### 2. Le fichier sera dans `app/Console/Commands/AssignFreePlan.php`

#### 3. Code de la commande :
```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Console\Command;

class AssignFreePlan extends Command
{
    protected $signature = 'subscription:assign-free {email}';
    protected $description = 'Attribuer le plan FREE à un utilisateur';

    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("Utilisateur non trouvé: {$email}");
            return 1;
        }
        
        if ($user->activeSubscription()) {
            $this->warn("L'utilisateur a déjà un abonnement actif.");
            return 0;
        }
        
        $freePlan = SubscriptionPlan::where('slug', 'free')->first();
        
        if (!$freePlan) {
            $this->error("Plan FREE non trouvé.");
            return 1;
        }
        
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $freePlan->id,
            'status' => 'trial',
            'amount' => 0,
            'started_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);
        
        $this->info("✅ Plan FREE attribué avec succès!");
        $this->table(
            ['Champ', 'Valeur'],
            [
                ['Utilisateur', $user->name],
                ['Email', $user->email],
                ['Plan', $freePlan->name],
                ['Status', $subscription->status],
                ['Expire le', $subscription->expires_at],
            ]
        );
        
        return 0;
    }
}
```

#### 4. Exécuter la commande
```bash
docker exec <nom_du_container> php artisan subscription:assign-free azeezsemiu07@gmail.com
```

---

## 🔍 Vérification Post-Attribution

### Vérifier l'abonnement créé
```bash
docker exec -i <container> php artisan tinker --execute="
\$user = \App\Models\User::where('email', 'azeezsemiu07@gmail.com')->first();
\$sub = \$user->activeSubscription();
echo 'Plan: ' . \$sub->plan->name . PHP_EOL;
echo 'Status: ' . \$sub->status . PHP_EOL;
echo 'Expire le: ' . \$sub->expires_at . PHP_EOL;
"
```

### Vérifier via MySQL/PostgreSQL
```bash
# Entrer dans le container de base de données
docker exec -it <nom_container_db> psql -U postgres -d batix_saas

# Requête SQL
SELECT 
    u.email, 
    sp.name as plan_name, 
    s.status, 
    s.expires_at,
    s.amount
FROM subscriptions s
JOIN users u ON u.id = s.user_id
JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
WHERE u.email = 'azeezsemiu07@gmail.com';
```

---

## 🚨 Troubleshooting

### Erreur : "Container not found"
```bash
# Lister les containers en cours d'exécution
docker ps

# Trouver le nom ou ID du container Laravel
# Utiliser ce nom dans les commandes
```

### Erreur : "Plan FREE non trouvé"
```bash
# Exécuter le seeder du plan FREE
docker exec <container> php artisan db:seed --class=FreePlanSeeder
```

### Erreur : "Field 'amount' doesn't have a default value"
```bash
# C'est déjà corrigé dans le script (amount = 0)
# Si ça persiste, vérifier la migration
```

### L'utilisateur ne voit pas la bannière FREE
```bash
# Vérifier que le plan slug est bien 'free'
docker exec -i <container> php artisan tinker --execute="
\$plan = \App\Models\SubscriptionPlan::find(4);
echo 'Slug: ' . \$plan->slug . PHP_EOL;
"

# Si ce n'est pas 'free', le corriger
docker exec -i <container> php artisan tinker --execute="
\$plan = \App\Models\SubscriptionPlan::find(4);
\$plan->slug = 'free';
\$plan->save();
echo 'Slug mis à jour' . PHP_EOL;
"
```

---

## 📊 Attribution en Masse

### Si vous avez plusieurs anciens comptes sans abonnement

#### 1. Créer un script pour tous les utilisateurs sans abonnement
```php
// assign_free_plan_bulk.php
$usersWithoutSubscription = \App\Models\User::whereDoesntHave('subscriptions')
    ->where('role', 'super_admin')
    ->get();

$freePlan = \App\Models\SubscriptionPlan::where('slug', 'free')->first();

echo "Utilisateurs sans abonnement: " . $usersWithoutSubscription->count() . PHP_EOL;

foreach ($usersWithoutSubscription as $user) {
    echo "Attribution à: {$user->email}... ";
    
    \App\Models\Subscription::create([
        'user_id' => $user->id,
        'subscription_plan_id' => $freePlan->id,
        'status' => 'trial',
        'amount' => 0,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
    ]);
    
    echo "✅" . PHP_EOL;
}

echo PHP_EOL . "✅ Terminé! {$usersWithoutSubscription->count()} abonnements créés." . PHP_EOL;
```

#### 2. Exécuter
```bash
docker exec -i <container> php artisan tinker < assign_free_plan_bulk.php
```

---

## 📝 Notes Importantes

1. **Backup** : Faites un backup de la DB avant l'exécution en production
2. **Test** : Testez d'abord en local avec Docker
3. **Logs** : Gardez une trace des emails traités
4. **Vérification** : Vérifiez toujours après attribution

## ✅ Checklist d'Exécution

- [ ] Identifier le nom du container Docker Laravel
- [ ] Vérifier que le plan FREE existe (slug='free')
- [ ] Backup de la base de données
- [ ] Copier le script `assign_free_plan.php` sur le serveur
- [ ] Modifier l'email dans le script
- [ ] Exécuter le script via Docker
- [ ] Vérifier la sortie du script
- [ ] Tester la connexion de l'utilisateur
- [ ] Vérifier que la bannière FREE s'affiche
- [ ] Vérifier les limites (1 boutique, 2 utilisateurs)

---

**Date de création** : 28 février 2026  
**Version** : 1.0.0  
**Testé avec** : Docker, Laravel 11, PostgreSQL
