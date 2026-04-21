---
children_hash: e906e6ca9653d8768d3166fbe8f1622f4f834c9a751e4881bcec216a3bc4c399
compression_ratio: 0.4265279583875163
condensation_order: 3
covers: [facts/_index.md, governance/_index.md, project_guidance/_index.md, repo_guidelines/_index.md]
covers_token_total: 3845
summary_level: d3
token_count: 1640
type: summary
---
### Level d3 structural summary of provided entries

## 1) `facts/_index.md` — durable project facts (domain)
- **Domain intent** (`facts/context.md`)
  - Central place for **stable, easy-to-recall project facts**: technical choices, operational defaults, and durable conventions.
  - **Included:** project-wide tech/architecture facts, testing expectations, environment constraints.
  - **Excluded:** personal profile facts; detailed feature implementation notes.

- **Architecture → testing convention linkage** (`local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`)
  - **Architectural premise (sourced from `project_guidance`):**
    - Beaver is **local-first**, **offline-by-default**, **no registration**, **no hosted backend**.
    - Cross-device workflow is **file-based export/import** with **CRDT-based merges**.
  - **Derived testing convention (ties to `facts/project/testing_preferences.md`):**
    - Prefer **fast, isolated, in-memory unit tests**.
    - Avoid unit-test reliance on **external dependencies** (DB/network/services); prefer **fakes**, **in-memory repositories**, and **pure-function tests**.
  - **Key relationship:** connects product constraints (local-first + file-transfer + CRDT merge) to test strategy (in-memory-first).

- **Testing constraints index** (`facts/project/_index.md`)
  - Canonical rule (verbatim from `testing_preferences.md`): **“Unit tests should stay fast and in-memory.”**
  - Captures provenance metadata: **timestamp 2026-04-17**, author **user**, maturity **core** (importance 85).
  - Process framing: `test execution -> in-memory isolation -> fast feedback`.

**Drill-down:** `facts/context.md`, `local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`, `facts/project/_index.md` → `facts/project/testing_preferences.md`.

---

## 2) `governance/_index.md` — repo-wide engineering rules (via `repo_guidelines/_index.md`)
- **Policy scope & precedence**
  - Root `AGENTS.md` applies repo-wide; deeper `AGENTS.md` may **refine** local constraints (blast radius, verification) without duplicating parent guidance.

- **Core architectural decision: Feature-Sliced Design (FSD) layering**
  - **Canonical responsibilities:**
    - `src/app` (bootstrap/routing/global shells)
    - `src/pages` (route/pane composition, navigation state)
    - `src/widgets` (screen-scale composition)
    - `src/features` (user-triggered flows: dialogs/forms/menus/destructive actions)
    - `src/entities` (domain read models, typed access patterns, small reusable UI)
    - `src/shared` (cross-layer infra/services/schemas/utilities/shared UI)
  - **Import direction constraints:**
    - `shared` must not import upper layers
    - `entities` → only `shared`
    - `features` → `entities` + `shared`
    - `widgets` → compose `features` + `entities` + `shared` (avoid owning domain rules)
  - **API surface rules:**
    - Prefer public entry points (`index.ts`) when present.
    - UI-facing layers must access background logic via **explicit proxy clients**; avoid direct imports of `*Service` into UI.

- **Runtime/UX posture**
  - Treat DOM parentage, scroll ownership, focus/teleport/overlay wiring as **runtime contracts**; verify rendered hierarchy before composition refactors.
  - Align with **Material 3**, optimize **mobile-first**, assume large datasets/low-end devices; bound main-thread work.
  - Explicit lifecycle management for resources (subscriptions/listeners/workers/timers/caches/file handles/blob URLs).

- **CRDT-backed state constraints**
  - Mutate live nested objects only inside owning change callback.
  - Never assign a live doc object back into the same doc.
  - Prefer helpers: `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`.

- **Verification expectations (pnpm-based)**
  - Use `pnpm`; after changes run **narrowest relevant verification**:
    - logic: at least `pnpm type-check`
    - plus targeted `vitest` / Playwright / smoke depending on scope
    - when tests change: run narrowest relevant **mutation testing** for touched scope
  - Prefer targeted lint/format (`oxlint`, `eslint --fix`, `oxfmt`) over repo-wide sweeps.

- **Repo conventions & anti-patterns**
  - Conventional Commits; colocate `*.test.ts` next to code (avoid `__tests__`).
  - Naming conventions (PascalCase for `pages`/`widgets` dirs, UI components; reserved prefixes/suffixes like `MD*`, `*Service`, `$` for raw RxJS observables).
  - Anti-patterns: breaking layer direction, bypassing domain APIs with direct storage mutation, duplicating schemas/types/constants, pushing orchestration into props, desktop-first assumptions, using `AGENTS.md` for essays/dumps/temp notes.

**Drill-down:** `repo_guidelines/_index.md` (covers `agents_repository_policy.md`), `architecture/feature_sliced_design/context.md`, `facts/project/testing_preferences.md`.

---

## 3) `project_guidance/_index.md` — user-facing guidance + documentation conventions
- **Documentation policy** (`documentation-policy-keep-guidance-platform-neutral-and-align-test-guidance-with.md`)
  - Treat key guidance as **durable conventions** (stable, recall-friendly rules), not fragile examples.
  - Prefer **platform-neutral terminology** in docs to keep guidance portable across environments.
  - **Cross-domain relationship:** aligns `project_guidance` docs with `facts` as the source of stable conventions (notably testing preferences).
  - Concrete change (2026-04-18): removed **Apple-specific AirDrop** references; replaced with generic **file-transfer** wording in `README.md` and `README.ru.md`.

- **README index / product stance** (`readme/_index.md` → `product_positioning_and_feature_overview.md`)
  - Beaver is a **local-first personal data app**, **not a cloud service**: **no registration**, **no hosted backend**, **offline-by-default**.
  - Storage backends: **Browser OPFS** and **user-selected local folder**.
  - Sync/merge model: **file-transfer sync** + **CRDT-based data format** enabling merges (avoid overwrites).
  - Doc structure decision: README for positioning/roadmap; `DEVELOPMENT.md` for setup/tooling.
  - License: **Functional Source License (FSL)** with a **3-year non-compete** term.
  - Related reference: `repo_guidelines/package_scripts/context.md` for script/tooling conventions documentation may point to.

**Drill-down:** `project_guidance/readme/_index.md`, `product_positioning_and_feature_overview.md`, `documentation-policy-keep-guidance-platform-neutral-and-align-test-guidance-with.md`, `facts/project/testing_preferences.md`.