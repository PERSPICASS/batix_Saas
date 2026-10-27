<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Accorder à UN compte en essai plus que ce que son plan permet : boutiques, et
 * collaborateurs par boutique.
 *
 * La dérogation est écrite dans `metadata.limits` de l'abonnement d'essai lui-même
 * (Subscription::trialLimit) : elle ne touche ni le plan, partagé par tous les essais, ni un
 * futur abonnement payé, et cesse d'elle-même dès que l'abonnement n'est plus un essai.
 */
class GrantTrialLimits extends Command
{
    protected $signature = 'subscription:grant-trial-limits
        {code_user : Le code du compte (celui des URLs)}
        {--shops= : Nombre de boutiques permises}
        {--users-per-shop= : Collaborateurs par boutique, propriétaire non compris}
        {--clear : Retirer la dérogation}';

    protected $description = "Accorder plus de boutiques et d'utilisateurs à un compte en essai";

    public function handle(): int
    {
        $owner = User::where('code_user', $this->argument('code_user'))->where('role', 'super_admin')->first();

        if (!$owner) {
            $this->error("Aucun propriétaire de compte avec le code {$this->argument('code_user')}.");

            return self::FAILURE;
        }

        $subscription = $owner->activeSubscription();

        if (!$subscription || $subscription->status !== 'trial') {
            $this->error("{$owner->email} n'est pas en essai" . ($subscription ? " (statut : {$subscription->status})" : '') . ' : rien à accorder.');

            return self::FAILURE;
        }

        $metadata = $subscription->metadata ?? [];

        if ($this->option('clear')) {
            unset($metadata['limits']);
        } else {
            $shops = $this->option('shops');
            $perShop = $this->option('users-per-shop');

            if ($shops === null && $perShop === null) {
                $this->error('Préciser --shops et/ou --users-per-shop (ou --clear).');

                return self::FAILURE;
            }

            foreach (['--shops' => $shops, '--users-per-shop' => $perShop] as $name => $value) {
                if ($value !== null && (!ctype_digit((string) $value) || (int) $value < 1)) {
                    $this->error("{$name} doit être un entier positif.");

                    return self::FAILURE;
                }
            }

            $metadata['limits'] = array_filter([
                'max_shops' => $shops !== null ? (int) $shops : ($metadata['limits']['max_shops'] ?? null),
                'max_users_per_shop' => $perShop !== null ? (int) $perShop : ($metadata['limits']['max_users_per_shop'] ?? null),
                'granted_at' => now()->toIso8601String(),
            ], fn ($value) => $value !== null);
        }

        $subscription->metadata = $metadata ?: null;
        $subscription->save();

        $limits = $owner->getSubscriptionLimits();
        $this->info("{$owner->email} — essai jusqu'au {$subscription->expires_at?->format('d/m/Y')}");
        $this->line("  Boutiques : {$limits['current_shops']} / {$limits['max_shops']}");
        $this->line('  Utilisateurs par boutique : ' . ($limits['max_users_per_shop'] ?? 'selon le plan (' . $limits['max_users'] . ' au total)'));

        return self::SUCCESS;
    }
}
