import { readFile } from 'node:fs/promises';
const baseUrl = process.env.OPENFGA_BASE_URL ?? 'http://localhost:8082';
const jsonOutput = process.argv.includes('--json');
async function json(path) { return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8')); }
async function request(path, init = {}) { const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init.headers ?? {}) } }); if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`); return response.json(); }
const store = await request('/stores', { method: 'POST', body: JSON.stringify({ name: 'mission-access-lab' }) });
const model = await json('../../authorization/model.json');
const published = await request(`/stores/${store.id}/authorization-models`, { method: 'POST', body: JSON.stringify(model) });
const tuples = await json('../../authorization/seed-tuples.json');
await request(`/stores/${store.id}/write`, { method: 'POST', body: JSON.stringify({ ...tuples, authorization_model_id: published.authorization_model_id }) });
if (jsonOutput) {
  console.log(JSON.stringify({ storeId: store.id, modelId: published.authorization_model_id }));
} else {
  console.log('\nOpenFGA bootstrapped successfully. Set these before starting Spring Boot:\n');
  console.log(`OPENFGA_STORE_ID=${store.id}`); console.log(`OPENFGA_MODEL_ID=${published.authorization_model_id}`);
}
