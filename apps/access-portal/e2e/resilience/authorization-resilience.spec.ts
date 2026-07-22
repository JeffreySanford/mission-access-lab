import { test, expect, type Locator, type Page } from '@playwright/test';
import { bootstrapOpenFga, ensureInfra, recreateWrapper, startService, stopService } from './infra-control';

/**
 * The deliberately-deferred negative-space cases from docs/next-work.md section 3:
 * OpenFGA container down, a stale/wrong model ID, and a missing JWT once
 * SECURITY_ENABLED=true. Each needs to mutate live infra state (stop a container,
 * force-recreate the wrapper with different env) mid-suite, which is slower and
 * riskier than the golden-path suite — kept in a separate testDir, excluded from the
 * default `access-portal:e2e` target, and run explicitly via
 * `nx run access-portal:e2e-resilience` / `pnpm run e2e:resilience`.
 *
 * Every describe block restores the wrapper to a known-good, freshly-bootstrapped
 * OpenFGA store/model before finishing, so a partial run doesn't leave the shared dev
 * stack in a broken state for whatever runs next.
 */

function decision(page: Page): Locator {
  return page.locator('article.result strong');
}

async function runCheck(page: Page, user: string, relation: string, object: string): Promise<void> {
  await page.goto('/authorization');
  await page.getByLabel('User').fill(user);
  await page.locator('select[name="relation"]').selectOption(relation);
  await page.getByLabel('Object').fill(object);
  await page.getByRole('button', { name: 'Run OpenFGA check' }).click();
}

test.describe.serial('Authorization lab resilience — OpenFGA container down', () => {
  test.beforeAll(async () => {
    stopService('openfga');
  });

  test.afterAll(async () => {
    startService('openfga');
    ensureInfra();
    const { storeId, modelId } = bootstrapOpenFga();
    await recreateWrapper({ OPENFGA_STORE_ID: storeId, OPENFGA_MODEL_ID: modelId, SECURITY_ENABLED: 'false' });
  });

  test('a check fails closed to DENY, not a crash, when OpenFGA is unreachable', async ({ page }) => {
    await runCheck(page, 'user:alice', 'can_view', 'project:orion');
    await expect(decision(page)).toHaveText('DENY', { timeout: 15_000 });
    await expect(page.getByText(/OpenFGA is unavailable/i)).toBeVisible();
    await expect(page.locator('.error')).toHaveCount(0);
  });
});

test.describe.serial('Authorization lab resilience — stale OpenFGA model ID', () => {
  let validStoreId = '';
  let validModelId = '';

  test.beforeAll(async () => {
    const bootstrapped = bootstrapOpenFga();
    validStoreId = bootstrapped.storeId;
    validModelId = bootstrapped.modelId;
    await recreateWrapper({
      OPENFGA_STORE_ID: validStoreId,
      OPENFGA_MODEL_ID: '01BOGUSMODELID0000000000',
      SECURITY_ENABLED: 'false',
    });
  });

  test.afterAll(async () => {
    await recreateWrapper({ OPENFGA_STORE_ID: validStoreId, OPENFGA_MODEL_ID: validModelId, SECURITY_ENABLED: 'false' });
  });

  test('a check fails closed to DENY, not a crash, against a stale model ID', async ({ page }) => {
    await runCheck(page, 'user:alice', 'can_view', 'project:orion');
    await expect(decision(page)).toHaveText('DENY', { timeout: 15_000 });
    await expect(page.getByText(/OpenFGA rejected the request/i)).toBeVisible();
    await expect(page.locator('.error')).toHaveCount(0);
  });
});

test.describe.serial('Authorization lab resilience — missing JWT under SECURITY_ENABLED=true', () => {
  let validStoreId = '';
  let validModelId = '';

  test.beforeAll(async () => {
    const bootstrapped = bootstrapOpenFga();
    validStoreId = bootstrapped.storeId;
    validModelId = bootstrapped.modelId;
    await recreateWrapper({ OPENFGA_STORE_ID: validStoreId, OPENFGA_MODEL_ID: validModelId, SECURITY_ENABLED: 'true' });
  });

  test.afterAll(async () => {
    await recreateWrapper({ OPENFGA_STORE_ID: validStoreId, OPENFGA_MODEL_ID: validModelId, SECURITY_ENABLED: 'false' });
  });

  test('a request without a bearer token is rejected with 401, not a crash', async ({ request }) => {
    const response = await request.post('/api/access/check', {
      data: { user: 'user:alice', relation: 'can_view', object: 'project:orion' },
    });
    expect(response.status()).toBe(401);
  });

  test('the actuator health endpoint stays open without a token', async ({ request }) => {
    const response = await request.get('/actuator/health');
    expect(response.ok()).toBe(true);
  });
});
