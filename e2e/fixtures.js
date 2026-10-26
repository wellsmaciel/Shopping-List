const base = require('@playwright/test');

// Every test starts from an empty Shopping List: the auto fixture clears it
// through the public API (DELETE /api/items) before the test runs.
const test = base.test.extend({
  emptyList: [
    async ({ request }, use) => {
      const res = await request.delete('/api/items');
      base.expect(res.ok()).toBeTruthy();
      await use();
    },
    { auto: true },
  ],
});

module.exports = { test, expect: base.expect };
