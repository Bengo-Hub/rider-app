/**
 * E2E: Rider delivery workflow — sequential, single browser session.
 *
 * Flow: SSO Login → Dashboard → Active → Deliveries → Earnings → Profile → Settings
 * Each test depends on the previous one. Single browser context preserves auth.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ─── Environment (loaded from .env.test) ────────────────────────────
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'urban-loft';
// Rider account — loaded from .env.test (no hardcoded passwords)
const EMAIL = process.env.E2E_LOGIN_EMAIL || 'titusowuor30@gmail.com';
const PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';

// =====================================================================
// Sequential test suite — single browser, shared state
// =====================================================================
test.describe.serial('Rider delivery workflow', () => {
  let context: BrowserContext;
  let page: Page;
  let apiErrors: { method: string; url: string; status: number }[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // Track API errors across all tests
    page.on('response', (res) => {
      const url = res.url();
      if ((url.includes('/api/') || url.includes('sso.')) && res.status() >= 500) {
        apiErrors.push({ method: res.request().method(), url, status: res.status() });
      }
    });
  });

  test.afterAll(async () => {
    if (apiErrors.length > 0) {
      console.log('5xx API errors during rider tests:');
      apiErrors.forEach((e) => console.log(`  ${e.method} ${e.url} → ${e.status}`));
    }
    await context.close();
  });

  // ─── Step 1: SSO Login ────────────────────────────────────────────
  test('1. SSO login as rider', async () => {
    if (!PASSWORD) {
      test.skip(true, 'E2E_LOGIN_PASSWORD not set in .env.test');
      return;
    }

    // Navigate to org dashboard — ProtectedRoute auto-redirects to SSO
    await page.goto(`/${ORG_SLUG}`);

    // Wait for SSO page
    await page.waitForURL(/accounts\.codevertexitsolutions\.com/, { timeout: 20_000 });

    // Fill login form (wait for the email input to appear)
    const emailInput = page.locator('input[type="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await emailInput.fill(EMAIL);

    const passwordInput = page.locator('input[type="password"], input[id="password"]').first();
    await passwordInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect back to rider app
    await page.waitForURL(/riderapp\.codevertexitsolutions\.com|localhost/, { timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // Confirm we're on the rider app
    expect(page.url()).toContain(ORG_SLUG);
  });

  // ─── Step 2: Dashboard ────────────────────────────────────────────
  test('2. Dashboard loads with content', async () => {
    // Should already be on dashboard after login
    if (!page.url().includes(ORG_SLUG)) {
      await page.goto(`/${ORG_SLUG}`);
    }
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // Verify any dashboard content renders
    const content = page
      .getByText(/today|summary|deliveries|earnings|queue|available|rider|welcome/i)
      .first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  // ─── Step 3: Active Delivery ──────────────────────────────────────
  test('3. Active delivery page loads', async () => {
    await page.goto(`/${ORG_SLUG}/active`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const content = page
      .getByText(/active delivery|no active|delivery/i)
      .or(page.getByRole('heading'));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── Step 4: Delivery History ─────────────────────────────────────
  test('4. Delivery history page loads', async () => {
    await page.goto(`/${ORG_SLUG}/deliveries`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const content = page
      .getByRole('heading', { name: /deliveries|tasks/i })
      .or(page.getByText(/all|available|my tasks|delivery/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── Step 5: Earnings ─────────────────────────────────────────────
  test('5. Earnings page loads', async () => {
    await page.goto(`/${ORG_SLUG}/earnings`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const content = page
      .getByRole('heading', { name: /earnings/i })
      .or(page.getByText(/earnings|today|this week|completed/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── Step 6: Profile/KYC ─────────────────────────────────────────
  test('6. Profile page loads', async () => {
    await page.goto(`/${ORG_SLUG}/profile`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // May show profile form or redirect (approved riders)
    const content = page
      .getByRole('heading', { name: /complete profile|profile|edit/i })
      .or(page.getByText(/contact information|vehicle details|phone/i));
    const hasProfile = await content.first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasProfile) {
      // Verify key sections
      await expect(page.getByText(/contact information/i)).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/vehicle details/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.info().annotations.push({ type: 'info', description: 'Profile page redirected — rider may be approved' });
    }
  });

  // ─── Step 7: Pending Review Banner ────────────────────────────────
  test('7. Pending review banner check', async () => {
    await page.goto(`/${ORG_SLUG}`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const banner = page.getByText(/application under review/i);
    const hasBanner = await banner.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasBanner) {
      // Test dismiss
      const dismissBtn = page.getByRole('button', { name: /dismiss/i });
      if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await dismissBtn.click();
        await expect(banner).not.toBeVisible({ timeout: 3_000 });
      }
    } else {
      console.log('Rider is not in pending_review status — banner test skipped');
    }
  });

  // ─── Step 8: Settings ─────────────────────────────────────────────
  test('8. Settings page loads', async () => {
    await page.goto(`/${ORG_SLUG}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const content = page
      .getByRole('heading', { name: /settings/i })
      .or(page.getByText(/edit profile|notifications|privacy|sign out/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── Step 9: No critical 5xx errors ───────────────────────────────
  test('9. No critical server errors during workflow', async () => {
    expect(
      apiErrors.length,
      `${apiErrors.length} server errors:\n${apiErrors.map((e) => `  ${e.method} ${e.url} → ${e.status}`).join('\n')}`,
    ).toBe(0);
  });
});
