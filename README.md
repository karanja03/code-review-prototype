# Code Review Sprint (//kood prototype)

Low-fidelity **SvelteKit + Tailwind** prototype for the peer learning journey: collapsible project brief → phased sidebar → testing checklist → structured **code review sprint** (four categories, FIFO assign to Jane/Joe, read-only cross-visibility) → standup → accept → 360° feedback. State persists in `localStorage`.

## Svelte vs Vite

This app is **Svelte** (with **SvelteKit**). **Vite** is only the dev server and bundler underneath, like a motor for the car — you still write `.svelte` components. Messages like `VITE v… ready` are normal.

## Run

```sh
npm install
npm run dev
```

If you ever see **HTTP 500** on the first load, pull the latest changes: the root layout disables **SSR** (`src/routes/+layout.ts`) so client-only state works reliably. Dependencies use **Vite 6** so **Node 20.17** is supported without engine warnings from Vite 7.

Use **Act as** (Sandra / Jane / Joe) to switch personas. **Show demo jumps** (bottom-left) jumps phases or resets the prototype.

### Source layout

- `src/lib/ui/` — shared primitives (`Accordion`, `Modal`, `ToastStack`)
- `src/lib/features/testing/` — testing checklist, collapsible rows, `testingUtils`, `checklist`
- `src/lib/features/briefing/` — project brief + `messenger/FunctionalRequirements.svelte`
- `src/lib/features/shell/` — curriculum nav, workflow panel, sidebar meta, role switcher
- `src/lib/features/code-review/` — sprint + category panels + 7-day rhythm
- `src/lib/features/project-flow/` — completion, standup, accept, 360° feedback
- `src/lib/appState.svelte.ts` — global prototype state + persistence keys

---

## Scaffold notes

Powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.13.1 create --template minimal --types ts --add tailwindcss="plugins:none" --install npm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
