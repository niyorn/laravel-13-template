<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuthConfigResource;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Features;

class AuthConfigController extends Controller
{
    /**
     * Get the auth settings the sign-in and sign-up screens render against.
     */
    public function show(): AuthConfigResource
    {
        return new AuthConfigResource([
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
        ]);
    }
}
