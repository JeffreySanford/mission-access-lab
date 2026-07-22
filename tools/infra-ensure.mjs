import { spawnSync } from 'node:child_process';

const COMPOSE_FILE = 'infra/compose.yaml';
const RUNNING_SERVICES = ['postgres', 'openfga', 'keycloak'];
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

function compose(args, opts = {}) {
  return spawnSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    encoding: 'utf8',
    ...opts,
  });
}

function fail(message) {
  console.error(`[infra:ensure] ${message}`);
  process.exit(1);
}

function dockerAvailable() {
  const result = spawnSync('docker', ['info'], { stdio: 'ignore' });
  return result.status === 0;
}

function readContainerStatuses() {
  const result = compose(['ps', '--all', '--format', 'json']);
  if (result.status !== 0) fail(`docker compose ps failed:\n${result.stderr}`);
  const output = result.stdout.trim();
  if (!output) return [];
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return output.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  }
}

function isHealthy(container) {
  if (!container) return false;
  if (container.Health) return container.Health === 'healthy';
  return container.State === 'running';
}

function isDirty(container) {
  if (!container) return true;
  if (container.State === 'exited' || container.State === 'dead') return true;
  if (container.Health === 'unhealthy') return true;
  return false;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (!dockerAvailable()) {
  fail('Docker daemon is not reachable. Start Docker Desktop and try again.');
}

console.log('[infra:ensure] Starting infra containers (docker compose up -d)...');
const up = compose(['up', '-d'], { stdio: 'inherit' });
if (up.status !== 0) fail('docker compose up -d failed.');

const deadline = Date.now() + POLL_TIMEOUT_MS;
let recreateAttempted = new Set();

while (Date.now() < deadline) {
  const containers = readContainerStatuses();
  const byService = Object.fromEntries(containers.map((c) => [c.Service, c]));

  const dirty = RUNNING_SERVICES.filter((service) => isDirty(byService[service]));
  for (const service of dirty) {
    if (recreateAttempted.has(service)) continue;
    recreateAttempted.add(service);
    console.log(`[infra:ensure] '${service}' is dirty (exited/unhealthy) — recreating...`);
    compose(['up', '-d', '--force-recreate', '--no-deps', service], { stdio: 'inherit' });
  }

  const allHealthy = RUNNING_SERVICES.every((service) => isHealthy(byService[service]));
  if (allHealthy && dirty.length === 0) {
    console.log('[infra:ensure] postgres, openfga, and keycloak are up and healthy.');
    process.exit(0);
  }

  await sleep(POLL_INTERVAL_MS);
}

fail(`Timed out after ${POLL_TIMEOUT_MS / 1000}s waiting for infra containers to become healthy.`);
