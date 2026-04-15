import { json } from '@sveltejs/kit';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const STATE_DIR = path.join(os.tmpdir(), 'kood-code-review-prototype');
const STATE_FILE = path.join(STATE_DIR, 'prototype-state.json');

async function ensureStateDir() {
	await mkdir(STATE_DIR, { recursive: true });
}

function defaultPayload() {
	return { snapshot: null };
}

export async function GET() {
	await ensureStateDir();
	try {
		const raw = await readFile(STATE_FILE, 'utf8');
		const parsed = JSON.parse(raw) as unknown;
		return json(parsed);
	} catch {
		return json(defaultPayload());
	}
}

export async function PUT({ request }) {
	await ensureStateDir();
	const body = await request.json();
	await writeFile(STATE_FILE, JSON.stringify(body, null, 2), 'utf8');
	return json({ ok: true });
}
