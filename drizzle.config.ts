import { defineConfig } from 'drizzle-kit';

function resolveKitUrl(): string {
	const raw = (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./data/local.db').trim();
	if (raw.startsWith('file:') || /^\w+:\/\//.test(raw)) return raw;
	return `file:${raw}`;
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		url: resolveKitUrl(),
		authToken: process.env.TURSO_AUTH_TOKEN
	}
});
