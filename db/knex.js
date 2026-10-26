const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = ['production', 'test'].includes(process.env.NODE_ENV) ? process.env.NODE_ENV : 'development';
const config = knexConfig[environment];

if (environment === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required when NODE_ENV=production');
}

module.exports = knex(config);
