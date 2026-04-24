---
children_hash: 52cd05129dad5bb31659018d42e272a5746590b7a6e759f469c0b0f7adb75a28
compression_ratio: 0.9542566709021602
condensation_order: 2
covers: [agents_guidance/_index.md]
covers_token_total: 1574
summary_level: d2
token_count: 1502
type: summary
---
## `repo_guidelines/agents_guidance` (d2 structural summary)

### Index: `agents_guidance/_index.md`
- Aggregates and summarizes two key guidance entries:
  - `repository_agents_policy.md` (repo-wide agent policy + architecture/process rules)
  - `src_shared_lib_agents_guidelines.md` (extra constraints for `src/shared/lib`)

---

## Repository-wide policy (`repository_agents_policy.md`)
- **Policy scope & inheritance**
  - Repo-root `AGENTS.md` governs the whole repo unless overridden by deeper `AGENTS.md`.
  - ByteRover operational details belong in the `byterover` skill; `AGENTS.md` is reserved for stable repo policy (not runbooks / temporary notes).

- **Architecture boundary: Feature-Sliced Design (FSD)**
  - Layers: `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`.
  - Responsibilities (high level):
    - `pages`: compose screens
    - `widgets`: compose larger UI sections; avoid owning domain rules
    - `features`: user actions (dialogs/forms/menus)
    - `entities`: domain reads + derived state
    - `shared`: cross-layer infrastructure; must remain upper-layer-free
  - **Dependency constraints**
    - `shared` must not import upper layers.
    - `entities` may import only `shared`.
    - `features` build on `entities` + `shared`.
    - Avoid “pulling dependencies upward” (violating the direction).
    - Prefer `index.ts` public entry points where available.
    - UI-facing layers must access background logic via explicit proxy clients (no direct `*Service` imports into UI layers).

- **UI/runtime contract rules**
  - Treat runtime wiring as a concrete contract: DOM parentage, scroll ownership, focus, teleport/overlays; verify rendered hierarchy before refactors.
  - Optimize for Material 3 + mobile-first; assume large datasets/low-end devices; bound main-thread work.
  - Keep contracts narrow (IDs/primitives/small display records); prefer explicit emits/slots over deep configs or “service bags”.
  - Validation/parsing/extraction should live close to the boundary that defines the contract.
  - Lifecycle-manage resources (subscriptions/listeners/workers/timers/caches/file handles/blob URLs).
  - Prefer typed collection helpers over raw `Object.keys/values/entries`; avoid local type assertions except at true boundaries.

- **CRDT mutation constraints**
  - Mutate live nested objects **in place** inside the owning change callback.
  - Never assign a live document object back into the same document.
  - Prefer shared helpers when applicable: `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`.

- **Verification & tooling**
  - Package manager: `pnpm`.
  - Run the narrowest relevant checks:
    - Logic changes: at least `pnpm type-check`.
    - Add focused `vitest` / Playwright / reproducible smoke checks as relevant.
    - For lint/format-covered files: targeted `oxlint`, `eslint --fix`, and/or `oxfmt`.
    - When modifying tests: run narrowest relevant mutation check for touched scope (plus functional verification).
  - Third-party semantics must be verified via official docs or installed source; if not verified, explicitly state that.

- **Testing conventions**
  - Unit tests colocated as sibling `*.test.ts` files; **no `__tests__` directories**.

- **Naming conventions**
  - Directories: `pages` and `widgets` use PascalCase; other submodules use lower camel case.
  - Files: Vue components and class-centric files use PascalCase; other TS files use lower camel case / lowercase.
  - Feature modules named by user actions (`<domain><Action>`); entities named for stable domain concepts.
  - UI components named by rendered surface with concrete suffixes (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`).
  - Reserved semantics:
    - `MD*` only for shared Material-style primitives
    - `use*`, `setup*`, `define*`, `create*`, `get*`, `is*`, `zod*` indicate intent
    - `*Service` reserved for background-side infrastructure
    - `$` suffix reserved for raw RxJS observables
    - `on*` for event handlers/callback bindings

- **Process conventions**
  - Use Conventional Commits.
  - Add child `AGENTS.md` only for local invariants / blast-radius rules / reproducible verification guidance; refine parent rather than duplicating it; update AGENTS tree when boundaries (ownership/API/deps/verification) change.

- **Related drill-down references**
  - Mentions additional related knowledge: `architecture/feature_sliced_design/context.md`, `facts/project/testing_preferences.md`.

---

## `src/shared/lib` specific guidance (`src_shared_lib_agents_guidelines.md`)
- **Scope & inheritance**
  - `src/shared/lib/AGENTS.md` inherits from `src/shared/AGENTS.md` and applies to descendants unless overridden.

- **What belongs in `src/shared/lib`**
  - Reusable non-UI helpers; storage/filesystem abstractions; schema helpers; typed contract wrappers around browser/third-party APIs; migrations; composables.

- **Core constraints & patterns**
  - Prefer small, single-responsibility modules.
  - Wrap browser APIs / storage APIs / third-party SDKs behind typed contracts.
  - Keep validation/parsing/extraction at the boundary; keep platform typing workarounds at the boundary (don’t spread complexity/allocations).
  - Composables/adapters must specify lifecycle behavior (cleanup/cancellation/resubscribe/memory profile) as part of the contract.
  - CRDT helpers: nested objects are live; update in place; don’t reassign live objects into the document.
  - Must not import upper layers.
  - Avoid vague “utility” modules without clear invariant/caller set/testable responsibility.
  - Don’t mix generic helpers with project-specific policy unless intentionally shared (shared/lib changes have broad blast radius).

- **Documentation requirement**
  - Exported functions in `src/shared/lib` must include concise TSDoc (for call-site readability and refactors).

- **Minimum verification**
  - `pnpm type-check` plus focused unit tests or reproducible checks for the touched helper semantics.