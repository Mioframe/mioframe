## Key points
- `setupApp` is the Vue bootstrap entrypoint that wires **Sentry early** via `app.use(sentryPlugin, { dsn, enabled })`.
- Sentry configuration uses **`VITE_SENTRY_DSN`** for DSN and is **explicitly enabled only in production** via `import.meta.env.PROD`.
- Boot sequence configures **stack navigation**, then registers **router**, **head/meta management**, and **back navigation handling**.
- In **DEV only**, a **playground** is lazily loaded via `Promise.all` to keep production boot minimal.
- **Google sessions** initialization is **conditional** on a truthy `GOOGLE_CLIENT_ID`.

## Structure / sections summary
- **Reason**: States the goal—document how bootstrap wires Sentry and other boot-time integrations.
- **Raw Concept**
  - **Task / Changes / Files**: Focused on wiring Sentry via `sentryPlugin` in `src/app/setupApp.ts`.
  - **Flow**: Lists the ordered bootstrap steps from `createApp(MainApp)` through optional DEV/Google features and returning the app instance.
  - **Timestamp**: 2026-04-22.
- **Narrative**
  - **Structure**: Describes high-level ordering and “Sentry first” registration.
  - **Dependencies**: Enumerates major imported modules used during setup.
  - **Highlights**: Calls out PROD gating for Sentry and DEV-only lazy playground import.
- **Facts**: Three tagged conventions/guards around Sentry env wiring, DEV playground imports, and Google sessions guard.
- **Code snippet**: Shows the exact `sentryPlugin` configuration (`dsn`, `enabled`).

## Notable entities, patterns, or decisions
- **Entities / modules**
  - `setupApp` (bootstrap entrypoint), `MainApp`
  - `sentryPlugin`
  - `router` (`./router`)
  - `createHead` from `@unhead/vue/client`
  - `backNavigationHandler` from `@shared/lib/onBackNavigation`
  - `setupStackNavigation` from `@page/routes`
  - `setupGoogleSessions` from `@entity/googleSession`
  - DEV playground modules: `@shared/lib/playground`, `./playgroundPages`
- **Environment/config decisions**
  - Sentry DSN sourced from `import.meta.env.VITE_SENTRY_DSN`
  - Sentry enablement strictly `import.meta.env.PROD` (PROD-only)
  - Playground loaded only when in DEV (`import.meta.env.DEV` implied by doc)
  - Google sessions only when `GOOGLE_CLIENT_ID` is present/truthy
- **Integration patterns**
  - **Early plugin registration** (Sentry registered before router/head/back-nav)
  - **Conditional, lazy loading** for dev tooling via `Promise.all` imports
  - **Bootstrap flow** returns the configured `app` instance after all setup steps