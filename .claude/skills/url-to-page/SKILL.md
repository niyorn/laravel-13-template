---
name: url-to-page
description: Use when given a page URL for this app (e.g. a bug report "something's broken on http://<this-app>.test/...") and you need the Vue page component that renders it. Resolves URL → Inertia page .vue + auto-applied layout chain + child-component tree for this Inertia + Fortify + Wayfinder app.
---

# url-to-page

## Overview

Maps a page URL from this app to the Inertia page component on disk, plus its
auto-applied layout chain and its `.vue` child tree. Runs `resolve_page.mjs` (Node, no deps), which is
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
node .claude/skills/url-to-page/resolve_page.mjs "<url-or-path>" [--depth N] [--ui] [--layout] [--all]
```

By default the output is `lean`: the route, page file, one-line layout summary, and the page's
`own` component tree. The extras below are opt-in — add them when you need the fuller picture.

| Flag        | Effect                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| `--depth N` | How many child levels to walk (default `4`).                                      |
| `--ui`      | Also include shadcn/Reka `ui/*` wrappers (`Button`, `Dialog*`, etc.).             |
| `--layout`  | Also walk the layout children tree (the one-line `Layout:` summary always shows). |
| `--all`     | Shorthand for `--ui --layout` — the full tree, e.g. for "all components of X".    |

Examples:

```bash
# Lean default — just this page's own components
node .claude/skills/url-to-page/resolve_page.mjs "http://<this-app>.test/settings/profile"

# 1 level of children
node .claude/skills/url-to-page/resolve_page.mjs "/dashboard" --depth 1

# Everything — page + ui/* wrappers + layout subtree
node .claude/skills/url-to-page/resolve_page.mjs "/login" --all
```

## Output

Full output with `--all` (default output omits the `ui/*` lines and the `Layout children` block):

```
URL path : /settings/profile
Route    : GET settings/profile  (name: profile.edit)
Render   : 'settings/Profile'  (via App\Http\Controllers\Settings\ProfileController@edit)
Page     : resources/js/pages/settings/Profile.vue
Layout   : AppLayout (resources/js/layouts/AppLayout.vue) -> SettingsLayout (...)  (auto-applied via app.ts)
Children (depth 4):
  - components/DeleteUser.vue
    - components/ui/dialog/Dialog.vue
  - components/ui/button/Button.vue
  ...
Layout children — AppLayout (depth 4):
  - layouts/app/AppSidebarLayout.vue
    - components/AppSidebar.vue
  ...
```

Child paths are relative to `resources/js`. `[MISSING]` after a page or child means the
import didn't resolve to a file on disk (a real problem worth flagging, not noise).

`shadcn-vue / Reka UI wrappers` (`@/components/ui/button`, etc.) are resolved with `--ui` (or
`--all`): the folder's `index.ts` barrel is read and each imported name maps to its `.vue` file
(e.g. `Button` -> `components/ui/button/Button.vue`). Default depth is `4` (override with `--depth N`).

`Layout children` are walked with `--layout` (or `--all`) under their own heading. Layouts are
applied centrally in `app.ts`, not imported by the page, so the page's own tree never reaches them
— this section covers the layout chain (including the variant a wrapper like `AuthLayout` delegates
to, e.g. `AuthSimpleLayout`, and that variant's own children).

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

- Only statically `import`ed children appear (direct `.vue` imports and `ui/*` barrel imports).
  Components rendered via `<component :is>`, a registry, or async string lookup won't show.
- Barrel resolution only maps names re-exported as `.vue` files in the folder's `index.ts`/`index.js`.
  Re-exports pointing at `.ts` files (variants, helpers like `buttonVariants`) are intentionally skipped.
- If the action can't be mapped (e.g. a closure that renders Inertia inline), the script
  prints the action and tells you to open it and look for `Inertia::render('...')`.
