<?php

namespace App\Console\Commands;

use App\Models\Expense;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Déplacer les justificatifs de dépense hors du dossier servi par le serveur web.
 *
 * Les nouveaux dépôts arrivent déjà sur le disque privé ; ceux d'avant sont restés sur
 * `public`, donc lisibles sans session par qui connaît l'URL. Tant qu'ils y sont,
 * `Expense::receiptDisk()` les y trouve et l'application continue de les afficher — c'est
 * cette commande qui referme, et elle seule.
 */
class SecureExpenseReceipts extends Command
{
    protected $signature = 'expenses:secure-receipts {--dry-run : Lister les fichiers à déplacer sans rien écrire}';

    protected $description = 'Move expense receipts off the public disk onto the private one';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $public = Storage::disk('public');
        $private = Storage::disk(Expense::RECEIPT_DISK);

        $moved = 0;
        $missing = [];

        $expenses = Expense::whereNotNull('receipt')->orderBy('id')->get();

        foreach ($expenses as $expense) {
            $path = $expense->receipt;

            if ($private->exists($path)) {
                continue; // déjà déplacé, ou déposé après le correctif
            }

            if (!$public->exists($path)) {
                $missing[] = "#{$expense->id} → {$path}";
                continue;
            }

            if ($dryRun) {
                $this->line("  déplacerait  {$path}");
                $moved++;
                continue;
            }

            // Copie puis suppression, et non un déplacement : entre les deux, le fichier
            // existe des deux côtés et `receiptDisk()` le trouve toujours. Une copie ratée
            // laisse l'original en place plutôt qu'un justificatif perdu.
            $private->put($path, $public->get($path));

            if (!$private->exists($path)) {
                $this->error("Échec de la copie de {$path} — arrêt, rien n'est supprimé.");

                return self::FAILURE;
            }

            $public->delete($path);
            $moved++;
        }

        $this->info($dryRun
            ? "{$moved} justificatif(s) à déplacer."
            : "{$moved} justificatif(s) déplacé(s) sur le disque privé.");

        if ($missing !== []) {
            $this->newLine();
            $this->warn(count($missing) . ' dépense(s) référencent un fichier introuvable sur les deux disques :');
            foreach ($missing as $line) {
                $this->line("  {$line}");
            }
            $this->line('Rien à faire ici : le fichier a été perdu avant cette commande.');
        }

        return self::SUCCESS;
    }
}
