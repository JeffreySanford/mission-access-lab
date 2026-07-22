import { spawnSync } from 'node:child_process';

const steps = [];

function run(name, command, args, options = {}) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true, ...options });
  const passed = result.status === 0;
  steps.push({ name, passed });
  return passed;
}

function pending(name, reason) {
  console.log(`\n=== ${name} ===`);
  console.log(`PENDING: ${reason}`);
  steps.push({ name, pending: true, reason });
}

// Queries Nx's resolved project graph rather than reading project.json directly, so
// this also detects targets registered via inferred plugins (e.g. @nx/playwright's
// "e2e" target, which is never an explicit key in project.json).
function hasNxTarget(project, target) {
  const result = spawnSync('pnpm', ['exec', 'nx', 'show', 'project', project, '--json'], {
    encoding: 'utf8',
    shell: true,
  });
  if (result.status !== 0) return false;
  try {
    const parsed = JSON.parse(result.stdout);
    return Boolean(parsed.targets?.[target]);
  } catch {
    return false;
  }
}

function prepareLiveOpenFgaForE2e() {
  console.log('\n=== E2E live OpenFGA bootstrap ===');
  const ensure = spawnSync('pnpm', ['exec', 'nx', 'run', 'infra:ensure'], {
    stdio: 'inherit',
    shell: true,
  });
  if (ensure.status !== 0) {
    steps.push({ name: 'E2E live OpenFGA bootstrap', passed: false });
    return null;
  }

  const bootstrap = spawnSync('node', ['tools/openfga/bootstrap.mjs', '--json'], {
    encoding: 'utf8',
    shell: true,
  });
  if (bootstrap.status !== 0) {
    console.error(bootstrap.stderr || bootstrap.stdout);
    steps.push({ name: 'E2E live OpenFGA bootstrap', passed: false });
    return null;
  }

  try {
    const parsed = JSON.parse(bootstrap.stdout.trim());
    if (!parsed.storeId || !parsed.modelId) throw new Error('missing store/model IDs');
    const env = {
      ...process.env,
      OPENFGA_STORE_ID: parsed.storeId,
      OPENFGA_MODEL_ID: parsed.modelId,
    };
    // If a previous local run left the wrapper container alive with stale/empty
    // env vars, remove just that service so the E2E webServer starts it with the
    // freshly bootstrapped IDs.
    spawnSync('docker', ['compose', '-f', 'infra/compose.yaml', 'rm', '-sf', 'authorization-wrapper'], {
      stdio: 'inherit',
      shell: true,
      env,
    });
    console.log(`[verify:release] OpenFGA store ${parsed.storeId}, model ${parsed.modelId}`);
    steps.push({ name: 'E2E live OpenFGA bootstrap', passed: true });
    return env;
  } catch (error) {
    console.error(`[verify:release] Could not parse bootstrap output: ${error.message}`);
    console.error(bootstrap.stdout);
    steps.push({ name: 'E2E live OpenFGA bootstrap', passed: false });
    return null;
  }
}

run('Workspace sanity', 'node', ['tools/verify-workspace.mjs']);
run('E2E readiness contract', 'node', ['tools/verify-e2e-contract.mjs']);
run('OpenFGA model tests', 'pnpm', ['run', 'fga:test']);
run('Lint (TypeScript, Java, YAML, docker compose)', 'pnpm', ['run', 'lint']);
run('Unit tests (Angular + Spring Boot)', 'pnpm', ['run', 'test']);
run('Build', 'pnpm', ['run', 'build']);

if (hasNxTarget('access-portal', 'e2e')) {
  const e2eEnv = prepareLiveOpenFgaForE2e();
  if (e2eEnv) {
    run('E2E tests', 'pnpm', ['exec', 'nx', 'run', 'access-portal:e2e'], { env: e2eEnv });
  } else {
    steps.push({ name: 'E2E tests', passed: false });
  }
} else {
  pending('E2E tests', 'not implemented yet — see docs/next-work.md, section 3');
}

if (hasNxTarget('access-portal', 'storybook')) {
  run('Storybook build', 'pnpm', ['exec', 'nx', 'run', 'access-portal:build-storybook']);
} else {
  pending('Storybook', 'not implemented yet — see docs/next-work.md, section 2');
}

console.log('\n=== verify:release summary ===');
let anyFailed = false;
for (const step of steps) {
  if (step.pending) {
    console.log(`PEND  ${step.name} — ${step.reason}`);
    continue;
  }
  console.log(`${step.passed ? 'PASS' : 'FAIL'}  ${step.name}`);
  if (!step.passed) anyFailed = true;
}

if (anyFailed) {
  console.log('\nverify:release FAILED. Do not commit/push until every gate above passes.');
  process.exit(1);
}

const pendingCount = steps.filter((step) => step.pending).length;
if (pendingCount > 0) {
  console.log(
    `\nverify:release passed every implemented gate (${pendingCount} gate(s) still pending implementation — see docs/next-work.md).`
  );
} else {
  console.log('\nverify:release passed all gates.');
}
