import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/**
 * These tests hit the real containerized stack (Angular dev server -> Spring Boot
 * wrapper -> live OpenFGA), not a mocked API — infra:ensure/authorization-wrapper are
 * brought up by the Playwright webServer config (see playwright.config.mts).
 */

// The preset buttons themselves are labeled "... (ALLOW)"/"(DENY)", so a bare
// getByText('ALLOW') is ambiguous — scope to the decision result panel specifically.
function decision(page: Page): Locator {
  return page.locator('article.result strong');
}

async function expectLiveOpenFga(request: APIRequestContext): Promise<void> {
  await expect
    .poll(
      async () => {
        const response = await request.get('/api/access/diagnostics');
        if (!response.ok()) return `HTTP ${response.status()}`;
        const diagnostics = await response.json() as { live?: boolean; storeId?: string | null; modelId?: string | null };
        if (!diagnostics.live) return 'demo';
        if (!diagnostics.storeId || !diagnostics.modelId) return 'missing ids';
        return 'live';
      },
      {
        message: 'authorization E2E requires the wrapper to be live against a bootstrapped OpenFGA store/model',
        timeout: 30_000,
      }
    )
    .toBe('live');
}

test.describe('Authorization API readiness', () => {
  // eslint-disable-next-line playwright/expect-expect -- expectLiveOpenFga wraps expect.poll with a clearer failure message.
  test('has a live OpenFGA-backed API before UI checks run', async ({ request }) => {
    await expectLiveOpenFga(request);
  });
});

test.describe('Authorization lab — golden paths', () => {
  test.beforeEach(async ({ page, request }) => {
    await expectLiveOpenFga(request);
    await page.goto('/authorization');
    await expect(page.getByRole('heading', { name: 'Authorization lab' })).toBeVisible();
    await expect(page.getByText('LIVE — talking to OpenFGA')).toBeVisible({ timeout: 15_000 });
  });

  test('reports a live connection to OpenFGA', async ({ page }) => {
    await expect(page.getByText('LIVE — talking to OpenFGA')).toBeVisible({ timeout: 15_000 });
  });

  test('alice owns project:orion — allowed', async ({ page }) => {
    await page.getByRole('button', { name: /alice owns orion/i }).click();
    await expect(decision(page)).toHaveText('ALLOW');
    await expect(page.getByText('OpenFGA found a valid relationship path.')).toBeVisible();
  });

  test('bob cannot edit project:orion — denied', async ({ page }) => {
    await page.getByRole('button', { name: /bob cannot edit orion/i }).click();
    await expect(decision(page)).toHaveText('DENY');
    await expect(page.getByText('OpenFGA found no relationship path granting this relation.')).toBeVisible();
  });

  test('carol inherits admin edit rights on project:orion via org membership — allowed', async ({ page }) => {
    await page.getByRole('button', { name: /carol inherits admin edit rights/i }).click();
    await expect(decision(page)).toHaveText('ALLOW');
  });

  test('bob inherits view access on the child document via the parent project — allowed', async ({ page }) => {
    await page.getByRole('button', { name: /bob inherits view via parent project/i }).click();
    await expect(decision(page)).toHaveText('ALLOW');
  });

  test('dave is an unseeded stranger — denied', async ({ page }) => {
    await page.getByRole('button', { name: /dave is a stranger/i }).click();
    await expect(decision(page)).toHaveText('DENY');
  });

  test('carol has zero direct tuple on project:orion yet passes can_edit via graph inheritance', async ({ page }) => {
    await page.getByRole('button', { name: "Check carol's edit access to project:orion" }).click();
    await expect(decision(page)).toHaveText('ALLOW');
  });
});

test.describe('Authorization lab — negative space', () => {
  test.beforeEach(async ({ page, request }) => {
    await expectLiveOpenFga(request);
    await page.goto('/authorization');
    await expect(page.getByRole('heading', { name: 'Authorization lab' })).toBeVisible();
    await expect(page.getByText('LIVE — talking to OpenFGA')).toBeVisible({ timeout: 15_000 });
  });

  test('a malformed object string is handled gracefully (denied, not a crash)', async ({ page }) => {
    await page.getByLabel('User').fill('user:alice');
    await page.getByLabel('Object').fill('not-a-real-object-id-###');
    await page.getByRole('button', { name: 'Run OpenFGA check' }).click();

    await expect(decision(page)).toHaveText('DENY');
    await expect(page.locator('.error')).toHaveCount(0);
  });

  test('a cross-organization user is denied access to a project they are not related to', async ({ page }) => {
    await page.getByLabel('User').fill('user:zara');
    await page.locator('select[name="relation"]').selectOption('can_view');
    await page.getByLabel('Object').fill('project:orion');
    await page.getByRole('button', { name: 'Run OpenFGA check' }).click();

    await expect(decision(page)).toHaveText('DENY');
  });
});
