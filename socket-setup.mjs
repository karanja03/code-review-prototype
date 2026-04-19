/** @type {import('socket.io').Server | null} */
let ioRef = null;

/** Vite loads `socket-setup.mjs` twice (plugin vs SvelteKit server bundle) — share the Server on `globalThis`. */
const GLOBAL_IO_KEY = '__koodSocketIoServer';

/** @returns {import('socket.io').Server | null} */
function getIo() {
	const shared = Reflect.get(globalThis, GLOBAL_IO_KEY);
	return ioRef ?? shared ?? null;
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} roomName
 */
function roomSize(io, roomName) {
	try {
		const n = io?.sockets?.adapter?.rooms?.get(roomName);
		return n ? n.size : 0;
	} catch {
		return 0;
	}
}

/**
 * @param {string} projectId
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToProject(projectId, event, payload = {}) {
	const io = getIo();
	if (!io || typeof projectId !== 'string' || !projectId) {
		console.warn('[realtime-server] broadcastToProject skipped', { hasIo: !!io, projectId });
		return;
	}
	const r = `project:${projectId}`;
	io.to(r).emit(event, payload);
	console.info('[realtime-server] emit', event, '→', r, 'subscribers:', roomSize(io, r));
}

/**
 * Notify a single signed-in user (e.g. reviewer before they join a project room).
 * @param {string} userId
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToUser(userId, event, payload = {}) {
	const io = getIo();
	if (!io || typeof userId !== 'string' || !userId) {
		console.warn('[realtime-server] broadcastToUser skipped', { hasIo: !!io, userId });
		return;
	}
	const r = `user:${userId}`;
	io.to(r).emit(event, payload ?? {});
	console.info('[realtime-server] emit', event, '→', r, 'subscribers:', roomSize(io, r));
}

/**
 * Notify everyone who joined a logical role room (e.g. admins watching the dashboard).
 * @param {string} role
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToRole(role, event, payload = {}) {
	const io = getIo();
	if (!io || typeof role !== 'string' || !role) {
		console.warn('[realtime-server] broadcastToRole skipped', { hasIo: !!io, role });
		return;
	}
	const r = `role:${role}`;
	io.to(r).emit(event, payload ?? {});
	console.info('[realtime-server] emit', event, '→', r, 'subscribers:', roomSize(io, r));
}

/**
 * Shared Socket.IO wiring for Vite dev (configureServer) and production `server.js`.
 * @param {import('socket.io').Server} io
 */
export function attachSocketIo(io) {
	ioRef = io;
	Reflect.set(globalThis, GLOBAL_IO_KEY, io);
	io.on('connection', (socket) => {
		console.info('[realtime-server] client connected', socket.id);
		socket.emit('server:hello', { t: Date.now(), message: 'Socket connected' });
		socket.on('client:ping', () => {
			socket.emit('server:pong', { t: Date.now() });
		});
		socket.on('joinProject', (projectId) => {
			if (typeof projectId !== 'string' || !projectId) return;
			socket.join(`project:${projectId}`);
			console.info('[realtime-server] joinProject', socket.id, '→ project:' + projectId.slice(0, 8) + '…');
		});
		socket.on('leaveProject', (projectId) => {
			if (typeof projectId !== 'string' || !projectId) return;
			socket.leave(`project:${projectId}`);
			console.info('[realtime-server] leaveProject', socket.id);
		});
		socket.on('joinUser', (userId) => {
			if (typeof userId !== 'string' || !userId) return;
			socket.join(`user:${userId}`);
			console.info('[realtime-server] joinUser', socket.id, '→ user:' + userId.slice(0, 8) + '…');
		});
		socket.on('joinRole', (role) => {
			if (typeof role !== 'string' || !role) return;
			socket.join(`role:${role}`);
			console.info('[realtime-server] joinRole', socket.id, role);
		});
	});
}
