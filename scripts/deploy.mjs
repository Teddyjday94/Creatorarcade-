// Builds with the production D1 id and deploys the Worker to Cloudflare.
// Usage (any shell, including PowerShell):  pnpm ship <D1 database id>
// The id comes from `pnpm exec wrangler d1 create creatorarcade`. See SETUP.md.
import { spawnSync } from 'node:child_process';

const id = process.argv[2] || process.env.D1_DATABASE_ID;
if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
  console.error('Usage: pnpm ship <D1 database id>   (see SETUP.md, step 2)');
  process.exit(1);
}
const env = { ...process.env, D1_DATABASE_ID: id };
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run('pnpm', ['build']);
run('pnpm', ['exec', 'wrangler', 'deploy', '--config', 'dist/server/wrangler.json']);
