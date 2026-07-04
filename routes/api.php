<?php

use App\Http\Controllers\Api\MobileController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\ProductController;
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
    });
    Route::middleware('abilities:sales:write')->group(function () {
        Route::post('/sales', [SaleController::class, 'store']);
    });

    Route::middleware('abilities:invoices:read')->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    });
    Route::middleware('abilities:stock-movements:read')->group(function () {
        Route::get('/stock-movements', [StockMovementController::class, 'index']);
    });
});
