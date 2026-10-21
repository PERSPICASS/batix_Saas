<?php

use App\Http\Controllers\Api\MobileController;
use App\Http\Controllers\Api\V1\AlertController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\LowStockProductController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\StockMovementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    // Mobile sync endpoints — mêmes abilities que l'API v1 pour respecter le scope
    // du token (un token products:read seul ne doit pas pouvoir créer des ventes).
    Route::middleware('abilities:sales:read')->post('/sync/sales', [MobileController::class, 'syncSales']);
    Route::middleware('abilities:products:read')->post('/sync/products', [MobileController::class, 'syncProducts']);
    Route::middleware('abilities:customers:read')->post('/sync/customers', [MobileController::class, 'syncCustomers']);

    // Mobile sales creation
    Route::middleware('abilities:sales:write')->post('/sales', [MobileController::class, 'createSale']);

    // Shop information
    Route::get('/shop', [MobileController::class, 'getShopInfo']);
});

// API publique v1 — pour intégrations tierces via token (voir Settings/ApiTokens).
// Chaque route exige l'ability Sanctum correspondante ; les tokens créés avant le
// retrait du défaut ['*'] (accès complet) passent toujours ces contrôles.
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::middleware('abilities:products:read')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
    });
    Route::middleware('abilities:products:write')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::match(['put', 'patch'], '/products/{product}', [ProductController::class, 'update']);
    });

    Route::middleware('abilities:customers:read')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    });
    Route::middleware('abilities:customers:write')->group(function () {
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::match(['put', 'patch'], '/customers/{customer}', [CustomerController::class, 'update']);
    });

    Route::middleware('abilities:sales:read')->group(function () {
        Route::get('/sales', [SaleController::class, 'index']);
        Route::get('/sales/{sale}', [SaleController::class, 'show']);
        // Analyses de ventes (consommées par l'assistant IA via le MCP).
        Route::get('/analytics/sales-summary', [AnalyticsController::class, 'salesSummary']);
        Route::get('/analytics/top-products', [AnalyticsController::class, 'topProducts']);
    });
    Route::middleware('abilities:sales:write')->group(function () {
        Route::post('/sales', [SaleController::class, 'store']);
    });

    Route::middleware('abilities:invoices:read')->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{invoice}/download-link', [InvoiceController::class, 'downloadLink']);
    });
    // Création en brouillon uniquement — le contrôleur force le statut, l'émission
    // (qui déstocke et fige la pièce comptable) reste dans l'application.
    Route::middleware('abilities:invoices:write')->group(function () {
        Route::post('/invoices', [InvoiceController::class, 'store']);
        // Modification limitée aux brouillons par le contrôleur : une facture émise
        // se corrige par annulation ou avoir, jamais par réécriture.
        Route::match(['put', 'patch'], '/invoices/{invoice}', [InvoiceController::class, 'update']);
    });

    Route::middleware('abilities:quotes:read')->group(function () {
        Route::get('/quotes', [QuoteController::class, 'index']);
        Route::get('/quotes/{quote}', [QuoteController::class, 'show']);
        Route::get('/quotes/{quote}/download-link', [QuoteController::class, 'downloadLink']);
    });
    Route::middleware('abilities:quotes:write')->group(function () {
        Route::post('/quotes', [QuoteController::class, 'store']);
        Route::match(['put', 'patch'], '/quotes/{quote}', [QuoteController::class, 'update']);
    });
    Route::middleware('abilities:stock-movements:read')->group(function () {
        Route::get('/stock-movements', [StockMovementController::class, 'index']);
        Route::get('/stock/low-products', LowStockProductController::class);
        Route::get('/alerts', [AlertController::class, 'index']);
    });
});
