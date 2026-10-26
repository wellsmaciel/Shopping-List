import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import pkg from '../package.json';

describe('GET /api/version', () => {
  it('returns the package version', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ version: pkg.version });
    expect(res.body.version).toBe('0.5.0');
  });
});

describe('JSON error handler', () => {
  it('returns 404 not_found for an unknown /api route', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('not_found');
    expect(typeof res.body.error).toBe('string');
  });

  it('returns 400 invalid_json for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_json');
    expect(typeof res.body.error).toBe('string');
  });
});

describe('static frontend', () => {
  it('serves index.html at /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
  });
});
