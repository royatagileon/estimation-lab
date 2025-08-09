import { test, expect } from '@playwright/test';

test('home and navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Estimation Lab' })).toBeVisible();
  await page.getByRole('link', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'Join a session' })).toBeVisible();
});


