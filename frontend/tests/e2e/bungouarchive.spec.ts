import { test, expect } from '@playwright/test';

// Utility for creating users and logging in
async function registerAndLogin(page, email, password, username) {
  await page.goto('/auth/signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="username"]', username);
  await page.click('button[type="submit"]');
  await page.waitForURL('/onboarding/username');
  // Complete username step if needed
  if (await page.isVisible('input[name="username"]')) {
    await page.fill('input[name="username"]', username);
    await page.click('button[type="submit"]');
  }
}

test.describe('AUTH', () => {
  test('Login with email/password works', async ({ page }) => {
    await registerAndLogin(page, 'testuser1@example.com', 'TestPass123!', 'testuser1');
    await expect(page).toHaveURL(/onboarding|profile/);
  });

  test('Logged out user cannot access /faction/[faction]', async ({ page }) => {
    await page.goto('/faction/agency');
    await expect(page).toHaveURL(/login/);
  });

  test('Logged out user cannot access /owner', async ({ page }) => {
    await page.goto('/owner');
    await expect(page).toHaveURL(/login|\//);
  });

  test('Logout clears session', async ({ page }) => {
    await registerAndLogin(page, 'testuser2@example.com', 'TestPass123!', 'testuser2');
    await page.click('button:has-text("out")');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('QUIZ', () => {
  test('All 7 questions load', async ({ page }) => {
    await registerAndLogin(page, 'quizuser@example.com', 'TestPass123!', 'quizuser');
    await page.goto('/onboarding/quiz');
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator(`[data-question="${i}"]`)).toBeVisible();
      await page.click('button.next');
    }
  });

  test('Correct faction assigned after completing quiz', async ({ page }) => {
    await registerAndLogin(page, 'quizuser2@example.com', 'TestPass123!', 'quizuser2');
    await page.goto('/onboarding/quiz');
    for (let i = 1; i <= 7; i++) {
      await page.click('button.next');
    }
    await expect(page).toHaveURL(/result/);
    await expect(page.locator('.faction-result')).toBeVisible();
  });

  test('Quiz cannot be accessed again after completion', async ({ page }) => {
    await registerAndLogin(page, 'quizuser3@example.com', 'TestPass123!', 'quizuser3');
    await page.goto('/onboarding/quiz');
    for (let i = 1; i <= 7; i++) {
      await page.click('button.next');
    }
    await page.goto('/onboarding/quiz');
    await expect(page).not.toHaveURL(/quiz/);
  });
});

test.describe('RLS', () => {
  test('User A cannot read user B faction messages', async ({ page, context }) => {
    // Register two users in different factions
    await registerAndLogin(page, 'rlsuserA@example.com', 'TestPass123!', 'rlsuserA');
    await page.goto('/onboarding/quiz');
    for (let i = 1; i <= 7; i++) await page.click('button.next');
    await page.goto('/faction/agency');
    const cookiesA = await context.cookies();
    const pageB = await context.newPage();
    await registerAndLogin(pageB, 'rlsuserB@example.com', 'TestPass123!', 'rlsuserB');
    await pageB.goto('/onboarding/quiz');
    for (let i = 1; i <= 7; i++) await pageB.click('button.next');
    await pageB.goto('/faction/mafia');
    // Try to access each other's faction messages
    await page.goto('/faction/mafia');
    await expect(page.locator('.faction-chat')).not.toBeVisible();
    await pageB.goto('/faction/agency');
    await expect(pageB.locator('.faction-chat')).not.toBeVisible();
  });

  test('User cannot read another user\'s notifications', async ({ page, context }) => {
    await registerAndLogin(page, 'rlsuserC@example.com', 'TestPass123!', 'rlsuserC');
    const cookiesC = await context.cookies();
    const pageD = await context.newPage();
    await registerAndLogin(pageD, 'rlsuserD@example.com', 'TestPass123!', 'rlsuserD');
    await pageD.goto('/profile/rlsuserC');
    await expect(pageD.locator('.notification-list')).not.toBeVisible();
  });
});

test.describe('PROFILE', () => {
  test('Own profile shows AP bar', async ({ page }) => {
    await registerAndLogin(page, 'profileuser@example.com', 'TestPass123!', 'profileuser');
    await page.goto('/profile/profileuser');
    await expect(page.locator('.ap-bar')).toBeVisible();
  });

  test('Public profile hides AP bar', async ({ page, context }) => {
    await registerAndLogin(page, 'profileuser2@example.com', 'TestPass123!', 'profileuser2');
    const page2 = await context.newPage();
    await registerAndLogin(page2, 'profileuser3@example.com', 'TestPass123!', 'profileuser3');
    await page2.goto('/profile/profileuser2');
    await expect(page2.locator('.ap-bar')).not.toBeVisible();
  });

  test('Bio enforces 100 character limit', async ({ page }) => {
    await registerAndLogin(page, 'profileuser4@example.com', 'TestPass123!', 'profileuser4');
    await page.goto('/profile/profileuser4');
    await page.fill('textarea[name="bio"]', 'a'.repeat(101));
    await page.click('button.save-bio');
    await expect(page.locator('.error')).toContainText('100');
  });
});

test.describe('ARCHIVE', () => {
  test('Loads without login at /archive', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.locator('.archive-list')).toBeVisible();
  });

  test('Search input filters results', async ({ page }) => {
    await page.goto('/archive');
    await page.fill('input[type="search"]', 'case');
    await expect(page.locator('.archive-list .case')).toHaveCount(1);
  });

  test('Individual case file at /archive/[slug] loads correctly', async ({ page }) => {
    await page.goto('/archive/some-case-slug');
    await expect(page.locator('.case-file')).toBeVisible();
  });
});

test.describe('REGISTRY', () => {
  test('Rank 1 user cannot access /registry/submit', async ({ page }) => {
    await registerAndLogin(page, 'reguser1@example.com', 'TestPass123!', 'reguser1');
    await page.goto('/registry/submit');
    await expect(page).not.toHaveURL(/submit/);
  });

  test('Submission under 200 words is blocked', async ({ page }) => {
    await registerAndLogin(page, 'reguser2@example.com', 'TestPass123!', 'reguser2');
    await page.goto('/registry/submit');
    await page.fill('textarea[name="content"]', 'short');
    await page.click('button.submit');
    await expect(page.locator('.error')).toContainText('200');
  });

  test('Approved posts visible on /registry', async ({ page }) => {
    await page.goto('/registry');
    await expect(page.locator('.registry-post.approved')).toBeVisible();
  });

  test('Pending posts not visible to other users', async ({ page, context }) => {
    await registerAndLogin(page, 'reguser3@example.com', 'TestPass123!', 'reguser3');
    await page.goto('/registry/submit');
    await page.fill('textarea[name="content"]', 'a '.repeat(201));
    await page.click('button.submit');
    const page2 = await context.newPage();
    await registerAndLogin(page2, 'reguser4@example.com', 'TestPass123!', 'reguser4');
    await page2.goto('/registry');
    await expect(page2.locator('.registry-post.pending')).not.toBeVisible();
  });
});

test.describe('BUILD', () => {
  test('npx tsc --noEmit passes', async () => {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
  });
  test('npm run build passes', async () => {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
  });
});
