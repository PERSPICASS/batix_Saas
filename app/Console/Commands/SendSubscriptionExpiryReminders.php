<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionExpiryReminderMail;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionExpiryReminders extends Command
{
    protected $signature   = 'subscriptions:send-expiry-reminders';
    protected $description = 'Envoie les emails de rappel d\'expiration à J-7 et J-1';

    public function handle(): void
    {
        $remindDays = [7, 1];

        foreach ($remindDays as $days) {
            $subscriptions = Subscription::with(['user', 'plan'])
                ->whereIn('status', ['active', 'trial'])
                ->whereDate('expires_at', now()->addDays($days)->toDateString())
                ->get();

            foreach ($subscriptions as $subscription) {
                $user = $subscription->user;

                if (!$user || !$user->email) {
                    continue;
                }

                try {
                    Mail::to($user->email)->send(
                        new SubscriptionExpiryReminderMail($user, $subscription, $days)
                    );
                    $this->info("Rappel J-{$days} envoyé à {$user->email}");
                } catch (\Throwable $e) {
                    Log::error('SubscriptionExpiryReminderMail failed', [
                        'user'  => $user->id,
                        'days'  => $days,
                        'error' => $e->getMessage(),
                    ]);
                    $this->error("Échec envoi à {$user->email} : {$e->getMessage()}");
                }
            }
        }

        $this->info('Rappels d\'expiration traités.');
    }
}
