import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * The deliberately-deferred infra-restart negative-space pass (docs/next-work.md
 * section 3): OpenFGA down, a stale/wrong model ID, a missing JWT under
 * SECURITY_ENABLED=true. Split from playwright.config.mts because each test group
 * force-recreates the authorization-wrapper container (or stops OpenFGA) mid-suite —
 * slower (~30-60s per restart) and riskier against the single shared dev stack than
 * the golden-path suite, so it stays a separate, explicitly-invoked target
 * (`nx run access-portal:e2e-resilience` / `pnpm run e2e:resilience`) rather than
 * bolted onto the default `access-portal:e2e` that verify:release gates on.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './e2e/resilience' }),
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm start:all',
    url: 'http://localhost:4200/api/access/diagnostics',
    reuseExistingServer: true,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
