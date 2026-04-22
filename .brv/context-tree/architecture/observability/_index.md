---
children_hash: b637739d097062169be54df48cc0a5c8e7ac2b39b66163ed6a4a6eb2cb58e5c2
compression_ratio: 0.47737909516380655
condensation_order: 1
covers: [sentry_lazy_initialization_facade_vue.md, sentry_proxy_facade_vue.md]
covers_token_total: 1923
summary_level: d1
token_count: 918
type: summary
---
## Observability → Optional Sentry integration for Vue (`setupSentry.ts`)

Two related entries document an optional, safe-to-call Sentry boundary for Vue apps implemented in `src/shared/lib/setupSentry.ts` with tests in `src/shared/lib/setupSentry.test.ts`. Both designs share the same lifecycle and guardrails: **Sentry loads lazily via `import("@sentry/vue")` and initializes only when `config.enabled === true` and `config.dsn` is truthy**, with **warn-once missing-config behavior in dev** (silent in `import.meta.env.PROD`).

### Common runtime API + lifecycle (both entries)
- **Exports / call sites**
  - `registerSentryConfig(config)`
  - `ensureSentry(app?)` (idempotent; caches `initPromise`)
  - `setupSentry(app, dsn)` (convenience initializer)
  - `useSentry()` → returns a **stable facade** (safe before/after init)
  - `sentryPlugin` (Vue `Plugin`) → registers config during app bootstrap
- **Initialization flow**
  - `registerSentryConfig` → optional `sentryPlugin.install(app, config)` → `useSentry()` returns facade
  - Facade may trigger `kickoffSentryInitIfPossible` → `ensureSentry(app?)`
  - `ensureSentry` → `import("@sentry/vue")` → `sentry.init({ dsn, app?, integrations: [sentry.replayIntegration()], tracesSampleRate: 0.7, replaysSessionSampleRate: 0.7, replaysOnErrorSampleRate: 1.0 })`
- **Behavior before init / missing config**
  - Most capture/start APIs return `undefined` in no-op mode.
  - Missing configuration warning (dev-only, once): `"[sentry] Sentry is not configured. Calls will be ignored."`

---

## Entry: `sentry_lazy_initialization_facade_vue.md` (hand-authored facade type)
- **Facade shape (explicit method list)**
  - Defines `SentryConfig` and a typed `SentryFacade` with explicit functions:
    - `captureException`, `captureMessage`, `captureEvent`
    - `startSpan<T>(options, callback) => T | undefined`
    - `startSpanManual<T>(options, callback) => T | undefined`
    - `startInactiveSpan(...)`
- **Module-level state ensures safety + idempotence**
  - Maintains `runtimeConfig`, `initPromise`, `activeFacade`, and `appRef`.
  - `useSentry()` always returns a `SentryFacade`; no-op facade runs callbacks with `undefined` span while init is pending/unavailable.
- **Guardrails / rules**
  - `canInitializeSentry(config): config?.enabled === true && !!config.dsn`
  - `warnMissingConfigOnce()` is suppressed in production.
  - `kickoffSentryInitIfPossible()` avoids double-init if `activeFacade` or `initPromise` already exist.

---

## Entry: `sentry_proxy_facade_vue.md` (Proxy-based forwarding facade)
- **Key architectural decision**
  - Replaces a hand-maintained method list with a **single stable `Proxy` facade** that forwards *all callable* `@sentry/vue` exports once initialized, reducing maintenance when the SDK adds new functions.
- **No-op compatibility for callback-sensitive APIs**
  - Keeps internal special cases so `withScope`, `startSpan`, and `startSpanManual` remain callable in no-op mode (callbacks still execute; `startSpanManual` provides a NOOP `finish`).
- **Proxy safety rule**
  - Proxy `get` trap ignores non-string props and `"then"` to avoid accidental “thenable” behavior.
- **Tests**
  - Tests validate no-op behavior, warn-once, one-time init, delegation after init, and “async-gap” initialization (facade calls made before the SDK finishes loading).

---

## Relationships / drill-down
- `sentry_proxy_facade_vue.md` explicitly relates to `sentry_lazy_initialization_facade_vue.md` and represents an evolution: **same public runtime boundary and init guards**, but **Proxy-based forwarding** to avoid curated method lists while preserving safe callback execution in no-op mode.