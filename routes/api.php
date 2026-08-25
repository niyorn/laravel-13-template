<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthConfigController;
use App\Http\Controllers\Api\Settings\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/auth/config', [AuthConfigController::class, 'show'])->name('api.auth.config');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', fn (Request $request) => $request->user());

    Route::get('/settings/profile', [ProfileController::class, 'show'])->name('api.settings.profile');
});
