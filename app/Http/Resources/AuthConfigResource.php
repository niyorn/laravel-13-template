<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The auth settings the login and registration screens need before anyone signs in.
 */
#[SchemaName('AuthConfig')]
final class AuthConfigResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{passwordRules: string, canResetPassword: bool}
     */
    public function toArray(Request $request): array
    {
        return [
            'passwordRules' => (string) $this->resource['passwordRules'],
            'canResetPassword' => (bool) $this->resource['canResetPassword'],
        ];
    }
}
