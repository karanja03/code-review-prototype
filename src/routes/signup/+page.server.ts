import { lucia } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { isValidEmail, normalizeEmail } from '$lib/server/email';
import { ensureActiveProjectForSubmitter } from '$lib/server/review-workspace';
import { isSignUpRole, type SignUpRole } from '$lib/userRole';
import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { eq, or } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const usernameRaw = formData.get('username');
		const emailRaw = formData.get('email');
		const password = formData.get('password');
		const roleRaw = formData.get('role');

		if (
			typeof usernameRaw !== 'string' ||
			usernameRaw.length < 3 ||
			usernameRaw.length > 31 ||
			!/^[a-z0-9_-]+$/.test(usernameRaw)
		) {
			return fail(400, { message: 'Invalid username' });
		}
		if (typeof emailRaw !== 'string') {
			return fail(400, { message: 'Invalid email' });
		}
		const email = normalizeEmail(emailRaw);
		if (!isValidEmail(email)) {
			return fail(400, { message: 'Invalid email' });
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, { message: 'Invalid password' });
		}
		if (!isSignUpRole(roleRaw)) {
			return fail(400, { message: 'Choose Submitter or Reviewer' });
		}
		const role: SignUpRole = roleRaw;

		const username = usernameRaw.toLowerCase();
		const db = getDb();
		const clash = await db
			.select()
			.from(user)
			.where(or(eq(user.username, username), eq(user.email, email)))
			.limit(1);
		if (clash.length > 0) {
			const row = clash[0];
			const msg =
				row.username === username
					? 'Username already taken'
					: 'An account with this email already exists';
			return fail(400, { message: msg });
		}

		const userId = generateIdFromEntropySize(10);
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		await db.insert(user).values({ id: userId, username, email, password_hash: passwordHash, role });

		if (role === 'submitter') {
			await ensureActiveProjectForSubmitter(userId);
		}

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, '/');
	}
};
