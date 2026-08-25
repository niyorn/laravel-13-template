<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Settings;

use App\Http\Resources\ProfileSettingsResource;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;

final class ProfileController
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
