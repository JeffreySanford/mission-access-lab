import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { workspaceRoot } from '@nx/devkit';

const COMPOSE_FILE = path.join(workspaceRoot, 'infra', 'compose.yaml');
const WRAPPER_HEALTH_URL = 'http://localhost:8080/actuator/health';

function compose(args: string[], env?: Record<string, string>): void {
  execFileSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForWrapperHealth(timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(WRAPPER_HEALTH_URL);
      if (response.ok) return;
    } catch {
      // Not reachable yet — keep polling.
    }
    await sleep(3_000);
  }
  throw new Error(`authorization-wrapper did not become healthy within ${timeoutMs}ms`);
}

/** Force-recreates the wrapper container with the given env overrides layered on top
 * of the host's current environment (Docker Compose interpolates `${VAR}` references
 * in infra/compose.yaml from the calling process's env), then waits for it to report
 * healthy. Used to flip SECURITY_ENABLED / corrupt OPENFGA_MODEL_ID mid-suite. */
export async function recreateWrapper(envOverrides: Record<string, string>): Promise<void> {
  compose(['up', '-d', '--force-recreate', 'authorization-wrapper'], envOverrides);
  await waitForWrapperHealth();
}

export function stopService(service: string): void {
  compose(['stop', service]);
}

export function startService(service: string): void {
  compose(['start', service]);
}

/** Bootstraps a fresh OpenFGA store/model (same script verify-release.mjs uses for the
 * golden-path suite) so resilience tests have known-valid IDs to restore to. */
export function bootstrapOpenFga(): { storeId: string; modelId: string } {
  const output = execFileSync('node', ['tools/openfga/bootstrap.mjs', '--json'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  return JSON.parse(output.trim()) as { storeId: string; modelId: string };
}

/** Re-ensures postgres/openfga/keycloak are healthy (dirty-check + recreate if needed) —
 * the same script CI and local dev use to bring infra up. */
export function ensureInfra(): void {
  execFileSync('node', ['tools/infra-ensure.mjs'], { cwd: workspaceRoot, stdio: 'inherit' });
}

/** Idempotently provisions the mission-access Keycloak realm/client/user and returns a
 * fresh bearer token for the test user, so resilience tests can exercise the real
 * authenticated success path (not just the missing-token rejection). */
export function bootstrapKeycloak(): { realm: string; clientId: string; username: string; accessToken: string } {
  const output = execFileSync('node', ['tools/keycloak/bootstrap.mjs', '--json'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  return JSON.parse(output.trim()) as { realm: string; clientId: string; username: string; accessToken: string };
}
