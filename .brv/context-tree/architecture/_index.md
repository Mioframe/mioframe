---
children_hash: ebb80f3ad67671e51a6485909a1bdbdadce966fdad45c1611fc9ff6980fcba6f
compression_ratio: 0.744345442083619
condensation_order: 2
covers: [app_bootstrap/_index.md, observability/_index.md]
covers_token_total: 1459
summary_level: d2
token_count: 1086
type: summary
---
## architecture — Level d2 Structural Summary

### app_bootstrap (`app_bootstrap/_index.md` → `vue_app_setup_sentry_plugin_wiring.md`)
- **Purpose:** Documents Vue app bootstrap sequence and **where Sentry is wired** during initialization.
- **Primary file:** `src/app/setupApp.ts`
- **Bootstrap flow (ordered, key decisions preserved):**
  - `createApp(MainApp)`
  - **Sentry registered early:** `app.use(sentryPlugin, { dsn, enabled })`
    - `dsn = import.meta.env.VITE_SENTRY_DSN`
    - `enabled = import.meta.env.PROD` (**production-only gating**)
  - `setupStackNavigation(router)`
  - **DEV-only playground modules:** `Promise.all([import('@shared/lib/playground'), import('./playgroundPages')])`
  - `app.use(router)`
  - `app.use(createHead(...))` via `@unhead/vue/client`
  - `app.use(backNavigationHandler)` from `@shared/lib/onBackNavigation`
  - **Optional Google sessions:** `setupGoogleSessions` only if `GOOGLE_CLIENT_ID` is truthy (from `@entity/googleSession`)
  - `return app`
- **Relationship:** Bootstrap uses `sentryPlugin` from the shared Sentry boundary (see `observability/_index.md` → `sentry_lazy_initialization_facade_vue.md`, `sentry_proxy_facade_vue.md`).

---

### observability (`observability/_index.md` → `sentry_lazy_initialization_facade_vue.md`, `sentry_proxy_facade_vue.md`)
- **Purpose:** Defines an **optional, safe-to-call Sentry integration boundary** for Vue that is resilient to missing config and safe before SDK load.
- **Key implementation + tests:**
  - Implementation: `src/shared/lib/setupSentry.ts`
  - Tests: `src/shared/lib/setupSentry.test.ts`
- **Common runtime API (shared across both entries):**
  - Config/bootstrapping: `registerSentryConfig(config)`, `setupSentry(app, dsn)`, `sentryPlugin` (Vue `Plugin`)
  - Lifecycle/usage: `ensureSentry(app?)` (idempotent; caches `initPromise`), `useSentry()` (returns stable facade)
- **Common initialization lifecycle + guardrails:**
  - **Lazy-load:** `import("@sentry/vue")`
  - **Init condition:** only when `config.enabled === true` and `config.dsn` is truthy
  - **Warn-once missing config:** dev-only message `"[sentry] Sentry is not configured. Calls will be ignored."` (suppressed in `import.meta.env.PROD`)
  - **Sentry init parameters (core decision):**
    - `sentry.init({ dsn, app?, integrations: [sentry.replayIntegration()], tracesSampleRate: 0.7, replaysSessionSampleRate: 0.7, replaysOnErrorSampleRate: 1.0 })`
  - **No-op behavior pre-init/unconfigured:** capture/start APIs return `undefined`, but callback-based APIs still execute callbacks safely.

#### `sentry_lazy_initialization_facade_vue.md` (typed, explicit facade)
- **Architectural approach:** hand-authored `SentryFacade` with an explicit method list.
- **Facade methods (explicit surface):**
  - `captureException`, `captureMessage`, `captureEvent`
  - `startSpan<T>(options, callback) => T | undefined`
  - `startSpanManual<T>(options, callback) => T | undefined`
  - `startInactiveSpan(...)`
- **Safety/idempotence via module state:** `runtimeConfig`, `initPromise`, `activeFacade`, `appRef`
- **Key rule:** `canInitializeSentry(config): config?.enabled === true && !!config.dsn`
- **No-op contract:** in no-op mode, callbacks still run with `undefined` span while init is pending/unavailable.

#### `sentry_proxy_facade_vue.md` (Proxy forwarding facade; evolution)
- **Architectural decision:** replace explicit method list with a **stable `Proxy` facade** that forwards callable `@sentry/vue` exports post-init, reducing maintenance as SDK APIs evolve.
- **No-op compatibility preserved for callback APIs:** special handling so `withScope`, `startSpan`, `startSpanManual` remain callable even when unconfigured; `startSpanManual` provides a NOOP `finish`.
- **Proxy safety rule:** ignore non-string props and `"then"` to prevent thenable/await confusion.
- **Test coverage emphasis:** validates no-op behavior, warn-once, one-time init, delegation after init, and calls made before SDK load completes (“async-gap” behavior).

--- 

### Cross-entry pattern (app_bootstrap ↔ observability)
- `src/app/setupApp.ts` wires `sentryPlugin` early with env-derived config, while `src/shared/lib/setupSentry.ts` enforces **lazy initialization + safe facade usage** so Sentry calls remain safe across the app even when Sentry is disabled, unconfigured, or still loading.