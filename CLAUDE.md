<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.5
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/pint (PINT) - v1
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/wayfinder (WAYFINDER) - v
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/vue3 (INERTIA_VUE) - v3
- tailwindcss (TAILWINDCSS) - v4
- vue (VUE) - v3
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
    - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== herd rules ===

# Laravel Herd

- The application is served by Laravel Herd at `https?://[kebab-case-project-dir].test`. Use the `get-absolute-url` tool to generate valid URLs. Never run commands to serve the site. It is always available.
- Use the `herd` CLI to manage services, PHP versions, and sites (e.g. `herd sites`, `herd services:start <service>`, `herd php:list`). Run `herd list` to discover all available commands.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-vue-development` when working with Inertia Vue client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== wayfinder/v rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- The `{name}` argument should not include the test suite directory. Use `php artisan make:test --pest SomeFeatureTest` instead of `php artisan make:test --pest Feature/SomeFeatureTest`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-vue/core rules ===

# Inertia + Vue

Vue components must have a single root element.

- IMPORTANT: Activate `inertia-vue-development` when working with Inertia Vue client-side patterns.

</laravel-boost-guidelines>

<!--
  The block above is auto-generated by `php artisan boost:update`. Do NOT hand-edit it.
  Keep project-specific notes below this line so they survive a boost regeneration.
-->

# Routing architecture — where routes live

`Page views go in `web.php`; everything else goes in `api.php`.` This split is deliberate: the JSON API
is meant to be exposed/consumed independently of the web UI.

- `web.php` → Inertia page renders only (`Inertia::render(...)` returning a Vue page). Session + cookie
  auth, CSRF. Typed on the frontend by Wayfinder (`@/wayfinder/...`).
- `api.php` → everything else: data fetches and mutations (create/update/delete), and anything a page
  does after its initial load. Stateless JSON, token auth (Sanctum), returns API Resources. Typed on the
  frontend by `@/types/api` (Scramble → openapi-typescript).

Rule of thumb: returns a rendered page → `web.php`; returns or accepts JSON → `api.php`.

`Exception:` Fortify's session-auth routes (login, register, password, email verification, profile)
are inherently web/session and stay on the web side. The "everything in `api.php`" rule is about your
own domain endpoints, not the session-auth plumbing.

# Wayfinder — running the `next`/beta branch

This project intentionally tracks the Wayfinder beta (`laravel/wayfinder: dev-next` in `composer.json`),
which generates TypeScript for far more than routes: controller actions, named routes, Form Request
types, Eloquent model interfaces, PHP enums, Inertia page props, broadcast channels/events, and env vars.

## Key differences from stable (v0.1.x)

- All output now lives under `resources/js/wayfinder/` (was `resources/js/actions` + `resources/js/routes`).
  Imports use `@/wayfinder/...`:
    - Named routes: `import { dashboard } from '@/wayfinder/routes'`
    - Controller actions: `import ProfileController from '@/wayfinder/App/Http/Controllers/...'`
- Generators are configured in `config/wayfinder.php`, NOT via CLI flags or Vite-plugin args.
  The old `--with-form` / `--skip-actions` / `--skip-routes` flags were removed.
- `types.ts` was renamed to `types.d.ts`.
- Generate manually with `php artisan wayfinder:generate` (add `--fresh` to clear the cache first).

## Project-specific decisions

- `Vite plugin must be bare `wayfinder()```in`vite.config.ts`. Passing `formVariants: true`makes the`@laravel/vite-plugin-wayfinder`(still on the stable 0.1.x line) push the removed`--with-form`flag,
which breaks`npm run dev`/`npm run build`. Form variants are on by default via `form_variant` in config.
- `Inertia `shared_data` generation is DISABLED` (`config/wayfinder.php`). The generated `auth.user` is typed
  from raw DB columns — it leaks `$hidden` fields (`password`, `two_factor_secret`), is nullable, and lacks
  the `avatar` accessor the UI uses. The hand-curated `sharedPageProps` in `resources/js/types/global.d.ts`
  is more accurate, so it stays the source of truth for shared page props. Per-page prop types
  (`Inertia.Pages.*`), models, enums, and form requests are still generated.

## How we use it (conventions)

`Golden rule: never hardcode a URL or path in frontend code.` Always import a generated
function from `@/wayfinder/...`. If you're typing a string that starts with `/`, you're doing it wrong.

`1. Links / navigation` — import the named route and call it inside `:href`:

```vue
<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { dashboard } from '@/wayfinder/routes';
import { edit } from '@/wayfinder/routes/profile';
</script>

<template>
    <Link :href="dashboard()">Dashboard</Link>
    <Link :href="edit()">Edit profile</Link>
</template>
```

`2. Forms` — this project submits forms with Inertia's `<Form>` bound to a controller action's
`.form()`. Do NOT reach for `useForm` or `router.post` for normal forms; follow the existing pattern:

```vue
<script setup lang="ts">
import { Form } from '@inertiajs/vue3';
import ProfileController from '@/wayfinder/App/Http/Controllers/Settings/ProfileController';
</script>

<template>
    <Form
        v-bind="ProfileController.update.form()"
        v-slot="{ errors, processing }"
    >
        <input name="name" />
        <button type="submit" :disabled="processing">Save</button>
    </Form>
</template>
```

`3. Method variants` on any generated route/action function:

```ts
edit()              // { url: "/settings/profile", method: "get" }
edit.url()          // "/settings/profile"  (string only)
edit.get() / .post() / .patch() / .delete()
update.form()       // { action, method } — bind to <Form v-bind="...">
edit({ query: { tab: 'security' } })   // append query params
```

`4. Typing page props` — use the generated page type, don't hand-write the interface:

```vue
<script setup lang="ts">
import type { Inertia } from '@/wayfinder/types';
defineProps<Inertia.Pages.Settings.Security>(); // { passwordRules: ... } typed for you
</script>
```

`Read shared props (auth, name, sidebarOpen) via `usePage()``, which is typed by
`resources/js/types/global.d.ts`— NOT from the page-prop type. The shared-data half of the
generated`Inertia.Pages.\*` types is currently untyped (`any`) because `inertia.shared_data`
generation is disabled (see above), so the page type is only reliable for page-specific fields.

`5. Form Request input types` (when you do need `useForm`): import the generated request type:

```ts
import type { App } from '@/wayfinder/types';
const form =
    useForm<App.Http.Controllers.Settings.ProfileController.Update.Request>({
        /* ... */
    });
```

`6. Regenerating` — the Vite plugin regenerates on `npm run dev` / `npm run build`. After backend
route/controller/model changes outside a running dev server, run `php artisan wayfinder:generate --fresh`.
`Never edit files under `resources/js/wayfinder/```— they're overwritten. Always use`named imports`(e.g.`import { dashboard }`) so unused routes tree-shake out of the bundle.

## Caveats

- Beta: the API may change before v1.0.0. Pin/upgrade deliberately.
- `skipLibCheck` (on by default via Vue's tsconfig) hides the dangling `Inertia.SharedData` reference
  inside generated page-prop types. If you disable `skipLibCheck`, regenerate with `shared_data` enabled
  or those types will fail to compile.
- `resources/js/wayfinder/` is git-ignored (generated). Regenerate after route/controller/model changes;
  the Vite plugin also regenerates on dev/build.
- Model types reflect DB columns only — they do NOT honor `$hidden`/`$visible`/`$appends` or accessors.
  Don't trust generated model types as the serialized API shape.

# JSON API types — always use the generated types

The JSON API (`api.php`) is typed end-to-end: `api.php` controllers return Laravel API Resources →
Scramble generates an OpenAPI spec at `/docs/api.json` → `openapi-typescript` writes it to
`resources/js/types/api/index.d.ts`. See the `api-types-development` skill for the full workflow.

`GOLDEN RULE: every frontend call to the JSON API MUST be typed with the generated types in
`resources/js/types/api/`(import via`@/types/api`).` Never type an API request or response with
`any`, and never hand-write an interface to describe an API payload — derive it from `@/types/api` so a
backend change surfaces as a TypeScript error instead of a runtime surprise.

`Prefer the flat schema aliases.` Every API Resource schema is re-exported as a bare type name from
`@/types/api/schemas` (generated, see below) — use that instead of the verbose `components['schemas'][...]`
index. Only drop down to `paths[...]` for an exact endpoint response/request body.

```ts
import type { User } from '@/types/api/schemas'; // flat alias — preferred for a Resource shape

const { data } = await useHttp().get<User>('/api/user');
```

```ts
// Only when you need the exact response body of a specific endpoint (not just the Resource):
import type { paths } from '@/types/api';
type UserResponse =
    paths['/user']['get']['responses']['200']['content']['application/json'];
```

`Flat aliases come from Scramble's schema names.` `schemas.ts` blindly turns each OpenAPI schema key
into a bare type, so the alias name = the schema name Scramble emits. A Resource named `PostResource`
defaults to the key `PostResource` (→ `import type { PostResource }`). To get a clean `Post` alias,
name the schema on the Resource class with Scramble's attribute — this is the one knob that controls
the generated frontend type name:

```php
use Dedoc\Scramble\Attributes\SchemaName;

#[SchemaName('Post')] // → export type Post = ... in schemas.ts
class PostResource extends JsonResource { /* ... */ }
```

`How the types stay current:`

- Regenerate manually with `npm run generate:types` (needs the app served by Herd — it curls the live spec).
- The `generate-api-types` pre-commit hook auto-regenerates and stages both files whenever a commit
  touches `app/Http/Resources`, `app/Http/Controllers`, `app/Http/Requests`, `app/Enums`, or `routes/api.php`.
- `Unlike `resources/js/wayfinder/`, `resources/js/types/api/` IS committed` — the Vite build can't rebuild
  it (it needs a running server), so the committed copy is the source of truth. Don't hand-edit it.
- `generate:types` writes two files: `api/index.d.ts` (openapi-typescript output) and `api/schemas.ts`
  (flat aliases, via `scripts/generate-model-types.mjs`). Both are generated and committed — don't hand-edit them.

`Don't confuse the two type systems:`

- `Wayfinder` (`@/wayfinder/...`) → `web.php` Inertia routes: links, forms, page props.
- `@/types/api` → `api.php` JSON request/response shapes. Use this for every API call.

# UI components — reuse Reka UI before building your own

`This project builds its UI on Reka UI` (`reka-ui`) — an unstyled, accessible Vue 3 primitive
library. The styled, ready-to-use wrappers live in `resources/js/components/ui/` (shadcn-vue style:
each primitive in its own folder — `button/`, `dialog/`, `select/`, `tooltip/`, `sidebar/`, etc.).

`Golden rule: reach for an existing component before writing a new one.` In order of preference:

1. `Use a wrapper in `resources/js/components/ui/`` if one already exists (`Button`, `Dialog`,
`Select`, `Checkbox`, `Sheet`, `DropdownMenu`, …). These are the project's design-system pieces —
   prefer them for anything user-facing.
2. `Compose from a Reka UI primitive` if no styled wrapper exists yet but Reka UI ships the behavior
   (accordion, popover, slider, tabs, combobox, etc.). Reka UI handles accessibility, keyboard
   navigation, and focus management for you — don't reinvent it. Check the Reka UI docs for what's
   available before assuming you need something custom.
3. `Only write a fully custom component when necessary` — i.e. when neither an existing wrapper nor a
   Reka UI primitive covers the need. When you do, follow the structure of the existing
   `components/ui/` folders (per-component folder, typed props, Tailwind classes via the project's
   `cn()` / `tailwind-merge` helper) so it stays consistent with the design system.

Never hand-roll a custom dropdown, modal, tooltip, or other interactive widget when Reka UI already
provides an accessible primitive for it.

# Responsive design — Mobile First, Container Queries by default

`Always design mobile first.` Write the base (unprefixed) Tailwind styles for the smallest screen,
then layer larger layouts on top with responsive variants. Never start from desktop and try to
shrink down.

```vue
<!-- base = mobile; @lg: = wider container -->
<div class="flex flex-col gap-4 @lg:flex-row @lg:gap-8">…</div>
```

`Prefer Container Queries over Media Queries.` Components should respond to the size of their own
container, not the viewport — this keeps a component correct wherever it's placed (sidebar, modal,
full-width page). Tailwind v4 has container queries built in (no plugin needed):

- Mark the container with `@container` on the parent.
- Size children with the `@`-prefixed variants: `@sm:`, `@md:`, `@lg:`, `@xl:` (and named containers
  via `@container/{name}` → `@lg/{name}:`).

```vue
<div class="@container">
    <article class="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-3">…</article>
</div>
```

`Use viewport Media Queries (`sm:`/`md:`/`lg:`/`xl:`) only as a last resort` — reserve them for things
that genuinely depend on the viewport rather than the component's own box (e.g. a top-level page
shell, the app sidebar collapse breakpoint, or device-level layout switches). If you find yourself
reaching for a media-query variant inside a reusable component, stop and use a container query
instead.
