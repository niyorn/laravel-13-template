<?php

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Route;

test('API resources are returned without a data wrapper', function () {
    Route::get('/_test/resource', fn () => new class(['id' => 1, 'name' => 'Ada']) extends JsonResource
    {
        /** @return array<string, mixed> */
        public function toArray($request): array
        {
            return [
                'id' => $this->resource['id'],
                'name' => $this->resource['name'],
            ];
        }
    });

    $this->getJson('/_test/resource')
        ->assertOk()
        ->assertExactJson(['id' => 1, 'name' => 'Ada']);
});
