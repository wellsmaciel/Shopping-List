import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import app from '../app';

const knex = createRequire(import.meta.url)('../db/knex');

beforeEach(async () => {
  await knex('items').del();
});

const milk = { name: 'Milk', unit: 'liters', quantity: 2 };
const add = (body) => request(app).post('/api/items').send(body);

describe('GET /api/units', () => {
  it('returns the ordered Unit codes', async () => {
    const res = await request(app).get('/api/units');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['units', 'liters', 'milliliters', 'kg', 'grams', 'pack', 'bottles', 'box', 'bag']);
  });
});

describe('POST /api/items', () => {
  it('returns 201 with the full Item and a real id', async () => {
    const res = await add(milk);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), ...milk });
    expect(res.body.id).toBeGreaterThan(0);
  });

  it('can be found again by the id it returned', async () => {
    const created = (await add(milk)).body;
    const list = (await request(app).get('/api/items')).body;
    expect(list.find((item) => item.id === created.id)).toEqual(created);
  });

  it('trims the name', async () => {
    const res = await add({ ...milk, name: '  Milk  ' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Milk');
  });

  it('accepts a 100-character name and the same name twice', async () => {
    expect((await add({ ...milk, name: 'a'.repeat(100) })).status).toBe(201);
    expect((await add(milk)).status).toBe(201);
    expect((await add(milk)).status).toBe(201);
  });

  it.each([
    ['missing name', { unit: 'box', quantity: 1 }],
    ['non-string name', { name: 5, unit: 'box', quantity: 1 }],
    ['empty name', { name: '', unit: 'box', quantity: 1 }],
    ['blank name', { name: '   ', unit: 'box', quantity: 1 }],
    ['101-character name', { name: 'a'.repeat(101), unit: 'box', quantity: 1 }],
  ])('rejects %s with invalid_name', async (label, body) => {
    const res = await add(body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_name');
    expect(typeof res.body.error).toBe('string');
  });

  it.each([
    ['missing quantity', undefined],
    ['zero', 0],
    ['negative', -1],
    ['decimal', 1.5],
    ['numeric string', '2'],
    ['null', null],
    ['too large', 3000000000],
  ])('rejects quantity: %s with invalid_quantity', async (label, quantity) => {
    const res = await add({ name: 'Milk', unit: 'box', quantity });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_quantity');
  });

  it.each([
    ['missing unit', undefined],
    ['unknown unit', 'gallons'],
    ['wrong case', 'Liters'],
    ['non-string', 3],
  ])('rejects %s with invalid_unit', async (label, unit) => {
    const res = await add({ name: 'Milk', unit, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_unit');
  });

  it('rejects an empty request with a validation code', async () => {
    const res = await request(app).post('/api/items');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_name');
  });

  it('rejects malformed JSON with invalid_json', async () => {
    const res = await request(app).post('/api/items').set('Content-Type', 'application/json').send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_json');
  });

  it('stores nothing when validation fails', async () => {
    await add({ name: '', unit: 'box', quantity: 1 });
    expect((await request(app).get('/api/items')).body).toEqual([]);
  });
});

describe('GET /api/items', () => {
  it('returns an empty array for an empty list', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns Items ordered by id', async () => {
    const a = (await add({ ...milk, name: 'A' })).body;
    const b = (await add({ ...milk, name: 'B' })).body;
    const c = (await add({ ...milk, name: 'C' })).body;
    const res = await request(app).get('/api/items');
    expect(res.body.map((item) => item.id)).toEqual([a.id, b.id, c.id]);
  });
});

describe('PUT /api/items/:id', () => {
  const edit = (id, body) => request(app).put(`/api/items/${id}`).send(body);
  const updated = { name: 'Oat milk', unit: 'bottles', quantity: 3 };

  it('returns 200 with the full updated Item and stores it', async () => {
    const created = (await add(milk)).body;
    const res = await edit(created.id, updated);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: created.id, ...updated });
    const list = (await request(app).get('/api/items')).body;
    expect(list).toEqual([res.body]);
  });

  it('trims the name and leaves other Items alone', async () => {
    const a = (await add({ ...milk, name: 'A' })).body;
    const b = (await add({ ...milk, name: 'B' })).body;
    const res = await edit(a.id, { ...updated, name: '  Tea  ' });
    expect(res.body.name).toBe('Tea');
    const list = (await request(app).get('/api/items')).body;
    expect(list.find((item) => item.id === b.id)).toEqual(b);
  });

  it.each([
    ['missing name', { unit: 'box', quantity: 1 }, 'invalid_name'],
    ['blank name', { name: '   ', unit: 'box', quantity: 1 }, 'invalid_name'],
    ['101-character name', { name: 'a'.repeat(101), unit: 'box', quantity: 1 }, 'invalid_name'],
    ['zero quantity', { name: 'Milk', unit: 'box', quantity: 0 }, 'invalid_quantity'],
    ['decimal quantity', { name: 'Milk', unit: 'box', quantity: 1.5 }, 'invalid_quantity'],
    ['string quantity', { name: 'Milk', unit: 'box', quantity: '2' }, 'invalid_quantity'],
    ['too large quantity', { name: 'Milk', unit: 'box', quantity: 3000000000 }, 'invalid_quantity'],
    ['unknown unit', { name: 'Milk', unit: 'gallons', quantity: 1 }, 'invalid_unit'],
    ['missing unit', { name: 'Milk', quantity: 1 }, 'invalid_unit'],
  ])('rejects %s with %s and changes nothing', async (label, body, code) => {
    const created = (await add(milk)).body;
    const res = await edit(created.id, body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(code);
    expect((await request(app).get('/api/items')).body).toEqual([created]);
  });

  it('returns 404 not_found for an unknown id', async () => {
    const res = await edit(999999, updated);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('not_found');
  });

  it('returns 404 not_found for a very large id', async () => {
    const res = await edit('99999999999999', updated);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('not_found');
  });

  it.each(['abc', '0', '-1', '1.5', '1abc'])('returns 400 invalid_id for %s', async (id) => {
    const res = await edit(id, updated);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_id');
  });
});

describe('DELETE /api/items/:id', () => {
  it('returns 204 and removes only that Item', async () => {
    const a = (await add({ ...milk, name: 'A' })).body;
    const b = (await add({ ...milk, name: 'B' })).body;
    const res = await request(app).delete(`/api/items/${a.id}`);
    expect(res.status).toBe(204);
    const list = (await request(app).get('/api/items')).body;
    expect(list.map((item) => item.id)).toEqual([b.id]);
  });

  it('returns 404 not_found for an unknown id', async () => {
    const res = await request(app).delete('/api/items/999999');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('not_found');
  });

  it('returns 404 not_found for a very large id', async () => {
    const res = await request(app).delete('/api/items/99999999999999');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('not_found');
  });

  it.each(['abc', '0', '-1', '1.5', '1abc'])('returns 400 invalid_id for %s', async (id) => {
    const res = await request(app).delete(`/api/items/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_id');
  });
});

describe('DELETE /api/items', () => {
  it('returns 204 and clears the list', async () => {
    await add(milk);
    await add(milk);
    const res = await request(app).delete('/api/items');
    expect(res.status).toBe(204);
    expect((await request(app).get('/api/items')).body).toEqual([]);
  });

  it('returns 204 on an already empty list', async () => {
    expect((await request(app).delete('/api/items')).status).toBe(204);
  });
});
