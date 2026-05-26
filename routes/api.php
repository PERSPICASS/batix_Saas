<?php

use App\Http\Controllers\Api\MobileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    // Mobile sync endpoints
    Route::post('/sync/sales', [MobileController::class, 'syncSales']);
    Route::post('/sync/products', [MobileController::class, 'syncProducts']);
    Route::post('/sync/customers', [MobileController::class, 'syncCustomers']);

    // Mobile sales creation
    Route::post('/sales', [MobileController::class, 'createSale']);

    // Shop information
    Route::get('/shop', [MobileController::class, 'getShopInfo']);
});
