/**
 * Quick sanity check for Turso/libsql remote connectivity (same env as drizzle.config).
 * If this times out, drizzle-kit will also hang at "Pulling schema from database...".
 */
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';

const root = process.cwd();
for (const name of ['.env', '.env.local']) {
	const p = resolve(root, name);
	if (existsSync(p)) config({ path: p, override: name === '.env.local' });
}

function resolveKitUrl() {
	const raw = (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? '').trim();
	if (!raw) {
		console.error('Set TURSO_DATABASE_URL or DATABASE_URL (e.g. in .env.local).');
		process.exit(1);
	}
	if (raw.startsWith('file:') || /^\w+:\/\//.test(raw)) return raw;
	return `file:${raw}`;
}

const url = resolveKitUrl();
if (url.startsWith('file:')) {
	console.log('DATABASE_URL is a local file — remote ping skipped.');
	process.exit(0);
}

const ms = Number(process.env.LIBSQL_PING_TIMEOUT_MS ?? '25000');
const client = createClient({
	url,
	authToken: process.env.TURSO_AUTH_TOKEN
});

const deadline = setTimeout(() => {
	console.error(
		`No response after ${ms}ms. Typical causes: offline/VPN/firewall blocking Turso, wrong URL, cold DB wake still running (wait and retry), or DNS/IPv6 issues.`
	);
	process.exit(1);
}, ms);

try {
	const r = await client.execute('SELECT 1 AS ok');
	clearTimeout(deadline);
	console.log('libsql reachable:', r.rows);
} catch (err) {
	clearTimeout(deadline);
	console.error(err);
	process.exit(1);
}
