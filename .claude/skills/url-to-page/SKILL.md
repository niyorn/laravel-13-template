---
name: url-to-page
description: Use when given a page URL for this app (e.g. a bug report "something's broken on http://<this-app>.test/...") and you need the Vue page component that renders it. Resolves URL → Inertia page .vue + auto-applied layout chain + child-component tree for this Inertia + Fortify + Wayfinder app.
---

# url-to-page

## Overview

Maps a page URL from this app to the Inertia page component on disk, plus its
auto-applied layout chain and its `.vue` child tree. Runs `resolve_page.py`, which is
deterministic: it reads the live route table (`php artisan route:list --json`), resolves
the Inertia component name from the route's action, reads the layout rules from
`resources/js/app.ts`, and walks `@/`-aliased imports. No guessing.

Use it the moment someone shares a URL and says "there's a bug here" — it replaces the
slow manual loop of finding the route, the controller/provider, the `Inertia::render`
name, and hand-resolving `@/` imports.

## When to use

- A bug report / request names a page URL and you need the component to edit.
- "Which component renders `<url>`?"
- You need the child tree under a page to locate where a bug lives.

Not for: API endpoint → controller (that's a backend `api.php` lookup), or finding a
component by name (use grep/glob).

## Usage

Run from anywhere inside the repo (needs `php artisan` to work — Herd serves the app, but
this only shells out to artisan, not the live site):

```bash
python3 .claude/skills/url-to-page/resolve_page.py "<url-or-path>" [--depth N]
```

Examples:

```bash
# Paste the URL verbatim — host and query string are fine
python3 .claude/skills/url-to-page/resolve_page.py "http://<this-app>.test/settings/profile"

# Just a path, 1 level of children
python3 .claude/skills/url-to-page/resolve_page.py "/dashboard" --depth 1
```

## Output

```
URL path : /settings/profile
Route    : GET settings/profile  (name: profile.edit)
Render   : 'settings/Profile'  (via App\Http\Controllers\Settings\ProfileController@edit)
Page     : resources/js/pages/settings/Profile.vue
Layout   : AppLayout (resources/js/layouts/AppLayout.vue) -> SettingsLayout (...)  (auto-applied via app.ts)
Children (depth 3):
  - components/DeleteUser.vue
    - components/Heading.vue
  ...
```

Child paths are relative to `resources/js`. `[MISSING]` after a page or child means the
import didn't resolve to a file on disk (a real problem worth flagging, not noise).

## How it resolves the component name

The route's `action` (from `route:list`) decides where the `Inertia::render` name lives:

| Action                            | Source of component name                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Inertia\Controller`              | `Route::inertia('<uri>', '<Component>')` in `routes/*.php`                                                                                                           |
| `App\Http\Controllers\...@method` | `Inertia::render('<Component>')` in that controller method                                                                                                           |
| `Laravel\Fortify\...`             | `Fortify::<view>(... Inertia::render('<Component>'))` in `FortifyServiceProvider` (auth pages: login, register, password reset, verify email, confirm password, 2FA) |

The layout chain is read live from the `layout:` resolver in `app.ts` (currently:
`Welcome`→none, `auth/*`→AuthLayout, `settings/*`→AppLayout+SettingsLayout, else AppLayout),
so it stays correct if those rules change.

## Limitations

- Only statically `import`ed `.vue` children appear. Components rendered via
  `<component :is>`, a registry, or async string lookup won't show.
- Reka UI / shadcn-vue wrappers (`@/components/ui/button`, etc.) are folder/barrel imports,
  not `.vue` files, so they don't appear in the child tree — check the page's `import` lines
  directly for those.
- `AuthLayout.vue` itself delegates to one of `auth/Auth{Simple,Card,Split}Layout.vue`; the
  script reports `AuthLayout` — open it to see which variant is currently wired in.
- If the action can't be mapped (e.g. a closure that renders Inertia inline), the script
  prints the action and tells you to open it and look for `Inertia::render('...')`.
