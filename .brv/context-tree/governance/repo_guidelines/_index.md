---
children_hash: 2e91bebf273d46c670ebb276d4035e0f80c33f5fd9dd9edb7b3f94f986ad84e4
compression_ratio: 0.9997736532367587
condensation_order: 1
covers: [agents_repository_policy.md]
covers_token_total: 4418
summary_level: d1
token_count: 4417
type: summary
---
## agents_repository_policy.md
---
consolidated_at: '2026-04-20T12:12:09.465Z'
consolidated_from:
  - {date: '2026-04-20T12:12:09.465Z', path: governance/repo_guidelines/agents_repository_policy.abstract.md, reason: All three files describe the same topic (repo-wide AGENTS.md policy). The abstract and overview are derivative summaries of the main policy document and overlap heavily (>50%) in meaning/content. Consolidating into the richest file avoids redundancy and keeps a single canonical source; the merged output preserves the full policy plus the abstract/overview as explicit summary sections for quick scanning.}
  - {date: '2026-04-20T12:12:09.465Z', path: governance/repo_guidelines/agents_repository_policy.overview.md, reason: All three files describe the same topic (repo-wide AGENTS.md policy). The abstract and overview are derivative summaries of the main policy document and overlap heavily (>50%) in meaning/content. Consolidating into the richest file avoids redundancy and keeps a single canonical source; the merged output preserves the full policy plus the abstract/overview as explicit summary sections for quick scanning.}
createdAt: '2026-04-20T10:37:24.747Z'
keywords: []
related:
  - architecture/feature_sliced_design/context.md
summary: 'Repository-wide AGENTS.md policy: FSD layer responsibilities and boundaries, verification requirements (type-check + targeted tests), naming conventions, and constraints for shared/entities/features/widgets/pages.'
tags: []
title: AGENTS Repository Policy
updatedAt: '2026-04-20T10:37:24.747Z'
---

## Abstract
The repository-wide AGENTS.md policy defines Feature-Sliced Design layer responsibilities and import constraints, naming conventions, and required verification (pnpm type-check, targeted tests, and mutation checks when tests change).

## Overview
### Key points
- Defines **repo-wide AGENTS.md policy** (root-scoped) for **Feature-Sliced Design (FSD)** responsibilities, dependency direction, and when/why to add **child AGENTS.md** files for local invariants.
- Enforces **layer boundaries & import rules**: keep changes in the owning layer, avoid “pulling dependencies upward,” and prefer importing through **public `index.ts` entry points** when available.
- Requires **narrow, targeted verification after edits**: at minimum `pnpm type-check` for logic changes, plus focused `vitest`/Playwright/smoke checks for behavior-sensitive changes.
- Adds a strict **mutation testing requirement**: if tests are created/modified, run the **narrowest relevant mutation check** for the touched scope in addition to functional verification.
- Establishes **UI/runtime contract discipline** (DOM parentage, scroll/focus, teleport/overlay wiring) and **mobile-first, Material 3** performance expectations.
- Sets **naming conventions** for directories, files, modules, and common prefixes/suffixes (`use*`, `setup*`, `*Service`, `$` for observables, etc.), plus **Conventional Commits** and **pnpm-only** tooling.

### Structure / sections summary
- **Reason**: States the intent—capture stable, repository-wide AGENTS.md rules (FSD, naming, verification, constraints).
- **Raw Concept**
  - **Task**: Document contributor/agent policy from `AGENTS.md`.
  - **Changes**: Records layer rules, verification (incl. mutation testing), naming/process rules.
  - **Flow**: Change within owning layer → follow constraints → run narrowest relevant verification (+ mutation if tests touched) → commit with Conventional Commits.
  - **Timestamp**: 2026-04-20.
- **Narrative**
  - **Structure**: Root AGENTS.md is stable policy; child AGENTS.md can refine local rules.
  - **Dependencies**: Assumes FSD folder layout and pnpm workflows; verify ambiguous third-party semantics via official docs/installed source.
  - **Highlights**: Runtime UI contracts; Material 3 + mobile-first performance; lifecycle resource management; verification guidance including mutation testing when tests change.
  - **Rules**: Restates mutation testing requirement when tests are created/modified.
- **File Contents: `AGENTS.md`**
  - **Contains**: Defines responsibilities for `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`.
  - **Patterns**: Prescriptive practices (FSD boundaries, contract narrowness, typed iteration helpers, CRDT mutation rules, progress reporting, test colocation).
  - **Anti-patterns**: Explicit “don’ts” (upward deps, bypassing APIs/storage, schema duplication, orchestration in props, desktop-first assumptions, misusing AGENTS.md).
  - **Constraints**: Import restrictions per layer; UI↔background access via proxy clients; verification/tooling conventions; naming conventions; rules for adding/updating child AGENTS.md.
- **Facts**: Extracted conventions (scope/override, pnpm, Conventional Commits, test location, mutation testing, FSD import rules, naming rules).

### Notable entities, patterns, or decisions mentioned
- **FSD layers & responsibilities**
  - `src/app`: bootstrap/routing/global shells/styles
  - `src/pages`: route/pane composition + navigation state
  - `src/widgets`: screen-scale compositions
  - `src/features`: user-triggered flows (dialogs/forms/menus/destructive actions)
  - `src/entities`: domain read models, typed access patterns, small reusable UI
  - `src/shared`: cross-layer infra/services/schemas/utils/shared UI
- **Dependency/constraint decisions**
  - `shared` **must not** import upper layers; `entities` import only `shared`; `features` build on `entities`+`shared`; `widgets` compose lower layers but avoid domain rules.
  - UI-facing layers may access background logic only through **explicit proxy clients**; do **not** import `*Service` modules into UI layers or shared UI.
  - Import via **`index.ts` public entry points** when present.
- **Verification decisions**
  - Use **pnpm**; after edits run the **narrowest relevant verification**.
  - For logic changes: at least `pnpm type-check`; add targeted `vitest`/Playwright/smoke checks when behavior/schema/service/storage changes.
  - If tests change: run **mutation testing** for the **touched scope**.
  - Prefer targeted `oxlint`, `eslint --fix`, `oxfmt` runs over repo-wide commands.
- **Runtime/UI contract patterns**
  - Treat **DOM parentage, scroll ownership, focus, teleport, overlay wiring** as concrete runtime contracts; verify rendered hierarchy before moving wrappers/composition boundaries.
  - Optimize for **Material 3** and **mobile-first**; assume large datasets and low-end devices; bound main-thread work.
  - Surface **determinate progress** when knowable.
- **Code/design patterns**
  - Keep component/composable contracts narrow: prefer IDs/primitives/small display records and explicit emits/slots over “service bags” and deep configs.
  - Keep validation/parsing/extraction near the contract boundary that defines it.
  - Treat subscriptions/listeners/workers/timers/caches/file handles/blob URLs as lifecycle-managed resources.
  - Prefer **typed collection helpers** over raw `Object.keys/values/entries`; avoid type assertions except rare boundary adapters.
  - **CRDT-backed state rule**: mutate live nested objects inside owning change callback; never assign a live document object back into itself; prefer helpers `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject` when matching the write shape.
- **Naming conventions**
  - Directories: `pages` and `widgets` use **PascalCase**; other submodules use **lower camel case**.
  - Files: Vue components & class-centric files use **PascalCase**; other TS files lower camel case or lowercase.
  - Modules: feature modules named for user actions like `<domain><Action>`; entity modules named for stable domain concepts.
  - Visual components named by rendered surface with concrete suffixes (`Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, `State`); avoid vague `Manager`/`Helper`.
  - Prefix/suffix semantics: `MD*` only for shared Material primitives; `use*`, `setup*`, `define*`, `create*`, `get*`, `is*`, `zod*`, `*Service`; `on*` for handlers; `$` suffix reserved for raw RxJS observables.
- **Repository process decisions**
  - Use **Conventional Commits**.
  - Unit tests must be **colocated** as sibling `*.test.ts`; do **not** create `__tests__` directories.
  - Add child `AGENTS.md` only for local invariants/blast-radius/verification guidance; refine parent rather than repeat; update AGENTS.md tree when ownership/APIs/dependencies/verification boundaries change.

## Reason
Capture repository-wide AGENTS.md rules including layered architecture (FSD), naming conventions, verification requirements, and constraints.

## Raw Concept
**Task:**
Document repository-wide contributor/agent policy from AGENTS.md

**Changes:**
- Recorded FSD layer responsibilities and import constraints
- Recorded verification requirements including mutation testing for changed tests
- Recorded naming conventions and repository process rules

**Files:**
- AGENTS.md

**Flow:**
Change -> keep within owning FSD layer -> follow constraints -> run narrowest relevant verification (+ mutation checks if tests touched) -> commit with Conventional Commits

**Timestamp:** 2026-04-20

## Narrative
### Structure
AGENTS.md at repo root defines stable repository policy: feature-sliced design (FSD) responsibilities by layer, allowed dependency directions, verification expectations after edits, naming conventions, and constraints/anti-patterns. Child AGENTS.md files may exist to refine local invariants for subdirectories.

### Dependencies
The policy assumes a Feature-Sliced Design layout (src/app, src/pages, src/widgets, src/features, src/entities, src/shared) and uses pnpm-driven workflows. It also expects developers/agents to validate third-party semantics from official docs or installed source when behavior is ambiguous.

### Highlights
Key emphasis areas: preserve FSD boundaries and avoid pulling dependencies upward; treat DOM/scroll/focus/teleport/overlay wiring as concrete runtime contracts; optimize UI for Material 3 and mobile-first performance; manage lifecycle resources (subscriptions, timers, workers, blob URLs). Verification guidance includes at least pnpm type-check for logic changes and targeted test runs; when tests change, also run the narrowest relevant mutation test check for the touched scope.

### Rules
Project policy: whenever tests are created or modified, run the narrowest relevant mutation test check for the touched test scope in addition to focused functional verification. This complements the repository-wide AGENTS.md verification rules.

## File Contents (pre-loaded from --files flag)

### File: AGENTS.md (Text)
```
# /

Applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Contains

- `src/app`: bootstrap, routing, global shells, and global styles.
- `src/pages`: route-level and pane-level composition plus navigation state.
- `src/widgets`: screen-scale compositions built from lower layers.
- `src/features`: user-triggered flows such as dialogs, forms, menus, and destructive actions.
- `src/entities`: domain read models, typed access patterns, and small reusable UI.
- `src/shared`: cross-layer infrastructure, background services, schemas, utilities, and shared UI.

## Patterns

- Keep changes in the layer that owns the behavior, and import through `index.ts` when a public entry point exists.
- Preserve FSD boundaries: `pages` compose screens, `widgets` compose larger sections, `features` own user actions, `entities` own domain reads and derived state, and `shared` stays upper-layer-free.
- Keep ByteRover usage details in the `byterover` skill. Use `AGENTS.md` for stable repo policy, not step-by-step `brv` runbooks.
- Verify third-party semantics from official docs or installed source before relying on ambiguous helpers, options, or return values. If the behavior is still unverified, say so.
- Treat DOM parentage, scroll ownership, focus, teleport, and overlay wiring as concrete runtime contracts. Check the rendered hierarchy before moving wrappers or composition boundaries.
- Keep the UI aligned with Material 3 expectations and optimize for mobile browsers first. Assume large datasets and low-end devices, and keep main-thread work bounded.
- Keep component and composable contracts narrow. Prefer IDs, primitive values, small display records, and explicit emits or slots over service bags, deeply nested configs, or mixed read/write models.
- Keep validation, parsing, and extraction close to the contract or boundary that defines them.
- Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.
- Prefer typed collection helpers over raw `Object.keys`, `Object.values`, and `Object.entries` when iterating typed records. Do not add local type assertions just to paper over iteration typing outside rare boundary adapters.
- For CRDT-backed state, mutate live nested objects inside the owning change callback, never assign a live document object back into the same document, and prefer shared helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
- When progress is knowable, surface progress instead of falling back to an indeterminate spinner.
- Keep unit tests colocated with the source file they verify, using sibling `*.test.ts` files. Do not introduce `__tests__` directories.

## Anti-patterns

- Do not pull dependencies upward against the intended layer direction.
- Do not bypass entity or service APIs with direct storage access or ad hoc document mutation.
- Do not duplicate schemas, type aliases, or constants across layers.
- Do not push orchestration complexity into component props.
- Do not treat desktop performance, hover, or precise pointer input as the default interaction model.
- Do not use `AGENTS.md` as an architecture essay, a file dump, or a place for temporary notes.

## Constraints

- `shared` must not import upper layers.
- `entities` may import only `shared`.
- `features` build on `entities` and `shared`.
- `widgets` may compose `features`, `entities`, and `shared`, but should not own domain rules.
- UI-facing layers may cross into background logic only through explicit proxy clients. Do not directly import `*Service` modules into `pages`, `widgets`, `features`, `entities`, or shared UI.
- Use `pnpm` for package management and project commands.
- After edits, run the narrowest relevant verification. For logic changes, run at least `pnpm type-check`; add focused `vitest`, Playwright, or reproducible smoke checks for behavior, schema, service, or storage changes.
- When creating or modifying tests, run the narrowest relevant mutation check for the touched test scope in addition to the focused functional verification.
- Prefer targeted `oxlint`, `eslint --fix`, and `oxfmt` runs over repo-wide commands.
- Use Conventional Commits.
- `pages` and `widgets` directories use PascalCase. Other submodules use lower camel case.
- Vue components and class-centric files use PascalCase. Other TypeScript files use lower camel case or lowercase.
- Feature modules are named for user actions such as `<domain><Action>`. Entity modules are named for stable domain concepts.
- Visual components are named for the rendered surface, using concrete suffixes such as `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, or `State`, not vague roles such as `Manager` or `Helper`.
- Use the `MD*` prefix only for shared Material-style primitives.
- `use*` exposes reactive or lifecycle-managed capabilities. `setup*` wires dependencies and cleanup. `define*` stays side-effect-light and declarative. `create*` returns a fresh owned instance. `get*` is pure lookup or derivation. `is*` is boolean. `zod*` exports schemas. `*Service` is reserved for background-side infrastructure.
- Use `on*` for component event handlers and callback bindings.
- Reserve the `$` suffix for raw RxJS observables.
- Add a child `AGENTS.md` only when a directory has local invariants, blast-radius rules, or reproducible verification guidance that the parent cannot express cleanly.
- Child `AGENTS.md` files should refine the parent rather than repeat it, and their `Contains` sections should describe stable responsibilities instead of the current file list.
- Update the `AGENTS.md` tree together with ownership, public API, dependency, or verification-boundary changes.

```

## Facts
- **agents_md_scope**: This AGENTS.md applies to the whole repository unless a deeper AGENTS.md overrides it. [convention]
- **package_manager**: Use pnpm for package management and project commands. [convention]
- **commit_convention**: Use Conventional Commits. [convention]
- **unit_test_location**: Keep unit tests colocated with the source file they verify, using sibling *.test.ts files; do not introduce __tests__ directories. [convention]
- **mutation_testing_requirement**: When creating or modifying tests, run the narrowest relevant mutation check for the touched test scope in addition to focused functional verification. [convention]
- **fsd_shared_import_rule**: `shared` must not import upper layers. [convention]
- **fsd_entities_import_rule**: `entities` may import only `shared`. [convention]
- **fsd_features_dependencies**: `features` build on `entities` and `shared`. [convention]
- **fsd_widgets_rule**: `widgets` may compose `features`, `entities`, and `shared`, but should not own domain rules. [convention]
- **directory_naming**: `pages` and `widgets` directories use PascalCase; other submodules use lower camel case. [convention]
- **file_naming**: Vue components and class-centric files use Pa
[summary compaction; truncated from 4418 tokens]