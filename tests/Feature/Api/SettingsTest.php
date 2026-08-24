<?php

use App\Models\User;

test('the auth config endpoint is reachable without signing in', function () {
    $this->getJson('/api/auth/config')
        ->assertOk()
        ->assertJsonStructure(['passwordRules', 'canResetPassword']);
});

test('a signed-in session can read the profile settings endpoint', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/settings/profile')
        ->assertOk()
        ->assertJsonStructure(['mustVerifyEmail']);
});

test('the profile settings endpoint is closed to guests', function () {
    $this->getJson('/api/settings/profile')->assertUnauthorized();
});
