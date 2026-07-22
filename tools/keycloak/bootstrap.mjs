const baseUrl = process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8081';
const realm = process.env.KEYCLOAK_REALM ?? 'mission-access';
const clientId = 'e2e-tests';
const testUsername = 'alice';
const testPassword = 'alice-e2e-password';
const jsonOutput = process.argv.includes('--json');

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  return response;
}

async function adminToken() {
  const response = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 'admin-cli',
      username: 'admin',
      password: 'admin',
      grant_type: 'password',
    }),
  });
  if (!response.ok) throw new Error(`Admin login failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  return body.access_token;
}

// Keycloak 26's declarative user profile dynamically resolves VERIFY_PROFILE as a
// required action for any user, independent of that required action's own
// "defaultAction" flag and independent of the per-user requiredActions list — a
// freshly created user otherwise fails password-grant login with "Account is not
// fully set up" (error="resolve_required_actions") even with emailVerified: true and
// requiredActions: []. VERIFY_EMAIL can trigger the same way. Both are irrelevant for
// this lab-only test realm/client, so disable them outright.
async function disableRequiredAction(adminAccessToken, alias) {
  const get = await request(`/admin/realms/${realm}/authentication/required-actions/${alias}`, {
    headers: { authorization: `Bearer ${adminAccessToken}` },
  });
  if (!get.ok) return;
  const config = await get.json();
  if (!config.enabled) return;
  config.enabled = false;
  await request(`/admin/realms/${realm}/authentication/required-actions/${alias}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${adminAccessToken}` },
    body: JSON.stringify(config),
  });
}

async function ensureRealm(adminAccessToken) {
  const existing = await request(`/admin/realms/${realm}`, {
    headers: { authorization: `Bearer ${adminAccessToken}` },
  });
  if (!existing.ok) {
    const created = await request('/admin/realms', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminAccessToken}` },
      body: JSON.stringify({ realm, enabled: true }),
    });
    if (!created.ok) throw new Error(`Realm creation failed: ${created.status} ${await created.text()}`);
  }
  await disableRequiredAction(adminAccessToken, 'VERIFY_EMAIL');
  await disableRequiredAction(adminAccessToken, 'VERIFY_PROFILE');
}

async function ensureClient(adminAccessToken) {
  const existing = await request(`/admin/realms/${realm}/clients?clientId=${clientId}`, {
    headers: { authorization: `Bearer ${adminAccessToken}` },
  });
  const found = existing.ok ? await existing.json() : [];
  if (Array.isArray(found) && found.length > 0) return;

  const created = await request(`/admin/realms/${realm}/clients`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminAccessToken}` },
    body: JSON.stringify({
      clientId,
      enabled: true,
      publicClient: true,
      // Direct access grants (Resource Owner Password Credentials) let the E2E suite
      // trade a username/password for a token without a browser-based redirect flow —
      // fine for a lab test client, not something to carry into a real deployment.
      directAccessGrantsEnabled: true,
      standardFlowEnabled: false,
    }),
  });
  if (!created.ok) throw new Error(`Client creation failed: ${created.status} ${await created.text()}`);
}

async function ensureUser(adminAccessToken) {
  const existing = await request(`/admin/realms/${realm}/users?username=${testUsername}&exact=true`, {
    headers: { authorization: `Bearer ${adminAccessToken}` },
  });
  const found = existing.ok ? await existing.json() : [];
  if (Array.isArray(found) && found.length > 0) return;

  const created = await request(`/admin/realms/${realm}/users`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminAccessToken}` },
    body: JSON.stringify({
      username: testUsername,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
      credentials: [{ type: 'password', value: testPassword, temporary: false }],
    }),
  });
  if (!created.ok) throw new Error(`User creation failed: ${created.status} ${await created.text()}`);
}

async function userToken() {
  const response = await fetch(`${baseUrl}/realms/${realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      username: testUsername,
      password: testPassword,
      grant_type: 'password',
    }),
  });
  if (!response.ok) throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  return body.access_token;
}

const adminAccessToken = await adminToken();
await ensureRealm(adminAccessToken);
await ensureClient(adminAccessToken);
await ensureUser(adminAccessToken);
const accessToken = await userToken();

if (jsonOutput) {
  console.log(JSON.stringify({ realm, clientId, username: testUsername, accessToken }));
} else {
  console.log(`\nKeycloak realm "${realm}" bootstrapped with client "${clientId}" and user "${testUsername}".\n`);
  console.log(`Access token:\n${accessToken}`);
}
