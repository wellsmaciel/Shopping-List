const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('./fixtures');

const load = (language) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'i18n', `${language}.json`), 'utf8'));
const en = load('en');
const ga = load('ga');

async function expectIrish(page) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'ga');
  await expect(page.getByRole('heading', { name: ga['app.heading'] })).toBeVisible();
  await expect(page.getByRole('heading', { name: ga['list.heading'] })).toBeVisible();
  await expect(page.getByLabel(ga['form.item'])).toBeVisible();
  await expect(page.getByLabel(ga['form.quantity'])).toBeVisible();
  await expect(page.getByRole('button', { name: ga['button.add'] })).toBeVisible();
  await expect(page.getByRole('button', { name: ga['button.clear'] })).toBeVisible();
  await expect(page.getByRole('button', { name: ga['button.update'] })).toBeVisible();
  await expect(page.getByRole('button', { name: ga['button.delete'] })).toBeVisible();
  await expect(page.getByRole('button', { name: ga['lang.switch'] })).toBeVisible();
  await expect(page).toHaveTitle(ga['page.title']);
}

test('switches the interface to Irish, keeps Item names, survives reload, and switches back', async ({
  page,
  request,
}) => {
  const res = await request.post('/api/v2/shopping_list', {
    data: { item_name: 'Milk', quantity: 2, unit_type: 'Liters' },
  });
  expect(res.ok()).toBeTruthy();

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Milk')).toBeVisible();

  await page.getByRole('button', { name: en['lang.switch'] }).click();
  await expectIrish(page);
  await expect(page.getByText('Milk')).toBeVisible();

  await page.reload();
  await expectIrish(page);
  await expect(page.getByText('Milk')).toBeVisible();

  await page.getByRole('button', { name: ga['lang.switch'] }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: en['app.heading'] })).toBeVisible();
  await expect(page.getByRole('button', { name: en['button.add'] })).toBeVisible();
  await expect(page.getByRole('button', { name: en['button.delete'] })).toBeVisible();
});
