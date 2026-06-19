# Laravel Template 13

My personal Laravel 13 + Inertia (Vue 3) starter. Ships with Fortify auth (incl. 2FA),
a settings area, a Reka UI / shadcn-vue component kit, Wayfinder + Scramble end-to-end
TypeScript types, Pest tests, and Tailwind v4.

## Requirements

- PHP 8.3+
- Node 22+
- [Laravel Herd](https://herd.laravel.com/) (serves the app at `https://laravel-template-13.test`)
- PostgreSQL — run via Herd's built-in DB Engine (see below)

## 1. Set up PostgreSQL in Herd (DB Engine)

The app is configured for Postgres (see `.env.example`), because that's the deploy target.
Create the database through Herd's bundled database engine:

1. Open the **Herd** app → **Services** (Herd Pro) → add a **PostgreSQL** service and start it.
   It listens on `127.0.0.1:5432` with user `postgres` and a blank password by default.
2. Open the service's database manager (Herd's UI, or any client like TablePlus / `psql`).
3. Create a database named **`laravel`**:

    ```sql
    CREATE DATABASE laravel;
    ```

4. Confirm the credentials match `.env.example`:

    ```env
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=laravel
    DB_USERNAME=postgres
    DB_PASSWORD=
    ```

    > If Herd shows a different username/password for your Postgres service, update these
    > values in your `.env` to match.

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
