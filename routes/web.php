<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\SubcategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MarketingGrowthController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::resource('boutiques', ShopController::class)->names('shops');
    Route::resource('produits', ProductController::class)->names('products');
    Route::resource('categories', CategoryController::class)->names('categories');
    Route::resource('sous-categories', SubcategoryController::class)->names('subcategories');
    Route::resource('clients', CustomerController::class)->names('customers');
    Route::resource('factures', InvoiceController::class)->names('invoices');
    Route::resource('ventes', SaleController::class)->names('sales');
    Route::resource('stocks', StockMovementController::class)->except(['edit', 'update']);
    Route::resource('inventory', InventoryController::class);
    Route::post('inventory/{inventory}/complete', [InventoryController::class, 'complete'])->name('inventory.complete');
    Route::resource('users', UserController::class);
    Route::resource('suppliers', SupplierController::class)->parameters([
        'suppliers' => 'supplier'
    ]);

    Route::prefix('marketing')->name('marketing.')->group(function () {
        Route::get('/', [MarketingGrowthController::class, 'index'])->name('index');
        Route::post('/campaigns', [MarketingGrowthController::class, 'storeCampaign'])->name('campaigns.store');
        Route::post('/leads', [MarketingGrowthController::class, 'storeLead'])->name('leads.store');
    });

    Route::get('/abonnements', function () {
        return Inertia::render('Management/Placeholder', [
            'title' => 'Abonnements',
            'description' => 'Plans, limites de boutiques, facturation et upgrades.',
        ]);
    })->name('subscriptions.index');

    Route::get('/analitics', function () {
        return Inertia::render('Management/Placeholder', [
            'title' => 'Analitics',
            'description' => 'Tableaux de bord, indicateurs de performance et tendances.',
        ]);
    })->name('analytics.index');

    Route::get('/parametres', [SettingsController::class, 'index'])->name('settings.index');
    Route::patch('/parametres', [SettingsController::class, 'update'])->name('settings.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
