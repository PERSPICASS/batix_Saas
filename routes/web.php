<?php

use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ApiTokenController;
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
use App\Http\Controllers\SitePageController;
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
use App\Http\Controllers\PreorderController;
use App\Http\Controllers\RecurringInvoiceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\ProductArticleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Site public bilingue : FR par défaut (noms de route classiques),
// EN sous le préfixe /en (noms de route préfixés `en.`). Chaque groupe force
// la locale applicative via le middleware `setlocale` pour que Inertia
// partage la bonne langue (voir HandleInertiaRequests) indépendamment de
// tout état client. ──────────────────────────────────────────────────────
Route::middleware('setlocale:fr')->group(function () {
    Route::get('/', [WelcomeController::class, 'index'])->name('welcome');
    Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
    Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');
    Route::get('/fonctionnalites', [SitePageController::class, 'features'])->name('features.index');
    Route::get('/fonctionnalites/{slug}', [SitePageController::class, 'featureShow'])->name('features.show');
    Route::get('/tarifs', [SitePageController::class, 'pricing'])->name('pricing');
    Route::get('/clients', [SitePageController::class, 'customers'])->name('customers');
    Route::get('/ressources', [SitePageController::class, 'resources'])->name('resources');
    Route::get('/a-propos', [SitePageController::class, 'about'])->name('about');
    Route::get('/contact', [SitePageController::class, 'contactShow'])->name('contact.show');
});

Route::prefix('en')->name('en.')->middleware('setlocale:en')->group(function () {
    Route::get('/', [WelcomeController::class, 'index'])->name('welcome');
    Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
    Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');
    Route::get('/features', [SitePageController::class, 'features'])->name('features.index');
    Route::get('/features/{slug}', [SitePageController::class, 'featureShow'])->name('features.show');
    Route::get('/pricing', [SitePageController::class, 'pricing'])->name('pricing');
    Route::get('/customers', [SitePageController::class, 'customers'])->name('customers');
    Route::get('/resources', [SitePageController::class, 'resources'])->name('resources');
    Route::get('/about', [SitePageController::class, 'about'])->name('about');
    Route::get('/contact', [SitePageController::class, 'contactShow'])->name('contact.show');
});

Route::post('/contact', [ContactController::class, 'send'])->name('contact.send');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Routes des politiques (pages statiques)
Route::get('/policies/terms', fn() => Inertia::render('Policies/Show', ['policyType' => 'terms']))->name('policies.terms');
Route::get('/policies/privacy', fn() => Inertia::render('Policies/Show', ['policyType' => 'privacy']))->name('policies.privacy');
Route::get('/policies/refund', fn() => Inertia::render('Policies/Show', ['policyType' => 'refund']))->name('policies.refund');

// Route publique pour voir les plans
Route::get('/plans', [SubscriptionPlanController::class, 'publicIndex'])->name('plans.index');

// Routes paiement manuel (auth + 2FA requis si activé)
Route::middleware(['auth', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->group(function () {
    Route::get('/plans/{plan}/checkout', [PaymentController::class, 'checkout'])->name('payment.checkout');
    Route::post('/plans/{plan}/process', [PaymentController::class, 'process'])->name('payment.process');
    Route::get('/payment/confirmation/{planSlug}', [PaymentController::class, 'confirmation'])->name('payment.confirmation');
});

// Routes PawaPay (webhook public, autres avec auth)
Route::post('/pawapay/webhook', [PawaPayController::class, 'webhook'])
    ->name('pawapay.webhook')
    ->middleware('throttle:60,1')
    ->withoutMiddleware(['web']); // stateless webhook

Route::middleware(['auth', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->group(function () {
    Route::post('/pawapay/initiate/{plan}', [PawaPayController::class, 'initiate'])->name('pawapay.initiate');
    Route::get('/pawapay/status/{depositId}', [PawaPayController::class, 'pollStatus'])->name('pawapay.status');
    Route::post('/pawapay/simulate/{depositId}', [PawaPayController::class, 'simulate'])->name('pawapay.simulate');
});

// Routes Jèko (webhook public, success/error public redirects, initiate with auth)
Route::post('/jeko/webhook', [JekoController::class, 'webhook'])
    ->name('jeko.webhook')
    ->middleware('throttle:60,1')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]); // public webhook, no CSRF

Route::get('/jeko/success', [JekoController::class, 'success'])->name('jeko.success');
Route::get('/jeko/error', [JekoController::class, 'error'])->name('jeko.error');

Route::middleware(['auth', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->group(function () {
    Route::post('/jeko/initiate/{plan}', [JekoController::class, 'initiate'])->name('jeko.initiate');
});

// Routes LemonSqueezy (webhook public, checkout with auth)
Route::post('/lemonsqueezy/webhook', [LemonSqueezyController::class, 'webhook'])
    ->name('lemonsqueezy.webhook')
    ->middleware('throttle:60,1')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]); // public webhook

Route::middleware(['auth', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->group(function () {
    Route::post('/lemonsqueezy/checkout/{plan}', [LemonSqueezyController::class, 'checkout'])->name('lemonsqueezy.checkout');
});

// Route admin pour synchroniser les produits LemonSqueezy
Route::middleware(['auth', 'platform.admin', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->prefix('platform-admin')->group(function () {
    Route::post('/lemonsqueezy/sync-products', [LemonSqueezyController::class, 'syncProducts'])->name('platform.lemonsqueezy.sync');
});

// Routes Paddle (webhook public, checkout with auth)
Route::post('/paddle/webhook', [PaddleController::class, 'webhook'])
    ->name('paddle.webhook')
    ->middleware(['throttle:60,1', \Laravel\Paddle\Http\Middleware\VerifyWebhookSignature::class])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]); // public webhook

Route::middleware(['auth', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->group(function () {
    Route::post('/paddle/checkout/{plan:slug}', [PaddleController::class, 'checkout'])->name('paddle.checkout');
    Route::get('/paddle/checkout', fn() => Inertia::render('Payment/PaddlePay'))->name('paddle.pay');
});

// 2FA Routes (auth only, no 2FA check needed)
Route::middleware(['auth'])->group(function () {
    Route::get('/two-factor', [TwoFactorController::class, 'index'])->name('two-factor.index');
    Route::get('/two-factor/verify', [TwoFactorController::class, 'showVerification'])->name('two-factor.verify.get');
    Route::post('/two-factor/generate-secret', [TwoFactorController::class, 'generateSecret'])->name('two-factor.generate');
    Route::post('/two-factor/verify', [TwoFactorController::class, 'verify'])->middleware('throttle:6,1')->name('two-factor.verify');
    Route::post('/two-factor/disable', [TwoFactorController::class, 'disable'])->middleware('throttle:6,1')->name('two-factor.disable');
    Route::post('/two-factor/check-code', [TwoFactorController::class, 'checkCode'])->middleware('throttle:6,1')->name('two-factor.check');
});

Route::get('/paddle/success', [PaddleController::class, 'success'])->name('paddle.success');
Route::get('/paddle/cancel', [PaddleController::class, 'cancel'])->name('paddle.cancel');

// Routes publiques pour les invitations (avant auth)
Route::get('/invitation/{token}', [InvitationController::class, 'show'])->name('invitation.show');
Route::post('/invitation/{token}/accept', [InvitationController::class, 'accept'])->name('invitation.accept');

// Routes admin plateforme (accès réservé aux admin_platforme)
Route::middleware(['auth', 'platform.admin', \App\Http\Middleware\CheckTwoFactorAuthentication::class])->prefix('platform-admin')->group(function () {
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
        ->middleware(['subscription.limits:shop', 'permission:shops,create']);
    Route::get('boutiques', [ShopController::class, 'index'])->name('shops.index')->middleware('permission:shops,view');
    Route::get('boutiques/create', [ShopController::class, 'create'])->name('shops.create')->middleware('permission:shops,create');
    Route::get('boutiques/{shop}', [ShopController::class, 'show'])->name('shops.show')->middleware('permission:shops,view');
    Route::get('boutiques/{shop}/edit', [ShopController::class, 'edit'])->name('shops.edit')->middleware('permission:shops,edit');
    Route::put('boutiques/{shop}', [ShopController::class, 'update'])->name('shops.update')->middleware('permission:shops,edit');
    Route::patch('boutiques/{shop}', [ShopController::class, 'update'])->middleware('permission:shops,edit');
    Route::delete('boutiques/{shop}', [ShopController::class, 'destroy'])->name('shops.destroy')->middleware('permission:shops,delete');

    // Routes pour les produits
    Route::resource('produits', ProductController::class)->names('products')->parameters(['produits' => 'product'])
        ->middlewareFor(['index', 'show'], 'permission:products,view')
        ->middlewareFor(['create', 'store'], 'permission:products,create')
        ->middlewareFor(['edit', 'update'], 'permission:products,edit')
        ->middlewareFor('destroy', 'permission:products,delete');
    Route::get('produits-template', [ProductController::class, 'downloadTemplate'])->name('products.template')->middleware('permission:products,view');
    Route::get('produits-export', [ProductController::class, 'export'])->name('products.export')->middleware('permission:products,view');
    Route::post('produits-import', [ProductController::class, 'import'])->name('products.import')->middleware('permission:products,create');
    Route::patch('produits/{product}/retirer-boutique', [ProductController::class, 'removeFromShop'])->name('products.remove-from-shop')->middleware('permission:products,edit');
    Route::patch('produits/{product}/remettre-boutique', [ProductController::class, 'restoreToShop'])->name('products.restore-to-shop')->middleware('permission:products,edit');

    // Routes pour les variations de produits
    Route::get('produits/{product}/variations', [ProductVariationController::class, 'index'])->name('products.variations.index')->middleware('permission:products,view');

    // Routes pour les articles/lots
    Route::get('produits/{productId}/articles', [ProductArticleController::class, 'listByProduct'])->name('articles.list')->middleware('permission:products,view');
    Route::get('produits/{productId}/articles-disponibles', [ProductArticleController::class, 'getAvailableByProduct'])->name('articles.available')->middleware('permission:products,view');
    Route::post('articles', [ProductArticleController::class, 'store'])->name('articles.store')->middleware('permission:products,create');
    Route::patch('articles/{productArticle}/status', [ProductArticleController::class, 'updateStatus'])->name('articles.update-status')->middleware('permission:products,edit');
    Route::delete('articles/{productArticle}', [ProductArticleController::class, 'destroy'])->name('articles.destroy')->middleware('permission:products,delete');
    Route::post('produits/{product}/variations', [ProductVariationController::class, 'store'])->name('products.variations.store')->middleware('permission:products,create');
    Route::patch('produits/{product}/variations/{variation}', [ProductVariationController::class, 'update'])->name('products.variations.update')->middleware('permission:products,edit');
    Route::delete('produits/{product}/variations/{variation}', [ProductVariationController::class, 'destroy'])->name('products.variations.destroy')->middleware('permission:products,delete');

    // Routes pour les attributs de produits (variations)
    Route::get('attributs-produits', [ProductAttributeController::class, 'index'])->name('product-attributes.index')->middleware('permission:products,view');
    Route::post('attributs-produits', [ProductAttributeController::class, 'store'])->name('product-attributes.store')->middleware('permission:products,create');
    Route::patch('attributs-produits/{attribute}', [ProductAttributeController::class, 'update'])->name('product-attributes.update')->middleware('permission:products,edit');
    Route::delete('attributs-produits/{attribute}', [ProductAttributeController::class, 'destroy'])->name('product-attributes.destroy')->middleware('permission:products,delete');
    Route::post('attributs-produits/{attribute}/valeurs', [ProductAttributeController::class, 'addValue'])->name('product-attributes.add-value')->middleware('permission:products,create');
    Route::patch('attributs-produits-valeurs/{value}', [ProductAttributeController::class, 'updateValue'])->name('product-attributes.update-value')->middleware('permission:products,edit');
    Route::delete('attributs-produits-valeurs/{value}', [ProductAttributeController::class, 'destroyValue'])->name('product-attributes.destroy-value')->middleware('permission:products,delete');

    // Routes pour les catégories
    Route::resource('categories', CategoryController::class)->names('categories')->parameters(['categories' => 'category'])
        ->middlewareFor(['index', 'show'], 'permission:categories,view')
        ->middlewareFor(['create', 'store'], 'permission:categories,create')
        ->middlewareFor(['edit', 'update'], 'permission:categories,edit')
        ->middlewareFor('destroy', 'permission:categories,delete');

    // Routes pour les sous-catégories (rattachées au module "categories" — pas de découpage plus fin)
    Route::resource('sous-categories', SubcategoryController::class)->names('subcategories')->parameters(['sous-categories' => 'subcategory'])
        ->middlewareFor(['index', 'show'], 'permission:categories,view')
        ->middlewareFor(['create', 'store'], 'permission:categories,create')
        ->middlewareFor(['edit', 'update'], 'permission:categories,edit')
        ->middlewareFor('destroy', 'permission:categories,delete');

    // Routes pour les clients
    Route::resource('clients', CustomerController::class)->names('customers')->parameters(['clients' => 'customer'])
        ->middlewareFor(['index', 'show'], 'permission:customers,view')
        ->middlewareFor(['create', 'store'], 'permission:customers,create')
        ->middlewareFor(['edit', 'update'], 'permission:customers,edit')
        ->middlewareFor('destroy', 'permission:customers,delete');

    // Routes pour les devis
    Route::resource('devis', QuoteController::class)->names('quotes')->parameters(['devis' => 'quote'])
        ->middlewareFor(['index', 'show'], 'permission:quotes,view')
        ->middlewareFor(['create', 'store'], 'permission:quotes,create')
        ->middlewareFor(['edit', 'update'], 'permission:quotes,edit')
        ->middlewareFor('destroy', 'permission:quotes,delete');
    Route::post('devis/{quote}/envoyer', [QuoteController::class, 'send'])->name('quotes.send')->middleware('permission:quotes,edit');
    Route::post('devis/{quote}/accepter', [QuoteController::class, 'accept'])->name('quotes.accept')->middleware('permission:quotes,edit');
    Route::post('devis/{quote}/convertir-facture', [QuoteController::class, 'convertToInvoice'])->name('quotes.convert')->middleware('permission:quotes,edit');

    // Routes pour les précommandes
    Route::resource('precommandes', PreorderController::class)
        ->names('preorders')
        ->parameters(['precommandes' => 'preorder'])
        ->only(['index', 'create', 'store', 'show'])
        ->middlewareFor(['index', 'show'], 'permission:preorders,view')
        ->middlewareFor(['create', 'store'], 'permission:preorders,create');
    Route::patch('precommandes/{preorder}/statut', [PreorderController::class, 'updateStatus'])->name('preorders.update-status')->middleware('permission:preorders,edit');
    Route::post('precommandes/{preorder}/convertir-vente', [PreorderController::class, 'convertToSale'])->name('preorders.convert')->middleware('permission:preorders,edit');

    // Routes pour les factures récurrentes
    Route::resource('factures-recurrentes', RecurringInvoiceController::class)->names('recurring-invoices')->parameters(['factures-recurrentes' => 'recurring_invoice'])
        ->middlewareFor(['index', 'show'], 'permission:recurring_invoices,view')
        ->middlewareFor(['create', 'store'], 'permission:recurring_invoices,create')
        ->middlewareFor(['edit', 'update'], 'permission:recurring_invoices,edit')
        ->middlewareFor('destroy', 'permission:recurring_invoices,delete');
    Route::post('factures-recurrentes/{recurring_invoice}/generer', [RecurringInvoiceController::class, 'generateNow'])->name('recurring-invoices.generate')->middleware('permission:recurring_invoices,create');
    Route::post('factures-recurrentes/{recurring_invoice}/toggle', [RecurringInvoiceController::class, 'toggleActive'])->name('recurring-invoices.toggle')->middleware('permission:recurring_invoices,edit');

    // Routes pour les factures
    Route::resource('factures', InvoiceController::class)->names('invoices')->parameters(['factures' => 'invoice'])
        ->middlewareFor(['index', 'show'], 'permission:invoices,view')
        ->middlewareFor(['create', 'store'], 'permission:invoices,create')
        ->middlewareFor(['edit', 'update'], 'permission:invoices,edit')
        ->middlewareFor('destroy', 'permission:invoices,delete');
    Route::post('factures/{invoice}/creer-cycle-recurrent', [InvoiceController::class, 'createRecurring'])->name('invoices.create-recurring')->middleware('permission:invoices,create');
    Route::post('factures/{invoice}/envoyer', [InvoiceController::class, 'send'])->name('invoices.send')->middleware('permission:invoices,edit');
    Route::get('factures/export/excel', [InvoiceController::class, 'export'])->name('invoices.export')->middleware('permission:invoices,view');

    // Routes pour les devis
    Route::post('devis/export/excel', [QuoteController::class, 'export'])->name('quotes.export')->middleware('permission:quotes,view');

    // Routes pour les rapports
    Route::get('rapports/analytique', [ReportController::class, 'analytics'])->name('reports.analytics')->middleware('permission:analytics,view');
    Route::post('rapports/analytique/export', [ReportController::class, 'exportAnalytics'])->name('reports.analytics.export')->middleware('permission:analytics,view');

    // Routes pour les ventes
    Route::resource('ventes', SaleController::class)->names('sales')->parameters(['ventes' => 'sale'])
        ->middlewareFor(['index', 'show'], 'permission:sales,view')
        ->middlewareFor(['create', 'store'], 'permission:sales,create')
        ->middlewareFor(['edit', 'update'], 'permission:sales,edit')
        ->middlewareFor('destroy', 'permission:sales_delete,delete');
    Route::post('ventes/{sale}/pay-credit', [SaleController::class, 'payCredit'])->name('sales.pay-credit')->middleware('permission:credits,edit');
    Route::patch('ventes/{sale}/reactiver', [SaleController::class, 'restore'])->name('sales.restore')->middleware('permission:sales_restore,view');

    // Routes pour les retours
    Route::post('ventes/{sale}/retours', [ReturnsController::class, 'store'])->name('returns.store')->middleware('permission:returns,create');
    Route::delete('retours/{return}', [ReturnsController::class, 'destroy'])->name('returns.destroy')->middleware('permission:returns,delete');

    // Routes pour l'inventaire de retour
    Route::get('inventaire-retours', [ReturnedInventoryController::class, 'index'])->name('returned-inventory.index')->middleware('permission:returned_inventory,view');
    Route::post('inventaire-retours/{item}/approve', [ReturnedInventoryController::class, 'approve'])->name('returned-inventory.approve')->middleware('permission:returned_inventory,edit');
    Route::post('inventaire-retours/{item}/reject', [ReturnedInventoryController::class, 'reject'])->name('returned-inventory.reject')->middleware('permission:returned_inventory,edit');

    // Routes pour les créances
    Route::get('creances', [CreditController::class, 'index'])->name('sales.credits')->middleware('permission:credits,view');
    Route::get('creances/export', [CreditController::class, 'export'])->name('sales.credits.export')->middleware('permission:credits,view');
    Route::post('creances/{sale}/payer', [CreditController::class, 'pay'])->name('sales.credits.pay')->middleware('permission:credits,edit');
    Route::patch('creances/{sale}/echeance', [CreditController::class, 'updateDueDate'])->name('sales.credits.update-due-date')->middleware('permission:credits,edit');

    // Stocks (mouvements de stock)
    Route::resource('stocks', StockMovementController::class)->except(['edit', 'update'])->parameters(['stocks' => 'stockMovement'])
        ->middlewareFor(['index', 'show'], 'permission:stocks,view')
        ->middlewareFor(['create', 'store'], 'permission:stocks,create')
        ->middlewareFor('destroy', 'permission:stocks,delete');

    // Inventaires
    Route::resource('inventory', InventoryController::class)
        ->middlewareFor(['index', 'show'], 'permission:inventory,view')
        ->middlewareFor(['create', 'store'], 'permission:inventory,create')
        ->middlewareFor(['edit', 'update'], 'permission:inventory,edit')
        ->middlewareFor('destroy', 'permission:inventory,delete');
    Route::post('inventory/{inventory}/complete', [InventoryController::class, 'complete'])->name('inventory.complete')->middleware('permission:inventory,edit');
    Route::get('inventory/{inventory}/completion-preview', [InventoryController::class, 'completionPreview'])->name('inventory.completion-preview')->middleware('permission:inventory,view');

    // Utilisateurs (avec vérification des limites d'abonnement)
    Route::post('users', [UserController::class, 'store'])
        ->name('users.store')
        ->middleware(['subscription.limits:user', 'permission:users,create']);
    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:users,view');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:users,create');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show')->middleware('permission:users,view');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('permission:users,edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:users,edit');
    Route::patch('users/{user}', [UserController::class, 'update'])->middleware('permission:users,edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:users,delete');

    // Fournisseurs
    Route::resource('suppliers', SupplierController::class)->parameters([
        'suppliers' => 'supplier'
    ])
        ->middlewareFor(['index', 'show'], 'permission:suppliers,view')
        ->middlewareFor(['create', 'store'], 'permission:suppliers,create')
        ->middlewareFor(['edit', 'update'], 'permission:suppliers,edit')
        ->middlewareFor('destroy', 'permission:suppliers,delete');

    // Module d'achats (Bons de commande fournisseurs)
    Route::resource('purchases', PurchaseController::class)->parameters([
        'purchases' => 'purchase'
    ])
        ->middlewareFor(['index', 'show'], 'permission:purchases,view')
        ->middlewareFor(['create', 'store'], 'permission:purchases,create')
        ->middlewareFor(['edit', 'update'], 'permission:purchases,edit')
        ->middlewareFor('destroy', 'permission:purchases,delete');
    Route::post('purchases/{purchase}/confirm', [PurchaseController::class, 'confirm'])->name('purchases.confirm')->middleware('permission:purchases,edit');
    Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->name('purchases.receive')->middleware('permission:purchases,edit');
    Route::post('purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->name('purchases.cancel')->middleware('permission:purchases,edit');

    // Module Dépôts
    Route::resource('depots', DepotController::class)->parameters(['depots' => 'depot'])
        ->middlewareFor(['index', 'show'], 'permission:depots,view')
        ->middlewareFor(['create', 'store'], 'permission:depots,create')
        ->middlewareFor(['edit', 'update'], 'permission:depots,edit')
        ->middlewareFor('destroy', 'permission:depots,delete');
    Route::post('depots/{depot}/stock/add', [DepotController::class, 'addStock'])->name('depots.stock.add')->middleware('permission:depots,create');
    Route::post('depots/{depot}/stock/import', [DepotController::class, 'importStock'])->name('depots.stock.import')->middleware('permission:depots,create');
    Route::get('depots/{depot}/stock/template', [DepotController::class, 'stockTemplate'])->name('depots.stock.template')->middleware('permission:depots,view');
    Route::match(['POST', 'PATCH'], 'depots/{depot}/stock/{depotProduct}', [DepotController::class, 'updateStock'])->whereNumber('depotProduct')->name('depots.stock.update')->middleware('permission:depots,edit');
    Route::delete('depots/{depot}/stock/{depotProduct}', [DepotController::class, 'removeStock'])->whereNumber('depotProduct')->name('depots.stock.remove')->middleware('permission:depots,delete');
    Route::post('depots/{depot}/transfer', [DepotController::class, 'transferStock'])->name('depots.transfer')->middleware('permission:depots,edit');
    Route::post('depots/{depot}/transfer-depot', [DepotController::class, 'transferToDepot'])->name('depots.transfer-depot')->middleware('permission:depots,edit');
    Route::get('depots/{depot}/transfers', [DepotController::class, 'transfers'])->name('depots.transfers')->middleware('permission:depots,view');

    Route::get('/abonnements', function () {
        return Inertia::render('Management/Placeholder', [
            'title' => 'Abonnements',
            'description' => 'Plans, limites de boutiques, facturation et upgrades.',
        ]);
    })->name('subscriptions.index');

    Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
    Route::get('/billing/invoices/{subscriptionInvoice}/download', [BillingController::class, 'downloadInvoice'])->name('billing.invoice.download');

    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index')->middleware('permission:analytics,view');

    // AI Chat — throttle pour limiter le coût d'appels API en rafale (usage normal : quelques
    // messages par minute dans une conversation).
    Route::post('ai-chat', [AiChatController::class, 'chat'])->middleware('throttle:20,1')->name('ai.chat');

    // Dépenses
    Route::get('depenses', [ExpenseController::class, 'index'])->name('expenses.index')->middleware('permission:expenses,view');
    Route::post('depenses', [ExpenseController::class, 'store'])->name('expenses.store')->middleware('permission:expenses,create');
    Route::match(['POST', 'PATCH'], 'depenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update')->middleware('permission:expenses,edit');
    Route::delete('depenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy')->middleware('permission:expenses,delete');

    // Logs d'activité
    Route::get('/historique', [ActivityLogController::class, 'index'])->name('activity-logs.index')->middleware('permission:activity_logs,view');

    // Paramètres de la boutique
    Route::get('/parametres', [SettingsController::class, 'index'])->name('settings.index')->middleware('permission:settings,view');
    Route::patch('/parametres', [SettingsController::class, 'update'])->name('settings.update')->middleware('permission:settings,edit');

    // Tokens API pour intégrations (super_admin uniquement)
    Route::get('/integrations', [ApiTokenController::class, 'index'])->name('api-tokens.index');
    Route::post('/integrations', [ApiTokenController::class, 'store'])->name('api-tokens.store');
    Route::delete('/integrations/{tokenId}', [ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/locale', [ProfileController::class, 'updateLocale'])->name('locale.update');

});

require __DIR__.'/auth.php';
