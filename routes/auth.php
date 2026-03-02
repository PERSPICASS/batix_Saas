<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationCodeController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\LockScreenController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    // Email Verification with OTP Code
    Route::get('verify-email-code', [EmailVerificationCodeController::class, 'show'])
        ->name('verification.code.show');
    
    Route::post('verify-email-code', [EmailVerificationCodeController::class, 'verify'])
        ->middleware('throttle:6,1')
        ->name('verification.code.verify');
    
    Route::post('verify-email-code/resend', [EmailVerificationCodeController::class, 'resend'])
        ->middleware('throttle:3,1')
        ->name('verification.code.resend');

    // Création de la première boutique (Étape 3 de l'inscription)
    Route::get('create-shop', [\App\Http\Controllers\ShopController::class, 'createInitial'])
        ->name('shop.create.initial');
    
    Route::post('create-shop', [\App\Http\Controllers\ShopController::class, 'storeInitial'])
        ->name('shop.store.initial');

    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    // Lock Screen routes
    Route::get('lock-screen', [LockScreenController::class, 'show'])
        ->name('lock-screen.show');
    
    Route::post('lock-screen', [LockScreenController::class, 'lock'])
        ->name('lock-screen.lock');
    
    Route::post('lock-screen/unlock', [LockScreenController::class, 'unlock'])
        ->name('lock-screen.unlock');
});
