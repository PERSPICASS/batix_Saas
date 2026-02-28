<?php

/**
 * Script pour attribuer le plan FREE aux anciens comptes
 * Usage: php artisan tinker < assign_free_plan.php
 * Ou en production Docker: docker exec -i <container_name> php artisan tinker < assign_free_plan.php
 */

// Définir l'email du compte
$email = 'azeezsemiu07@gmail.com';

echo "=== Attribution du Plan FREE ===" . PHP_EOL;
echo "Email: {$email}" . PHP_EOL;
echo PHP_EOL;

// Trouver l'utilisateur
$user = \App\Models\User::where('email', $email)->first();

if (!$user) {
    echo "❌ Utilisateur non trouvé avec l'email: {$email}" . PHP_EOL;
    exit(1);
}

echo "✓ Utilisateur trouvé:" . PHP_EOL;
echo "  ID: {$user->id}" . PHP_EOL;
echo "  Nom: {$user->name}" . PHP_EOL;
echo "  Email: {$user->email}" . PHP_EOL;
echo "  Rôle: {$user->role}" . PHP_EOL;
echo "  Créé le: {$user->created_at}" . PHP_EOL;
echo PHP_EOL;

// Vérifier s'il a déjà un abonnement actif
$existingSubscription = $user->activeSubscription();

if ($existingSubscription) {
    echo "⚠️  Utilisateur a déjà un abonnement actif:" . PHP_EOL;
    echo "  Plan: {$existingSubscription->plan->name}" . PHP_EOL;
    echo "  Status: {$existingSubscription->status}" . PHP_EOL;
    echo "  Expire le: {$existingSubscription->expires_at}" . PHP_EOL;
    echo PHP_EOL;
    echo "Voulez-vous continuer et remplacer cet abonnement ? (Ctrl+C pour annuler)" . PHP_EOL;
    exit(0);
}

echo "✓ Aucun abonnement actif trouvé" . PHP_EOL;
echo PHP_EOL;

// Récupérer le plan FREE
$freePlan = \App\Models\SubscriptionPlan::where('slug', 'free')->first();

if (!$freePlan) {
    echo "❌ Plan FREE non trouvé dans la base de données." . PHP_EOL;
    echo "Veuillez d'abord exécuter le seeder: php artisan db:seed --class=FreePlanSeeder" . PHP_EOL;
    exit(1);
}

echo "✓ Plan FREE trouvé:" . PHP_EOL;
echo "  ID: {$freePlan->id}" . PHP_EOL;
echo "  Nom: {$freePlan->name}" . PHP_EOL;
echo "  Prix: {$freePlan->price} EUR" . PHP_EOL;
echo "  Max boutiques: {$freePlan->max_shops}" . PHP_EOL;
echo "  Max utilisateurs: {$freePlan->max_users}" . PHP_EOL;
echo PHP_EOL;

// Créer l'abonnement FREE
try {
    $subscription = \App\Models\Subscription::create([
        'user_id' => $user->id,
        'subscription_plan_id' => $freePlan->id,
        'status' => 'trial',
        'amount' => 0,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
    ]);

    echo "✅ Plan FREE attribué avec succès!" . PHP_EOL;
    echo PHP_EOL;
    echo "Détails de l'abonnement:" . PHP_EOL;
    echo "  Subscription ID: {$subscription->id}" . PHP_EOL;
    echo "  Plan: {$freePlan->name}" . PHP_EOL;
    echo "  Status: {$subscription->status}" . PHP_EOL;
    echo "  Montant: {$subscription->amount} EUR" . PHP_EOL;
    echo "  Début: {$subscription->started_at}" . PHP_EOL;
    echo "  Expire le: {$subscription->expires_at}" . PHP_EOL;
    echo "  Jours restants: " . now()->diffInDays($subscription->expires_at) . PHP_EOL;
    echo PHP_EOL;
    echo "✓ L'utilisateur peut maintenant:" . PHP_EOL;
    echo "  - Créer {$freePlan->max_shops} boutique(s)" . PHP_EOL;
    echo "  - Ajouter {$freePlan->max_users} utilisateur(s)" . PHP_EOL;
    echo "  - Utiliser toutes les fonctionnalités pendant 30 jours" . PHP_EOL;
    
} catch (\Exception $e) {
    echo "❌ Erreur lors de la création de l'abonnement:" . PHP_EOL;
    echo "  {$e->getMessage()}" . PHP_EOL;
    exit(1);
}
