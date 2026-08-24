<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileSettingsResource;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Get the profile settings screen's data for the signed-in user.
     */
    public function show(Request $request): ProfileSettingsResource
    {
        return new ProfileSettingsResource([
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
        ]);
    }
}
