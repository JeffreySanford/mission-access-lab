import { access, readFile } from 'node:fs/promises';
const required = ['package.json','nx.json','apps/access-portal/project.json','apps/authorization-wrapper/build.gradle.kts','authorization/model.fga','infra/compose.yaml','docs/skills-gap-and-code-map.md'];
for (const path of required) await access(path);
for (const path of ['package.json','nx.json','apps/access-portal/project.json','authorization/model.json','authorization/seed-tuples.json']) JSON.parse(await readFile(path,'utf8'));
console.log(`Workspace verification passed (${required.length} key artifacts and JSON syntax).`);
