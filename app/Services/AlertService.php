<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Preorder;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Carbon\Carbon;

class AlertService
{
    public static function createLowStockAlert(Product $product, User $user): void
    {
        Alert::create([
            'user_id' => $user->id,
            'shop_id' => $product->shop_id,
            'type' => 'stock_low',
            'title' => 'Stock faible: ' . $product->name,
            'message' => "Le produit \"{$product->name}\" a un stock faible ({$product->stock_quantity} restant). Stock minimum: {$product->min_stock_alert}",
            'related_type' => 'Product',
            'related_id' => $product->id,
        ]);
    }

    public static function createOutOfStockAlert(Product $product, User $user): void
    {
        // Check if alert already exists for today
        $existingAlert = Alert::where('user_id', $user->id)
            ->where('type', 'stock_out')
            ->where('related_type', 'Product')
            ->where('related_id', $product->id)
            ->whereDate('created_at', today())
            ->exists();

        if ($existingAlert) {
            return;
        }

        Alert::create([
            'user_id' => $user->id,
            'shop_id' => $product->shop_id,
            'type' => 'stock_out',
            'title' => 'Stock épuisé: ' . $product->name,
            'message' => "Le produit \"{$product->name}\" est en rupture de stock.",
            'related_type' => 'Product',
            'related_id' => $product->id,
        ]);
    }

    public static function createOverdueCreditAlert(Sale $sale, User $user): void
    {
        $daysOverdue = now()->diffInDays($sale->credit_due_date);

        Alert::create([
            'user_id' => $user->id,
            'shop_id' => $sale->shop_id,
            'type' => 'credit_overdue',
            'title' => 'Créance en retard: ' . $sale->ticket_number,
            'message' => "La créance {$sale->ticket_number} pour {$sale->customer?->name} est en retard de {$daysOverdue} jours. Montant: " . number_format($sale->remaining_amount, 0, ',', ' ') . " FCFA",
            'related_type' => 'Sale',
            'related_id' => $sale->id,
        ]);
    }

    public static function createPreorderReadyAlert(Preorder $preorder, User $user): void
    {
        Alert::create([
            'user_id' => $user->id,
            'shop_id' => $preorder->shop_id,
            'type' => 'preorder_ready',
            'title' => 'Pré-commande prête: ' . $preorder->product->name,
            'message' => "La pré-commande pour {$preorder->customer->name} ({$preorder->quantity_ordered}x {$preorder->product->name}) est prête pour être convertie en vente.",
            'related_type' => 'Preorder',
            'related_id' => $preorder->id,
        ]);
    }

    public static function checkAndCreateAlerts(Shop $shop, User $user): void
    {
        // Check for low stock products
        $lowStockProducts = Product::where('shop_id', $shop->id)
            ->where('track_stock', true)
            ->whereRaw('stock_quantity <= min_stock_alert')
            ->where('stock_quantity', '>', 0)
            ->get();

        foreach ($lowStockProducts as $product) {
            // Check if alert already exists for today
            $existingAlert = Alert::where('user_id', $user->id)
                ->where('type', 'stock_low')
                ->where('related_type', 'Product')
                ->where('related_id', $product->id)
                ->whereDate('created_at', today())
                ->exists();

            if (!$existingAlert) {
                self::createLowStockAlert($product, $user);
            }
        }

        // Check for out of stock products
        $outOfStockProducts = Product::where('shop_id', $shop->id)
            ->where('track_stock', true)
            ->where('stock_quantity', '=', 0)
            ->get();

        foreach ($outOfStockProducts as $product) {
            self::createOutOfStockAlert($product, $user);
        }

        // Check for overdue credits
        $overdueCredits = Sale::where('shop_id', $shop->id)
            ->whereIn('status', ['pending', 'completed'])
            ->where('remaining_amount', '>', 0)
            ->where('credit_due_date', '<', now())
            ->get();

        foreach ($overdueCredits as $sale) {
            // Check if alert already exists for today
            $existingAlert = Alert::where('user_id', $user->id)
                ->where('type', 'credit_overdue')
                ->where('related_type', 'Sale')
                ->where('related_id', $sale->id)
                ->whereDate('created_at', today())
                ->exists();

            if (!$existingAlert) {
                self::createOverdueCreditAlert($sale, $user);
            }
        }

        // Check for preorders ready for conversion
        $readyPreorders = Preorder::where('shop_id', $shop->id)
            ->where('status', 'ready')
            ->get();

        foreach ($readyPreorders as $preorder) {
            // Check if alert already exists
            $existingAlert = Alert::where('user_id', $user->id)
                ->where('type', 'preorder_ready')
                ->where('related_type', 'Preorder')
                ->where('related_id', $preorder->id)
                ->where('is_read', false)
                ->exists();

            if (!$existingAlert) {
                self::createPreorderReadyAlert($preorder, $user);
            }
        }
    }
}
