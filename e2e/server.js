// Test-only entry point for the browser tests. Starts the real app against a
// fresh in-memory SQLite database, migrated before the server listens.
// Never used by `npm start` or in production.
process.env.NODE_ENV = 'test';
delete process.env.TEST_DATABASE_URL;

const knex = require('../db/knex');

knex.migrate
  .latest()
  .then(() => require('../bin/www'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
