/**
 * drizzle-kit + Turso/libsql HTTP uses @libsql/hrana-client, which can throw
 * `TypeError: resp.body?.cancel is not a function` on Node 21+ when handling
 * error responses. This repo targets Node 20.x (.nvmrc).
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';

const root = process.cwd();
for (const name of ['.env', '.env.local']) {
	const p = resolve(root, name);
	if (existsSync(p)) config({ path: p, override: name === '.env.local' });
}

const raw = (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? '').trim();
const usesRemoteLibsql =
	raw !== '' &&
	!/^\s*file:/i.test(raw) &&
	(/^libsql:\/\//i.test(raw) ||
		/^https?:\/\//i.test(raw) ||
		/^wss:\/\//i.test(raw));

const major = Number.parseInt(process.versions.node.split('.')[0], 10);

if (usesRemoteLibsql && major >= 21) {
	console.warn(
		[
			'[db] You are on Node 21+; this project’s engines and .nvmrc use Node 20.18.x.',
			'If you see libsql/hrana errors, run: nvm use',
			`Current: ${process.version}`
		].join('\n')
	);
}
