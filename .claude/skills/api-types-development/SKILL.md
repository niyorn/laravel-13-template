---
name: api-types-development
description: 'Use this skill whenever building or changing the JSON API (api.php) or wiring frontend code to it in this project. The API uses idiomatic Laravel API Resources; Scramble (dedoc/scramble) auto-generates an OpenAPI spec from the controllers/Resources/FormRequests, and openapi-typescript turns that spec into frontend TypeScript. Trigger when: creating or editing an api.php route or controller, writing a JsonResource / ResourceCollection, designing a JSON response shape, validating API input with a FormRequest, regenerating or consuming frontend API types, importing from @/types/api, running npm run generate:types, or fixing API type mismatches. Covers: make:resource, Scramble OpenAPI generation, the /docs/api + /docs/api.json routes, openapi-typescript, improving Scramble inference, and the APP_URL regeneration caveat. Do NOT use for Inertia web.php page props (those are plain arrays typed by Wayfinder) or Wayfinder route/form-request helpers.'
---

# API types — Resources → Scramble → openapi-typescript

This project's JSON API is typed end-to-end without hand-writing types or DTOs. The chain:

```
api.php controller + JsonResource  →  Scramble (OpenAPI spec)  →  openapi-typescript  →  resources/js/types/api/index.d.ts
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

This curls `/docs/api.json` and runs `openapi-typescript` → `resources/js/types/api/index.d.ts`, then
writes the flat aliases to `resources/js/types/api/schemas.ts`. (The Vite
build does NOT do this — run it manually after API changes, or wire it into your dev flow.)

`4. Consume the types on the frontend.` openapi-typescript emits a `paths` map and reusable
`components['schemas']`. On top of that, `generate:types` runs `scripts/generate-model-types.mjs` to
write `resources/js/types/api/schemas.ts` — a `flat alias` per schema (`export type Post = ...`). Prefer the
flat alias for a Resource shape; only index into `paths[...]` for an exact endpoint body:

```ts
import type { Post } from '@/types/api/schemas'; // flat alias — preferred

// response body of GET /api/posts (only when you need the exact endpoint body):
import type { paths } from '@/types/api';
type PostsResponse =
    paths['/api/posts']['get']['responses']['200']['content']['application/json'];
```

`The flat alias name = the schema name Scramble emits.` A Resource named `PostResource` defaults to
the key `PostResource` (→ `import type { PostResource }`). Use Scramble's `#[SchemaName('Post')]`
attribute on the Resource class to get a clean `Post` alias — that attribute is the single knob that
controls the generated frontend type name:

```php
use Dedoc\Scramble\Attributes\SchemaName;

#[SchemaName('Post')] // → export type Post = ... in schemas.ts
class PostResource extends JsonResource { /* ... */ }
```

`schemas.ts is generated and committed` alongside `api/index.d.ts` — don't hand-edit it.

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

`generate:types` hits a `running backend`. The script reads `APP_URL` straight from this
project's `.env`, so it follows the app's Herd URL automatically — no hardcoded host, and it
keeps working when the template is copied into a differently-named project.

To point at another environment, change `APP_URL` in `.env` before running the script (the
script reads `.env`, so an exported shell variable alone will not override it).

If `git status` shows an unexpectedly large diff in `resources/js/types/api/`, you probably
generated against the wrong backend — discard and re-run with the correct `APP_URL`.

## Gotchas

- `Only `api.php` routes are documented` (Scramble's default `api_path`). `web.php` Inertia routes are
  not part of the spec — they're Wayfinder's job. The spec is empty until `api.php` has routes
  (run `php artisan install:api` to create it; that also installs Sanctum).
- `Keep returning Resources from api.php` — not raw models or arrays. The Resource is the response
  contract Scramble reads and types.
- `Responses are unwrapped` — `JsonResource::withoutWrapping()` is set globally in `AppServiceProvider`,
  so Resources serialize without a top-level `data` key, and Scramble generates unwrapped types to match.
  Don't re-introduce a manual `data` wrapper. (Paginated collections still return `data` + `meta` + `links`;
  that's inherent to pagination and unaffected.)
- `Don't hand-edit `resources/js/types/api/```(`index.d.ts`or`schemas.ts`) — both are overwritten by`generate:types`.
- Re-run `generate:types` after any API change so the frontend types update and stale usages break.
- `laravel-data is intentionally NOT used here` — Resources + Scramble is the chosen path. (Scramble
  can document Data objects too, but we standardise on Resources.)
