<?php

namespace App\Console\Commands;

use App\Models\SubscriptionPlan;
use Illuminate\Console\Command;

class LinkChariowProducts extends Command
{
    protected $signature = 'chariow:link-products
                            {--plan= : Ne traiter qu\'un plan (slug)}
                            {--show : Afficher le mappage actuel sans rien modifier}';

    protected $description = 'Associer chaque plan payant à ses produits Chariow (mensuel et annuel)';

    public function handle(): int
    {
        $query = SubscriptionPlan::where('is_active', true)->orderBy('sort_order');

        if ($slug = $this->option('plan')) {
            $query->where('slug', $slug);
        }

        $plans = $query->get();

        if ($plans->isEmpty()) {
            $this->error('Aucun plan actif trouvé.');

            return self::FAILURE;
        }

        if ($this->option('show')) {
            $this->table(
                ['Plan', 'Prix mensuel', 'Produit mensuel', 'Produit annuel'],
                $plans->map(fn (SubscriptionPlan $p) => [
                    $p->slug,
                    $p->price,
                    $p->chariow_product_id ?: '—',
                    $p->chariow_product_id_yearly ?: '—',
                ])
            );

            return self::SUCCESS;
        }

        $this->info('Les IDs se trouvent dans Chariow → Produits (format prd_xxx). Le slug du produit fonctionne aussi.');
        $this->line('Laisser vide pour conserver la valeur actuelle.');
        $this->newLine();

        $updated = 0;

        foreach ($plans as $plan) {
            // Les plans gratuits (Free, Entreprise sur devis) ne passent jamais par
            // un paiement : leur associer un produit n'aurait pas de sens.
            if ((float) $plan->price === 0.0) {
                $this->line("  {$plan->slug} : plan sans prix, ignoré.");
                continue;
            }

            $yearlyPrice = round((float) $plan->price * 10);

            $this->newLine();
            $this->info("{$plan->name} — mensuel {$plan->price} XOF, annuel {$yearlyPrice} XOF");

            $monthly = $this->ask('  Produit Chariow mensuel', $plan->chariow_product_id);
            $yearly  = $this->ask('  Produit Chariow annuel', $plan->chariow_product_id_yearly);

            $plan->update([
                'chariow_product_id'        => $monthly ?: null,
                'chariow_product_id_yearly' => $yearly ?: null,
            ]);

            $updated++;
        }

        $this->newLine();
        $this->info("✓ {$updated} plan(s) mis à jour.");
        $this->line('Vérifiez avec : php artisan chariow:link-products --show');

        return self::SUCCESS;
    }
}
