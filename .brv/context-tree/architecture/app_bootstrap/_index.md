---
children_hash: 523e6b9cb9adff1a886e67385514d4e77c76306e7c76475af6ed4d2c822e4c86
compression_ratio: 0.7402597402597403
condensation_order: 1
covers: [vue_app_setup_sentry_plugin_wiring.md]
covers_token_total: 539
summary_level: d1
token_count: 399
type: summary
---
## architecture/app_bootstrap — Level d1 Structural Summary

### Vue App Setup: Sentry Plugin Wiring (`vue_app_setup_sentry_plugin_wiring.md`)
- **Primary scope:** Documents the Vue bootstrap entrypoint `setupApp` and where/how **Sentry** is wired during app initialization.
- **Key file:** `src/app/setupApp.ts`
- **Bootstrap flow (ordered):**
  - `createApp(MainApp)`
  - `app.use(sentryPlugin, { dsn, enabled })`
    - `dsn = import.meta.env.VITE_SENTRY_DSN`
    - `enabled = import.meta.env.PROD` (**PROD-only gating**)
  - `setupStackNavigation(router)`
  - **DEV-only:** lazy-load playground modules via `Promise.all([import('@shared/lib/playground'), import('./playgroundPages')])`
  - `app.use(router)`
  - `app.use(createHead(...))` (head/meta management via `@unhead/vue/client`)
  - `app.use(backNavigationHandler)` (from `@shared/lib/onBackNavigation`)
  - **Optional:** `setupGoogleSessions` only if `GOOGLE_CLIENT_ID` is truthy (from `@entity/googleSession`)
  - `return app`
- **Architectural decisions/patterns:**
  - **Early plugin registration:** Sentry is registered *early* in bootstrap (before router/head/back navigation).
  - **Environment-gated integrations:** Sentry enabled only in production; playground imported only in development to keep production boot minimal.
  - **Config-flag optionality:** Google sessions are guarded by presence of `GOOGLE_CLIENT_ID`.
- **Relationships:**
  - Related to Sentry initialization design in `architecture/observability/sentry_lazy_initialization_facade_vue.md` (drill down there for deeper observability/Sentry lifecycle details).