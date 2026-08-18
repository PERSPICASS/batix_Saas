<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rappels d'expiration d'abonnement — tous les jours à 8h00
Schedule::command('subscriptions:send-expiry-reminders')->dailyAt('08:00');

// Purge des conversations de l'assistant IA inactives depuis 90 jours — 3h30, après la
// sauvegarde de 3h00 pour qu'un fil supprimé reste récupérable dans le dernier dump.
Schedule::command('ai:purge-conversations')->dailyAt('03:30');

// ATTENTION : c'est bien ce fichier qui définit le planning. app/Console/Kernel.php
// n'est plus lu depuis Laravel 11 (bootstrap/app.php déclare `commands:` ici) ;
// toute tâche ajoutée là-bas ne s'exécutera jamais. Vérifier avec `schedule:list`.

// Factures récurrentes — tous les jours à 2h00.
// Cette tâche était déclarée dans app/Console/Kernel.php, jamais lu : elle n'a donc
// jamais tourné en production. Prévisualiser l'arriéré avec
// `php artisan invoices:generate-recurring --dry-run` avant de compter dessus.
Schedule::command('invoices:generate-recurring')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onFailure(fn () => Log::error('Scheduled invoices:generate-recurring failed.'));

// Sauvegarde de la base — tous les jours à 3h00, avant le pic d'activité.
Schedule::command('db:backup')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->onFailure(fn () => Log::error('Scheduled db:backup failed — see the command output above.'));

// Audit du stock — tous les lundis à 4h00, après la sauvegarde de 3h.
//
// Les compteurs (products.stock_quantity, depot_products.quantity) et le registre des
// mouvements doivent raconter la même histoire. Rien ne le vérifiait, si bien qu'une dérive
// restait invisible : ni constatable, ni datable, ni traçable. Une fois la base remise en
// cohérence avec --baseline, tout nouvel écart désigne un vrai problème.
//
// `--fail-on-drift` fait sortir la commande en échec quand il reste des écarts : un écart
// n'est pas une panne, mais l'ordonnanceur n'a que le code de sortie pour le savoir.
//
// Jamais --baseline ici : ce serait masquer automatiquement ce qu'on cherche à détecter.
Schedule::command('stock:audit --fail-on-drift')
    ->weeklyOn(1, '04:00')
    ->withoutOverlapping()
    ->onFailure(function () {
        $message = 'stock:audit a relevé des écarts entre les compteurs de stock et le registre des mouvements.';

        Log::error($message);

        // Le stack de journalisation ne contient que `daily` : un Log::error finit dans un
        // fichier que personne ne lit. Sentry est le seul endroit où l'alerte sera vue.
        if (app()->bound('sentry')) {
            \Sentry\captureMessage($message);
        }
    });
