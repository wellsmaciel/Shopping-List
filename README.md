# Shopping List

A single shared list of things to buy at the supermarket. Add **Items** (a name, a **Quantity** and a **Unit**), tick them **In Cart** while you shop (In Cart Items sink to the bottom and the state is saved), edit or delete them, or use **Clear List** to remove everything after a confirmation. The **Interface Language** (English or Irish, Gaeilge) can be switched with a button; it changes the app's own text but never what you typed. The theme and language are remembered per browser.

Stack: Node 24, Express 5, Knex (SQLite in development, Postgres in production), plain HTML/CSS/JS.

Live app: https://shopping-list-production-6a17.up.railway.app

## Local setup

```bash
npm install
npm run migrate   # creates db/dev.sqlite3
npm run seed      # optional sample Items
npm start         # http://localhost:3000
```

Requires Node 24 or newer.

## Scripts

| Script | What it does |
| --- | --- |
| `npm start` | Starts the server (`node ./bin/www`) on `PORT` (default 3000) |
| `npm run dev` | Same, restarting on file changes (`node --watch`) |
| `npm run migrate` | Applies database migrations (`knex migrate:latest`) |
| `npm run seed` | Loads sample Items (`knex seed:run`) |
| `npm test` | API and language-file tests (Vitest + supertest) |
| `npm run test:e2e` | Browser tests (Playwright, Chromium) |

## Environment variables

| Variable | Used for | Default |
| --- | --- | --- |
| `NODE_ENV` | `development` (SQLite file), `test` (in-memory SQLite or Postgres), `production` (Postgres). Knex and the app both pick their database from it. | `development` |
| `PORT` | Port the server listens on | `3000` |
| `DATABASE_URL` | Postgres connection string. Required when `NODE_ENV=production`; the app refuses to start without it. | none |
| `DATABASE_SSL` | Set to `true` to use SSL for the production Postgres connection. Leave unset on Railway's private network. | `false` |
| `TEST_DATABASE_URL` | When `NODE_ENV=test`, run against this Postgres instead of in-memory SQLite | none |

## Testing

```bash
npm test                 # in-memory SQLite
npx playwright install chromium   # once
npm run test:e2e
```

To run the API tests against Postgres (for example with Docker):

```bash
docker run --rm -d --name shopping-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shopping_list_test postgres:17

# bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shopping_list_test npm test
# PowerShell
$env:TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/shopping_list_test"; npm test
```

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`, with Node 24:

1. **Tests (SQLite)**: `npm test` on in-memory SQLite.
2. **Tests (Postgres)**: the same suite against a Postgres 17 service container.
3. **Browser tests (Playwright)**: `npm run test:e2e` in Chromium.

## API reference

All endpoints are under `/api` and use JSON.

| Method and path | Body | Success |
| --- | --- | --- |
| `GET /api/items` | | 200, array of Items (not In Cart first, then In Cart; each by id) |
| `POST /api/items` | `{ name, unit, quantity }` | 201, the created Item |
| `PUT /api/items/:id` | `{ name, unit, quantity }` | 200, the updated Item (`in_cart` unchanged) |
| `PATCH /api/items/:id` | `{ in_cart: boolean }` | 200, the updated Item |
| `DELETE /api/items/:id` | | 204 |
| `DELETE /api/items` | | 204 (Clear List) |
| `GET /api/units` | | 200, ordered array of Unit codes |
| `GET /api/version` | | 200, `{ version }` |

An Item looks like `{ "id": 1, "name": "Milk", "unit": "liters", "quantity": 2, "in_cart": false }`.

Unit codes: `units`, `liters`, `milliliters`, `kg`, `grams`, `pack`, `bottles`, `box`, `bag`.

Validation: `name` is trimmed and must be 1 to 100 characters; `quantity` must be a whole number of 1 or more; `unit` must be a Unit code; `in_cart` must be a boolean; `:id` must be a positive integer.

Errors always have the body `{ "error": "<message for developers>", "code": "<code>" }`:

| Code | Status | Meaning |
| --- | --- | --- |
| `invalid_name`, `invalid_quantity`, `invalid_unit`, `invalid_in_cart`, `invalid_id`, `invalid_json` | 400 | Validation failed or malformed JSON |
| `not_found` | 404 | Unknown Item id or unknown `/api` route |
| `server_error` | 500 | Unexpected failure |

## Deploying to Railway

Migrations run automatically on every deploy through the pre-deploy command `npm run migrate`; the app starts with `npm start`. Both are in `railway.json`. Railway sets `PORT` itself.

1. Create a new Railway project.
2. Add a **PostgreSQL** database to the project.
3. Add a service from the GitHub repo `wellsmaciel/Shopping-List` (branch `main`). Railway reads `railway.json`.
4. In the service **Variables** tab, set:
   - `NODE_ENV=production`
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}` (a reference variable; replace `Postgres` with the database service's name if different)
   - `DATABASE_SSL` is not needed: the service reaches Postgres over Railway's private network. Set it to `true` only if you connect through a public URL that requires SSL.
5. In the service **Settings > Deploy**, check the **Pre-deploy Command**. Railway may not pick it up from `railway.json`; if the field is empty, set it to `npm run migrate`. Without it the database has no tables and `/api/items` returns 500 (`relation "items" does not exist`). The start command should be `npm start`.
6. In the service **Settings**, enable **Wait for CI**, so that deploys from `main` only start after the GitHub Actions checks pass. The toggle only appears once you have accepted Railway's updated GitHub permissions (Railway shows a banner for this). It also requires the workflow to have a `push` trigger on `main`, which `ci.yml` already has.
7. In **Settings > Networking**, click **Generate Domain**, then put the URL at the top of this README.

## Author

Created by Wells Maciel: [LinkedIn](https://www.linkedin.com/in/wells-velasquez-maciel/) · [GitHub](https://github.com/wellsmaciel/Shopping-List)
