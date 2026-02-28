<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Console\Command;

class AssignFreePlan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:assign-free {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Attribuer le plan FREE à un utilisateur existant';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        $this->info('=== Attribution du Plan FREE ===');
        $this->info("Email: {$email}");
        $this->newLine();

        // Trouver l'utilisateur
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("❌ Utilisateur non trouvé avec l'email: {$email}");
            return Command::FAILURE;
        }

        $this->info('✓ Utilisateur trouvé:');
        $this->line("  ID: {$user->id}");
        $this->line("  Nom: {$user->name}");
        $this->line("  Email: {$user->email}");
        $this->line("  Rôle: {$user->role}");
        $this->line("  Créé le: {$user->created_at}");
        $this->newLine();

        // Vérifier s'il a déjà un abonnement actif
        $existingSubscription = $user->activeSubscription();

        if ($existingSubscription) {
            $this->warn('⚠️  Utilisateur a déjà un abonnement actif:');
            $this->line("  Plan: {$existingSubscription->plan->name}");
            $this->line("  Status: {$existingSubscription->status}");
            $this->line("  Expire le: {$existingSubscription->expires_at}");
            $this->newLine();

            if (!$this->confirm('Voulez-vous continuer et remplacer cet abonnement ?', false)) {
                $this->info('Opération annulée.');
                return Command::SUCCESS;
            }

            // Annuler l'ancien abonnement
            $existingSubscription->update(['status' => 'cancelled']);
            $this->info('✓ Ancien abonnement annulé');
        } else {
            $this->info('✓ Aucun abonnement actif trouvé');
        }

        $this->newLine();

        // Récupérer le plan FREE
        $freePlan = SubscriptionPlan::where('slug', 'free')->first();

        if (!$freePlan) {
            $this->error('❌ Plan FREE non trouvé dans la base de données !');
            return Command::FAILURE;
        }

        $this->info('✓ Plan FREE trouvé:');
        $this->line("  ID: {$freePlan->id}");
        $this->line("  Nom: {$freePlan->name}");
        $this->line("  Durée: {$freePlan->trial_days} jours");
        $this->newLine();

        // Créer l'abonnement FREE
        $startDate = now();
        $expiresAt = $startDate->copy()->addDays($freePlan->trial_days);

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $freePlan->id,
            'status' => 'trial',
            'started_at' => $startDate,
            'expires_at' => $expiresAt,
            'amount' => 0,
        ]);

        $this->newLine();
        $this->info('✅ Abonnement FREE créé avec succès !');
        $this->line("  ID: {$subscription->id}");
        $this->line("  Status: {$subscription->status}");
        $this->line("  Début: {$subscription->started_at}");
        $this->line("  Expiration: {$subscription->expires_at}");
        $this->line("  Jours restants: " . now()->diffInDays($subscription->expires_at));
        $this->newLine();

        $this->info('🎉 L\'utilisateur peut maintenant se connecter et profiter de son essai gratuit !');

        return Command::SUCCESS;
    }
}
