import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './e2e' }),
  // The infra-restart resilience suite (e2e/resilience/**) mutates live containers
  // mid-test and is deliberately excluded from this default target — it runs via its
  // own playwright.resilience.config.mts (`pnpm run e2e:resilience`), not as part of
  // the fast golden-path suite verify:release gates on.
  testIgnore: '**/resilience/**',
  // There is exactly one dev server instance (reuseExistingServer / a single Vite
  // process), not one per worker. Concurrent test files navigating it simultaneously
  // was observed to trip a spurious <vite-error-overlay> that blocks clicks — serialize
  // instead of trying to make the dev server handle concurrent HMR traffic.
  fullyParallel: false,
  workers: 1,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run the real full stack (infra + Angular dev server + Spring Boot backend) before
     starting the tests — these e2e tests deliberately exercise the real containerized
     backend, not a mocked API. authorization-wrapper's cold start (Docker + Gradle) can
     take 20-30s, hence the generous timeout. */
  webServer: {
    command: 'pnpm start:all',
    url: 'http://localhost:4200/api/access/diagnostics',
    reuseExistingServer: true,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: [
    // Chromium only for now — keeps the suite fast. Add firefox/webkit projects here
    // if cross-browser coverage becomes worth the added CI time for this lab.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
