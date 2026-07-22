import { spawnSync } from 'node:child_process';

const steps = [];

function run(name, command, args) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
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

run('Workspace sanity', 'node', ['tools/verify-workspace.mjs']);
run('Lint (TypeScript, Java, YAML, docker compose)', 'pnpm', ['run', 'lint']);
run('Unit tests (Angular + Spring Boot)', 'pnpm', ['run', 'test']);
run('Build', 'pnpm', ['run', 'build']);

if (hasNxTarget('access-portal', 'e2e')) {
  run('E2E tests', 'pnpm', ['exec', 'nx', 'run', 'access-portal:e2e']);
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
