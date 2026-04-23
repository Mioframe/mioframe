---
title: Repository AGENTS Policy
summary: 'Top-level AGENTS.md policy: Feature-Sliced Design layer responsibilities, dependency constraints, verification expectations (pnpm/type-check/lint/format), and naming conventions.'
tags: []
related: [architecture/feature_sliced_design/context.md, facts/project/testing_preferences.md]
keywords: []
importance: 59
recency: 1
maturity: draft
accessCount: 3
createdAt: '2026-04-20T11:03:35.007Z'
updatedAt: '2026-04-20T11:03:35.007Z'
---
## Reason
Capture top-level AGENTS.md repository policy and conventions as durable knowledge.

## Raw Concept
**Task:**
Document repository-wide AGENTS.md policy (layer responsibilities, constraints, verification, naming).

**Changes:**
- Curated top-level AGENTS.md guidance into context tree for durable recall.

**Files:**
- AGENTS.md

**Flow:**
Change code -> keep changes within owning FSD layer -> verify with narrowest targeted checks (lint/format/type-check/tests) -> commit with Conventional Commits.

**Timestamp:** 2026-04-20

## Narrative
### Structure
AGENTS.md at repo root applies to the whole repository unless overridden by a deeper AGENTS.md. It defines Feature-Sliced Design (FSD) layer responsibilities and repository-wide development conventions.

### Dependencies
Verification relies on pnpm scripts and tooling such as oxlint/eslint/oxfmt, TypeScript type checking, vitest, and Playwright when relevant. Guidance requires checking official docs/installed source for ambiguous third-party behavior.

### Highlights
Key themes: preserve FSD boundaries and import direction, keep contracts narrow, treat UI runtime wiring (DOM parentage/scroll/focus/teleport/overlays) as concrete contracts, and lifecycle-manage resources like subscriptions, timers, workers, caches, blob URLs, and file handles.

### Rules
Keep changes in the layer that owns the behavior, and import through `index.ts` when a public entry point exists.
Preserve FSD boundaries: `pages` compose screens, `widgets` compose larger sections, `features` own user actions, `entities` own domain reads and derived state, and `shared` stays upper-layer-free.
Keep ByteRover usage details in the `byterover` skill. Use `AGENTS.md` for stable repo policy, not step-by-step `brv` runbooks.
Verify third-party semantics from official docs or installed source before relying on ambiguous helpers, options, or return values. If the behavior is still unverified, say so.
Treat DOM parentage, scroll ownership, focus, teleport, and overlay wiring as concrete runtime contracts. Check the rendered hierarchy before moving wrappers or composition boundaries.
Keep the UI aligned with Material 3 expectations and optimize for mobile browsers first. Assume large datasets and low-end devices, and keep main-thread work bounded.
Keep component and composable contracts narrow. Prefer IDs, primitive values, small display records, and explicit emits or slots over service bags, deeply nested configs, or mixed read/write models.
Keep validation, parsing, and extraction close to the contract or boundary that defines them.
Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.
Prefer typed collection helpers over raw `Object.keys`, `Object.values`, and `Object.entries` when iterating typed records. Do not add local type assertions just to paper over iteration typing outside rare boundary adapters.
For CRDT-backed state, mutate live nested objects inside the owning change callback, never assign a live document object back into the same document, and prefer shared helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
When progress is knowable, surface progress instead of falling back to an indeterminate spinner.
Keep unit tests colocated with the source file they verify, using sibling `*.test.ts` files. Do not introduce `__tests__` directories.
Do not pull dependencies upward against the intended layer direction.
Do not bypass entity or service APIs with direct storage access or ad hoc document mutation.
Do not duplicate schemas, type aliases, or constants across layers.
Do not push orchestration complexity into component props.
Do not treat desktop performance, hover, or precise pointer input as the default interaction model.
Do not use `AGENTS.md` as an architecture essay, a file dump, or a place for temporary notes.
`shared` must not import upper layers.
`entities` may import only `shared`.
`features` build on `entities` and `shared`.
`widgets` may compose `features`, `entities`, and `shared`, but should not own domain rules.
UI-facing layers may cross into background logic only through explicit proxy clients. Do not directly import `*Service` modules into `pages`, `widgets`, `features`, `entities`, or shared UI.
Use `pnpm` for package management and project commands.
After edits, run the narrowest relevant verification. For logic changes, run at least `pnpm type-check`; add focused `vitest`, Playwright, or reproducible smoke checks for behavior, schema, service, or storage changes.
When creating or modifying tests, run the narrowest relevant mutation check for the touched test scope in addition to the focused functional verification.
After editing files that are covered by linting or formatting rules, run the narrowest relevant targeted `oxlint`, `eslint --fix`, and/or `oxfmt` pass for the touched scope.
Prefer targeted `oxlint`, `eslint --fix`, and `oxfmt` runs over repo-wide commands.
Use Conventional Commits.
`pages` and `widgets` directories use PascalCase. Other submodules use lower camel case.
Vue components and class-centric files use PascalCase. Other TypeScript files use lower camel case or lowercase.
Feature modules are named for user actions such as `<domain><Action>`. Entity modules are named for stable domain concepts.
Visual components are named for the rendered surface, using concrete suffixes such as `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, or `State`, not vague roles such as `Manager` or `Helper`.
Use the `MD*` prefix only for shared Material-style primitives.
`use*` exposes reactive or lifecycle-managed capabilities. `setup*` wires dependencies and cleanup. `define*` stays side-effect-light and declarative. `create*` returns a fresh owned instance. `get*` is pure lookup or derivation. `is*` is boolean. `zod*` exports schemas. `*Service` is reserved for background-side infrastructure.
Use `on*` for component event handlers and callback bindings.
Reserve the `$` suffix for raw RxJS observables.
Add a child `AGENTS.md` only when a directory has local invariants, blast-radius rules, or reproducible verification guidance that the parent cannot express cleanly.
Child `AGENTS.md` files should refine the parent rather than repeat it, and their `Contains` sections should describe stable responsibilities instead of the current file list.
Update the `AGENTS.md` tree together with ownership, public API, dependency, or verification-boundary changes.

### Examples
Layer responsibilities: src/pages composes screens; src/features owns user-triggered flows like dialogs/forms/menus; src/entities owns domain read models; src/shared contains cross-layer infrastructure and shared UI.
Verification example: after editing a file under lint/format rules, run targeted oxlint/eslint --fix/oxfmt for the touched scope; for logic changes run pnpm type-check; add focused vitest/Playwright/smoke checks when relevant.

## Facts
- **fsd_layers**: Repository uses Feature-Sliced Design layering: src/app, src/pages, src/widgets, src/features, src/entities, src/shared. [convention]
- **package_manager**: Use pnpm for package management and project commands. [convention]
- **commit_convention**: Use Conventional Commits. [convention]
- **layer_constraints_shared**: shared must not import upper layers. [convention]
- **layer_constraints_entities**: entities may import only shared. [convention]
- **layer_constraints_features**: features build on entities and shared. [convention]
- **directory_naming**: pages and widgets directories use PascalCase; other submodules use lower camel case. [convention]
- **file_naming**: Vue components and class-centric files use PascalCase; other TypeScript files use lower camel case or lowercase. [convention]
- **test_colocation**: Keep unit tests colocated as sibling *.test.ts files; do not introduce __tests__ directories. [convention]
- **verification_lint_format**: After editing linted/formatted files, run the narrowest relevant targeted oxlint/eslint --fix/oxfmt pass for the touched scope. [convention]

---

## Consolidated summary (formerly abstract/overview)
The repo-root AGENTS.md defines Feature-Sliced Design layer boundaries and dependency rules, plus conventions for naming, test colocation, and targeted pnpm-based verification (type-check/lint/format/tests) with Conventional Commits.

### Key points
- Root `AGENTS.md` defines repo-wide policy unless overridden by deeper `AGENTS.md` files; it encodes Feature-Sliced Design (FSD) responsibilities, dependency direction, verification expectations, and naming conventions.
- Changes should stay within the owning FSD layer and respect import direction; use `index.ts` public entry points when available and avoid pulling dependencies “upward.”
- Verification is via `pnpm` and targeted checks (type-check, lint/format, tests); prefer narrow scope runs over repo-wide commands and verify ambiguous third-party behavior via official docs or installed source.
- UI/runtime wiring (DOM parentage, scroll, focus, teleport, overlays) is treated as a concrete contract—validate rendered hierarchy before refactors; optimize for Material 3 and mobile-first performance constraints.
- Keep contracts narrow and boundary-local: prefer primitives/IDs/small display records and explicit emits/slots; keep parsing/validation close to the defining boundary; avoid orchestration complexity in component props.
- Lifecycle-manage resources (subscriptions, listeners, workers, timers, caches, file handles, blob URLs) and follow specific CRDT mutation rules (mutate within owning callback; don’t reassign live doc objects).
- Use Conventional Commits; follow directory/file/module naming conventions (including reserved prefixes/suffixes like `MD*`, `$`, and `*Service`).

### Notable entities, patterns, or decisions mentioned
- **Entities / tools**: `pnpm`; `oxlint`, `eslint --fix`, `oxfmt`; TypeScript (`pnpm type-check`); `vitest`, Playwright; “mutation check” for touched test scope.
- **Architecture**: Feature-Sliced Design layers `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared` with stated responsibilities and dependency constraints.
- **Verification**: run the narrowest relevant checks; minimum `pnpm type-check` for logic changes; validate ambiguous third-party behavior; explicitly note when unverified.
- **UI/runtime**: DOM hierarchy/scroll/focus/teleport/overlays as contract; Material 3 + mobile-first; bound main-thread work; prefer determinate progress.
- **API/contract design**: narrow contracts; boundary-local parsing/validation; typed iteration helpers; avoid unnecessary type assertions.
- **CRDT**: mutate inside owning change callback; don’t reassign live doc objects; prefer helpers `put`, `patch`, `deepPutJsonObject`, `deepPatchJsonObject`.
- **Tests**: sibling `*.test.ts`, no `__tests__` dirs.
- **Naming**: conventions for directories/files/modules/components; reserved prefixes/suffixes (`MD*`, `$`, `*Service`, etc.).
- **Scope management**: ByteRover usage in `byterover` skill; child `AGENTS.md` only for local invariants; keep `Contains` stable; update AGENTS tree with ownership/API/dependency/verification changes.
