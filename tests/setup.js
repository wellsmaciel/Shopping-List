import { afterAll, beforeAll } from 'vitest';
import { createRequire } from 'node:module';

// Load through Node's require so we share the same instance (and DB) as app.js.
const knex = createRequire(import.meta.url)('../db/knex');

// Runs in every test file's context, so each suite gets a migrated database
// (a fresh in-memory SQLite DB, or the shared Postgres test DB).
beforeAll(async () => {
  await knex.migrate.latest();
});

afterAll(async () => {
  await knex.destroy();
});
