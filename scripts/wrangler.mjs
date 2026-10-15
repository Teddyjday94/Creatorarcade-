// Runs the project's Wrangler, falling back to `npx wrangler@<pinned>` if the local
// install is missing (some Windows setups fail to link node_modules/.bin/wrangler).
// Usage: pnpm wrangler <args>   e.g. pnpm wrangler login
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

export function wrangler(args, env = process.env) {
  const local = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
  const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).devDependencies.wrangler;
  const r = existsSync(local)
    ? spawnSync(process.execPath, [local, ...args], { stdio: 'inherit', env })
    : // Run outside the project so npx cannot pick up a broken local shim.
      spawnSync('npx', ['--yes', `wrangler@${version}`, ...args], { stdio: 'inherit', env, cwd: tmpdir(), shell: process.platform === 'win32' });
  return r.status ?? 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(wrangler(process.argv.slice(2)));
