import { createClient, type Client } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export type AppDatabase = LibSQLDatabase<typeof schema>;

type LibsqlGlobal = typeof globalThis & {
	__koodLibsql?: { key: string; client: Client; db: AppDatabase };
};

function resolveDatabaseUrl(): string {
	const raw = (env.TURSO_DATABASE_URL ?? env.DATABASE_URL)?.trim();
	if (!raw) {
		throw new Error(
			'[db] Set TURSO_DATABASE_URL (Turso / libSQL) or DATABASE_URL. Examples: libsql://your-db.turso.io, file:./data/local.db'
		);
	}
	if (raw.startsWith('file:') || /^\w+:\/\//.test(raw)) return raw;
	return `file:${raw}`;
}

function ensureFileDatabaseDirectory(url: string) {
	if (!url.startsWith('file:')) return;
	const pathPart = url.slice('file:'.length);
	const abs = isAbsolute(pathPart) ? pathPart : resolve(process.cwd(), pathPart);
	mkdirSync(dirname(abs), { recursive: true });
}

function connectionKey(url: string): string {
	const token = env.TURSO_AUTH_TOKEN ?? '';
	return `${url}\0${token}`;
}

function createLibsqlClient(url: string): Client {
	ensureFileDatabaseDirectory(url);
	return createClient({
		url,
		authToken: env.TURSO_AUTH_TOKEN || undefined
	});
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

export function getDb(): AppDatabase {
	const url = resolveDatabaseUrl();
	const key = connectionKey(url);
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
			const db = getDb();
			const rows = await db.all(
				sql`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user' LIMIT 1`
			);
			if (!rows.length) {
				throw new Error(
					'[db] Database has no tables yet. Apply the schema with `npm run db:push` (Turso) or reset a local file DB, set env, then start again.'
				);
			}
		})();
	}
	return initOnce;
}
