<?php

namespace App\Console\Commands;

use App\Mail\DailyAlertsMail;
use App\Models\User;
use App\Services\AlertDigest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Le résumé quotidien des alertes, un email par propriétaire (AlertDigest).
 *
 * Seulement aux comptes actifs avec un abonnement en cours, pas aux comptes démo,
 * suspendus ou désinscrits, et seulement quand il y a quelque chose à signaler. Une ligne
 * alert_digests (user_id + jour) est réservée avant l'envoi : deux exécutions ne peuvent
 * pas envoyer deux fois le même jour, et un échec libère la ligne pour un nouvel essai.
 */
class SendDailyAlerts extends Command
{
    protected $signature = 'alerts:send-daily {--dry-run : Liste les envois sans rien envoyer}';

    protected $description = 'Envoie à chaque propriétaire le résumé de ce qui demande son attention (baisse de CA, retards de paiement, stock, transferts)';

    public function handle(AlertDigest $digests): int
    {
        $today = now()->toDateString();
        $sent = 0;

        $owners = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->where('is_demo', false)
            ->whereNull('alerts_opted_out_at')
            ->whereNotNull('email')
            ->get();

        foreach ($owners as $owner) {
            if ($owner->isSuspended() || ! $owner->activeSubscription()) {
                continue;
            }

            $digest = $digests->for($owner);
            if ($digest === null) {
                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("{$owner->email} : ".count($digest['shops']).' boutique(s), '.count($digest['transfers']).' transfert(s)');
                $sent++;
                continue;
            }

            $reserved = DB::table('alert_digests')->insertOrIgnore([
                'user_id' => $owner->id,
                'sent_on' => $today,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if ($reserved === 0) {
                continue;
            }

            try {
                Mail::to($owner->email)->send(new DailyAlertsMail($owner, $digest));
                $sent++;
            } catch (\Throwable $e) {
                DB::table('alert_digests')->where('user_id', $owner->id)->where('sent_on', $today)->delete();
                Log::error('DailyAlertsMail failed', ['user' => $owner->id, 'error' => $e->getMessage()]);
                $this->error("Échec → {$owner->email} : {$e->getMessage()}");
            }
        }

        $this->info(($this->option('dry-run') ? 'À envoyer' : 'Résumés envoyés')." : {$sent}");

        return self::SUCCESS;
    }
}
