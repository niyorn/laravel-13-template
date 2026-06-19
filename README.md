# Laravel Template 13

My personal Laravel 13 + Inertia (Vue 3) starter. Ships with Fortify auth (incl. 2FA),
a settings area, a Reka UI / shadcn-vue component kit, Wayfinder + Scramble end-to-end
TypeScript types, Pest tests, and Tailwind v4.

## Requirements

- PHP 8.3+
- Node 22+
- [Laravel Herd](https://herd.laravel.com/) (serves the app at `https://laravel-template-13.test`)
- PostgreSQL — run via [DBngin](https://dbngin.com/) (free) or Herd Pro's DB Engine (see below)

## 1. Set up PostgreSQL

The app is configured for Postgres (see `.env.example`), because that's the deploy target. Use
**either** of the database engines below — both end up at `127.0.0.1:5432` with user `postgres` and a
blank password, which is what `.env.example` already expects.

### Option A — DBngin (free)

[DBngin](https://dbngin.com/) is a free local database manager (by the TablePlus team). No Herd Pro needed.

1. Download and open **DBngin**, then **Create a new server** → choose **PostgreSQL**, pick a version,
   and leave the port at **`5432`**. Click **Create**, then **Start** the server.
   DBngin runs Postgres with user `postgres` and a blank password by default.
2. Open the server in a client (DBngin's **Open in TablePlus** button, or `psql`) and create a
   database named **`laravel`**:

    ```sql
    CREATE DATABASE laravel;
    ```

### Option B — Herd Pro (DB Engine)

If you have **Herd Pro**, use its bundled database engine instead:

1. Open the **Herd** app → **Services** → add a **PostgreSQL** service and start it.
   It listens on `127.0.0.1:5432` with user `postgres` and a blank password by default.
2. Open the service's database manager (Herd's UI, or any client like TablePlus / `psql`) and create
   a database named **`laravel`**:

    ```sql
    CREATE DATABASE laravel;
    ```

### Confirm the credentials

Whichever engine you used, make sure `.env` matches the running server (this is what `.env.example` ships with):

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=laravel
DB_USERNAME=postgres
DB_PASSWORD=
```

> If your engine shows a different port, username, or password, update these values in `.env` to match.

## 2. Install & boot

```bash
# PHP dependencies
composer install

# JS dependencies
npm install

# Environment file + app key
cp .env.example .env
php artisan key:generate

# Create the tables (uses the Postgres DB from step 1)
php artisan migrate

# Start the dev servers (Vite + queue + logs + server)
composer dev
```

Herd serves the site automatically at **https://laravel-template-13.test** — you don't
need `php artisan serve`. `composer dev` runs Vite (asset hot-reload), the queue worker,
and the log tail together.

## Common commands

| Command                  | What it does                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `composer dev`           | Run Vite + queue + Pail logs together (development)                                                                         |
| `npm run dev`            | Vite dev server only                                                                                                        |
| `npm run build`          | Build production assets                                                                                                     |
| `php artisan test`       | Run the Pest test suite (uses in-memory SQLite, no DB needed)                                                               |
| `composer lint`          | Format PHP with Pint                                                                                                        |
| `npm run lint`           | Lint/fix JS/Vue with oxlint + ESLint                                                                                        |
| `npm run generate:types` | Regenerate `resources/js/types/api/` (`index.d.ts` + flat `schemas.ts`) from the live API spec (app must be served by Herd) |
