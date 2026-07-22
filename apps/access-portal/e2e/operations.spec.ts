import { test, expect } from '@playwright/test';

test.describe('Operations dashboard', () => {
  test('loads and displays live telemetry', async ({ page }) => {
    await page.goto('/operations');

    await expect(page.getByRole('heading', { name: 'Mission operations' })).toBeVisible();
    await expect(page.getByText('Streaming telemetry')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Requests / minute')).toBeVisible();
    await expect(page.getByText('Availability')).toBeVisible();
  });

  test('the root path redirects to the operations dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/operations$/);
  });
});
