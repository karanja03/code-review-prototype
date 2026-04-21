import type { TestingItem } from '$lib/types';

function row(
	id: string,
	section: 'mandatory' | 'extra',
	text: string,
	mandatoryOwner?: 'jane' | 'joe'
): TestingItem {
	return {
		id,
		section,
		text,
		mandatoryOwner: section === 'mandatory' ? mandatoryOwner : undefined,
		jane: 'pending',
		joe: 'pending',
		verdictHistory: [],
		comments: [],
		drafts: {}
	};
}

/** First ceil(n/2) mandatory rows → you (Jane id), rest → Joe (stable order in array). */
export function withMandatoryOwners(items: TestingItem[]): TestingItem[] {
	const mandatoryCount = items.filter((t) => t.section === 'mandatory').length;
	const janeCount = Math.ceil(mandatoryCount / 2);
	let mi = 0;
	return items.map((t) => {
		if (t.section !== 'mandatory') return t;
		const owner: 'jane' | 'joe' = mi < janeCount ? 'jane' : 'joe';
		mi += 1;
		return { ...t, mandatoryOwner: owner };
	});
}

/** Full Mobile Messenger testing checklist (mandatory + extra). */
export function createFullTestingItems(): TestingItem[] {
	const raw = [
		row('m1', 'mandatory', 'Repository contains complete source code and configuration files.'),
		row(
			'm2',
			'mandatory',
			'Documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.'
		),
		row(
			'm3',
			'mandatory',
			'Application runs successfully on a virtual or physical device with chosen platform (Android/iOS).'
		),
		row('m4', 'mandatory', 'User can create an account with email, username and password.'),
		row(
			'm5',
			'mandatory',
			'Registration is not allowed if email or username is already in use. User receives proper visual feedback.'
		),
		row(
			'm6',
			'mandatory',
			'Application checks password strength: ≥8 characters, lowercase, uppercase, digit, special character. Registration blocked if weak; user gets visual feedback.'
		),
		row('m7', 'mandatory', 'User receives verification email after creating an account.'),
		row('m8', 'mandatory', 'User needs email and password to log in to the messenger.'),
		row('m9', 'mandatory', 'User can reset their account password.'),
		row(
			'm10',
			'mandatory',
			'Authentication persistence unless explicit logout or session expiry — verify by closing and reopening the app; user stays logged in.'
		),
		/* Prototype: 5 mandatory rows per reviewer (m1–m5 → Jane, m6–m10 → Joe). Rest commented for easier testing:
		row(
			'm11',
			'mandatory',
			'User has a profile page with at least username, profile picture, and About Me sections.'
		),
		row('m12', 'mandatory', 'Default profile picture on first login; About Me empty initially.'),
		row(
			'm13',
			'mandatory',
			'Profile picture upload supports at least JPEG and PNG (5MB limit per spec).'
		),
		row('m14', 'mandatory', 'User can edit any data in their profile.'),
		row('m15', 'mandatory', 'User can search for contacts by username or by email.'),
		row('m16', 'mandatory', 'User can send chat invitations to other users.'),
		row(
			'm17',
			'mandatory',
			'User can accept or decline invitations; application has a pending invitation section.'
		),
		row('m18', 'mandatory', 'Chat list sorted by time of last message received or sent.'),
		row('m19', 'mandatory', 'User can archive and unarchive chats.'),
		row('m20', 'mandatory', 'Users can send text messages to each other.'),
		row('m21', 'mandatory', 'Users can send images to each other.'),
		row('m22', 'mandatory', 'Users can send videos to each other.'),
		row(
			'm23',
			'mandatory',
			'Typing indicators show when either user is composing a message in real time.'
		),
		row('m24', 'mandatory', 'Each message shows sent and delivered state.'),
		row('m25', 'mandatory', 'On failed delivery, user receives clear visual feedback.'),
		row('m26', 'mandatory', 'Each message shows whether it has been read by the recipient.'),
		row('m27', 'mandatory', 'User can edit and delete their own messages in the chat.'),
		row('m28', 'mandatory', 'Data persists after restarting the application.'),
		row(
			'm29',
			'mandatory',
			'Messages, media, profile information, and chat list contents are encrypted before reaching the database.'
		),
		row(
			'm30',
			'mandatory',
			'On errors/exceptions, messenger returns to last stable state when possible; user receives visual feedback about the error.'
		),
		*/
		row(
			'e1',
			'extra',
			'Code is properly organized with logical lib structure, consistent naming and formatting.'
		),
		row(
			'e2',
			'extra',
			'All tabs share a common theme; interface is intuitive and user-friendly.'
		),
		row(
			'e3',
			'extra',
			'Easy launch without full Flutter setup: .apk provided with instructions for device, lightweight emulator, and browser-based emulator; backend starts with a single command (Docker allowed).'
		),
		row('e4', 'extra', 'Application supports recording and sending audio messages in chat.'),
		row(
			'e5',
			'extra',
			'Push notifications for new messages and invites; user can mute notifications per chat.'
		),
		row(
			'e6',
			'extra',
			'Application uses additional technologies/features beyond core requirements (bonus).'
		)
	];
	return withMandatoryOwners(raw);
}
