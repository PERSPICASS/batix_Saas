<?php

namespace App\Console\Commands;

use App\Models\AiConversation;
use Illuminate\Console\Command;

/**
 * Supprime les conversations de l'assistant restées sans activité.
 *
 * Ces échanges contiennent des noms de clients, des prix et des marges. Les conserver
 * indéfiniment fait grossir la table sans usage — personne ne relit un fil vieux de six
 * mois — et élargit inutilement ce qui serait exposé en cas de fuite.
 */
class PurgeAiConversations extends Command
{
    protected $signature = 'ai:purge-conversations {--days=90 : Inactivité au-delà de laquelle une conversation est supprimée} {--dry-run : Compter sans rien supprimer}';

    protected $description = 'Supprime les conversations IA inactives depuis N jours';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $query = AiConversation::where('last_message_at', '<', $cutoff);
        $count = (clone $query)->count();

        if ($this->option('dry-run')) {
            $this->info("{$count} conversation(s) seraient supprimées (inactives depuis plus de {$days} jours).");

            return self::SUCCESS;
        }

        // delete() sur le query builder est une suppression de masse : elle ne déclenche
        // aucun événement de modèle, mais la cascade des clés étrangères emporte bien les
        // messages — elle vit en base, pas dans Eloquent.
        $query->delete();

        $this->info("{$count} conversation(s) supprimées (inactives depuis plus de {$days} jours).");

        return self::SUCCESS;
    }
}
