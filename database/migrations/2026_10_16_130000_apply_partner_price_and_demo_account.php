<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Données de prod demandées par Fred le 2026-10-15 (pas d'accès direct à la base
 * de prod : passer par le déploiement, qui joue les migrations).
 *
 * - TUXWB4ZHQV (Aziz Sami, partenaire) : plan Growth facturé 15 000 FCFA / mois
 *   au lieu du prix du plan. Seuls les abonnements en cours ou à venir (active,
 *   trial, pending) sont corrigés : l'historique annulé/expiré garde ce qui a été
 *   enregistré à l'époque.
 * - 7L6NZR3DGY (compte démo de Fred) : exclu des chiffres de la plateforme.
 *
 * Ciblé par code de compte : sans effet sur toute autre base (dev, tests, CI).
 */
return new class extends Migration
{
    private const PARTNER_CODE = 'TUXWB4ZHQV';
    private const PARTNER_MONTHLY_PRICE = 15000;
    private const DEMO_CODE = '7L6NZR3DGY';

    public function up(): void
    {
        $partner = DB::table('users')->where('code_user', self::PARTNER_CODE)->where('role', 'super_admin')->first();

        if ($partner) {
            $growthIds = DB::table('subscription_plans')->where('slug', 'growth')->pluck('id');

            $updated = DB::table('subscriptions')
                ->where('user_id', $partner->id)
                ->whereIn('subscription_plan_id', $growthIds)
                ->whereIn('status', ['active', 'trial', 'pending'])
                ->update([
                    'amount' => self::PARTNER_MONTHLY_PRICE,
                    'billing_cycle' => 'monthly',
                    'updated_at' => now(),
                ]);

            // Rien à corriger = son abonnement n'est pas (ou plus) un Growth en cours :
            // à régler à la main depuis Admin › Compte.
            Log::log($updated > 0 ? 'info' : 'warning', 'Partner price applied', [
                'code_user' => self::PARTNER_CODE,
                'subscriptions' => $updated,
            ]);
        }

        // Visible dans le journal du déploiement GitHub : seule trace lisible sans accès à la prod.
        fwrite(STDOUT, sprintf("  partner %s: %s\n", self::PARTNER_CODE, $partner ? ($updated ?? 0).' subscription(s) set to '.self::PARTNER_MONTHLY_PRICE.'/month' : 'account not found'));

        $demo = DB::table('users')->where('code_user', self::DEMO_CODE)->where('role', 'super_admin')->update(['is_demo' => true]);
        Log::info('Demo account flagged', ['code_user' => self::DEMO_CODE, 'updated' => $demo]);
        fwrite(STDOUT, sprintf("  demo %s: %s\n", self::DEMO_CODE, $demo ? 'flagged' : 'account not found'));
    }

    public function down(): void
    {
        // Correction de données : pas de retour arrière automatique (l'ancien montant
        // n'était pas le bon). Se corrige depuis Admin › Compte si besoin.
    }
};
