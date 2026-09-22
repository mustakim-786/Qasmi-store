import { expect, test } from '@playwright/test';

test('SPA deep links serve the storefront shell', async ({ page }) => {
  await page.goto('/search?q=fabric');
  await expect(page).toHaveTitle(/Qasmi General Store/i);
  await expect(page.getByRole('heading', { name: /search/i })).toBeVisible();
});
