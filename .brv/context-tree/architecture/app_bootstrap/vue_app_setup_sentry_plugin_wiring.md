---
title: 'Vue App Setup: Sentry Plugin Wiring'
summary: setupApp registers Sentry plugin using VITE_SENTRY_DSN + PROD gating, sets up router/head/back navigation, optional playground in DEV, and optional Google sessions.
tags: []
related: [architecture/observability/sentry_lazy_initialization_facade_vue.md]
keywords: []
createdAt: '2026-04-22T06:22:52.055Z'
updatedAt: '2026-04-22T06:22:52.055Z'
---
## Reason
Capture how the application bootstrap wires the Sentry plugin and other boot-time integrations.

## Raw Concept
**Task:**
Document setupApp Vue bootstrap flow and Sentry integration point

**Changes:**
- Wired Sentry via sentryPlugin during app setup

**Files:**
- src/app/setupApp.ts

**Flow:**
createApp(MainApp) -> app.use(sentryPlugin, {dsn, enabled}) -> setupStackNavigation(router) -> (DEV: import playground) -> app.use(router) -> app.use(createHead(...)) -> app.use(backNavigationHandler) -> (if GOOGLE_CLIENT_ID) setupGoogleSessions -> return app

**Timestamp:** 2026-04-22

## Narrative
### Structure
setupApp is the Vue app bootstrap entry that registers sentryPlugin early, then configures stack navigation, router, head meta, back navigation handling, and optional integrations based on env/config flags.

### Dependencies
Uses @unhead/vue/client for head management, router from ./router, backNavigationHandler from @shared/lib/onBackNavigation, stack navigation from @page/routes, and Google session setup from @entity/googleSession.

### Highlights
Sentry enablement is explicitly PROD-only via import.meta.env.PROD. Dev playground is lazily loaded only in DEV to keep production boot minimal.

## Facts
- **setup_app_sentry_env**: setupApp uses sentryPlugin with dsn=import.meta.env.VITE_SENTRY_DSN and enabled=import.meta.env.PROD. [environment]
- **setup_app_dev_playground_imports**: In DEV, setupApp lazily imports @shared/lib/playground and ./playgroundPages using Promise.all. [convention]
- **setup_app_google_sessions_guard**: Google sessions are initialized only when GOOGLE_CLIENT_ID is truthy. [convention]

---

app.use(sentryPlugin, {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
});
