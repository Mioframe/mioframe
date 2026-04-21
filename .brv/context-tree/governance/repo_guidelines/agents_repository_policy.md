---
title: AGENTS Repository Policy
summary: 'Repository-wide AGENTS.md policy: FSD layer responsibilities and boundaries, verification requirements (type-check + targeted tests), naming conventions, and constraints for shared/entities/features/widgets/pages.'
tags: []
related: [architecture/feature_sliced_design/context.md]
keywords: []
createdAt: '2026-04-20T10:37:24.747Z'
updatedAt: '2026-04-20T10:37:24.747Z'
---
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

**INSTRUCTIONS:**
- The file contents above have been pre-loaded for you
- Use this content to understand the context and create comprehensive knowledge topics
- DO NOT use read_file tool for the files above - the content is already provided
- Proceed with the normal workflow: detect domains, find existing knowledge, create/update topics
- PRESERVE all diagrams (Mermaid, PlantUML, ASCII art) verbatim using narrative.diagrams array
- PRESERVE all tables with every row - do not summarize table data
- PRESERVE exact code examples, API signatures, and interface definitions
- PRESERVE step-by-step procedures and numbered instructions in narrative.rules


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
- **file_naming**: Vue components and class-centric files use PascalCase; other TypeScript files use lower camel case or lowercase. [convention]
