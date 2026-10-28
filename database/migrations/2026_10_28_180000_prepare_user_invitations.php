<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Les comptes existants ont tous choisi (ou reçu) leur mot de passe : ils sont « acceptés ».
 * Sans cette date, un lien « nouveau mot de passe » envoyé à l'un d'eux le ferait passer
 * pour une invitation en attente (User::isInvitationPending).
 *
 * Les anciens jetons, eux, étaient stockés en clair par une ébauche jamais branchée :
 * UserInvitation ne stocke plus qu'une empreinte, ils ne correspondraient à rien.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->whereNull('invitation_accepted_at')->update(['invitation_accepted_at' => DB::raw('created_at')]);
        DB::table('users')->update(['invitation_token' => null]);
    }

    public function down(): void
    {
        // Rien à défaire : les dates posées ne changent aucun comportement antérieur.
    }
};
