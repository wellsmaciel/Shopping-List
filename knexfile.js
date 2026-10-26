const sharedMigrations = {
  tableName: 'knex_migrations',
  directory: './db/migrations',
};

const sharedSeeds = {
  directory: './db/seeds',
};

// Postgres SSL is controlled by DATABASE_SSL=true|false (default: false).
const useSsl = process.env.DATABASE_SSL === 'true';

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/dev.sqlite3',
    },
    migrations: sharedMigrations,
    seeds: sharedSeeds,
    useNullAsDefault: true,
  },

  // In-memory SQLite by default; Postgres when TEST_DATABASE_URL is set.
  test: process.env.TEST_DATABASE_URL
    ? {
        client: 'pg',
        connection: process.env.TEST_DATABASE_URL,
        migrations: sharedMigrations,
        seeds: sharedSeeds,
        pool: { min: 1, max: 5 },
      }
    : {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        migrations: sharedMigrations,
        seeds: sharedSeeds,
        useNullAsDefault: true,
        // Each pooled connection would be a separate in-memory database.
        pool: { min: 1, max: 1 },
      },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        }
      : undefined,
    migrations: sharedMigrations,
    seeds: sharedSeeds,
    pool: {
      min: 2,
      max: 10,
    },
  },
};
