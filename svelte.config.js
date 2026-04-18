import adapter from '@sveltejs/adapter-vercel';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			if (!filename) return true;
			const relativePath = relative(configDir, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		// Node serverless on Vercel: Turso client, @node-rs/argon2, Lucia need this (not Edge).
		adapter: adapter({ runtime: 'nodejs20.x' })
	}
};

export default config;
