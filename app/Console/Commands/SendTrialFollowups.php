<?php

namespace App\Console\Commands;

use App\Mail\TrialFollowupMail;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Relance les comptes dont l'essai gratuit (14 jours) est fini sans paiement.
 * subscriptions:send-expiry-reminders prévient AVANT l'échéance ; ici on écrit
 * APRÈS, à J+1, J+3, J+7, J+14 et J+30, puis plus jamais.
 *
 * Chaque étape n'est envoyée que dans sa fenêtre (de son jour jusqu'à la
 * suivante, 7 jours pour la dernière). Un essai expiré depuis des mois ne
 * reçoit donc rien au déploiement, et un jour de panne ne déclenche pas de
 * rattrapage en rafale : on envoie l'étape courante, pas les précédentes.
 *
 * Exclus : comptes ayant déjà payé (ce n'est plus un essai, c'est un départ),
 * abonnement actif, paiement en attente récent, comptes démo, suspendus ou
 * désinscrits.
 */
class SendTrialFollowups extends Command
{
    protected $signature = 'trials:send-followups {--dry-run : Liste les envois sans rien envoyer}';

    protected $description = 'Relance les comptes dont l\'essai gratuit est terminé sans paiement (J+1, 3, 7, 14, 30)';

    public const STEPS = [1, 3, 7, 14, 30];

    private const LAST_STEP_WINDOW = 7;

    /** L'étape à envoyer N jours après la fin de l'essai, ou null hors fenêtre. */
    public static function dueStep(int $daysSinceTrialEnd): ?int
    {
        foreach (self::STEPS as $i => $step) {
            $next = self::STEPS[$i + 1] ?? $step + self::LAST_STEP_WINDOW;

            if ($daysSinceTrialEnd >= $step && $daysSinceTrialEnd < $next) {
                return $step;
            }
        }

        return null;
    }

    public function handle(): int
    {
        $today = now()->startOfDay();
        $oldest = $today->copy()->subDays(max(self::STEPS) + self::LAST_STEP_WINDOW);
        $sent = 0;

        $owners = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->where('is_demo', false)
            ->whereNull('trial_followups_opted_out_at')
            ->whereNotNull('email')
            // un essai gratuit (montant nul) terminé dans la fenêtre des relances…
            ->whereHas('subscriptions', fn ($q) => $q->where('amount', 0)
                ->whereNotNull('expires_at')
                ->whereBetween('expires_at', [$oldest, now()]))
            // …et jamais aucun paiement (une demande en attente n'en est pas un).
            ->whereDoesntHave('subscriptions', fn ($q) => $q->where('amount', '>', 0)->where('status', '!=', 'pending'))
            ->get();

        foreach ($owners as $owner) {
            if ($owner->isSuspended() || $owner->activeSubscription()) {
                continue;
            }

            // Paiement manuel en cours de validation : ne pas le relancer pendant ce temps.
            if ($owner->subscriptions()->where('status', 'pending')->where('created_at', '>=', now()->subDays(7))->exists()) {
                continue;
            }

            $trialEnd = Carbon::parse($owner->subscriptions()->where('amount', 0)->max('expires_at'));
            $step = self::dueStep((int) $trialEnd->copy()->startOfDay()->diffInDays($today));

            if ($step === null || DB::table('trial_followups')->where('user_id', $owner->id)->where('step', $step)->exists()) {
                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("J+{$step} → {$owner->email}");
                $sent++;
                continue;
            }

            // Réservé avant l'envoi : deux exécutions simultanées ne peuvent pas
            // envoyer le même email (unicité user_id + step).
            $reserved = DB::table('trial_followups')->insertOrIgnore([
                'user_id' => $owner->id,
                'step' => $step,
                'sent_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($reserved === 0) {
                continue;
            }

            $shopIds = $owner->shops()->pluck('id');

            try {
                Mail::to($owner->email)->send(new TrialFollowupMail(
                    $owner,
                    $step,
                    Product::whereIn('shop_id', $shopIds)->count(),
                    Sale::whereIn('shop_id', $shopIds)->where('status', 'completed')->count(),
                ));
                $sent++;
            } catch (\Throwable $e) {
                // Libéré pour retenter demain, tant que la fenêtre de l'étape est ouverte.
                DB::table('trial_followups')->where('user_id', $owner->id)->where('step', $step)->delete();
                Log::error('TrialFollowupMail failed', ['user' => $owner->id, 'step' => $step, 'error' => $e->getMessage()]);
                $this->error("Échec J+{$step} → {$owner->email} : {$e->getMessage()}");
            }
        }

        $this->info(($this->option('dry-run') ? 'À envoyer' : 'Relances envoyées')." : {$sent}");

        return self::SUCCESS;
    }
}
