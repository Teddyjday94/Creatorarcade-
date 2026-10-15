// Builds with the production D1 id and deploys the Worker to Cloudflare.
// Usage (any shell, including PowerShell):  pnpm ship <D1 database id>
// The id comes from `pnpm wrangler d1 create creatorarcade`. See SETUP.md.
import { spawnSync } from 'node:child_process';
import { wrangler } from './wrangler.mjs';
import { fileURLToPath } from 'node:url';

const id = process.argv[2] || process.env.D1_DATABASE_ID;
if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
  console.error('Usage: pnpm ship <D1 database id>   (see SETUP.md, step 2)');
  process.exit(1);
}
const env = { ...process.env, D1_DATABASE_ID: id };
const build = spawnSync('pnpm', ['build'], { stdio: 'inherit', env, shell: process.platform === 'win32' });
if (build.status !== 0) process.exit(build.status ?? 1);
process.exit(wrangler(['deploy', '--config', fileURLToPath(new URL('../dist/server/wrangler.json', import.meta.url))], env));
