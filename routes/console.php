<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rappels d'expiration d'abonnement — tous les jours à 8h00
Schedule::command('subscriptions:send-expiry-reminders')->dailyAt('08:00');
