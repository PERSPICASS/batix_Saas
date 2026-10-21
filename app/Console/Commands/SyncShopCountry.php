<?php

namespace App\Console\Commands;

use App\Models\Shop;
use Illuminate\Console\Command;

class SyncShopCountry extends Command
{
    protected $signature = 'shops:sync-country {--dry-run : Show what would change without writing}';

    protected $description = "Align each shop's country with its owner's (chosen at registration). Before the country field existed, shops kept a hardcoded default (Maroc/France).";

    public function handle(): int
    {
        $shops = Shop::with('user')->whereNotNull('user_id')->get();

        $changed = [];
        foreach ($shops as $shop) {
            $ownerCountry = $shop->user?->country;

            // Skip owners with no country, and shops already aligned.
            if (!$ownerCountry || $shop->country === $ownerCountry) {
                continue;
            }

            $changed[] = [$shop->id, $shop->name, $shop->country ?? '(vide)', $ownerCountry];

            if (!$this->option('dry-run')) {
                $shop->update(['country' => $ownerCountry]);
            }
        }

        if (empty($changed)) {
            $this->info('Nothing to change — every shop already matches its owner’s country.');
            return self::SUCCESS;
        }

        $this->table(['Shop ID', 'Name', 'Was', 'Owner country'], $changed);

        if ($this->option('dry-run')) {
            $this->newLine();
            $this->warn(count($changed) . ' shop(s) would be updated. Re-run without --dry-run to apply.');
            return self::SUCCESS;
        }

        $this->newLine();
        $this->info('Updated ' . count($changed) . ' shop(s).');

        return self::SUCCESS;
    }
}
