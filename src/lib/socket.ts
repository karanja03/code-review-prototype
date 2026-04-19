import { browser } from '$app/environment';
import { io, type Socket } from 'socket.io-client';
import { realtimeClientLog } from './realtimeDebug';

let singleton: Socket | null = null;

/**
 * One Socket.IO client for the app (Vite dev + custom Node server). Reuse so `joinUser` / `joinProject` share a room.
 * On Vercel serverless, the server has no long-lived Socket.IO attach — connection fails and `+layout` falls back to polling.
 */
export function getRealtimeSocket(): Socket | null {
	if (!browser) return null;
	if (!singleton) {
		realtimeClientLog('creating Socket.IO client', { path: '/socket.io', origin: window.location.origin });
		singleton = io({
			path: '/socket.io',
			withCredentials: true,
			autoConnect: true
		});
	}
	return singleton;
}

/** @deprecated Use {@link getRealtimeSocket} */
export function createAppSocket(): Socket | null {
	return getRealtimeSocket();
}
