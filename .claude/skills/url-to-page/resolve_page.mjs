#!/usr/bin/env node
/**
 * Resolve a page URL to its Vue page component + layout + child tree.
 *
 * For Laravel apps built on this Inertia + Fortify + Wayfinder template (resolution is by
 * `artisan`, not a hardcoded project name). Node built-ins only — no npm install needed.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PAGES_DIR = 'resources/js/pages';
const APP_TS = 'resources/js/app.ts';
const FORTIFY_PROVIDER = 'app/Providers/FortifyServiceProvider.php';

// Fortify GET "view" routes -> the FortifyServiceProvider method that registers the render.
const FORTIFY_ROUTE_TO_VIEW = {
    login: 'loginView',
    register: 'registerView',
    'password.request': 'requestPasswordResetLinkView',
    'password.reset': 'resetPasswordView',
    'verification.notice': 'verifyEmailView',
    'password.confirm': 'confirmPasswordView',
    'two-factor.login': 'twoFactorChallengeView',
};

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isFile = (p) => {
    try {
        return fs.statSync(p).isFile();
    } catch {
        return false;
    }
};
const isDir = (p) => {
    try {
        return fs.statSync(p).isDirectory();
    } catch {
        return false;
    }
};
const toPosix = (p) => p.split(path.sep).join('/');

// ---------------------------------------------------------------------------
// Repo setup
// ---------------------------------------------------------------------------

function findRepoRoot(start) {
    let cur = path.resolve(start);

    for (;;) {
        if (isFile(path.join(cur, 'artisan'))) {
            return cur;
        }

        const parent = path.dirname(cur);

        if (parent === cur) {
            return null;
        }

        cur = parent;
    }
}

function read(repoRoot, rel) {
    const p = path.join(repoRoot, rel);

    return isFile(p) ? fs.readFileSync(p, 'utf8') : null;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

function loadRoutes(repoRoot) {
    let stdout;

    try {
        stdout = execFileSync('php', ['artisan', 'route:list', '--json'], {
            cwd: repoRoot,
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
        });
    } catch (e) {
        const msg = e.stderr || e.message || '';
        console.error(
            `ERROR: \`php artisan route:list --json\` failed:\n${msg}`,
        );
        process.exit(1);
    }

    if (!stdout.trim()) {
        console.error(
            'ERROR: `php artisan route:list --json` produced no output.',
        );
        process.exit(1);
    }

    return JSON.parse(stdout);
}

function uriToRegex(uri) {
    const parts = uri.split('/').map((seg) => {
        const m = /^\{(\w+)(\?)?\}$/.exec(seg);

        if (m) {
            return m[2] ? '[^/]*' : '[^/]+';
        }

        return reEscape(seg);
    });

    return '^/?' + parts.join('/') + '/?$';
}

function matchRoute(routes, urlPath) {
    const candidates = [];

    for (const r of routes) {
        if (!String(r.method || '').includes('GET')) {
            continue;
        }

        const uri = r.uri;

        if (new RegExp(uriToRegex(uri)).test(urlPath)) {
            candidates.push({ hasParam: uri.includes('{'), r });
        }
    }

    if (!candidates.length) {
        return null;
    }

    // static routes (no {param}) win over parameterised ones
    candidates.sort((a, b) => (a.hasParam ? 1 : 0) - (b.hasParam ? 1 : 0));

    return candidates[0].r;
}

// ---------------------------------------------------------------------------
// Component-name resolution (3 sources)
// ---------------------------------------------------------------------------

function componentFromRouteInertia(repoRoot, uri) {
    const routesDir = path.join(repoRoot, 'routes');
    const pat = /Route::inertia\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;
    const target = '/' + uri.replace(/^\/+/, '');
    let files;

    try {
        files = fs.readdirSync(routesDir);
    } catch {
        return null;
    }

    for (const f of files) {
        if (!f.endsWith('.php')) {
            continue;
        }

        const txt = fs.readFileSync(path.join(routesDir, f), 'utf8');

        for (const m of txt.matchAll(pat)) {
            if ('/' + m[1].replace(/^\/+/, '') === target) {
                return m[2];
            }
        }
    }

    return null;
}

function componentFromController(repoRoot, action) {
    const m = /^(App\\Http\\Controllers\\[\w\\]+)@(\w+)/.exec(action);

    if (!m) {
        return null;
    }

    const cls = m[1];
    const method = m[2];
    const rel = cls.replace(/^App\\/, 'app\\').replace(/\\/g, '/') + '.php';
    const txt = read(repoRoot, rel);

    if (!txt) {
        return null;
    }

    const fn = new RegExp('function\\s+' + reEscape(method) + '\\s*\\(').exec(
        txt,
    );

    if (!fn) {
        return null;
    }

    const rest = txt.slice(fn.index + fn[0].length);
    const rm = /Inertia::render\(\s*['"]([^'"]+)['"]/.exec(rest);

    return rm ? rm[1] : null;
}

function componentFromFortify(repoRoot, routeName) {
    const view = FORTIFY_ROUTE_TO_VIEW[routeName];

    if (!view) {
        return null;
    }

    const txt = read(repoRoot, FORTIFY_PROVIDER);

    if (!txt) {
        return null;
    }

    const re = new RegExp(
        'Fortify::' +
            reEscape(view) +
            '\\(.*?Inertia::render\\(\\s*[\'"]([^\'"]+)[\'"]',
        's',
    );
    const m = re.exec(txt);

    return m ? m[1] : null;
}

function resolveComponent(repoRoot, route) {
    const action = route.action || '';
    const name = route.name || '';

    if (action === 'Inertia\\Controller') {
        return [
            componentFromRouteInertia(repoRoot, route.uri),
            'Route::inertia()',
        ];
    }

    if (action.startsWith('App\\Http\\Controllers')) {
        return [componentFromController(repoRoot, action), action];
    }

    if (action.startsWith('Laravel\\Fortify')) {
        return [componentFromFortify(repoRoot, name), `Fortify view (${name})`];
    }

    return [null, action];
}

// ---------------------------------------------------------------------------
// Layout chain (read live from app.ts)
// ---------------------------------------------------------------------------

function layoutImports(appTs) {
    const out = {};

    for (const m of appTs.matchAll(
        /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    )) {
        out[m[1]] = m[2];
    }

    return out;
}

function resolveLayout(repoRoot, component) {
    const appTs = read(repoRoot, APP_TS);

    if (!appTs || component == null) {
        return [];
    }

    const bodyM = /layout:\s*\([^)]*\)\s*=>\s*\{(.*?)\n\s*\},/s.exec(appTs);

    if (!bodyM) {
        return [];
    }

    const body = bodyM[1];
    const imports = layoutImports(appTs);

    const cases = [...body.matchAll(/case\s+(.+?):\s*return\s+(.+?);/gs)];
    const defaultM = /default:\s*return\s+(.+?);/s.exec(body);

    const idents = (expr) => {
        expr = expr.trim();

        if (expr === 'null') {
            return [];
        }

        const arr = /^\[(.*)\]/.exec(expr);

        return arr ? arr[1].match(/\w+/g) || [] : [expr];
    };

    let chosen = null;

    for (const c of cases) {
        const pred = c[1].trim();
        const ret = c[2];
        const eq = /name\s*===\s*['"]([^'"]+)['"]/.exec(pred);
        const sw = /name\.startsWith\(\s*['"]([^'"]+)['"]/.exec(pred);

        if (eq && component === eq[1]) {
            chosen = ret;
            break;
        }

        if (sw && component.startsWith(sw[1])) {
            chosen = ret;
            break;
        }
    }

    if (chosen == null && defaultM) {
        chosen = defaultM[1];
    }

    if (chosen == null) {
        return [];
    }

    const result = [];

    for (const ident of idents(chosen)) {
        const spec = imports[ident] ?? '?';
        const p = spec.startsWith('@/')
            ? spec.replace('@/', 'resources/js/')
            : spec;
        result.push([ident, p]);
    }

    return result;
}

// ---------------------------------------------------------------------------
// Child .vue tree
// ---------------------------------------------------------------------------

// `import <clause> from '<spec>'` — clause captures default + named bindings, spec the path.
const IMPORT_RE = /import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/gs;

function resolveImport(spec, importingFile, repoRoot) {
    if (spec.startsWith('@/')) {
        return path.join(repoRoot, 'resources/js', spec.slice(2));
    }

    if (spec.startsWith('.')) {
        return path.normalize(path.join(path.dirname(importingFile), spec));
    }

    return null;
}

function importedNames(clause) {
    const brace = /\{([^}]*)\}/.exec(clause);

    if (brace) {
        const names = [];

        for (let part of brace[1].split(',')) {
            part = part.trim();

            if (part) {
                names.push(part.split(' as ')[0].trim());
            }
        }

        return names;
    }

    const bare = clause.trim();

    return /^\w+$/.test(bare) ? [bare] : [];
}

function resolveBarrel(dirAbs, names) {
    const index = ['index.ts', 'index.js']
        .map((c) => path.join(dirAbs, c))
        .find((p) => isFile(p));

    if (!index) {
        return [];
    }

    const txt = fs.readFileSync(index, 'utf8');
    const exports = {};

    for (const m of txt.matchAll(
        /export\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g,
    )) {
        const spec = m[2];

        if (!spec.endsWith('.vue')) {
            continue;
        }

        for (let part of m[1].split(',')) {
            part = part.trim();

            if (!part) {
                continue;
            }

            const name = part.includes(' as ')
                ? part.split(' as ')[1].trim()
                : part;
            exports[name] = path.normalize(path.join(dirAbs, spec));
        }
    }

    return names.filter((n) => n in exports).map((n) => exports[n]);
}

function childVue(f, repoRoot, includeUi = true) {
    if (!isFile(f)) {
        return [];
    }

    const txt = fs.readFileSync(f, 'utf8');
    let out = [];

    for (const m of txt.matchAll(IMPORT_RE)) {
        const clause = m[1];
        const spec = m[2];

        if (spec.endsWith('.vue')) {
            const r = resolveImport(spec, f, repoRoot);

            if (r) {
                out.push(r);
            }

            continue;
        }

        if (spec.startsWith('@/') || spec.startsWith('.')) {
            const target = resolveImport(spec, f, repoRoot);

            if (target && isDir(target)) {
                out.push(...resolveBarrel(target, importedNames(clause)));
            }
        }
    }

    if (!includeUi) {
        out = out.filter((c) => !toPosix(c).includes('/components/ui/'));
    }

    return out;
}

function printTree(f, repoRoot, depth, maxd, seen, includeUi = true) {
    const root = path.join(repoRoot, 'resources/js');

    for (const c of childVue(f, repoRoot, includeUi)) {
        const tag = isFile(c) ? '' : '  [MISSING]';
        const rel = path.relative(root, c);
        console.log(`${'  '.repeat(depth)}- ${rel}${tag}`);

        if (depth < maxd && !seen.has(c)) {
            seen.add(c);
            printTree(c, repoRoot, depth + 1, maxd, seen, includeUi);
        }
    }
}

// ---------------------------------------------------------------------------
// URL -> path
// ---------------------------------------------------------------------------

function urlToPath(u) {
    if (u.startsWith('/')) {
        return u.split('?')[0].split('#')[0] || '/';
    }

    let s = u;

    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
        s = 'https://' + s.replace(/^\/+/, '');
    }

    try {
        return new URL(s).pathname || '/';
    } catch {
        return '/';
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv) {
    if (!argv.length) {
        console.error(
            'usage: resolve_page.mjs <url-or-path> [--depth N] [--ui] [--layout] [--all]',
        );

        return 2;
    }

    const url = argv[0];
    let depth = 4;
    const di = argv.indexOf('--depth');

    if (di !== -1) {
        depth = parseInt(argv[di + 1], 10);
    }

    const includeUi = argv.includes('--ui') || argv.includes('--all');
    const includeLayout = argv.includes('--layout') || argv.includes('--all');

    const repoRoot = findRepoRoot(process.cwd());

    if (!repoRoot) {
        console.error(
            'ERROR: not inside a Laravel repo (no `artisan` found above cwd).',
        );

        return 1;
    }

    const urlPath = urlToPath(url);

    const routes = loadRoutes(repoRoot);
    const route = matchRoute(routes, urlPath);

    console.log(`URL path : ${urlPath}`);

    if (!route) {
        console.log(
            '\nNo route matched. Check `php artisan route:list` for the URL.',
        );

        return 0;
    }

    console.log(
        `Route    : ${String(route.method).split('|')[0]} ${route.uri}` +
            (route.name ? `  (name: ${route.name})` : ''),
    );

    const [component, source] = resolveComponent(repoRoot, route);

    if (!component) {
        console.log(`Action   : ${route.action}`);
        console.log(
            "\nCould not resolve the Inertia component name from this route's action.",
        );
        console.log(
            "Open the action above and look for Inertia::render('...').",
        );

        return 0;
    }

    const pageRel = `${PAGES_DIR}/${component}.vue`;
    const pageAbs = path.join(repoRoot, pageRel);
    console.log(`Render   : '${component}'  (via ${source})`);
    console.log(`Page     : ${pageRel}${isFile(pageAbs) ? '' : '  [MISSING]'}`);

    const layout = resolveLayout(repoRoot, component);

    if (layout.length) {
        const chain = layout
            .map(([ident, p]) => `${ident} (${p})`)
            .join(' -> ');
        console.log(`Layout   : ${chain}  (auto-applied via app.ts)`);
    } else {
        console.log('Layout   : none');
    }

    if (isFile(pageAbs)) {
        console.log(`Children (depth ${depth}):`);
        printTree(pageAbs, repoRoot, 1, depth, new Set([pageAbs]), includeUi);
    }

    if (includeLayout) {
        for (const [ident, p] of layout) {
            const layAbs = path.join(repoRoot, p);

            if (isFile(layAbs)) {
                console.log(`Layout children — ${ident} (depth ${depth}):`);
                printTree(
                    layAbs,
                    repoRoot,
                    1,
                    depth,
                    new Set([layAbs]),
                    includeUi,
                );
            }
        }
    }

    return 0;
}

process.exit(main(process.argv.slice(2)));
