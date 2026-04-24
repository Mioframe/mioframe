## Key points
- Provides a **stable Sentry facade** for Vue apps that is **safe to call before Sentry is configured or loaded** (no-op behavior during the async gap).
- Implements **lazy, async loading** of `@sentry/vue` via `import("@sentry/vue")` only when configuration is valid (`enabled === true` and `dsn` is truthy).
- Separates **config registration** from **SDK initialization**: register config during bootstrap, initialize later (or immediately via plugin).
- Ensures **one-time SDK initialization** using module-level state (`initPromise`, `activeFacade`, `runtimeConfig`, `appRef`) to make init **idempotent** across repeated calls.
- Emits a **missing-config warning only once in development**, suppressed in production via `import.meta.env.PROD`.
- Includes tests covering **no-op facade**, **single init**, and **async initialization gap** behavior.

## Structure / sections summary
- **Reason**: Documents an optional async Sentry runtime boundary and facade API for Vue.
- **Raw Concept**
  - Task: safe Sentry boundary with lazy initialization.
  - Changes: config registration split from SDK loading; stable no-op facade; Vue plugin for bootstrap registration; tests added.
  - Files: `src/shared/lib/setupSentry.ts`, `src/shared/lib/setupSentry.test.ts`.
  - Flow: `registerSentryConfig` → optional `sentryPlugin.install(app, config)` → `ensureSentry(app?)` → dynamic import `@sentry/vue` → `sentry.init(...)` → facade delegates.
- **Narrative**
  - Structure: exports facade-oriented API (`registerSentryConfig`, `ensureSentry`, `setupSentry`, `useSentry`, `sentryPlugin`) backed by module-level singleton state.
  - Dependencies: Vue `App`/`Plugin`; `@sentry/vue` deferred until config is valid; prod/dev warning behavior.
  - Highlights: `useSentry()` always returns a `SentryFacade`; no-op facade returns `undefined` for capture APIs and calls span callbacks with `undefined`; may kick off init when possible.
  - Rules: initialization eligibility, one-time warning, and init kickoff guard.
  - Examples: shows default `sentry.init` options including sample rates and replay integration.
- **Facts**: Enumerates explicit conventions (lazy import, init guard, warn-once, default sample rates, singleton init, plugin behavior).
- **Types**: Defines `SentryConfig` and `SentryFacade` method surface with `undefined` return allowances pre-init.

## Notable entities, patterns, or decisions mentioned
- **Entities / APIs**
  - Functions: `registerSentryConfig()`, `ensureSentry(app?)`, `setupSentry(app, dsn)`, `useSentry()`.
  - Plugin: `sentryPlugin` (Vue `Plugin`) to register config during app bootstrap and trigger init when eligible.
  - Types: `SentryConfig = { dsn?: string; enabled?: boolean }`; `SentryFacade` exposing `captureException`, `captureMessage`, `captureEvent`, `startSpan`, `startSpanManual`, `startInactiveSpan`.
- **Patterns**
  - **Facade pattern with no-op implementation** to keep call sites safe across an **async runtime boundary**.
  - **Lazy dynamic import** of `@sentry/vue` to avoid loading/initializing unless configured.
  - **Singleton/idempotent initialization** using cached `initPromise` plus `activeFacade` gating.
- **Key decisions / rules**
  - **Init guard**: only initialize when `config.enabled === true` and `config.dsn` is truthy (`canInitializeSentry`).
  - **Warn-once behavior**: `console.warn("[sentry] Sentry is not configured...")` only once in dev; **no warnings in prod** (`import.meta.env.PROD`).
  - **Kickoff logic**: `kickoffSentryInitIfPossible()` does nothing if already initialized or initializing; otherwise calls `ensureSentry(appRef)` when config becomes valid.
  - **Default Sentry settings**: `tracesSampleRate = 0.7`, `replaysSessionSampleRate = 0.7`, `replaysOnErrorSampleRate = 1.0`, and includes `sentry.replayIntegration()`.
  - **Plugin install behavior**: registers config and triggers `ensureSentry(app)` immediately when `enabled+dsn` are present.