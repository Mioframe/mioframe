---
children_hash: 5b89ec9b0d47b2e6f386624a2f7b344222888d18897dabfa0edc529a4b7f2f68
compression_ratio: 0.867601246105919
condensation_order: 2
covers: [repo_guidelines/_index.md]
covers_token_total: 1284
summary_level: d2
token_count: 1114
type: summary
---
## repo_guidelines (d2 structural summary)

### `repo_guidelines/_index.md` (covers: `agents_repository_policy.md`)
- **Policy scope & precedence**
  - Root `AGENTS.md` applies repo-wide.
  - Deeper `AGENTS.md` files may **refine** local invariants (blast radius, verification), but should not duplicate parent guidance.

- **Core architecture assumption: Feature-Sliced Design (FSD)**
  - Canonical layering (responsibilities):
    - `src/app`: bootstrap, routing, global shells/styles
    - `src/pages`: route/pane composition + navigation state
    - `src/widgets`: screen-scale composition
    - `src/features`: user-triggered flows (dialogs/forms/menus/destructive actions)
    - `src/entities`: domain read models, typed access patterns, small reusable UI
    - `src/shared`: cross-layer infra, background services, schemas, utilities, shared UI
  - **Import direction constraints**
    - `shared` must not import upper layers
    - `entities` → only `shared`
    - `features` → `entities` + `shared`
    - `widgets` → compose `features` + `entities` + `shared` (avoid owning domain rules)
  - **API surface rules**
    - Prefer importing via `index.ts` public entry points when present.
    - UI layers (`pages/widgets/features/entities` and shared UI) must access background logic via **explicit proxy clients**; avoid direct imports of `*Service` into UI-facing code.
  - **Drill-down relationship**
    - Points to `architecture/feature_sliced_design/context.md` as the canonical FSD reference.

- **Runtime/UX performance posture**
  - Treat DOM parentage, scroll ownership, focus handling, teleport/overlay wiring as **runtime contracts**; verify rendered hierarchy before refactors that move wrappers/composition boundaries.
  - Align UI expectations with **Material 3**, optimize **mobile-first**, and assume large datasets/low-end devices (bound main-thread work).
  - Explicitly manage lifecycle resources (subscriptions, listeners, workers, timers, caches, file handles, blob URLs).

- **Data/state + typing constraints**
  - Keep validation/parsing/extraction close to the boundary defining the contract.
  - Prefer typed collection helpers over raw `Object.keys/values/entries`; avoid routine local type assertions (allowed mainly at boundary adapters).
  - For CRDT-backed state:
    - Mutate live nested objects only inside the owning change callback.
    - Never assign a live doc object back into the same doc.
    - Prefer helper operations like `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject` where applicable.

- **Verification expectations (pnpm-based)**
  - Use `pnpm` for package management/commands.
  - After edits, run the **narrowest relevant verification**; for logic changes run at least `pnpm type-check`, plus targeted `vitest` / Playwright / smoke checks depending on affected areas.
  - If tests are created/modified, additionally run the narrowest relevant **mutation test** check for the touched scope.
  - Prefer targeted formatting/linting (`oxlint`, `eslint --fix`, `oxfmt`) over repo-wide sweeps.

- **Repo conventions**
  - Commits: **Conventional Commits**.
  - Tests: colocate `*.test.ts` as siblings; avoid `__tests__` directories.
  - Naming rules:
    - Directories: `pages` and `widgets` use **PascalCase**; other submodules use **lower camel case**.
    - Files: Vue components and class-centric files use **PascalCase**; other TS files use **lower camel case** or lowercase.
    - Feature modules named for user actions (`<domain><Action>`); entities named for stable domain concepts.
    - Component names should reflect concrete surfaces (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`) vs vague roles (`Manager`, `Helper`).
    - Reserved naming:
      - `MD*` prefix for shared Material-style primitives
      - `use*`, `setup*`, `define*`, `create*`, `get*`, `is*`, `zod*` prefixes with specified intent
      - `*Service` reserved for background infrastructure
      - `on*` for event handlers
      - `$` suffix reserved for raw RxJS observables

- **Explicit anti-patterns**
  - Violating layer direction by pulling dependencies upward.
  - Bypassing domain APIs via direct storage access or ad hoc document mutation.
  - Duplicating schemas/types/constants across layers.
  - Pushing orchestration complexity into component props.
  - Assuming desktop-first interaction/performance defaults.
  - Using `AGENTS.md` for architecture essays, file dumps, or temporary notes.