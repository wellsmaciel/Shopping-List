var express = require('express');
var items = express.Router();

const knex = require('../db/knex');
const { UNITS } = require('../lib/units');

const MAX_INT = 2147483647; // largest value of a Postgres integer column
const COLUMNS = ['id', 'name', 'unit', 'quantity'];

function badRequest(code, error) {
  return { status: 400, code, error };
}

// Returns { value } with the clean Item fields, or { failure } with the first problem found.
function validateItem(body) {
  const { name, unit, quantity } = body || {};

  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    return { failure: badRequest('invalid_name', 'name must be text of 1 to 100 characters') };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_INT) {
    return { failure: badRequest('invalid_quantity', 'quantity must be a whole number of 1 or more') };
  }
  if (typeof unit !== 'string' || !UNITS.includes(unit)) {
    return { failure: badRequest('invalid_unit', `unit must be one of: ${UNITS.join(', ')}`) };
  }
  return { value: { name: name.trim(), unit, quantity } };
}

function sendFailure(res, failure) {
  res.status(failure.status).json({ error: failure.error, code: failure.code });
}

items.get('/', async function (req, res) {
  const rows = await knex('items').select(COLUMNS).orderBy('id', 'asc');
  res.status(200).json(rows);
});

items.post('/', async function (req, res) {
  const { value, failure } = validateItem(req.body);
  if (failure) return sendFailure(res, failure);

  // returning() makes Postgres hand back the real id (SQLite supports it too).
  const rows = await knex('items').insert(value).returning(COLUMNS);
  res.status(201).json(rows[0]);
});

// Returns { id } for a valid path id, or { failure }. Ids above MAX_INT cannot exist, so they get { id: null }.
function parseId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) {
    return { failure: badRequest('invalid_id', 'id must be a positive integer') };
  }
  const id = Number(raw);
  return { id: id > MAX_INT ? null : id };
}

function notFound(res) {
  res.status(404).json({ error: 'Item not found', code: 'not_found' });
}

items.put('/:id', async function (req, res) {
  const { id, failure: idFailure } = parseId(req.params.id);
  if (idFailure) return sendFailure(res, idFailure);
  const { value, failure } = validateItem(req.body);
  if (failure) return sendFailure(res, failure);

  const rows = id === null ? [] : await knex('items').where({ id }).update(value).returning(COLUMNS);
  if (rows.length === 0) return notFound(res);
  res.status(200).json(rows[0]);
});

items.delete('/:id', async function (req, res) {
  const { id, failure } = parseId(req.params.id);
  if (failure) return sendFailure(res, failure);

  const deleted = id === null ? 0 : await knex('items').where({ id }).del();
  if (deleted === 0) return notFound(res);
  res.status(204).end();
});

// Clear List
items.delete('/', async function (req, res) {
  await knex('items').del();
  res.status(204).end();
});

module.exports = items;
