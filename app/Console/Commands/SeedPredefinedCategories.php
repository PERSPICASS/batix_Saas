<?php

namespace App\Console\Commands;

use App\Models\Shop;
use Illuminate\Console\Command;
use Database\Seeders\PredefinedCategoriesSeeder;

class SeedPredefinedCategories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:seed-predefined {--shop= : The ID of the shop to seed categories for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed predefined categories for a shop or all shops';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $shopId = $this->option('shop');

        if ($shopId) {
            $shop = Shop::find($shopId);
            
            if (!$shop) {
                $this->error("Shop with ID {$shopId} not found.");
                return self::FAILURE;
            }

            $this->info("Seeding predefined categories for shop: {$shop->name}...");
            
            $seeder = new PredefinedCategoriesSeeder();
            $seeder->setCommand($this);
            $seeder->run($shopId);
            
            $this->newLine();
            $this->info('✓ Categories seeded successfully!');
            
            return self::SUCCESS;
        }

        // Seed for all shops
        $shopsCount = Shop::count();
        
        if ($shopsCount === 0) {
            $this->warn('No shops found. Please create a shop first.');
            return self::FAILURE;
        }

        if (!$this->confirm("This will seed predefined categories for all {$shopsCount} shop(s). Continue?", true)) {
            $this->info('Operation cancelled.');
            return self::SUCCESS;
        }

        $this->info("Seeding predefined categories for all shops...");
        
        $seeder = new PredefinedCategoriesSeeder();
        $seeder->setCommand($this);
        $seeder->run();
        
        $this->newLine();
        $this->info('✓ Categories seeded successfully for all shops!');
        
        return self::SUCCESS;
    }
}
