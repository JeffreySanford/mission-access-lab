import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const authorizationDirectory = path.resolve(scriptDirectory, '../../authorization');
const mount = `${authorizationDirectory}:/authorization`;

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--volume',
    mount,
    'openfga/cli:v0.7.15',
    'model',
    'test',
    '--tests',
    '/authorization/model-tests.yaml',
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (result.error) {
  console.error(`Unable to start Docker: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
