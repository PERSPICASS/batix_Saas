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

// Sauvegarde de la base — tous les jours à 3h00, avant le pic d'activité.
Schedule::command('db:backup')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->onFailure(fn () => Log::error('Scheduled db:backup failed — see the command output above.'));
