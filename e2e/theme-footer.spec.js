const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('./fixtures');

const load = (language) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'i18n', `${language}.json`), 'utf8'));
const en = load('en');
const ga = load('ga');

test.describe('theme', () => {
  test('toggling the theme survives a reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.getByRole('button', { name: en['theme.label'] });
    await expect(html).toHaveAttribute('color-mode', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(html).toHaveAttribute('color-mode', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(html).toHaveAttribute('color-mode', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await page.reload();
    await expect(html).toHaveAttribute('color-mode', 'light');
  });

  test.describe('with an operating system preference for dark', () => {
    test.use({ colorScheme: 'dark' });

    test('starts dark when no choice is saved', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('color-mode', 'dark');
    });

    test('a saved choice wins over the operating system preference', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: en['theme.label'] }).click();
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('color-mode', 'light');
    });
  });
});

test.describe('footer', () => {
  test('shows the version and the link targets', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('Wells Maciel');
    await expect(footer).toContainText('v0.5');

    const linkedin = footer.getByRole('link', { name: 'LinkedIn' });
    await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/wells-velasquez-maciel/');
    await expect(linkedin).toHaveAttribute('target', '_blank');
    await expect(linkedin).toHaveAttribute('rel', /noopener/);

    const github = footer.getByRole('link', { name: 'GitHub' });
    await expect(github).toHaveAttribute('href', 'https://github.com/wellsmaciel/Shopping-List');
    await expect(github).toHaveAttribute('target', '_blank');
    await expect(github).toHaveAttribute('rel', /noopener/);
  });

  test('switches its text with the Interface Language', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText(en['footer.appName']);
    await expect(footer).toContainText(en['footer.createdBy']);

    await page.getByRole('button', { name: en['lang.switch'] }).click();
    await expect(footer).toContainText(ga['footer.appName']);
    await expect(footer).toContainText(ga['footer.createdBy']);
    await expect(footer).toContainText('Wells Maciel');
    await expect(footer).toContainText('v0.5');
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });
});
