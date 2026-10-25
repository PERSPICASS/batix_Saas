<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;

/**
 * Désinscription en un clic du résumé quotidien des alertes (lien dans DailyAlertsMail).
 * La route est signée (signed:relative) : l'id dans l'URL ne suffit pas.
 */
class AlertsUnsubscribeController extends Controller
{
    public function __invoke(User $user): View
    {
        if (! $user->alerts_opted_out_at) {
            $user->forceFill(['alerts_opted_out_at' => now()])->save();
        }

        app()->setLocale($user->getLocale());

        return view('alerts.unsubscribed');
    }
}
