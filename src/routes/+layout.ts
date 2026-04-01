/**
 * This prototype uses module-level `$state` / `$effect` in `appState.svelte.ts`, which does not
 * behave reliably during SSR. Turn off SSR so the app renders only in the browser (fixes HTTP 500).
 */
export const ssr = false;
