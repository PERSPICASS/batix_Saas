<?php

namespace App\Services;

use App\Mail\UserInvitationMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Le lien par lequel un employé choisit lui-même son mot de passe : à la création de son
 * compte (invitation), ou plus tard s'il l'a oublié. Le propriétaire ne saisit jamais le
 * mot de passe de personne.
 *
 * Seule l'empreinte du jeton est stockée (`users.invitation_token`) : une fuite de la base
 * ne donne aucun lien utilisable. Conséquence voulue : un lien ne peut pas être réaffiché,
 * on en émet un nouveau, et le précédent cesse aussitôt de fonctionner.
 */
class UserInvitation
{
    public const VALID_DAYS = 7;

    /** Émet un nouveau lien et invalide le précédent. */
    public static function issue(User $user): string
    {
        $token = Str::random(64);

        $user->forceFill([
            'invitation_token' => hash('sha256', $token),
            'invitation_sent_at' => now(),
        ])->save();

        return route('invitation.show', ['token' => $token]);
    }

    /** Émet un lien et l'envoie par email. Renvoie le lien, pour le copier aussi. */
    public static function send(User $user, User $sentBy): string
    {
        $url = self::issue($user);

        Mail::to($user->email)->send(new UserInvitationMail($user, $sentBy, $url));

        return $url;
    }

    /** L'utilisateur que ce lien désigne, s'il est encore valable. */
    public static function find(string $token): ?User
    {
        $user = User::where('invitation_token', hash('sha256', $token))->first();

        if (!$user || !$user->invitation_sent_at
            || $user->invitation_sent_at->copy()->addDays(self::VALID_DAYS)->isPast()) {
            return null;
        }

        return $user;
    }

    /**
     * Le mot de passe choisi. Le lien est détruit, et l'email tenu pour vérifié : le lien
     * n'a pu arriver que dans cette boîte (ou par le propriétaire, qui connaît la personne).
     */
    public static function accept(User $user, string $password): void
    {
        $wasPending = $user->isInvitationPending();

        $user->forceFill([
            'password' => Hash::make($password),
            'remember_token' => Str::random(60),
            'invitation_token' => null,
            'invitation_accepted_at' => $user->invitation_accepted_at ?? now(),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        // Un nouveau mot de passe sur un compte déjà actif : les sessions ouvertes avec
        // l'ancien n'ont plus de raison de rester valides.
        if (!$wasPending) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->tokens()->delete();
        }
    }
}
