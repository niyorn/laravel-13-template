---
name: api-types-development
description: 'Use this skill whenever building or changing the JSON API (api.php) or wiring frontend code to it in this project. The API uses idiomatic Laravel API Resources; Scramble (dedoc/scramble) auto-generates an OpenAPI spec from the controllers/Resources/FormRequests, and openapi-typescript turns that spec into frontend TypeScript. Trigger when: creating or editing an api.php route or controller, writing a JsonResource / ResourceCollection, designing a JSON response shape, validating API input with a FormRequest, regenerating or consuming frontend API types, importing from @/types/api, running npm run generate:types, or fixing API type mismatches. Covers: make:resource, Scramble OpenAPI generation, the /docs/api + /docs/api.json routes, openapi-typescript, improving Scramble inference, and the APP_URL regeneration caveat. Do NOT use for Inertia web.php page props (those are plain arrays typed by Wayfinder) or Wayfinder route/form-request helpers.'
---

# API types — Resources → Scramble → openapi-typescript

This project's JSON API is typed end-to-end without hand-writing types or DTOs. The chain:

```
api.php controller + JsonResource  →  Scramble (OpenAPI spec)  →  openapi-typescript  →  resources/js/types/api.d.ts
```

`Architecture split (don't mix the two):`

| Request                | Route file                      | Returns                | Typed by                      |
| ---------------------- | ------------------------------- | ---------------------- | ----------------------------- |
| Initial page load      | `web.php` → `Inertia::render()` | plain props array      | Wayfinder `Inertia.Pages.*`   |
| `The exposed JSON API` | `api.php` → JSON                | `Laravel API Resource` | Scramble → openapi-typescript |

## The way of working

`1. Write the endpoint with idiomatic Laravel — keep using Resources.`

```bash
php artisan make:resource PostResource
```

```php
// app/Http/Resources/PostResource.php
public function toArray(Request $request): array
{
    return [
        'id'          => $this->id,
        'title'       => $this->title,
        'body'        => $this->body,
        'isPublished' => $this->is_published,
        'createdAt'   => $this->created_at,
    ];
}

// api.php controller
public function index(): AnonymousResourceCollection
{
    return PostResource::collection(Post::all());
}

public function show(Post $post): PostResource
{
    return new PostResource($post);
}
```

`2. Scramble documents it automatically.` No annotations required — it reads routes, controllers,
return types, `FormRequest` rules, Resources, route-model bindings and enums by static analysis, and
serves the spec at:

- `/docs/api` — Swagger UI (human docs for API consumers)
- `/docs/api.json` — the raw OpenAPI 3.1 spec

`3. Generate the frontend types.`

```bash
npm run generate:types
```

This curls `/docs/api.json` and runs `openapi-typescript` → `resources/js/types/api.d.ts`. (The Vite
build does NOT do this — run it manually after API changes, or wire it into your dev flow.)

`4. Consume the types on the frontend.` openapi-typescript emits a `paths` map and reusable
`components['schemas']`. Alias what you need:

```ts
import type { components, paths } from '@/types/api';

type Post = components['schemas']['PostResource'];

// response body of GET /api/posts:
type PostsResponse =
    paths['/api/posts']['get']['responses']['200']['content']['application/json'];
```

## Getting accurate inference (the one discipline this requires)

Scramble infers shapes from your code, so accuracy depends on `clear types`:

- `Type-hint controller return types` (`: PostResource`, `: AnonymousResourceCollection`).
- Keep `toArray()` shapes explicit and literal; avoid returning untyped `$this->resource->toArray()`.
- Conditional fields (`$this->when(...)`, `whenLoaded(...)`) may render as optional/uncertain — add a
  PHPDoc hint or a Scramble attribute on the method when you need an exact shape.
- For request bodies, use `FormRequest` with explicit `rules()` — Scramble turns them into the request schema.

When inference isn't enough, reach for Scramble's annotations/attributes (only where needed), not a
blanket DTO rewrite. Publish config to customise (api path/domain, servers) if required:
`php artisan vendor:publish --tag=scramble-config`.

## Regeneration caveat (APP_URL)

`generate:types` hits a `running backend` — by default this project's Herd URL
(`http://laravel-template-13.test`). To point at another environment, export `APP_URL` first:

```bash
APP_URL=https://some-other.test npm run generate:types
```

If `git status` shows an unexpectedly large diff in `resources/js/types/api.d.ts`, you probably
generated against the wrong backend — discard and re-run with the correct `APP_URL`.

## Gotchas

- `Only `api.php` routes are documented` (Scramble's default `api_path`). `web.php` Inertia routes are
  not part of the spec — they're Wayfinder's job. The spec is empty until `api.php` has routes
  (run `php artisan install:api` to create it; that also installs Sanctum).
- `Keep returning Resources from api.php` — not raw models or arrays. The Resource is the response
  contract Scramble reads and types.
- `Don't hand-edit `resources/js/types/api.d.ts```— it's overwritten by`generate:types`.
- Re-run `generate:types` after any API change so the frontend types update and stale usages break.
- `laravel-data is intentionally NOT used here` — Resources + Scramble is the chosen path. (Scramble
  can document Data objects too, but we standardise on Resources.)
