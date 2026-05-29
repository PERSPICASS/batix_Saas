<?php

use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PlatformAdminController;
use App\Http\Controllers\ProductAttributeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductVariationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\SubcategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\DepotController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\JekoController;
use App\Http\Controllers\PawaPayController;
use App\Http\Controllers\PlatformSettingsController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\BlogAdminController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\ReturnsController;
use App\Http\Controllers\ReturnedInventoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

Route::get('/', [WelcomeController::class, 'index']);
Route::post('/contact', [ContactController::class, 'send'])->name('contact.send');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Routes publiques blog
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

// Route pour servir les fichiers uploadés (logos, images, etc.)
Route::get('/storage/{path}', function ($path) {
    $file = Storage::disk('public')->path($path);
    
    if (!file_exists($file)) {
        abort(404);
    }
    
    return Response::file($file);
})->where('path', '.*')->name('storage.file');

// Route publique pour voir les plans
Route::get('/plans', [SubscriptionPlanController::class, 'publicIndex'])->name('plans.index');

// Routes paiement manuel (auth requise)
Route::middleware(['auth'])->group(function () {
    Route::get('/plans/{plan}/checkout', [PaymentController::class, 'checkout'])->name('payment.checkout');
    Route::post('/plans/{plan}/process', [PaymentController::class, 'process'])->name('payment.process');
    Route::get('/payment/confirmation/{planSlug}', [PaymentController::class, 'confirmation'])->name('payment.confirmation');
});

// Routes PawaPay (webhook public, autres avec auth)
Route::post('/pawapay/webhook', [PawaPayController::class, 'webhook'])
    ->name('pawapay.webhook')
    ->withoutMiddleware(['web']); // stateless webhook

Route::middleware(['auth'])->group(function () {
    Route::post('/pawapay/initiate/{plan}', [PawaPayController::class, 'initiate'])->name('pawapay.initiate');
    Route::get('/pawapay/status/{depositId}', [PawaPayController::class, 'pollStatus'])->name('pawapay.status');
    Route::post('/pawapay/simulate/{depositId}', [PawaPayController::class, 'simulate'])->name('pawapay.simulate');
});

// Routes Jèko (webhook public, success/error public redirects, initiate with auth)
Route::post('/jeko/webhook', [JekoController::class, 'webhook'])
    ->name('jeko.webhook')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]); // public webhook, no CSRF

Route::get('/jeko/success', [JekoController::class, 'success'])->name('jeko.success');
Route::get('/jeko/error', [JekoController::class, 'error'])->name('jeko.error');

Route::middleware(['auth'])->group(function () {
    Route::post('/jeko/initiate/{plan}', [JekoController::class, 'initiate'])->name('jeko.initiate');
});

// Routes publiques pour les invitations (avant auth)
Route::get('/invitation/{token}', [InvitationController::class, 'show'])->name('invitation.show');
Route::post('/invitation/{token}/accept', [InvitationController::class, 'accept'])->name('invitation.accept');

// Routes admin plateforme (accès réservé aux admin_platforme)
Route::middleware(['auth'])->prefix('platform-admin')->group(function () {
    Route::get('/dashboard', [PlatformAdminController::class, 'index'])->name('platform.dashboard');
    Route::get('/accounts', [PlatformAdminController::class, 'accounts'])->name('platform.accounts');
    Route::post('/accounts/{user}/toggle', [PlatformAdminController::class, 'toggleAccountStatus'])->name('platform.accounts.toggle');
    Route::get('/shops', [PlatformAdminController::class, 'shops'])->name('platform.shops');
    Route::post('/shops/{shop}/toggle', [PlatformAdminController::class, 'toggleShopStatus'])->name('platform.shops.toggle');
    Route::get('/shops/{shop}/products', [PlatformAdminController::class, 'shopProducts'])->name('platform.shops.products');
    
    // Subscription Plans Management
    Route::resource('subscriptions', SubscriptionPlanController::class)->parameters([
        'subscriptions' => 'plan'
    ])->names([
        'index' => 'platform.subscriptions.index',
        'create' => 'platform.subscriptions.create',
        'store' => 'platform.subscriptions.store',
        'edit' => 'platform.subscriptions.edit',
        'update' => 'platform.subscriptions.update',
        'destroy' => 'platform.subscriptions.destroy',
    ]);
    Route::post('/subscriptions/{plan}/toggle', [SubscriptionPlanController::class, 'toggleStatus'])->name('platform.subscriptions.toggle');
    
    // Active Subscriptions Management
    Route::get('/active-subscriptions', [PlatformAdminController::class, 'subscriptions'])->name('platform.active-subscriptions');
    Route::post('/active-subscriptions/{subscription}/cancel', [PlatformAdminController::class, 'cancelSubscription'])->name('platform.active-subscriptions.cancel');
    Route::post('/active-subscriptions/{subscription}/renew', [PlatformAdminController::class, 'renewSubscription'])->name('platform.active-subscriptions.renew');
    Route::post('/active-subscriptions/{subscription}/update-dates', [PlatformAdminController::class, 'updateSubscriptionDates'])->name('platform.active-subscriptions.update-dates');
    Route::post('/active-subscriptions/{subscription}/activate', [PlatformAdminController::class, 'activateSubscription'])->name('platform.active-subscriptions.activate');

    // Paramètres plateforme
    Route::get('/settings', [PlatformSettingsController::class, 'index'])->name('platform.settings');
    Route::patch('/settings', [PlatformSettingsController::class, 'update'])->name('platform.settings.update');

    // MRR Dashboard
    Route::get('/mrr', [PlatformAdminController::class, 'mrrDashboard'])->name('platform.mrr');

    // Blog Management
    Route::get('/blog', [BlogAdminController::class, 'index'])->name('platform.blog.index');
    Route::get('/blog/create', [BlogAdminController::class, 'create'])->name('platform.blog.create');
    Route::post('/blog', [BlogAdminController::class, 'store'])->name('platform.blog.store');
    Route::get('/blog/{post}/edit', [BlogAdminController::class, 'edit'])->name('platform.blog.edit');
    Route::put('/blog/{post}', [BlogAdminController::class, 'update'])->name('platform.blog.update');
    Route::delete('/blog/{post}', [BlogAdminController::class, 'destroy'])->name('platform.blog.destroy');
    Route::post('/blog/{post}/toggle', [BlogAdminController::class, 'togglePublished'])->name('platform.blog.toggle');
});

// Routes avec préfixe code_user (pour tout le compte)
Route::prefix('{code_user}')
    ->middleware(['auth', 'verified:verification.code.show', \App\Http\Middleware\ValidateAccountAccess::class])
    ->group(function () {
        
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Routes pour les boutiques (avec vérification des limites d'abonnement)
    Route::post('boutiques', [ShopController::class, 'store'])
        ->name('shops.store')
        ->middleware('subscription.limits:shop');
    Route::get('boutiques', [ShopController::class, 'index'])->name('shops.index');
    Route::get('boutiques/create', [ShopController::class, 'create'])->name('shops.create');
    Route::get('boutiques/{shop}', [ShopController::class, 'show'])->name('shops.show');
    Route::get('boutiques/{shop}/edit', [ShopController::class, 'edit'])->name('shops.edit');
    Route::put('boutiques/{shop}', [ShopController::class, 'update'])->name('shops.update');
    Route::patch('boutiques/{shop}', [ShopController::class, 'update']);
    Route::delete('boutiques/{shop}', [ShopController::class, 'destroy'])->name('shops.destroy');

    // Routes pour les produits
    Route::resource('produits', ProductController::class)->names('products')->parameters(['produits' => 'product']);
    Route::get('produits-template', [ProductController::class, 'downloadTemplate'])->name('products.template');
    Route::get('produits-export', [ProductController::class, 'export'])->name('products.export');
    Route::post('produits-import', [ProductController::class, 'import'])->name('products.import');
    Route::patch('produits/{product}/retirer-boutique', [ProductController::class, 'removeFromShop'])->name('products.remove-from-shop');
    Route::patch('produits/{product}/remettre-boutique', [ProductController::class, 'restoreToShop'])->name('products.restore-to-shop');
    
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
    Route::post('ventes/{sale}/pay-credit', [SaleController::class, 'payCredit'])->name('sales.pay-credit');
    Route::patch('ventes/{sale}/reactiver', [SaleController::class, 'restore'])->name('sales.restore');

    // Routes pour les retours
    Route::post('ventes/{sale}/retours', [ReturnsController::class, 'store'])->name('returns.store');
    Route::delete('retours/{return}', [ReturnsController::class, 'destroy'])->name('returns.destroy');

    // Routes pour l'inventaire de retour
    Route::get('inventaire-retours', [ReturnedInventoryController::class, 'index'])->name('returned-inventory.index');
    Route::post('inventaire-retours/{item}/approve', [ReturnedInventoryController::class, 'approve'])->name('returned-inventory.approve');
    Route::post('inventaire-retours/{item}/reject', [ReturnedInventoryController::class, 'reject'])->name('returned-inventory.reject');

    // Routes pour les créances
    Route::get('creances', [CreditController::class, 'index'])->name('sales.credits');
    Route::get('creances/export', [CreditController::class, 'export'])->name('sales.credits.export');
    Route::post('creances/{sale}/payer', [CreditController::class, 'pay'])->name('sales.credits.pay');
    Route::patch('creances/{sale}/echeance', [CreditController::class, 'updateDueDate'])->name('sales.credits.update-due-date');

    // Stocks (mouvements de stock)
    Route::resource('stocks', StockMovementController::class)->except(['edit', 'update'])->parameters(['stocks' => 'stockMovement']);

    // Inventaires
    Route::resource('inventory', InventoryController::class);
    Route::post('inventory/{inventory}/complete', [InventoryController::class, 'complete'])->name('inventory.complete');

    // Utilisateurs (avec vérification des limites d'abonnement)
    Route::post('users', [UserController::class, 'store'])
        ->name('users.store')
        ->middleware('subscription.limits:user');
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('users/{user}', [UserController::class, 'update']);
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Fournisseurs
    Route::resource('suppliers', SupplierController::class)->parameters([
        'suppliers' => 'supplier'
    ]);

    // Module d'achats (Bons de commande fournisseurs)
    Route::resource('purchases', PurchaseController::class)->parameters([
        'purchases' => 'purchase'
    ]);
    Route::post('purchases/{purchase}/confirm', [PurchaseController::class, 'confirm'])->name('purchases.confirm');
    Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->name('purchases.receive');
    Route::post('purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->name('purchases.cancel');

    // Module Dépôts
    Route::resource('depots', DepotController::class)->parameters(['depots' => 'depot']);
    Route::post('depots/{depot}/stock/add', [DepotController::class, 'addStock'])->name('depots.stock.add');
    Route::post('depots/{depot}/stock/import', [DepotController::class, 'importStock'])->name('depots.stock.import');
    Route::get('depots/{depot}/stock/template', [DepotController::class, 'stockTemplate'])->name('depots.stock.template');
    Route::match(['POST', 'PATCH'], 'depots/{depot}/stock/{depotProduct}', [DepotController::class, 'updateStock'])->whereNumber('depotProduct')->name('depots.stock.update');
    Route::delete('depots/{depot}/stock/{depotProduct}', [DepotController::class, 'removeStock'])->whereNumber('depotProduct')->name('depots.stock.remove');
    Route::post('depots/{depot}/transfer', [DepotController::class, 'transferStock'])->name('depots.transfer');
    Route::post('depots/{depot}/transfer-depot', [DepotController::class, 'transferToDepot'])->name('depots.transfer-depot');
    Route::get('depots/{depot}/transfers', [DepotController::class, 'transfers'])->name('depots.transfers');

    Route::get('/abonnements', function () {
        return Inertia::render('Management/Placeholder', [
            'title' => 'Abonnements',
            'description' => 'Plans, limites de boutiques, facturation et upgrades.',
        ]);
    })->name('subscriptions.index');

    Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
    Route::get('/billing/invoices/{subscriptionInvoice}/download', [BillingController::class, 'downloadInvoice'])->name('billing.invoice.download');

    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Dépenses
    Route::get('depenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('depenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::match(['POST', 'PATCH'], 'depenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('depenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

    // Logs d'activité (super_admin uniquement)
    Route::get('/historique', [ActivityLogController::class, 'index'])->name('activity-logs.index');

    // Paramètres de la boutique
    Route::get('/parametres', [SettingsController::class, 'index'])->name('settings.index');
    Route::patch('/parametres', [SettingsController::class, 'update'])->name('settings.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
