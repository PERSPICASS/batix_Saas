<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;

/**
 * Désinscription en un clic des relances de fin d'essai. La route est signée
 * (signed:relative) : l'id dans l'URL ne suffit pas à désinscrire quelqu'un.
 */
class TrialFollowupUnsubscribeController extends Controller
{
    public function __invoke(User $user): View
    {
        if (! $user->trial_followups_opted_out_at) {
            $user->forceFill(['trial_followups_opted_out_at' => now()])->save();
        }

        app()->setLocale($user->getLocale());

        return view('trial-followups.unsubscribed');
    }
}
