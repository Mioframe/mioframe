---
children_hash: aec0617154ca9c86e4385b5bb2e9a6e148a7afb600895e9d275133d821175150
compression_ratio: 0.8415545590433483
condensation_order: 2
covers: [agents_guidance/_index.md]
covers_token_total: 1338
summary_level: d2
token_count: 1126
type: summary
---
## agents_guidance (d2 structural summary)

### `repository_agents_policy.md` (covered by `agents_guidance/_index.md`)
- **Policy scope & precedence**
  - Root `AGENTS.md` governs the whole repo unless overridden by a deeper directory-level `AGENTS.md`.
  - `AGENTS.md` is for *stable repo policy*; ByteRover operational details belong in ByteRover skill docs (not in `AGENTS.md`).

- **Architecture boundaries: Feature-Sliced Design (FSD)**
  - Layers and responsibilities:
    - `src/pages`: compose screens.
    - `src/widgets`: compose larger sections; avoid owning domain rules.
    - `src/features`: own user actions/flows (dialogs/forms/menus).
    - `src/entities`: domain read models + derived state.
    - `src/shared`: cross-layer infrastructure + shared UI; must remain upper-layer-free.
  - **Import direction constraints**
    - `shared` must not import upper layers.
    - `entities` → only `shared`.
    - `features` → `entities` + `shared`.
    - `widgets` → compose `features` + `entities` + `shared` (still avoid domain rules).
  - **UI-to-background access rule**
    - UI-facing layers may reach background logic only via explicit proxy clients; do not directly import `*Service` modules into UI layers.
  - Prefer `index.ts` public entry points when available.
  - Avoid bypassing entity/service APIs with direct storage access or ad hoc document mutation; avoid duplicating schemas/types/constants across layers.

- **UI/runtime contract guidance**
  - Treat DOM parentage, scroll ownership, focus, teleport, overlays as concrete runtime contracts; verify rendered hierarchy before moving wrappers/composition boundaries.
  - Align with Material 3; optimize mobile-first; assume large datasets + low-end devices; keep main-thread work bounded.
  - Keep component/composable contracts narrow (IDs/primitives/small display records; explicit emits/slots); avoid pushing orchestration complexity into props.
  - Prefer determinate progress when measurable (not default indeterminate spinners).

- **Lifecycle/resource management**
  - Subscriptions/listeners/workers/timers/caches/blob URLs/file handles are lifecycle-managed resources; ensure setup/cleanup discipline.

- **CRDT-backed state rules**
  - Mutate live nested objects only inside the owning change callback.
  - Never assign a live document object back into the same document.
  - Prefer shared write-shape helpers: `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`.

- **TypeScript iteration rule**
  - Prefer typed collection helpers over `Object.keys/values/entries` on typed records; avoid local type assertions except rare boundary adapters.

- **Verification & tooling: narrowest-target principle**
  - Use **pnpm**.
  - After edits, run the narrowest relevant checks:
    - Logic changes: at least `pnpm type-check`.
    - Behavior/schema/service/storage changes: add focused `vitest`/Playwright/smoke checks.
    - Lint/format: targeted `oxlint`, `eslint --fix`, and/or `oxfmt` on touched scope.
    - Tests: run narrowest relevant mutation check for touched test scope.
  - Third-party semantics: verify via official docs or installed source; mark explicitly unverified if ambiguous.

- **Naming & conventions**
  - Conventional Commits required.
  - Directory naming: `pages/` and `widgets/` use PascalCase; other submodules lower camel case.
  - File naming: Vue components and class-centric files use PascalCase; other TS files lower camel case or lowercase.
  - Module naming: features named by user actions (`<domain><Action>`); entities named for stable domain concepts.
  - Visual component names should reflect concrete rendered surface (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`), not vague roles (`Manager`, `Helper`).
  - Prefix/suffix conventions:
    - `MD*` reserved for shared Material-style primitives.
    - `use*`, `setup*`, `define*`, `create*`, `get*`, `is*`, `zod*`, `*Service`, `on*`, and `$` suffix reserved for raw RxJS observables.

- **AGENTS tree management**
  - Add child `AGENTS.md` only for local invariants/blast-radius/verification boundaries that can’t live at parent.
  - Child `AGENTS.md` refines parent (no repetition); “Contains” should describe stable responsibilities.
  - Update the AGENTS tree when ownership/public APIs/dependencies/verification boundaries change.

- **Related drill-downs**
  - `architecture/feature_sliced_design/context.md` (FSD structure/constraints)
  - `facts/project/testing_preferences.md` (test/verification preferences)