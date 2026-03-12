import { test, expect } from '@playwright/test';

test('unauthenticated user is redirected from /faction/agency', async ({ page }) => {
  await page.goto('/faction/agency');
  await expect(page).toHaveURL(/login/);
});
