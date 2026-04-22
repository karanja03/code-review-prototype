/**
 * better-sqlite3 ships prebuilt binaries per platform. `npm rebuild` helps after
 * switching Node locally, but on Vercel it often fails (toolchain / env) and is
 * unnecessary — `npm install` already fetched the Linux binary.
 */
import { spawnSync } from 'node:child_process';

if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
	console.log('[postinstall] Skipping better-sqlite3 rebuild on Vercel.');
	process.exit(0);
}

const r = spawnSync('npm', ['rebuild', 'better-sqlite3'], {
	stdio: 'inherit',
	shell: true,
	env: process.env
});
process.exit(typeof r.status === 'number' ? r.status : 1);
