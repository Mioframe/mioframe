## Key points
- Implements **optional, lazy Sentry integration for Vue** via a **stable Proxy-based facade** returned by `useSentry()`, avoiding call-site branching.
- **Initialization is gated**: Sentry only initializes when `runtimeConfig.enabled === true` **and** `runtimeConfig.dsn` is truthy.
- `ensureSentry(app?)` **dynamically imports** `@sentry/vue`, calls `Sentry.init`, and **runs only once** by caching both the loaded module and the init promise.
- In **dev only** (`import.meta.env.PROD` gating), missing config emits a **warn-once**: `"[sentry] Sentry is not configured. Calls will be ignored."`
- The Proxy **forwards all callable `@sentry/vue` exports**, removing the need for a hand-maintained method list and automatically supporting new callable SDK exports.
- **Callback-sensitive span helpers** (`withScope`, `startSpan`, `startSpanManual`) have special no-op behavior that still **executes callbacks** to keep call sites safe even when Sentry is unavailable.

## Structure / sections summary
- **Reason**
  - States the goal: document the optional/lazy Sentry integration in `src/shared/lib/setupSentry.ts` and its tests.
- **Raw Concept**
  - Task definition and a change list (Proxy forwarding, special cases for callback methods, TSDoc, tests).
  - Identifies modified files and provides a high-level runtime flow.
- **Narrative**
  - **Structure**: lists exported APIs and notes a single Proxy instance; tests mock `@sentry/vue`.
  - **Dependencies**: Vue types, dynamic import of `@sentry/vue`, and dev/prod warning gating.
  - **Highlights**: stable facade reference, Proxy future-proofing, callback helpers safe in no-op mode.
  - **Rules**: explicit init condition and defined no-op return/callback semantics.
- **Facts**
  - Enumerates the key design decisions and default init settings (warn-once, then-guard, sampling defaults).

## Notable entities, patterns, or decisions mentioned
- **Entities / modules**
  - File: `src/shared/lib/setupSentry.ts`
  - Tests: `src/shared/lib/setupSentry.test.ts`
  - External SDK: `@sentry/vue` (dynamic import)
  - Vue types: `App`, `Plugin`
  - Exported runtime APIs: `registerSentryConfig()`, `ensureSentry()`, `setupSentry()`, `useSentry()`, `sentryPlugin`, plus the `SentryFacade` type.
- **Patterns**
  - **Proxy facade** with a `get` trap to forward callable exports from `@sentry/vue`.
  - **Stable object identity**: same facade reference pre- and post-initialization.
  - **Lazy initialization** with cached module + cached init promise (`ensure once` semantics).
  - **Thenable guard**: Proxy ignores property `"then"` (and non-string props) to prevent the facade from being treated like a Promise/thenable.
  - **No-op behavior with callback preservation** for span helpers to avoid breaking wrapped work.
- **Decisions / behaviors**
  - **Init condition**: only when `enabled === true` and `dsn` is present.
  - **Dev-only warn-once** when missing config; production avoids warning noise.
  - **No-op return policy**: most SDK calls return `undefined` when unavailable; `startSpan` / `startSpanManual` invoke callbacks with `undefined` span (and `startSpanManual` provides a **NOOP `finish`**).
  - **Default sampling/integrations** in `Sentry.init`: `replayIntegration()` plus sample rates `tracesSampleRate: 0.7`, `replaysSessionSampleRate: 0.7`, `replaysOnErrorSampleRate: 1.0`.
  - **Runtime flow**: `registerSentryConfig` → optional `sentryPlugin.install` → `useSentry()` (facade) → facade call triggers `kickoffSentryInitIfPossible` → `ensureSentry` imports `@sentry/vue` → `Sentry.init` → subsequent calls delegate to SDK.