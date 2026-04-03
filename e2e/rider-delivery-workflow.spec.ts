import { expect, test, type Page, type Request } from '@playwright/test';

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------
const BASE_URL = process.env.BASE_URL || 'https://riderapp.codevertexitsolutions.com';
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'urban-loft';
const EMAIL = process.env.E2E_LOGIN_EMAIL || 'titusowuor30@gmail.com';
const PASSWORD = process.env.E2E_LOGIN_PASSWORD; // no default — must be supplied

// ---------------------------------------------------------------------------
// Inline NetworkLogger — records API calls and reports failures
// ---------------------------------------------------------------------------
interface NetworkEntry {
  method: string;
  url: string;
  status: number;
  timing: number;
}

class NetworkLogger {
  private entries: NetworkEntry[] = [];
  private pending = new Map<string, { method: string; url: string; start: number }>();

  attach(page: Page) {
    page.on('request', (req: Request) => {
      const url = req.url();
      // Only track API / XHR calls (skip static assets, images, fonts)
      if (this.isApiCall(url)) {
        this.pending.set(url + req.method(), {
          method: req.method(),
          url,
          start: Date.now(),
        });
      }
    });

    page.on('response', (res) => {
      const key = res.url() + res.request().method();
      const pendingReq = this.pending.get(key);
      if (pendingReq) {
        this.entries.push({
          method: pendingReq.method,
          url: pendingReq.url,
          status: res.status(),
          timing: Date.now() - pendingReq.start,
        });
        this.pending.delete(key);
      }
    });
  }

  /** Returns entries with 4xx / 5xx status codes */
  getErrors(): NetworkEntry[] {
    return this.entries.filter((e) => e.status >= 400);
  }

  /** Returns all recorded entries */
  getAll(): NetworkEntry[] {
    return [...this.entries];
  }

  /** Pretty-print errors for test output */
  formatErrors(): string {
    const errs = this.getErrors();
    if (errs.length === 0) return 'No API errors detected.';
    return errs
      .map((e) => `[${e.status}] ${e.method} ${e.url} (${e.timing}ms)`)
      .join('\n');
  }

  reset() {
    this.entries = [];
    this.pending.clear();
  }

  private isApiCall(url: string): boolean {
    // Track calls to our APIs and SSO, skip static assets
    if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico|webp|avif)(\?|$)/i.test(url)) {
      return false;
    }
    if (url.includes('/api/') || url.includes('/v1/') || url.includes('/auth/')) {
      return true;
    }
    if (url.includes('accounts.codevertexitsolutions.com')) {
      return true;
    }
    // Next.js RSC / data fetches
    if (url.includes('_next/data') || url.includes('_rsc')) {
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helper: SSO login flow — reusable across tests
// ---------------------------------------------------------------------------
async function ssoLogin(page: Page) {
  if (!PASSWORD) {
    throw new Error('E2E_LOGIN_PASSWORD env var is required');
  }

  await page.goto('/');

  // The rider-app landing may show a "Sign In" / "Login" / "Join" link
  const signInLink = page
    .getByRole('link', { name: /sign in|login|join/i })
    .first();
  await signInLink.click().catch(() => {
    // If no explicit link, the app may auto-redirect to SSO
  });

  // Wait for redirect to accounts SSO
  const onAccounts = await page
    .waitForURL(/accounts\.codevertexitsolutions\.com\/login/, {
      timeout: 15_000,
    })
    .then(() => true)
    .catch(() => false);

  if (onAccounts) {
    await page.getByRole('textbox', { name: /email/i }).fill(EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect back to rider app
    await page
      .waitForURL(/riderapp\.codevertexitsolutions\.com|localhost/, {
        timeout: 25_000,
      })
      .catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test.describe('Rider delivery workflow', () => {
  let networkLogger: NetworkLogger;

  test.beforeEach(async ({ page }) => {
    networkLogger = new NetworkLogger();
    networkLogger.attach(page);
  });

  // -----------------------------------------------------------------------
  // 1. SSO login as rider
  // -----------------------------------------------------------------------
  test('SSO login as rider and redirect to dashboard', async ({ page }) => {
    await ssoLogin(page);

    // After login we should land on the org-scoped dashboard
    const dashboardIndicator = page
      .getByText(/today.*summary|deliveries|available work|dashboard/i)
      .or(page.getByRole('link', { name: /deliveries|queue|earnings/i }))
      .first();

    await expect(dashboardIndicator).toBeVisible({ timeout: 15_000 });

    // URL should contain the org slug
    expect(page.url()).toContain(ORG_SLUG);
  });

  // -----------------------------------------------------------------------
  // 2. Dashboard loads correctly
  // -----------------------------------------------------------------------
  test('dashboard shows rider summary and navigation', async ({ page }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Should show "Today's Summary" or delivery count
    const summaryCard = page.getByText(/today.*summary/i).or(
      page.getByText(/deliveries/i).first(),
    );
    await expect(summaryCard).toBeVisible({ timeout: 10_000 });

    // Quick action cards should be visible — Queue and Earnings
    const queueLink = page.getByText(/queue/i);
    const earningsLink = page.getByText(/earnings/i);
    await expect(queueLink.or(earningsLink).first()).toBeVisible({
      timeout: 10_000,
    });

    // Available work section or empty state
    const availableWork = page
      .getByText(/available work/i)
      .or(page.getByText(/no deliveries available/i));
    await expect(availableWork.first()).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 3. Active delivery view
  // -----------------------------------------------------------------------
  test('active delivery page loads or shows empty state', async ({ page }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}/active`);
    await page.waitForLoadState('networkidle');

    // The page header should say "Active Delivery"
    const header = page.getByRole('heading', { name: /active delivery/i });
    await expect(header).toBeVisible({ timeout: 10_000 });

    // Either an active delivery view OR the empty state
    const content = page
      .getByText(/no active delivery/i)
      .or(page.getByText(/pickup|dropoff|en route/i).first());
    await expect(content.first()).toBeVisible({ timeout: 10_000 });

    // If empty state, verify CTA to delivery queue
    const emptyState = page.getByText(/no active delivery/i);
    if (await emptyState.isVisible().catch(() => false)) {
      const ctaLink = page.getByRole('link', {
        name: /view delivery queue/i,
      });
      await expect(ctaLink).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 4. Delivery history
  // -----------------------------------------------------------------------
  test('delivery history page loads with tabs', async ({ page }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}/deliveries`);
    await page.waitForLoadState('networkidle');

    // Header should say "Deliveries"
    const header = page.getByRole('heading', { name: /deliveries/i });
    await expect(header).toBeVisible({ timeout: 10_000 });

    // Filter tabs should be present: All, Available, My Tasks
    const allTab = page.getByRole('button', { name: /^all$/i });
    const availableTab = page.getByRole('button', { name: /available/i });
    const myTasksTab = page.getByRole('button', { name: /my tasks/i });

    await expect(allTab).toBeVisible({ timeout: 5_000 });
    await expect(availableTab).toBeVisible();
    await expect(myTasksTab).toBeVisible();

    // Content: either delivery cards or empty state
    const content = page
      .getByText(/no deliveries/i)
      .or(page.locator('[class*="delivery-card"], [class*="DeliveryCard"]'))
      .or(page.getByText(/showing \d+ of \d+/i))
      .or(page.getByText(/new delivery tasks|no available deliveries|no assigned tasks/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });

    // Verify tabs are clickable — switch to "Available"
    await availableTab.click();
    await page.waitForTimeout(1_000);

    const updatedContent = page
      .getByText(/no available deliveries/i)
      .or(page.getByText(/delivery|customer/i).first());
    await expect(updatedContent.first()).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 5. Earnings page
  // -----------------------------------------------------------------------
  test('earnings page loads with period tabs and summary', async ({
    page,
  }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}/earnings`);
    await page.waitForLoadState('networkidle');

    // Header
    const header = page.getByRole('heading', { name: /earnings/i });
    await expect(header).toBeVisible({ timeout: 10_000 });

    // Period tabs: Today, This Week, This Month
    const todayTab = page.getByRole('button', { name: /today/i });
    const weekTab = page.getByRole('button', { name: /this week/i });
    const monthTab = page.getByRole('button', { name: /this month/i });

    await expect(todayTab).toBeVisible({ timeout: 5_000 });
    await expect(weekTab).toBeVisible();
    await expect(monthTab).toBeVisible();

    // Summary card with delivery count
    const summaryCard = page
      .getByText(/deliveries/i)
      .or(page.getByText(/completed deliveries/i));
    await expect(summaryCard.first()).toBeVisible({ timeout: 10_000 });

    // Recent completed section or empty state
    const recentSection = page
      .getByText(/recent completed/i)
      .or(
        page.getByText(/no completed deliveries yet/i),
      );
    await expect(recentSection.first()).toBeVisible({ timeout: 10_000 });

    // Switch to "This Week" tab
    await weekTab.click();
    await page.waitForTimeout(500);
    // Summary should update to "This Week's Deliveries"
    const weekSummary = page.getByText(/this week.*deliveries/i);
    await expect(weekSummary).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // 6. Profile / KYC page
  // -----------------------------------------------------------------------
  test('profile page loads with KYC form fields', async ({ page }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}/profile`);
    await page.waitForLoadState('networkidle');

    // Header
    const header = page.getByRole('heading', { name: /complete profile/i });
    await expect(header).toBeVisible({ timeout: 10_000 });

    // Contact info section
    const contactSection = page.getByText(/contact information/i);
    await expect(contactSection).toBeVisible({ timeout: 5_000 });

    // Phone field
    const phoneInput = page.getByLabel(/phone number/i);
    await expect(phoneInput).toBeVisible();

    // ID / Passport number field
    const idInput = page.getByLabel(/national id.*passport number/i);
    await expect(idInput).toBeVisible();

    // Vehicle details section
    const vehicleSection = page.getByText(/vehicle details/i);
    await expect(vehicleSection).toBeVisible();

    // Vehicle type buttons
    const motorbike = page.getByRole('button', { name: /motorbike/i });
    const car = page.getByRole('button', { name: /^car$/i });
    await expect(motorbike).toBeVisible();
    await expect(car).toBeVisible();

    // License plate & license number inputs
    const licensePlate = page.getByLabel(/license plate/i);
    const licenseNo = page.getByLabel(/driving license number/i);
    await expect(licensePlate).toBeVisible();
    await expect(licenseNo).toBeVisible();

    // KYC image upload areas (ID/Passport Copy, Rider Photo, Vehicle plates, Side view)
    const idUpload = page.getByText(/id.*passport copy/i);
    const riderPhoto = page.getByText(/rider passport photo/i);
    const vehiclePlate = page.getByText(/vehicle.*license plate/i);
    const sideView = page.getByText(/vehicle.*side view/i);

    await expect(idUpload).toBeVisible();
    await expect(riderPhoto).toBeVisible();
    await expect(vehiclePlate).toBeVisible();
    await expect(sideView).toBeVisible();

    // Save button
    const saveBtn = page.getByRole('button', { name: /save profile/i });
    await expect(saveBtn).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 7. Pending review banner
  // -----------------------------------------------------------------------
  test('pending review banner shows for pending riders and is dismissible', async ({
    page,
  }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}`);
    await page.waitForLoadState('networkidle');

    // The PendingReviewBanner shows "Application under review" text
    const banner = page.getByText(/application under review/i);
    const isBannerVisible = await banner
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (isBannerVisible) {
      // Banner contains KYC info
      await expect(
        page.getByText(/kyc documents.*reviewed/i),
      ).toBeVisible();

      // Dismiss button should work
      const dismissBtn = page.getByRole('button', { name: /dismiss/i });
      await expect(dismissBtn).toBeVisible();
      await dismissBtn.click();

      // Banner should disappear after dismiss
      await expect(banner).not.toBeVisible({ timeout: 3_000 });

      // Reload — banner should stay dismissed (sessionStorage)
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(banner).not.toBeVisible({ timeout: 5_000 });
    } else {
      // Rider is not in pending_review state — this is non-blocking
      // eslint-disable-next-line no-console
      console.log(
        'Rider is not in pending_review status — PendingReviewBanner test skipped (non-blocking).',
      );
    }
  });

  // -----------------------------------------------------------------------
  // 8. Settings page
  // -----------------------------------------------------------------------
  test('settings page loads with profile and menu items', async ({ page }) => {
    await ssoLogin(page);
    await page.goto(`/${ORG_SLUG}/settings`);
    await page.waitForLoadState('networkidle');

    // Header
    const header = page.getByRole('heading', { name: /settings/i });
    await expect(header).toBeVisible({ timeout: 10_000 });

    // Profile card with user info
    const profileCard = page
      .getByText(/rider/i)
      .or(page.getByText(new RegExp(EMAIL.split('@')[0], 'i')))
      .first();
    await expect(profileCard).toBeVisible({ timeout: 5_000 });

    // Status badge — Active or Pending
    const statusBadge = page
      .getByText(/^active$/i)
      .or(page.getByText(/^pending$/i));
    await expect(statusBadge.first()).toBeVisible({ timeout: 5_000 });

    // Menu items
    const editProfile = page.getByText(/edit profile/i);
    const notifications = page.getByText(/notifications/i);
    const privacy = page.getByText(/privacy.*security/i);
    const help = page.getByText(/help.*support/i);

    await expect(editProfile).toBeVisible();
    await expect(notifications).toBeVisible();
    await expect(privacy).toBeVisible();
    await expect(help).toBeVisible();

    // Sign out button
    const signOutBtn = page.getByRole('button', { name: /sign out/i });
    await expect(signOutBtn).toBeVisible();

    // App version info
    const versionInfo = page.getByText(/rider app.*v\d+\.\d+\.\d+/i);
    await expect(versionInfo).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 9. Network monitoring — report any 4xx/5xx errors across the full flow
  // -----------------------------------------------------------------------
  test('no critical API errors during full navigation flow', async ({
    page,
  }) => {
    const flowLogger = new NetworkLogger();
    flowLogger.attach(page);

    await ssoLogin(page);

    // Navigate through all major pages
    const routes = [
      `/${ORG_SLUG}`,
      `/${ORG_SLUG}/deliveries`,
      `/${ORG_SLUG}/active`,
      `/${ORG_SLUG}/earnings`,
      `/${ORG_SLUG}/profile`,
      `/${ORG_SLUG}/settings`,
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      // Small pause to catch async API calls
      await page.waitForTimeout(1_500);
    }

    const errors = flowLogger.getErrors();
    const allRequests = flowLogger.getAll();

    // Log summary for reporting regardless of pass/fail
    // eslint-disable-next-line no-console
    console.log(`\n--- Network Summary ---`);
    // eslint-disable-next-line no-console
    console.log(`Total API requests tracked: ${allRequests.length}`);
    // eslint-disable-next-line no-console
    console.log(`Errors (4xx/5xx): ${errors.length}`);

    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`\nError details:\n${flowLogger.formatErrors()}`);
    }

    // Filter out expected 401s (may happen before auth token is set)
    const criticalErrors = errors.filter((e) => {
      // 401 on initial page loads before auth is established is expected
      if (e.status === 401) return false;
      // 404 on optional endpoints (e.g. brand config) is non-critical
      if (e.status === 404 && e.url.includes('/brand')) return false;
      return true;
    });

    expect(
      criticalErrors,
      `Critical API errors detected:\n${criticalErrors
        .map((e) => `[${e.status}] ${e.method} ${e.url}`)
        .join('\n')}`,
    ).toHaveLength(0);
  });
});
