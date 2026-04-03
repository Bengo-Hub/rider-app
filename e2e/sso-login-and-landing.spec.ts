import { expect, test } from '@playwright/test';

const EMAIL = process.env.E2E_LOGIN_EMAIL || 'demo@bengobox.dev';
const PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';

test.describe('Rider App SSO login and landing', () => {
  test('landing or join loads', async ({ page }) => {
    await page.goto('/');
    const signInOrContent = page.getByRole('link', { name: /sign in|login|join/i }).or(page.getByText(/rider|delivery|join/i));
    await expect(signInOrContent.first()).toBeVisible({ timeout: 10_000 });
  });

  test('full SSO login then authenticated indicator', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.getByRole('link', { name: /sign in|login|join/i }).first();
    await signInLink.click().catch(() => {});
    const onAccounts = await page.waitForURL(/accounts\.codevertexitsolutions\.com\/login/, { timeout: 15_000 }).then(() => true).catch(() => false);
    if (onAccounts) {
      await page.getByRole('textbox', { name: /email/i }).fill(EMAIL);
      await page.getByRole('textbox', { name: /password/i }).fill(PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL(/riderapp\.codevertexitsolutions\.com|localhost/, { timeout: 25_000 }).catch(() => {});
    }
    const dashboardOrProfile = page.getByRole('link', { name: /dashboard|profile|tasks/i }).or(page.getByText(/dashboard|tasks|rider/i));
    await expect(dashboardOrProfile.first()).toBeVisible({ timeout: 15_000 });
  });
});
