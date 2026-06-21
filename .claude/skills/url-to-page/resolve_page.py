#!/usr/bin/env python3
"""Resolve a page URL to its Vue page component + layout + child tree.

For Laravel apps built on this Inertia + Fortify + Wayfinder template (regardless of the
app's own name — resolution is by `artisan`, not a hardcoded project name).

Usage:
    resolve_page.py <url-or-path> [--depth N]

This is an Inertia + Fortify + Wayfinder app (NOT Vue Router). A URL is served by a
server-side route that renders an Inertia page name; that name maps to a .vue file under
resources/js/pages. Layouts are applied centrally in resources/js/app.ts by page-name
prefix, not imported in the page itself.

The resolver is deterministic:
  1. `php artisan route:list --json` gives uri -> name + action for every route.
  2. The matched GET route's Inertia component name is found from one of three sources,
     depending on the action:
       - action == 'Inertia\\Controller'      -> Route::inertia('<uri>', '<Component>') in routes/*.php
       - action == 'App\\Http\\Controllers...' -> Inertia::render('<Component>') in that controller method
       - action is a Fortify controller        -> Fortify::<view>(... Inertia::render('<Component>')) in FortifyServiceProvider
  3. The layout chain is read live from the `layout:` resolver in resources/js/app.ts.
  4. The .vue child tree is walked, resolving '@/...' (-> resources/js) and relative imports.

No model reasoning required.
"""

import json
import os
import re
import subprocess
import sys
from urllib.parse import urlsplit

PAGES_DIR = "resources/js/pages"
APP_TS = "resources/js/app.ts"
FORTIFY_PROVIDER = "app/Providers/FortifyServiceProvider.php"

# Fortify GET "view" routes -> the FortifyServiceProvider method that registers the render.
# Stable Fortify API: the route name is fixed even if the rendered component is renamed.
FORTIFY_ROUTE_TO_VIEW = {
    "login": "loginView",
    "register": "registerView",
    "password.request": "requestPasswordResetLinkView",
    "password.reset": "resetPasswordView",
    "verification.notice": "verifyEmailView",
    "password.confirm": "confirmPasswordView",
    "two-factor.login": "twoFactorChallengeView",
}


# ---------------------------------------------------------------------------
# Repo setup
# ---------------------------------------------------------------------------


def find_repo_root(start):
    """Walk up from `start` until a dir containing `artisan` is found (Laravel root)."""
    cur = os.path.abspath(start)
    while True:
        if os.path.isfile(os.path.join(cur, "artisan")):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return None
        cur = parent


def read(repo_root, rel):
    p = os.path.join(repo_root, rel)
    if not os.path.isfile(p):
        return None
    return open(p, encoding="utf-8").read()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


def load_routes(repo_root):
    """Return the parsed `php artisan route:list --json` array."""
    out = subprocess.run(
        ["php", "artisan", "route:list", "--json"],
        cwd=repo_root, capture_output=True, text=True,
    )
    if out.returncode != 0 or not out.stdout.strip():
        raise SystemExit(f"ERROR: `php artisan route:list --json` failed:\n{out.stderr}")
    return json.loads(out.stdout)


def uri_to_regex(uri):
    """Convert a Laravel route uri ('settings/profile', 'users/{id}', '{post?}') to a regex."""
    parts = []
    for seg in uri.split("/"):
        m = re.fullmatch(r"\{(\w+)(\?)?\}", seg)
        if m:
            parts.append(r"[^/]+" if not m.group(2) else r"[^/]*")
        else:
            parts.append(re.escape(seg))
    return "^/?" + "/".join(parts) + "/?$"


def match_route(routes, path):
    """Find the GET route whose uri matches `path`. Prefer exact (non-param) matches."""
    candidates = []
    for r in routes:
        if "GET" not in r.get("method", ""):
            continue
        uri = r["uri"]
        if re.match(uri_to_regex(uri), path):
            has_param = "{" in uri
            candidates.append((has_param, r))
    if not candidates:
        return None
    # static routes (no {param}) win over parameterised ones
    candidates.sort(key=lambda c: c[0])
    return candidates[0][1]


# ---------------------------------------------------------------------------
# Component-name resolution (3 sources)
# ---------------------------------------------------------------------------


def component_from_route_inertia(repo_root, uri):
    """Source 1: Route::inertia('<uri>', '<Component>') across routes/*.php."""
    routes_dir = os.path.join(repo_root, "routes")
    pat = re.compile(r"""Route::inertia\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]""")
    target = "/" + uri.lstrip("/")
    for f in os.listdir(routes_dir):
        if not f.endswith(".php"):
            continue
        txt = open(os.path.join(routes_dir, f), encoding="utf-8").read()
        for ruri, comp in pat.findall(txt):
            if "/" + ruri.lstrip("/") == target:
                return comp
    return None


def component_from_controller(repo_root, action):
    """Source 2: App controller -> first Inertia::render('<Component>') in the method body."""
    m = re.match(r"(App\\Http\\Controllers\\[\w\\]+)@(\w+)", action)
    if not m:
        return None
    cls, method = m.group(1), m.group(2)
    rel = cls.replace("App\\", "app\\").replace("\\", "/") + ".php"
    txt = read(repo_root, rel)
    if not txt:
        return None
    fn = re.search(r"function\s+" + re.escape(method) + r"\s*\(", txt)
    if not fn:
        return None
    rest = txt[fn.end():]
    rm = re.search(r"""Inertia::render\(\s*['"]([^'"]+)['"]""", rest)
    return rm.group(1) if rm else None


def component_from_fortify(repo_root, route_name):
    """Source 3: Fortify view route -> Inertia::render in FortifyServiceProvider."""
    view = FORTIFY_ROUTE_TO_VIEW.get(route_name)
    if not view:
        return None
    txt = read(repo_root, FORTIFY_PROVIDER)
    if not txt:
        return None
    m = re.search(
        r"Fortify::" + re.escape(view) + r"\(.*?Inertia::render\(\s*['\"]([^'\"]+)['\"]",
        txt, re.DOTALL,
    )
    return m.group(1) if m else None


def resolve_component(repo_root, route):
    action = route.get("action", "")
    name = route.get("name") or ""
    if action == "Inertia\\Controller":
        return component_from_route_inertia(repo_root, route["uri"]), "Route::inertia()"
    if action.startswith("App\\Http\\Controllers"):
        return component_from_controller(repo_root, action), action
    if action.startswith("Laravel\\Fortify"):
        return component_from_fortify(repo_root, name), f"Fortify view ({name})"
    return None, action


# ---------------------------------------------------------------------------
# Layout chain (read live from app.ts)
# ---------------------------------------------------------------------------


def layout_imports(app_ts):
    """Map layout identifier -> '@/...' import path from app.ts import lines."""
    out = {}
    for ident, spec in re.findall(
        r"""import\s+(\w+)\s+from\s+['"]([^'"]+)['"]""", app_ts):
        out[ident] = spec
    return out


def resolve_layout(repo_root, component):
    """Apply the `layout:` resolver in app.ts to `component`; return [(ident, path), ...]."""
    app_ts = read(repo_root, APP_TS)
    if not app_ts or component is None:
        return []
    body_m = re.search(r"layout:\s*\([^)]*\)\s*=>\s*\{(.*?)\n\s*\},", app_ts, re.DOTALL)
    if not body_m:
        return []
    body = body_m.group(1)
    imports = layout_imports(app_ts)

    # collect (predicate, return-expr) in source order, plus default
    cases = re.findall(r"case\s+(.+?):\s*return\s+(.+?);", body, re.DOTALL)
    default_m = re.search(r"default:\s*return\s+(.+?);", body)

    def idents(expr):
        expr = expr.strip()
        if expr == "null":
            return []
        arr = re.match(r"\[(.*)\]", expr)
        names = re.findall(r"\w+", arr.group(1)) if arr else [expr]
        return names

    chosen = None
    for pred, ret in cases:
        pred = pred.strip()
        eq = re.search(r"""name\s*===\s*['"]([^'"]+)['"]""", pred)
        sw = re.search(r"""name\.startsWith\(\s*['"]([^'"]+)['"]""", pred)
        if eq and component == eq.group(1):
            chosen = ret
            break
        if sw and component.startswith(sw.group(1)):
            chosen = ret
            break
    if chosen is None and default_m:
        chosen = default_m.group(1)
    if chosen is None:
        return []

    result = []
    for ident in idents(chosen):
        spec = imports.get(ident, "?")
        path = spec.replace("@/", "resources/js/", 1) if spec.startswith("@/") else spec
        result.append((ident, path))
    return result


# ---------------------------------------------------------------------------
# Child .vue tree
# ---------------------------------------------------------------------------

VUE_IMPORT_RE = re.compile(r"""from\s+['"]([^'"]+)['"]""")


def resolve_import(spec, importing_file, repo_root):
    """Resolve an import specifier to an absolute path. Handles '@/' and relative imports.

    Reka UI wrappers are imported as folders ('@/components/ui/button') -> index.ts barrel,
    which is not a .vue file, so those are skipped by the .vue filter in child_vue().
    """
    if spec.startswith("@/"):
        return os.path.join(repo_root, "resources/js", spec[2:])
    if spec.startswith("."):
        return os.path.normpath(os.path.join(os.path.dirname(importing_file), spec))
    return None


def child_vue(f, repo_root):
    if not os.path.isfile(f):
        return []
    out = []
    for ln in open(f, encoding="utf-8"):
        m = VUE_IMPORT_RE.search(ln)
        if not m:
            continue
        spec = m.group(1)
        if not spec.endswith(".vue"):
            continue
        r = resolve_import(spec, f, repo_root)
        if r:
            out.append(r)
    return out


def print_tree(f, repo_root, depth, maxd, seen):
    root = os.path.join(repo_root, "resources/js")
    for c in child_vue(f, repo_root):
        tag = "" if os.path.isfile(c) else "  [MISSING]"
        rel = os.path.relpath(c, root)
        print(f"{'  ' * depth}- {rel}{tag}")
        if depth < maxd and c not in seen:
            seen.add(c)
            print_tree(c, repo_root, depth + 1, maxd, seen)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv):
    if not argv:
        print("usage: resolve_page.py <url-or-path> [--depth N]", file=sys.stderr)
        return 2
    url = argv[0]
    depth = 3
    if "--depth" in argv:
        depth = int(argv[argv.index("--depth") + 1])

    repo_root = find_repo_root(os.getcwd())
    if not repo_root:
        print("ERROR: not inside a Laravel repo (no `artisan` found above cwd).", file=sys.stderr)
        return 1

    parts = urlsplit(url if "//" in url else "//" + url, scheme="https")
    path = parts.path or "/"

    routes = load_routes(repo_root)
    route = match_route(routes, path)

    print(f"URL path : {path}")
    if not route:
        print("\nNo route matched. Check `php artisan route:list` for the URL.")
        return 0

    print(f"Route    : {route['method'].split('|')[0]} {route['uri']}"
          + (f"  (name: {route['name']})" if route.get('name') else ""))

    component, source = resolve_component(repo_root, route)
    if not component:
        print(f"Action   : {route.get('action')}")
        print("\nCould not resolve the Inertia component name from this route's action.")
        print("Open the action above and look for Inertia::render('...').")
        return 0

    page_rel = f"{PAGES_DIR}/{component}.vue"
    page_abs = os.path.join(repo_root, page_rel)
    print(f"Render   : '{component}'  (via {source})")
    print(f"Page     : {page_rel}" + ("" if os.path.isfile(page_abs) else "  [MISSING]"))

    layout = resolve_layout(repo_root, component)
    if layout:
        chain = " -> ".join(f"{ident} ({path})" for ident, path in layout)
        print(f"Layout   : {chain}  (auto-applied via app.ts)")
    else:
        print("Layout   : none")

    if os.path.isfile(page_abs):
        print(f"Children (depth {depth}):")
        print_tree(page_abs, repo_root, 1, depth, {page_abs})
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
