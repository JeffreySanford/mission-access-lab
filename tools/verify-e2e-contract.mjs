import { readFile } from 'node:fs/promises';

const failures = [];

function requireIncludes(name, content, expected) {
  if (!content.includes(expected)) failures.push(`${name} must include ${expected}`);
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const verifyRelease = await readFile('tools/verify-release.mjs', 'utf8');
const playwrightConfig = await readFile('apps/access-portal/playwright.config.mts', 'utf8');
const authorizationSpec = await readFile('apps/access-portal/e2e/authorization.spec.ts', 'utf8');

requireIncludes(
  'playwright.config.mts',
  playwrightConfig,
  "url: 'http://localhost:4200/api/access/diagnostics'"
);
requireIncludes('playwright.config.mts', playwrightConfig, "command: 'pnpm start:all'");
requireIncludes('playwright.config.mts', playwrightConfig, 'workers: 1');
requireIncludes('authorization.spec.ts', authorizationSpec, 'expectLiveOpenFga');
requireIncludes('verify-release.mjs', verifyRelease, "tools/openfga/bootstrap.mjs', '--json'");
requireIncludes('verify-release.mjs', verifyRelease, 'OPENFGA_STORE_ID');
requireIncludes('verify-release.mjs', verifyRelease, 'OPENFGA_MODEL_ID');

if (!packageJson.scripts?.['verify:e2e-contract']) {
  failures.push('package.json must expose verify:e2e-contract');
}

if (failures.length > 0) {
  console.error('E2E readiness contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('E2E readiness contract passed.');
