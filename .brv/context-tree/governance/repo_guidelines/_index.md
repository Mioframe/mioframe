---
children_hash: 8266afb959ff690d70e65dc8d8c61715e265491f48fa79e88d8a9edbc57e8a19
compression_ratio: 0.4724592707525213
condensation_order: 1
covers: [agents_repository_policy.md]
covers_token_total: 2578
summary_level: d1
token_count: 1218
type: summary
---
# Structural Summary (d1)

## AGENTS Repository Policy (`agents_repository_policy.md`)
- **Scope & override model**
  - Root `AGENTS.md` applies repository-wide **unless** overridden by deeper (child) `AGENTS.md` files.
  - Child `AGENTS.md` files exist only to **refine** local invariants (blast-radius rules, verification guidance), not to repeat parent content.

- **Architectural foundation: Feature-Sliced Design (FSD)**
  - Assumed repo layout and responsibilities:
    - `src/app`: bootstrap, routing, global shells, global styles
    - `src/pages`: route-/pane-level composition + navigation state
    - `src/widgets`: screen-scale composition from lower layers
    - `src/features`: user-triggered flows (dialogs, forms, menus, destructive actions)
    - `src/entities`: domain read models, typed access patterns, small reusable UI
    - `src/shared`: cross-layer infrastructure, background services, schemas, utilities, shared UI
  - **Layer boundary constraints (import direction)**
    - `shared` must not import upper layers
    - `entities` may import only `shared`
    - `features` build on `entities` + `shared`
    - `widgets` may compose `features` + `entities` + `shared` (but should not own domain rules)
  - **API surface / dependency access**
    - Import through `index.ts` public entry points when they exist.
    - UI-facing layers may reach background logic only via **explicit proxy clients**; do **not** import `*Service` modules directly into `pages/widgets/features/entities` or shared UI.

- **Engineering/UX runtime contracts and performance posture**
  - DOM parentage, scroll ownership, focus, teleport, overlay wiring are treated as **runtime contracts**; verify rendered hierarchy before moving wrappers/composition boundaries.
  - Align UI with **Material 3** expectations; optimize **mobile-first**; assume large datasets and low-end devices; bound main-thread work.
  - Lifecycle-managed resources: subscriptions/listeners/workers/timers/caches/file handles/blob URLs must be explicitly managed.

- **Data/state and typing rules**
  - Keep validation/parsing/extraction close to the boundary that defines the contract.
  - Prefer typed collection helpers over raw `Object.keys/values/entries`; avoid local type assertions except at rare boundary adapters.
  - For CRDT-backed state: mutate live nested objects inside the owning change callback; never assign a live doc object back into the same doc; prefer helpers like `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject` when applicable.

- **Verification requirements (pnpm-based)**
  - Use `pnpm` for package management and commands.
  - After edits: run the **narrowest relevant verification**; for logic changes run at least `pnpm type-check`, plus focused `vitest` / Playwright / smoke checks depending on what changed (behavior/schema/service/storage).
  - When tests are created/modified: additionally run the **narrowest relevant mutation test check** for the touched test scope.
  - Prefer targeted `oxlint`, `eslint --fix`, `oxfmt` runs over repo-wide commands.

- **Repo conventions: commits, naming, test placement**
  - Use **Conventional Commits**.
  - Unit tests: colocate as sibling `*.test.ts` files; do not create `__tests__` directories.
  - Naming conventions:
    - Directories: `pages` and `widgets` use **PascalCase**; other submodules use **lower camel case**
    - Files: Vue components and class-centric files use **PascalCase**; other TS files use **lower camel case** or lowercase
    - Module naming: feature modules named for user actions (e.g., `<domain><Action>`); entity modules for stable domain concepts
    - Component naming: concrete rendered-surface suffixes (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`) vs vague roles (`Manager`, `Helper`)
    - Prefix/suffix rules:
      - `MD*` prefix reserved for shared Material-style primitives
      - `use*` (reactive/lifecycle-managed), `setup*` (wiring + cleanup), `define*` (declarative, low side-effect), `create*` (new owned instance), `get*` (pure derivation), `is*` (boolean), `zod*` (schemas)
      - `*Service` reserved for background-side infrastructure
      - `on*` for event handlers/callback bindings
      - `$` suffix reserved for raw RxJS observables

- **Anti-patterns explicitly called out**
  - Pulling dependencies upward against layer direction
  - Bypassing entity/service APIs via direct storage access or ad hoc document mutation
  - Duplicating schemas/type aliases/constants across layers
  - Pushing orchestration complexity into component props
  - Treating desktop performance/hover/precise pointer as default
  - Using `AGENTS.md` for architecture essays, file dumps, or temporary notes

- **Relationship for drill-down**
  - Related entry: `architecture/feature_sliced_design/context.md` (canonical FSD architecture reference supporting this policy)