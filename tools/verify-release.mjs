import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

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

async function hasNxTarget(projectJsonPath, target) {
  try {
    const project = JSON.parse(await readFile(projectJsonPath, 'utf8'));
    return Boolean(project.targets?.[target]);
  } catch {
    return false;
  }
}

run('Workspace sanity', 'node', ['tools/verify-workspace.mjs']);
run('Lint (TypeScript, Java, YAML, docker compose)', 'pnpm', ['run', 'lint']);
run('Unit tests (Angular + Spring Boot)', 'pnpm', ['run', 'test']);
run('Build', 'pnpm', ['run', 'build']);

if (await hasNxTarget('apps/access-portal/project.json', 'e2e')) {
  run('E2E tests', 'pnpm', ['exec', 'nx', 'run', 'access-portal:e2e']);
} else {
  pending('E2E tests', 'not implemented yet — see docs/next-work.md, section 3');
}

if (await hasNxTarget('apps/access-portal/project.json', 'storybook')) {
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
