<?php

use App\Models\User;

test('the auth config endpoint is reachable without signing in', function (): void {
    $this->getJson('/api/auth/config')
        ->assertOk()
        ->assertJsonStructure(['passwordRules', 'canResetPassword']);
});

test('a signed-in session can read the profile settings endpoint', function (): void {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/settings/profile')
        ->assertOk()
        ->assertJsonStructure(['mustVerifyEmail']);
});

test('the profile settings endpoint is closed to guests', function (): void {
    $this->getJson('/api/settings/profile')->assertUnauthorized();
});
