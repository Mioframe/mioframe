---
title: Sentry Proxy Facade (Vue)
summary: 'Optional Sentry integration: stable Proxy-based facade over callable @sentry/vue exports with lazy init, warn-once missing config, and callback-safe span helpers.'
tags: []
related: [architecture/observability/sentry_lazy_initialization_facade_vue.md]
keywords: []
importance: 56
recency: 1
maturity: draft
accessCount: 2
createdAt: '2026-04-22T06:38:04.097Z'
updatedAt: '2026-04-22T06:38:04.097Z'
---
## Reason
Document optional/lazy Sentry integration implemented in src/shared/lib/setupSentry.ts with proxy-based facade and tests.

## Raw Concept
**Task:**
Optional Sentry facade for Vue using Proxy and lazy initialization

**Changes:**
- Replaced hand-maintained method list with Proxy that forwards all callable @sentry/vue exports
- Kept callback-sensitive methods callable in no-op mode via small internal special cases (withScope/startSpan/startSpanManual)
- Added concise TSDoc on exported runtime APIs
- Added/updated unit tests for no-op, warn-once, one-time init, delegation, and async-gap initialization

**Files:**
- src/shared/lib/setupSentry.ts
- src/shared/lib/setupSentry.test.ts

**Flow:**
registerSentryConfig -> (optional) sentryPlugin.install -> useSentry() returns stable facade -> facade call triggers kickoffSentryInitIfPossible -> ensureSentry lazily imports @sentry/vue -> Sentry.init -> subsequent facade calls delegate to SDK

**Timestamp:** 2026-04-22

## Narrative
### Structure
src/shared/lib/setupSentry.ts defines a function-only SentryFacade type, creates a single Proxy instance (sentryFacade), and exposes registerSentryConfig(), ensureSentry(), setupSentry(), useSentry(), and sentryPlugin. Tests in src/shared/lib/setupSentry.test.ts mock @sentry/vue to validate behavior across no-config and initialized modes.

### Dependencies
Depends on Vue (App, Plugin types) and dynamically imports @sentry/vue. Uses import.meta.env.PROD to gate dev-only warnings.

### Highlights
The facade is stable (same object reference) before and after initialization, minimizing call-site branching. Proxy forwarding automatically supports new callable SDK exports without updating a curated list. Callback-based span helpers still execute wrapped work in no-op mode to avoid breaking call sites.

### Rules
Initialization is allowed only when runtimeConfig.enabled === true and runtimeConfig.dsn is truthy.
When Sentry is unavailable, most SDK calls return undefined; startSpan and startSpanManual call their callbacks with undefined span (and a NOOP finish for startSpanManual).

## Facts
- **sentry_facade**: Sentry integration is optional and lazily initialized via a stable Proxy facade returned by useSentry(). [project]
- **sentry_init_condition**: Sentry initializes only when config.enabled === true and config.dsn is present. [project]
- **sentry_ensure_once**: ensureSentry(app?) lazily imports @sentry/vue and initializes the SDK once, caching the init promise and loaded module. [project]
- **sentry_warn_once**: In dev, missing config triggers a warn-once message: "[sentry] Sentry is not configured. Calls will be ignored." [project]
- **sentry_proxy_then_guard**: Proxy get trap ignores non-string props and "then" to avoid thenable behavior. [project]
- **sentry_noop_callback_helpers**: No-op fallback preserves callback execution for startSpan and startSpanManual when Sentry is unavailable. [project]
- **sentry_default_sampling**: Sentry.init uses replayIntegration() and default sample rates: traces 0.7, replaysSession 0.7, replaysOnError 1.0. [project]
