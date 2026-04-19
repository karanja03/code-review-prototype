import { browser } from '$app/environment';

/** Browser console helper. Filter DevTools by `[realtime]`. Silence with `localStorage.setItem('REALTIME_DEBUG','0')`. */
export function realtimeClientLog(...args: unknown[]): void {
	if (!browser) return;
	if (typeof localStorage !== 'undefined' && localStorage.getItem('REALTIME_DEBUG') === '0') return;
	console.info('[realtime]', ...args);
}
