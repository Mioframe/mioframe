---
children_hash: 5933604a9a7643caa59c9411130c7927fe0fb190ba08b9541a945944fa0c8557
compression_ratio: 0.3768844221105528
condensation_order: 1
covers: [repository_agents_policy.md, src_shared_lib_agents_guidelines.md]
covers_token_total: 3980
summary_level: d1
token_count: 1500
type: summary
---
# Structural summary (d1)

## Repository AGENTS Policy (`repository_agents_policy.md`)
- **Scope & inheritance**
  - Repo-root `AGENTS.md` governs the whole repository unless overridden by deeper `AGENTS.md` files.
  - ByteRover usage details belong in the `byterover` skill; `AGENTS.md` is for stable repo policy (not runbooks or temporary notes).

- **Architecture: Feature-Sliced Design (FSD) boundaries**
  - Layers: `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`.
  - Responsibilities:
    - `pages`: compose screens
    - `widgets`: compose larger sections; should not own domain rules
    - `features`: user actions (dialogs/forms/menus)
    - `entities`: domain reads and derived state
    - `shared`: cross-layer infrastructure; must remain upper-layer-free
  - **Dependency constraints**
    - `shared` must not import upper layers
    - `entities` may import only `shared`
    - `features` build on `entities` + `shared`
    - Don’t pull dependencies “upward” against intended direction
    - Import via `index.ts` public entry points when they exist
    - UI-facing layers may access background logic only via explicit proxy clients (no direct `*Service` imports into UI layers)

- **Contract & UI/runtime design rules**
  - Treat UI runtime wiring as a **concrete contract**: DOM parentage, scroll ownership, focus, teleport, overlays; verify rendered hierarchy before refactors.
  - Optimize for **Material 3** and **mobile-first**; assume large datasets and low-end devices; bound main-thread work.
  - Keep contracts narrow: prefer IDs/primitives/small display records; explicit emits/slots over “service bags” or deep configs; avoid orchestration complexity in props.
  - Keep validation/parsing/extraction close to the boundary that defines the contract.
  - Lifecycle-manage resources: subscriptions, listeners, workers, timers, caches, file handles, blob URLs.
  - Typed iteration preference: prefer typed collection helpers over raw `Object.keys/values/entries`; avoid local type assertions except rare boundary adapters.

- **CRDT mutation constraints**
  - Mutate live nested objects **in place** inside the owning change callback.
  - Never assign a live document object back into the same document.
  - Prefer shared helpers when shape matches: `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`.

- **Verification workflow & tooling**
  - Package manager: **`pnpm`**.
  - Run the **narrowest relevant** checks:
    - For logic changes: at least `pnpm type-check`
    - Add focused `vitest`, Playwright, or reproducible smoke checks when relevant
    - For lint/format-covered files: targeted `oxlint`, `eslint --fix`, and/or `oxfmt` for the touched scope
    - When modifying tests: run the narrowest relevant mutation check for touched test scope (in addition to functional verification)
  - Third-party semantics: verify via official docs or installed source; if unverified, explicitly say so.

- **Testing conventions**
  - Unit tests colocated as sibling `*.test.ts` files; **no `__tests__` directories**.

- **Naming conventions**
  - Directories: `pages` and `widgets` use **PascalCase**; other submodules use **lower camel case**.
  - Files: Vue components and class-centric files use **PascalCase**; other TS files use lower camel case or lowercase.
  - Modules: features named by user actions (`<domain><Action>`); entities named for stable domain concepts.
  - UI components named for rendered surface with concrete suffixes (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`), not vague roles.
  - Reserved naming:
    - `MD*` prefix only for shared Material-style primitives
    - `use*`, `setup*`, `define*`, `create*`, `get*`, `is*`, `zod*` convey semantics
    - `*Service` reserved for background-side infrastructure
    - `$` suffix reserved for raw RxJS observables
    - `on*` for event handlers / callback bindings

- **Process conventions**
  - Use **Conventional Commits**.
  - Add child `AGENTS.md` only for local invariants / blast-radius rules / reproducible verification guidance; refine parent (don’t repeat), keep `Contains` stable, and update the AGENTS tree when ownership/API/dependency/verification boundaries change.

- **Related drill-down**
  - Mentions related entries: `architecture/feature_sliced_design/context.md`, `facts/project/testing_preferences.md`.

---

## `src/shared/lib` AGENTS Guidelines (`src_shared_lib_agents_guidelines.md`)
- **Scope & inheritance**
  - `src/shared/lib/AGENTS.md` inherits from `src/shared/AGENTS.md` and applies to descendants unless overridden.

- **What belongs in `src/shared/lib`**
  - Reusable non-UI helpers; storage/filesystem abstractions; schema helpers; typed contract wrappers around browser/third-party APIs; migrations; composables.

- **Core patterns / constraints**
  - Prefer **small, single-responsibility modules**.
  - Wrap browser APIs, storage APIs, and third-party SDKs behind **typed contracts**.
  - Keep validation/parsing/extraction at the boundary; keep platform typing workarounds at the boundary (avoid spreading allocations/complexity to callers).
  - Explicitly design lifecycle behavior for composables/adapters: cleanup, cancellation, resubscribe behavior, memory profile are part of the contract.
  - CRDT helpers: treat nested objects as live document objects; update in place; don’t reassign live objects back into the document.
  - Must not import upper layers.
  - Avoid vague “utility” modules without clear invariant/caller set/testable responsibility.
  - Don’t mix generic helpers with project-specific policy unless intentionally shared.
  - Emphasizes broad blast radius of shared/lib changes.

- **New/explicit requirement**
  - Exported functions in `src/shared/lib` must include **concise TSDoc** (readability at call sites and during refactors).

- **Minimum verification**
  - `pnpm type-check` **plus** focused unit tests or reproducible checks for the touched helper semantics (given wide impact).