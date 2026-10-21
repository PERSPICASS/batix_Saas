<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Dit, pour un compte donné, s'il peut écrire et POURQUOI — sans rien modifier.
 *
 * Écrit après deux allers-retours passés à deviner l'état d'un compte de production :
 * « le compte est expiré mais écrit encore » peut venir d'un déploiement qui n'a pas
 * pris, d'un abonnement sans date d'expiration (donc éternel), ou de la période de
 * grâce. Cette commande tranche en une exécution.
 */
class DiagnoseSubscription extends Command
{
    protected $signature   = 'subscription:diagnose {code_user : Le code du compte (ex. 7L6NZR3DGY)}';
    protected $description = "Explique si un compte est en lecture seule, et pourquoi (lecture seule, n'écrit rien)";

    public function handle(): int
    {
        $code = $this->argument('code_user');

        $owner = User::where('code_user', $code)->whereNotNull('code_user')->first();

        if (!$owner) {
            $this->error("Aucun compte avec le code « {$code} ».");

            return self::FAILURE;
        }

        $this->line("Compte      : {$owner->email} (id {$owner->id}, rôle {$owner->role})");
        $this->line('Créé le     : ' . $owner->created_at?->toDateTimeString());
        $this->line('Propriétaire: ' . ($owner->ownerId() ?? '— aucun (compte orphelin)'));
        $this->newLine();

        $subscriptions = Subscription::with('plan')
            ->where('user_id', $owner->ownerId())
            ->orderByDesc('started_at')
            ->orderByDesc('id')
            ->get();

        if ($subscriptions->isEmpty()) {
            $this->warn('Aucun abonnement en base pour ce compte.');
        } else {
            $this->table(
                ['id', 'plan', 'statut', 'début', 'expire le', 'fin essai'],
                $subscriptions->map(fn (Subscription $s) => [
                    $s->id,
                    $s->plan?->name ?? '—',
                    $s->status,
                    $s->started_at?->toDateString() ?? '—',
                    $s->expires_at?->toDateString() ?? 'JAMAIS (null)',
                    $s->trial_ends_at?->toDateString() ?? '—',
                ])->all()
            );
        }

        $this->newLine();

        $active = $owner->activeSubscription();

        if (!$active) {
            $this->info('VERDICT : écritures BLOQUÉES — le compte est en lecture seule.');
            $this->line("Si ce n'est pas ce que vous observez, c'est que le code déployé est antérieur");
            $this->line('à EnforceSubscriptionReadOnly (cache de routes à reconstruire, conteneur à');
            $this->line('redémarrer : opcache.validate_timestamps=0).');

            return self::SUCCESS;
        }

        $this->warn('VERDICT : écritures AUTORISÉES.');
        $this->line("Abonnement retenu : id {$active->id}, statut « {$active->status} ».");

        if ($active->expires_at === null) {
            $this->line("Raison : `expires_at` est NULL, ce que activeSubscription() lit comme");
            $this->line('« n\'expire jamais ». Cet abonnement ne s\'éteindra de lui-même à aucune date.');
        } elseif ($active->expires_at->isPast()) {
            $end = $owner->subscriptionGracePeriodEndsAt();
            $this->line('Raison : expiré le ' . $active->expires_at->toDateString()
                . ', mais dans la période de grâce de ' . User::SUBSCRIPTION_GRACE_PERIOD_DAYS
                . ' jours, qui court jusqu\'au ' . $end?->toDateString() . '.');
        } else {
            $this->line('Raison : abonnement encore valide jusqu\'au ' . $active->expires_at->toDateString() . '.');
        }

        return self::SUCCESS;
    }
}
