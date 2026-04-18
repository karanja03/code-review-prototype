import { lucia } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { normalizeEmail } from '$lib/server/email';
import { fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { eq, or } from 'drizzle-orm';
import type { Actions } from './$types';

export const runtime = 'nodejs';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const identifierRaw = formData.get('identifier');
		const password = formData.get('password');

		if (typeof identifierRaw !== 'string' || identifierRaw.trim().length < 3) {
			return fail(400, { message: 'Enter your email or username' });
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, { message: 'Invalid password' });
		}

		const trimmed = identifierRaw.trim();
		const asEmail = normalizeEmail(trimmed);
		const asUsername = trimmed.toLowerCase();

		const db = getDb();
		const rows = await db
			.select()
			.from(user)
			.where(or(eq(user.email, asEmail), eq(user.username, asUsername)))
			.limit(2);

		const existingUser =
			rows.find((r) => r.email === asEmail) ?? rows.find((r) => r.username === asUsername);

		if (!existingUser) {
			return fail(400, { message: 'Incorrect email/username or password' });
		}

		const validPassword = await verify(existingUser.password_hash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, { message: 'Incorrect email/username or password' });
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, existingUser.role === 'admin' ? '/admin' : '/');
	}
};
