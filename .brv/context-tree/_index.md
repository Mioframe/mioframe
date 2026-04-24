---
children_hash: 1c675769bd8550b96c235feea19475199e2c43b05d4cfbda37865ec6bc1f3a04
compression_ratio: 0.32437685799222504
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, governance/_index.md, project_guidance/_index.md, repo_guidelines/_index.md]
covers_token_total: 8746
summary_level: d3
token_count: 2837
type: summary
---
## Level d3 Structural Summary of Provided Knowledge

### 1) Architecture (`architecture/_index.md`)
**Scope:** Vue app bootstrap and observability/Sentry integration boundary.

- **App bootstrap & Sentry wiring** (`app_bootstrap/_index.md` → `vue_app_setup_sentry_plugin_wiring.md`)
  - **Primary file:** `src/app/setupApp.ts`
  - **Bootstrap sequence (ordered):**
    - `createApp(MainApp)`
    - Register Sentry **early**: `app.use(sentryPlugin, { dsn, enabled })`
      - `dsn = import.meta.env.VITE_SENTRY_DSN`
      - `enabled = import.meta.env.PROD` (production-only gating)
    - `setupStackNavigation(router)`
    - DEV-only playground modules via dynamic imports: `Promise.all([import('@shared/lib/playground'), import('./playgroundPages')])`
    - `app.use(router)`
    - `app.use(createHead(...))` from `@unhead/vue/client`
    - `app.use(backNavigationHandler)` from `@shared/lib/onBackNavigation`
    - Optional Google sessions: `setupGoogleSessions` only if `GOOGLE_CLIENT_ID` is truthy (`@entity/googleSession`)
    - `return app`
  - **Relationship:** `sentryPlugin` comes from the shared Sentry boundary (see `observability/_index.md`).

- **Observability: Sentry integration boundary** (`observability/_index.md` → `sentry_lazy_initialization_facade_vue.md`, `sentry_proxy_facade_vue.md`)
  - **Implementation:** `src/shared/lib/setupSentry.ts`
  - **Tests:** `src/shared/lib/setupSentry.test.ts`
  - **Shared public runtime API:**
    - Configuration/bootstrap: `registerSentryConfig(config)`, `setupSentry(app, dsn)`, `sentryPlugin` (Vue `Plugin`)
    - Lifecycle/use: `ensureSentry(app?)` (idempotent, caches `initPromise`), `useSentry()` (stable facade)
  - **Core architectural decisions / guardrails:**
    - Lazy-load SDK: `import("@sentry/vue")`
    - Initialize only if **enabled + DSN**: `config.enabled === true && !!config.dsn`
    - Dev-only warn-once when missing config: `"[sentry] Sentry is not configured. Calls will be ignored."` (suppressed in `import.meta.env.PROD`)
    - Standard init parameters:
      - `sentry.init({ dsn, app?, integrations: [sentry.replayIntegration()], tracesSampleRate: 0.7, replaysSessionSampleRate: 0.7, replaysOnErrorSampleRate: 1.0 })`
    - **No-op safety contract:** pre-init or unconfigured calls are safe; callback-based APIs still execute callbacks.

  - **Facade variant A: typed explicit facade** (`sentry_lazy_initialization_facade_vue.md`)
    - Hand-authored `SentryFacade` with explicit methods:
      - `captureException`, `captureMessage`, `captureEvent`
      - `startSpan<T>(options, callback) => T | undefined`
      - `startSpanManual<T>(options, callback) => T | undefined`
      - `startInactiveSpan(...)`
    - Module state for idempotence/safety: `runtimeConfig`, `initPromise`, `activeFacade`, `appRef`
    - Gate function: `canInitializeSentry(config): config?.enabled === true && !!config.dsn`
    - No-op mode still runs callbacks (span may be `undefined`).

  - **Facade variant B: Proxy forwarding facade (evolution)** (`sentry_proxy_facade_vue.md`)
    - Replace explicit method list with a **stable `Proxy` facade** that forwards to `@sentry/vue` post-init (reduces maintenance as SDK evolves).
    - Preserves no-op compatibility for callback-style APIs:
      - Special handling for `withScope`, `startSpan`, `startSpanManual` (incl. `startSpanManual` NOOP `finish`).
    - Proxy safety: ignore non-string props and `"then"` (avoid thenable/await confusion).
    - Tests emphasize: no-op behavior, warn-once, one-time init, delegation after init, and “async-gap” (calls before SDK import completes).

- **Cross-entry pattern (bootstrap ↔ observability)**
  - `src/app/setupApp.ts` wires `sentryPlugin` early using env config, while `src/shared/lib/setupSentry.ts` enforces **lazy init + safe facade**, ensuring Sentry calls are safe even when disabled/unconfigured/still loading.

---

### 2) Facts (domain) (`facts/_index.md`)
**Scope:** durable project-level facts and conventions intended for recall and consistent decision-making.

- **Domain intent** (`facts/context.md`)
  - Stores stable **project facts**: tech/architecture facts, testing expectations, environment constraints, durable conventions.
  - Excludes personal profile facts and detailed implementation notes.

- **Architecture → testing synthesis** (`local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`)
  - Product premise: **local-first**, **offline by default**, **no registration**, **no hosted backend**.
  - Cross-device workflow: **file-based export/import** with **CRDT merges**.
  - Derived testing convention (linked to `facts/project/testing_preferences.md` via index):
    - Prefer **fast, isolated, in-memory unit tests**.
    - Avoid external deps (real DB/network/services) in unit-test layer; use fakes/in-memory repos/pure functions.

- **Testing preferences index** (`facts/project/_index.md`)
  - Canonical rule (from `testing_preferences.md`): **“Unit tests should stay fast and in-memory.”**
  - Metadata noted: timestamp `2026-04-17`, author `user`, maturity `core` (importance 85).
  - Process framing: `test execution -> in-memory isolation -> fast feedback`

---

### 3) Governance / Repo-wide policy (`governance/_index.md` → `repo_guidelines/_index.md` → `agents_repository_policy.md`)
**Scope:** canonical repository-wide AGENTS.md policy (Feature-Sliced Design boundaries, verification, naming, and process conventions).

- **Canonical policy entry** (`agents_repository_policy.md`)
  - **Applies repo-wide** unless overridden by deeper `AGENTS.md` (inheritance model).
  - **FSD layers & responsibilities:**
    - `src/app`: bootstrap/routing/global shells/styles
    - `src/pages`: route/pane composition + navigation state
    - `src/widgets`: screen-scale composition
    - `src/features`: user-triggered flows (dialogs/forms/menus/destructive actions)
    - `src/entities`: domain read models/typed access patterns/small reusable UI
    - `src/shared`: cross-layer infra/background services/schemas/utils/shared UI
  - **Dependency direction constraints:**
    - `shared` must not import upper layers
    - `entities` may import only `shared`
    - `features` build on `entities` + `shared`
    - `widgets` may compose `features`/`entities`/`shared` but should not own domain rules
    - Prefer importing via public `index.ts` entry points where available
    - UI layers may access background logic only through explicit proxy clients (no direct `*Service` imports into UI layers/shared UI)
  - **Verification & tooling decisions:**
    - Use `pnpm`
    - After edits run the **narrowest relevant verification**:
      - logic changes: at least `pnpm type-check`
      - plus targeted `vitest` / Playwright / smoke checks when behavior/schema/service/storage changes
    - If tests are created/modified: run **narrowest relevant mutation check** for touched scope (in addition to functional verification)
    - Prefer targeted `oxlint`, `eslint --fix`, `oxfmt` over repo-wide runs
    - Use **Conventional Commits**
    - Unit tests colocated as sibling `*.test.ts`; no `__tests__` directories
  - **Runtime/UI contract rules:**
    - Treat DOM parentage, scroll ownership, focus, teleport/overlay wiring as concrete contracts; verify rendered hierarchy before refactors
    - Optimize for Material 3 + mobile-first; assume large datasets/low-end devices; bound main-thread work
    - Keep component/composable contracts narrow (IDs/primitives/small display records; explicit emits/slots)
    - Manage lifecycle resources (subscriptions/listeners/workers/timers/caches/file handles/blob URLs)
    - Prefer typed collection helpers over raw `Object.keys/values/entries`; avoid type assertions except boundary adapters
  - **CRDT mutation constraints:**
    - Mutate live nested objects inside owning change callback; never assign live document object back into itself
    - Prefer shared helpers: `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`
  - **Naming conventions (high signal subset):**
    - Dirs: `pages` and `widgets` PascalCase; others lower camel case
    - Files: Vue components/class-centric PascalCase; other TS lower camel/lowercase
    - Feature modules named by user actions (`<domain><Action>`); entities by stable domain concepts
    - UI component suffixes: `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`; avoid vague `Manager`/`Helper`
    - Reserved semantics: `MD*` (Material primitives), `use*`/`setup*`/`define*`/`create*`/`get*`/`is*`/`zod*`, `*Service` (background infra), `$` suffix (raw RxJS observables), `on*` handlers
  - **Related drill-down references:** points to `architecture/feature_sliced_design/context.md` and `facts/project/testing_preferences.md` (not included here, but explicitly linked).

---

### 4) Project Guidance (`project_guidance/_index.md`)
**Scope:** user-facing product documentation decisions and README positioning, with a deliberate link to durable conventions in `facts/`.

- **Documentation policy** (`documentation-policy-keep-guidance-platform-neutral-and-align-test-guidance-with.md`)
  - Decision: treat key guidance as **durable conventions** (stable rules), not transient examples.
  - Require **platform-neutral** language in docs for portability.
  - Concrete change (2026-04-18): removed Apple-specific **AirDrop** mentions in `README.md` and `README.ru.md`, replaced with generic file-transfer terminology.
  - Relationship: bridges `project_guidance` ↔ `facts` (especially testing conventions).

- **README index** (`readme/_index.md` → `product_positioning_and_feature_overview.md`)
  - Product stance: **local-first personal data app**, not a cloud service; **offline-by-default**, **no registration**, **no hosted backend**.
  - Storage backends: **Browser OPFS** and **user-selected local folder**.
  - Sync/merge workflow: file-transfer sync (export/import JSON) + **CRDT-based merges**.
  - Doc structure decision: README is for positioning/roadmap; `DEVELOPMENT.md` for setup/tooling.
  - Licensing: **Functional Source License (FSL)** with a **3-year non-compete** term.
  - Related drill-down: references `repo_guidelines/package_scripts/context.md` for scripts/tooling conventions.

---

### 5) Repo Guidelines (agents guidance view) (`repo_guidelines/_index.md`)
**Scope:** an alternative index framing for agent guidance, pointing to:
- **Repository-wide agent policy** (`repository_agents_policy.md`) — overlaps with `agents_repository_policy.md` (same core: FSD boundaries, verification, naming, CRDT rules).
- **`src/shared/lib` specific guidance** (`src_shared_lib_agents_guidelines.md`)
  - `src/shared/lib` contains reusable non-UI helpers, storage/filesystem abstractions, schema helpers, typed wrappers around browser/third-party APIs, migrations, composables/adapters.
  - Constraints:
    - Keep modules small/single-responsibility; avoid vague “utility” buckets.
    - Wrap platform/3P APIs behind typed contracts; keep parsing/validation at the boundary.
    - Composables/adapters must specify lifecycle behavior (cleanup/cancellation/resubscribe/memory profile).
    - Must not import upper layers; shared/lib changes have broad blast radius.
    - Exported functions require concise TSDoc.
  - Minimum verification: `pnpm type-check` + focused unit tests/repro checks for touched semantics.