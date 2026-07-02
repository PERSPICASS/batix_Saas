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
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\LemonSqueezyController;
use App\Http\Controllers\PaddleController;
use App\Http\Controllers\FixedCostController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\RecurringInvoiceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\ProductArticleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

Route::get('/', [WelcomeController::class, 'index']);
Route::post('/contact', [ContactController::class, 'send'])->name('contact.send');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Routes des politiques (pages statiques)
Route::get('/policies/terms', fn() => Inertia::render('Policies/Show', ['policyType' => 'terms']))->name('policies.terms');
Route::get('/policies/privacy', fn() => Inertia::render('Policies/Show', ['policyType' => 'privacy']))->name('policies.privacy');
Route::get('/policies/refund', fn() => Inertia::render('Policies/Show', ['policyType' => 'refund']))->name('policies.refund');

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

// Routes LemonSqueezy (webhook public, checkout with auth)
Route::post('/lemonsqueezy/webhook', [LemonSqueezyController::class, 'webhook'])
    ->name('lemonsqueezy.webhook')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]); // public webhook

Route::middleware(['auth'])->group(function () {
    Route::post('/lemonsqueezy/checkout/{plan}', [LemonSqueezyController::class, 'checkout'])->name('lemonsqueezy.checkout');
});

// Route admin pour synchroniser les produits LemonSqueezy
Route::middleware(['auth'])->prefix('platform-admin')->group(function () {
    Route::post('/lemonsqueezy/sync-products', [LemonSqueezyController::class, 'syncProducts'])->name('platform.lemonsqueezy.sync');
});

// Routes Paddle (webhook public, checkout with auth)
Route::post('/paddle/webhook', [PaddleController::class, 'webhook'])
    ->name('paddle.webhook')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]); // public webhook

Route::middleware(['auth'])->group(function () {
    Route::post('/paddle/checkout/{plan:slug}', [PaddleController::class, 'checkout'])->name('paddle.checkout');
    Route::get('/paddle/checkout', fn() => Inertia::render('Payment/PaddlePay'))->name('paddle.pay');
});

// 2FA Routes (auth only, no 2FA check needed)
Route::middleware(['auth'])->group(function () {
    Route::get('/two-factor', [TwoFactorController::class, 'index'])->name('two-factor.index');
    Route::get('/two-factor/verify', [TwoFactorController::class, 'showVerification'])->name('two-factor.verify.get');
    Route::post('/two-factor/generate-secret', [TwoFactorController::class, 'generateSecret'])->name('two-factor.generate');
    Route::post('/two-factor/verify', [TwoFactorController::class, 'verify'])->name('two-factor.verify');
    Route::post('/two-factor/disable', [TwoFactorController::class, 'disable'])->name('two-factor.disable');
    Route::post('/two-factor/check-code', [TwoFactorController::class, 'checkCode'])->name('two-factor.check');

    // Debug only - remove in production
    Route::get('/two-factor/debug/secret', [TwoFactorController::class, 'debugSecret'])->name('two-factor.debug.secret');
});

Route::get('/paddle/success', [PaddleController::class, 'success'])->name('paddle.success');
Route::get('/paddle/cancel', [PaddleController::class, 'cancel'])->name('paddle.cancel');

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

    // Fixed Costs Management
    Route::get('/fixed-costs', [FixedCostController::class, 'index'])->name('platform.fixed-costs.index');
    Route::get('/fixed-costs/create', [FixedCostController::class, 'create'])->name('platform.fixed-costs.create');
    Route::post('/fixed-costs', [FixedCostController::class, 'store'])->name('platform.fixed-costs.store');
    Route::get('/fixed-costs/{cost}/edit', [FixedCostController::class, 'edit'])->name('platform.fixed-costs.edit');
    Route::put('/fixed-costs/{cost}', [FixedCostController::class, 'update'])->name('platform.fixed-costs.update');
    Route::delete('/fixed-costs/{cost}', [FixedCostController::class, 'destroy'])->name('platform.fixed-costs.destroy');
});

// Routes avec préfixe code_user (pour tout le compte)
Route::prefix('{code_user}')
    ->middleware(['auth', 'verified:verification.code.show', \App\Http\Middleware\ValidateAccountAccess::class, \App\Http\Middleware\CheckTwoFactorAuthentication::class])
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

    // Routes pour les articles/lots
    Route::get('produits/{productId}/articles', [ProductArticleController::class, 'listByProduct'])->name('articles.list');
    Route::get('produits/{productId}/articles-disponibles', [ProductArticleController::class, 'getAvailableByProduct'])->name('articles.available');
    Route::post('articles', [ProductArticleController::class, 'store'])->name('articles.store');
    Route::patch('articles/{productArticle}/status', [ProductArticleController::class, 'updateStatus'])->name('articles.update-status');
    Route::delete('articles/{productArticle}', [ProductArticleController::class, 'destroy'])->name('articles.destroy');
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

    // Routes pour les devis
    Route::resource('devis', QuoteController::class)->names('quotes')->parameters(['devis' => 'quote']);
    Route::post('devis/{quote}/envoyer', [QuoteController::class, 'send'])->name('quotes.send');
    Route::post('devis/{quote}/accepter', [QuoteController::class, 'accept'])->name('quotes.accept');
    Route::post('devis/{quote}/convertir-facture', [QuoteController::class, 'convertToInvoice'])->name('quotes.convert');

    // Routes pour les factures récurrentes
    Route::resource('factures-recurrentes', RecurringInvoiceController::class)->names('recurring-invoices')->parameters(['factures-recurrentes' => 'recurring_invoice']);
    Route::post('factures-recurrentes/{recurring_invoice}/generer', [RecurringInvoiceController::class, 'generateNow'])->name('recurring-invoices.generate');
    Route::post('factures-recurrentes/{recurring_invoice}/toggle', [RecurringInvoiceController::class, 'toggleActive'])->name('recurring-invoices.toggle');

    // Routes pour les factures
    Route::resource('factures', InvoiceController::class)->names('invoices')->parameters(['factures' => 'invoice']);
    Route::post('factures/{invoice}/creer-cycle-recurrent', [InvoiceController::class, 'createRecurring'])->name('invoices.create-recurring');
    Route::post('factures/{invoice}/envoyer', [InvoiceController::class, 'send'])->name('invoices.send');
    Route::get('factures/export/excel', [InvoiceController::class, 'export'])->name('invoices.export');

    // Routes pour les devis
    Route::post('devis/export/excel', [QuoteController::class, 'export'])->name('quotes.export');

    // Routes pour les rapports
    Route::get('rapports/analytique', [ReportController::class, 'analytics'])->name('reports.analytics');
    Route::post('rapports/analytique/export', [ReportController::class, 'exportAnalytics'])->name('reports.analytics.export');

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

    // AI Chat
    Route::post('ai-chat', [AiChatController::class, 'chat'])->name('ai.chat');

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
    Route::post('/locale', [ProfileController::class, 'updateLocale'])->name('locale.update');

});

require __DIR__.'/auth.php';
