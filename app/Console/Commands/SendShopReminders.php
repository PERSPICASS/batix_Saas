<?php

namespace App\Console\Commands;

use App\Mail\ShopReminderMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Relance les inscrits qui n'ont jamais créé leur boutique. L'essai ne démarre qu'à la
 * création de la boutique : ces comptes ne recevaient donc aucune relance d'essai, et
 * personne ne leur écrivait. J+1 puis J+3 après l'inscription, puis plus jamais.
 *
 * Même logique de fenêtres que trials:send-followups : chaque étape ne part que dans sa
 * fenêtre, si bien qu'une inscription ancienne ne reçoit rien au déploiement.
 *
 * Seulement les emails vérifiés (une adresse jamais confirmée peut être fausse, et ses
 * rebonds nuiraient à la délivrabilité), ni démo, ni désactivé, ni désinscrit.
 */
class SendShopReminders extends Command
{
    protected $signature = 'signups:send-shop-reminders {--dry-run : Liste les envois sans rien envoyer}';

    protected $description = 'Relance les inscrits qui n\'ont pas créé leur boutique (J+1, J+3)';

    public const STEPS = [1, 3];

    private const LAST_STEP_WINDOW = 4;

    /** L'étape à envoyer N jours après l'inscription, ou null hors fenêtre. */
    public static function dueStep(int $daysSinceSignup): ?int
    {
        foreach (self::STEPS as $i => $step) {
            $next = self::STEPS[$i + 1] ?? $step + self::LAST_STEP_WINDOW;

            if ($daysSinceSignup >= $step && $daysSinceSignup < $next) {
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

        $signups = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->where('is_demo', false)
            ->whereNull('trial_followups_opted_out_at')
            ->whereNotNull('email_verified_at')
            // Un invité (ancien bug « Super Admin ») n'est pas un prospect.
            ->whereNull('invitation_token')
            ->whereDoesntHave('shops')
            ->whereBetween('created_at', [$oldest, now()])
            ->get();

        foreach ($signups as $user) {
            $step = self::dueStep((int) $user->created_at->copy()->startOfDay()->diffInDays($today));

            if ($step === null || DB::table('signup_followups')->where('user_id', $user->id)->where('step', $step)->exists()) {
                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("J+{$step} → {$user->email}");
                $sent++;
                continue;
            }

            // Réservé avant l'envoi : deux exécutions simultanées n'envoient pas deux fois.
            $reserved = DB::table('signup_followups')->insertOrIgnore([
                'user_id' => $user->id,
                'step' => $step,
                'sent_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($reserved === 0) {
                continue;
            }

            try {
                Mail::to($user->email)->send(new ShopReminderMail($user, $step));
                $sent++;
            } catch (\Throwable $e) {
                // Libéré pour retenter demain, tant que la fenêtre de l'étape est ouverte.
                DB::table('signup_followups')->where('user_id', $user->id)->where('step', $step)->delete();
                Log::error('ShopReminderMail failed', ['user' => $user->id, 'step' => $step, 'error' => $e->getMessage()]);
                $this->error("Échec J+{$step} → {$user->email} : {$e->getMessage()}");
            }
        }

        $this->info(($this->option('dry-run') ? 'À envoyer' : 'Relances envoyées')." : {$sent}");

        return self::SUCCESS;
    }
}
