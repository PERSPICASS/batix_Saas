<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProductAttributeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductVariationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\SubcategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SettingsController;
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

// Routes publiques pour les invitations (avant auth)
Route::get('/invitation/{token}', [InvitationController::class, 'show'])->name('invitation.show');
Route::post('/invitation/{token}/accept', [InvitationController::class, 'accept'])->name('invitation.accept');

// Routes avec préfixe code_user (pour tout le compte)
Route::prefix('{code_user}')
    ->middleware(['auth', \App\Http\Middleware\ValidateAccountAccess::class])
    ->group(function () {
        
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Routes pour les boutiques
    Route::resource('boutiques', ShopController::class)->names('shops')->parameters(['boutiques' => 'shop']);

    // Routes pour les produits
    Route::resource('produits', ProductController::class)->names('products')->parameters(['produits' => 'product']);
    Route::get('produits-template', [ProductController::class, 'downloadTemplate'])->name('products.template');
    Route::get('produits-export', [ProductController::class, 'export'])->name('products.export');
    Route::post('produits-import', [ProductController::class, 'import'])->name('products.import');
    
    // Routes pour les variations de produits
    Route::get('produits/{product}/variations', [ProductVariationController::class, 'index'])->name('products.variations.index');
    Route::post('produits/{product}/variations', [ProductVariationController::class, 'store'])->name('products.variations.store');
    Route::patch('produits/{product}/variations/{variation}', [ProductVariationController::class, 'update'])->name('products.variations.update');
    Route::delete('produits/{product}/variations/{variation}', [ProductVariationController::class, 'destroy'])->name('products.variations.destroy');

    // Routes pour les attributs de produits (variations)
    Route::get('attributs-produits', [ProductAttributeController::class, 'index'])->name('product-attributes.index');
    Route::post('attributs-produits', [ProductAttributeController::class, 'store'])->name('product-attributes.store');
    Route::patch('attributs-produits/{attribute}', [ProductAttributeController::class, 'update'])->name('product-attributes.update');
    Route::delete('attributs-produits/{attribute}', [ProductAttributeController::class, 'destroy'])->name('product-attributes.destroy');
    Route::post('attributs-produits/{attribute}/valeurs', [ProductAttributeController::class, 'addValue'])->name('product-attributes.add-value');
    Route::patch('attributs-produits-valeurs/{value}', [ProductAttributeController::class, 'updateValue'])->name('product-attributes.update-value');
    Route::delete('attributs-produits-valeurs/{value}', [ProductAttributeController::class, 'destroyValue'])->name('product-attributes.destroy-value');

    // Routes pour les catégories
    Route::resource('categories', CategoryController::class)->names('categories')->parameters(['categories' => 'category']);

    // Routes pour les sous-catégories
    Route::resource('sous-categories', SubcategoryController::class)->names('subcategories')->parameters(['sous-categories' => 'subcategory']);

    // Routes pour les clients
    Route::resource('clients', CustomerController::class)->names('customers')->parameters(['clients' => 'customer']);

    // Routes pour les factures
    Route::resource('factures', InvoiceController::class)->names('invoices')->parameters(['factures' => 'invoice']);

    // Routes pour les ventes
    Route::resource('ventes', SaleController::class)->names('sales')->parameters(['ventes' => 'sale']);

    // Stocks (mouvements de stock)
    Route::resource('stocks', StockMovementController::class)->except(['edit', 'update'])->parameters(['stocks' => 'stockMovement']);

    // Inventaires
    Route::resource('inventory', InventoryController::class);
    Route::post('inventory/{inventory}/complete', [InventoryController::class, 'complete'])->name('inventory.complete');

    // Utilisateurs
    Route::resource('users', UserController::class)->parameters(['users' => 'user']);

    // Fournisseurs
    Route::resource('suppliers', SupplierController::class)->parameters([
        'suppliers' => 'supplier'
    ]);

    Route::get('/abonnements', function () {
        return Inertia::render('Management/Placeholder', [
            'title' => 'Abonnements',
            'description' => 'Plans, limites de boutiques, facturation et upgrades.',
        ]);
    })->name('subscriptions.index');

    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Paramètres de la boutique
    Route::get('/parametres', [SettingsController::class, 'index'])->name('settings.index');
    Route::patch('/parametres', [SettingsController::class, 'update'])->name('settings.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
