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
