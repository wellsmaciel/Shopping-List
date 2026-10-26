const { test, expect } = require('./fixtures');

test('opens the app and shows the heading and the add form', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Shopping List App' })).toBeVisible();
  await expect(page.getByLabel('Item:')).toBeVisible();
  await expect(page.getByLabel('Unit:')).toBeVisible();
  await expect(page.getByLabel('Quantity:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to My List' })).toBeVisible();
});
