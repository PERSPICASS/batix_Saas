<?php

$user = \App\Models\User::where('email', 'mirage@gmail.com')->first();
if (!$user) {
    echo "Utilisateur introuvable\n";
    exit(1);
}
echo "Utilisateur: {$user->name} | email: {$user->email} | code_user: {$user->code_user}\n";

$freePlan = \App\Models\Plan::where('slug', 'free')->first()
    ?? \App\Models\Plan::where('price', 0)->first();

if (!$freePlan) {
    echo "Plan free introuvable\n";
    exit(1);
}
echo "Plan trouvé: {$freePlan->name} (id={$freePlan->id})\n";

// Vérifier si une subscription existe déjà
$existing = \App\Models\Subscription::where('user_id', $user->id)->first();
if ($existing) {
    $existing->update([
        'plan_id'    => $freePlan->id,
        'status'     => 'active',
        'ends_at'    => null,
        'trial_ends_at' => null,
    ]);
    echo "Abonnement mis à jour vers le plan free.\n";
} else {
    \App\Models\Subscription::create([
        'user_id'    => $user->id,
        'plan_id'    => $freePlan->id,
        'status'     => 'active',
        'starts_at'  => now(),
        'ends_at'    => null,
    ]);
    echo "Abonnement free créé.\n";
}

echo "Done.\n";
