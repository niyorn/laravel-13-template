<?php

namespace App\Http\Resources;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The profile settings screen's own data, separate from the signed-in user itself.
 */
#[SchemaName('ProfileSettings')]
class ProfileSettingsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{mustVerifyEmail: bool}
     */
    public function toArray(Request $request): array
    {
        return [
            'mustVerifyEmail' => (bool) $this->resource['mustVerifyEmail'],
        ];
    }
}
