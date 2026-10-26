const { test, expect } = require('./fixtures');

async function addItem(page, { name, quantity, unit }) {
  await page.getByLabel('Item:').fill(name);
  await page.getByLabel('Quantity:').fill(String(quantity));
  await page.getByLabel('Unit:').selectOption(unit);
  await page.getByRole('button', { name: 'Add to My List' }).click();
}

test('adds an Item: it is listed, shown with its Unit label, and the form clears', async ({ page }) => {
  await page.goto('/');
  await addItem(page, { name: 'Rice', quantity: 2, unit: 'kg' });

  const row = page.getByRole('listitem').filter({ hasText: 'Rice' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('2 - Kg');
  await expect(page.getByTestId('message')).toHaveText('Item added.');
  await expect(page.getByLabel('Item:')).toHaveValue('');
  await expect(page.getByLabel('Quantity:')).toHaveValue('');
});

test('offers every Unit from the server in the select', async ({ page, request }) => {
  const units = await (await request.get('/api/units')).json();
  await page.goto('/');
  await expect(page.getByLabel('Unit:').locator('option')).toHaveCount(units.length);
});

test('an invalid add shows an in-page error and lists nothing', async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Unexpected dialog: ${dialog.message()}`);
  });
  await page.goto('/');
  await addItem(page, { name: '   ', quantity: 1, unit: 'box' });

  await expect(page.getByTestId('message')).toHaveText('Enter an item name of 1 to 100 characters.');
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('shows a network error message when the server cannot be reached', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/items', (route) => route.abort());
  await addItem(page, { name: 'Milk', quantity: 1, unit: 'liters' });

  await expect(page.getByTestId('message')).toHaveText('Could not reach the server. Please check your connection.');
});

test('deletes a single Item immediately', async ({ page, request }) => {
  await request.post('/api/items', { data: { name: 'Milk', unit: 'liters', quantity: 2 } });
  await request.post('/api/items', { data: { name: 'Bread', unit: 'pack', quantity: 1 } });
  await page.goto('/');

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Milk' })
    .getByRole('button', { name: 'Delete', exact: true })
    .click();

  await expect(page.getByRole('listitem').filter({ hasText: 'Milk' })).toHaveCount(0);
  await expect(page.getByRole('listitem').filter({ hasText: 'Bread' })).toBeVisible();
});

test('edits an Item inline and saves it', async ({ page, request }) => {
  await request.post('/api/items', { data: { name: 'Milk', unit: 'liters', quantity: 2 } });
  await page.goto('/');

  const row = page.getByRole('listitem').filter({ hasText: 'Milk' });
  await row.getByRole('button', { name: 'Update', exact: true }).click();

  await expect(page.getByLabel('Item name')).toHaveValue('Milk');
  await expect(page.getByLabel('Quantity', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Unit', { exact: true })).toHaveValue('liters');

  // An invalid save shows the error in the page and keeps the form open.
  await page.getByLabel('Item name').fill('   ');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('message')).toHaveText('Enter an item name of 1 to 100 characters.');
  await expect(page.getByLabel('Item name')).toBeVisible();

  await page.getByLabel('Item name').fill('Oat milk');
  await page.getByLabel('Quantity', { exact: true }).fill('5');
  await page.getByLabel('Unit', { exact: true }).selectOption('bottles');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.getByTestId('message')).toHaveText('Item updated.');
  await expect(page.getByLabel('Item name')).toHaveCount(0);
  await expect(page.getByRole('listitem').filter({ hasText: 'Oat milk' })).toContainText('5 - Bottles');
  await expect(page.getByRole('listitem').filter({ hasText: /^Milk/ })).toHaveCount(0);
});

test('cancelling an edit restores the row unchanged', async ({ page, request }) => {
  await request.post('/api/items', { data: { name: 'Milk', unit: 'liters', quantity: 2 } });
  await page.goto('/');

  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await page.getByLabel('Item name').fill('Changed');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect(page.getByLabel('Item name')).toHaveCount(0);
  const row = page.getByRole('listitem');
  await expect(row).toContainText('Milk');
  await expect(row).toContainText('2 - Liters');
  await expect(row).not.toContainText('Changed');
});

test('Clear List: cancelling keeps the Items, confirming empties the list', async ({ page, request }) => {
  await request.post('/api/items', { data: { name: 'Milk', unit: 'liters', quantity: 2 } });
  await request.post('/api/items', { data: { name: 'Bread', unit: 'pack', quantity: 1 } });
  await page.goto('/');
  await expect(page.getByRole('listitem')).toHaveCount(2);

  await page.getByRole('button', { name: 'Clear List', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('listitem')).toHaveCount(2);

  await page.getByRole('button', { name: 'Clear List', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, clear it', exact: true }).click();
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByTestId('message')).toHaveText('List cleared.');
});

test('messages and Unit labels follow the Interface Language', async ({ page, request }) => {
  await request.post('/api/items', { data: { name: 'Rice', unit: 'kg', quantity: 2 } });
  await page.goto('/');
  await addItem(page, { name: '   ', quantity: 1, unit: 'box' });
  await expect(page.getByTestId('message')).toHaveText('Enter an item name of 1 to 100 characters.');

  await page.getByRole('button', { name: 'Gaeilge' }).click();
  await expect(page.getByTestId('message')).toHaveText('Cuir isteach ainm earra idir 1 agus 100 carachtar.');
  await expect(page.getByRole('listitem').filter({ hasText: 'Rice' })).toContainText('2 - Cileagram');
});
