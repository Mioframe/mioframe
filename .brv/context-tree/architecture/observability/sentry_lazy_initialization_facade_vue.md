---
title: Sentry Lazy Initialization Facade (Vue)
summary: Defines a stable no-op Sentry facade with lazy async initialization, a Vue plugin for config registration, and one-time SDK init guarded by enabled+dsn checks.
tags: []
keywords: []
createdAt: '2026-04-22T06:22:52.050Z'
updatedAt: '2026-04-22T06:22:52.050Z'
---
## Reason
Document optional async Sentry runtime boundary and facade API for Vue apps.

## Raw Concept
**Task:**
Provide a safe Sentry runtime boundary with lazy initialization in Vue

**Changes:**
- Separated config registration from SDK loading
- Added stable no-op facade that can kick off lazy init
- Added Vue plugin to register config during app bootstrap
- Added tests for no-op facade, one-time init, and async init gap

**Files:**
- src/shared/lib/setupSentry.ts
- src/shared/lib/setupSentry.test.ts

**Flow:**
registerSentryConfig -> (optional) sentryPlugin.install(app, config) -> ensureSentry(app?) -> import(@sentry/vue) -> sentry.init(...) -> activeFacade delegates

**Timestamp:** 2026-04-22

## Narrative
### Structure
setupSentry.ts exports a facade-oriented API: registerSentryConfig(), ensureSentry(app?), setupSentry(app, dsn), useSentry(), and a Vue sentryPlugin. Module-level state (runtimeConfig, initPromise, activeFacade, appRef) makes SDK init idempotent and keeps call sites safe before init.

### Dependencies
Uses Vue types (App, Plugin) and @sentry/vue, but defers loading @sentry/vue until runtimeConfig is valid (enabled+dsn). Uses import.meta.env.PROD to suppress missing-config warnings in production.

### Highlights
useSentry() always returns a SentryFacade. Before configuration or while SDK import is pending, calls are handled by a no-op facade that returns undefined for capture* APIs and invokes span callbacks with undefined; it may kick off init once configuration becomes available.

### Rules
canInitializeSentry(config): config?.enabled === true && !!config.dsn
warnMissingConfigOnce(): return early if import.meta.env.PROD or already warned; otherwise console.warn("[sentry] Sentry is not configured. Calls will be ignored.")
kickoffSentryInitIfPossible(): if activeFacade or initPromise exist, do nothing; else if canInitializeSentry(runtimeConfig), call ensureSentry(appRef)

### Examples
sentry.init({ dsn, ...(appRef ? { app: appRef } : {}), integrations: [sentry.replayIntegration()], tracesSampleRate: 0.7, replaysSessionSampleRate: 0.7, replaysOnErrorSampleRate: 1.0 })

## Facts
- **sentry_lazy_import**: Sentry is loaded lazily via dynamic import("@sentry/vue"). [project]
- **sentry_init_guard**: Sentry initialization is allowed only when config.enabled === true and config.dsn is truthy. [convention]
- **sentry_missing_config_warning**: Missing Sentry config warns only once in dev and is silent in prod. [convention]
- **sentry_default_sample_rates**: Default Sentry sample rates are tracesSampleRate=0.7, replaysSessionSampleRate=0.7, replaysOnErrorSampleRate=1.0. [project]
- **sentry_singleton_init**: ensureSentry caches initialization with initPromise and returns a stable facade; repeated calls init only once. [convention]
- **sentry_plugin_install_behavior**: sentryPlugin registers runtime config and triggers ensureSentry(app) immediately when enabled+dsn are provided. [convention]

---

export type SentryConfig = { dsn?: string; enabled?: boolean; };
export type SentryFacade = {
  captureException: (...args: Parameters<SentryModule["captureException"]>) => ReturnType<SentryModule["captureException"]> | undefined;
  captureMessage: (...args: Parameters<SentryModule["captureMessage"]>) => ReturnType<SentryModule["captureMessage"]> | undefined;
  captureEvent: (...args: Parameters<SentryModule["captureEvent"]>) => ReturnType<SentryModule["captureEvent"]> | undefined;
  startSpan: <T>(options: Parameters<SentryModule["startSpan"]>[0], callback: (span: unknown | undefined) => T) => T | undefined;
  startSpanManual: <T>(options: Parameters<SentryModule["startSpanManual"]>[0], callback: (span: unknown | undefined, finish?: unknown) => T) => T | undefined;
  startInactiveSpan: (...args: Parameters<SentryModule["startInactiveSpan"]>) => ReturnType<SentryModule["startInactiveSpan"]> | undefined;
};
