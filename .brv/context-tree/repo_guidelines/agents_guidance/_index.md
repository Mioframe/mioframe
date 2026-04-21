---
children_hash: 48214ad5062ef7033403fe79ef56eb3a84757860ee63f75fa052a3470a0feca9
compression_ratio: 0.5957845433255269
condensation_order: 1
covers: [repository_agents_policy.md]
covers_token_total: 2135
summary_level: d1
token_count: 1272
type: summary
---
## Structural Summary (d1)

### Repository AGENTS Policy (`repository_agents_policy.md`)
- **Scope & precedence**
  - Root `AGENTS.md` governs the entire repo **unless overridden** by a deeper, directory-level `AGENTS.md`.
  - `AGENTS.md` is for **stable repo policy**; ByteRover operational details belong in the `byterover` skill documentation (not in `AGENTS.md`).

- **Architecture: Feature-Sliced Design (FSD) responsibilities & boundaries**
  - Repository uses FSD layers: `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`.  
    - `pages`: compose screens.
    - `widgets`: compose larger sections; should not own domain rules.
    - `features`: own user actions/flows (dialogs/forms/menus).
    - `entities`: own domain read models + derived state.
    - `shared`: cross-layer infrastructure + shared UI; must remain upper-layer-free.
  - **Import direction constraints**
    - `shared` **must not** import upper layers.
    - `entities` may import **only** `shared`.
    - `features` build on `entities` + `shared`.
    - `widgets` may compose `features` + `entities` + `shared`, but avoid domain rules.
    - UI-facing layers may reach background logic **only via explicit proxy clients**; do not directly import `*Service` modules into UI layers.
  - Prefer importing via `index.ts` **public entry points** when available.
  - Do not bypass entity/service APIs with direct storage access or ad hoc document mutation; avoid duplicating schemas/types/constants across layers.

- **UI/runtime contract guidance**
  - Treat **DOM parentage, scroll ownership, focus, teleport, overlays** as concrete runtime contracts; verify rendered hierarchy before moving wrappers/composition boundaries.
  - Align with **Material 3** expectations; optimize for **mobile browsers first**; assume large datasets + low-end devices; keep main-thread work bounded.
  - Keep component/composable contracts **narrow** (IDs/primitives/small display records; explicit emits/slots). Avoid pushing orchestration complexity into component props.
  - When progress is knowable, **show progress** instead of defaulting to an indeterminate spinner.

- **Lifecycle/resource management**
  - Treat subscriptions/listeners/workers/timers/caches/blob URLs/file handles as **lifecycle-managed resources**.

- **CRDT-backed state rules**
  - Mutate live nested objects **inside the owning change callback**.
  - Never assign a live document object back into the same document.
  - Prefer shared helpers when matching the write shape: `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`.

- **TypeScript iteration rule**
  - Prefer typed collection helpers over raw `Object.keys/values/entries` on typed records; avoid local type assertions except at rare boundary adapters.

- **Verification & tooling (narrowest-target principle)**
  - Use **pnpm** for package management/commands.
  - After edits: run the **narrowest relevant** checks:
    - For logic changes: at least `pnpm type-check`.
    - Add focused `vitest`, Playwright, or reproducible smoke checks for behavior/schema/service/storage changes.
    - For lint/format-covered files: targeted `oxlint`, `eslint --fix`, and/or `oxfmt` for touched scope (prefer targeted over repo-wide).
    - When creating/modifying tests: run the narrowest relevant **mutation check** for the touched test scope in addition to functional verification.
  - Third-party semantics: verify via **official docs or installed source**; if still ambiguous, explicitly mark as unverified.

- **Naming & conventions**
  - Conventional Commits required.
  - Directory naming: `pages/` and `widgets/` use **PascalCase**; other submodules use **lower camel case**.
  - File naming: Vue components and class-centric files use **PascalCase**; other TS files use **lower camel case** or lowercase.
  - Module naming: feature modules named for user actions (`<domain><Action>`); entity modules named for stable domain concepts.
  - Visual components named for rendered surface with concrete suffixes (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`), not vague roles (`Manager`, `Helper`).
  - Prefix/suffix conventions:
    - `MD*` reserved for shared Material-style primitives.
    - `use*` reactive/lifecycle capabilities; `setup*` wiring + cleanup; `define*` declarative/side-effect-light; `create*` owned instance; `get*` pure lookup/derivation; `is*` boolean; `zod*` schemas; `*Service` background-side infrastructure; `on*` event handlers; `$` suffix reserved for raw RxJS observables.

- **AGENTS tree management**
  - Add a child `AGENTS.md` only when local invariants / blast-radius rules / reproducible verification can’t be expressed at the parent.
  - Child `AGENTS.md` refines parent (no repetition); `Contains` should describe stable responsibilities, not current file dumps.
  - Update the `AGENTS.md` tree alongside ownership/public API/dependency/verification boundary changes.

- **Relationships**
  - Related drill-down references: `architecture/feature_sliced_design/context.md`, `facts/project/testing_preferences.md`.