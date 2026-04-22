import { createClient, type Client } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fetch as undiciFetch } from 'undici';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

/** Hrana calls `fetch(request)` with a `cross-fetch` Request; Undici needs `fetch(url, init)`. */
function fetchForLibsql(input: unknown, init?: RequestInit): Promise<Response> {
	if (
		init === undefined &&
		typeof input === 'object' &&
		input !== null &&
		typeof (input as { url?: unknown }).url === 'string'
	) {
		const r = input as Request;
		const next: RequestInit = {
			method: r.method,
			headers: copyHeadersForUndici(r.headers),
			body: r.body
		};
		const sig = (r as { signal?: AbortSignal }).signal;
		if (sig) next.signal = sig;
		if (next.body !== undefined && next.body !== null && isReadableStream(next.body)) {
			(next as { duplex?: 'half' }).duplex = 'half';
		}
		return undiciFetch(r.url, next as never) as unknown as Promise<Response>;
	}
	return undiciFetch(input as never, init as never) as unknown as Promise<Response>;
}

function isReadableStream(x: unknown): boolean {
	return typeof ReadableStream !== 'undefined' && x instanceof ReadableStream;
}

function copyHeadersForUndici(src: Headers): Headers {
	const dst = new Headers();
	src.forEach((value, key) => {
		dst.append(key, value);
	});
	return dst;
}

export type AppDatabase = LibSQLDatabase<typeof schema>;

type SqliteGlobal = typeof globalThis & {
	__koodSqlite?: { path: string; sqlite: Database.Database; db: DrizzleDb };
	__koodBuildDb?: DrizzleDb;
};

/** In-memory DB used only while SvelteKit runs static analysis (`vite build`); no migrations, no disk. */
function getBuildPlaceholderDb(): DrizzleDb {
	const g = globalThis as SqliteGlobal;
	if (g.__koodBuildDb) return g.__koodBuildDb;
	const sqlite = new Database(':memory:');
	sqlite.pragma('foreign_keys = ON');
	g.__koodBuildDb = drizzle(sqlite, { schema });
	return g.__koodBuildDb;
}

function databasePath(): string {
	return env.DATABASE_URL ?? './data/local.db';
}

/** Survives Vite SSR HMR so we do not open/close the client on every module reload. */
function getOrCreateFromGlobal(url: string): AppDatabase {
	const g = globalThis as LibsqlGlobal;
	const key = connectionKey(url);
	const prev = g.__koodLibsql;
	if (prev) {
		if (prev.key === key) return prev.db;
		try {
			prev.client.close();
		} catch {
			/* ignore */
		}
		g.__koodLibsql = undefined;
	}

	const client = createLibsqlClient(url);
	const db = drizzle(client, { schema });
	g.__koodLibsql = { key, client, db };
	return db;
}

let moduleClient: Client | undefined;
let moduleDb: AppDatabase | undefined;
let moduleKey: string | undefined;

export function getDb() {
	if (building) {
		return getBuildPlaceholderDb();
	}
	const url = databasePath();
	const useGlobalCache = process.env.NODE_ENV !== 'production';
	if (useGlobalCache) {
		return getOrCreateFromGlobal(url);
	}
	if (moduleDb && moduleKey === key) return moduleDb;
	if (moduleClient) {
		try {
			moduleClient.close();
		} catch {
			/* ignore */
		}
		moduleClient = undefined;
		moduleDb = undefined;
	}
	moduleKey = key;
	moduleClient = createLibsqlClient(url);
	moduleDb = drizzle(moduleClient, { schema });
	return moduleDb;
}

let initOnce: Promise<void> | undefined;

/** Run once per process before handling requests (schema must exist). */
export function initDatabase(): Promise<void> {
	if (!initOnce) {
		initOnce = (async () => {
			const url = resolveDatabaseUrl();
			const db = getDb();
			let rows: Awaited<ReturnType<AppDatabase['all']>>;
			try {
				rows = await db.all(
					sql`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user' LIMIT 1`
				);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				if (msg.includes('404') && usesRemoteLibsql(url)) {
					throw new Error(
						'[db] Turso HTTP 404: URL or token does not match any database (wrong env, revoked token, or deleted DB). Not caused by an empty schema—Turso still returns 200 for an empty DB; you would then get a "no tables" error instead. Set Vercel Production TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from Turso → Connect. Then from your laptop: DATABASE_URL=<libsql url> TURSO_AUTH_TOKEN=<token> npm run db:push'
					);
				}
				throw e;
			}
			if (!rows.length) {
				const hint = url.startsWith('file:/data/')
					? ' On Fly.io with a mounted volume, open a shell on the machine and run: `cd /app && DATABASE_URL=/data/app.db npx drizzle-kit push` (release VMs do not see your volume).'
					: '';
				throw new Error(
					`[db] Database has no tables yet. Run \`npm run db:push\` for this DATABASE_URL (local file or Turso), then restart.${hint}`
				);
			}
		})();
	}
	return initOnce;
}
