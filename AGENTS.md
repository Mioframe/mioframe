# /

Applies to the whole repository. Applicable instructions are cumulative: a deeper `AGENTS.md` may add narrower constraints, but must not replace or weaken parent rules.

## Source of truth and instruction loading

- The current repository, its `AGENTS.md` tree, `.agents/skills/*/SKILL.md`, project documentation, code, and tests are the source of truth.
- Read the root and applicable nested `AGENTS.md` files before editing. Use the relevant skills as operating instructions; do not restate their detailed policy in plans or reports.
- Inspect only task-relevant files and direct dependencies first. Expand the search only when evidence shows a wider impact.
- If repository state, third-party semantics, or required behavior is unverified, verify it or report it as unresolved. Do not invent facts.
- For automatic Material migration, read `docs/material-3/library-roadmap.md`, follow its active milestone and single `Next action`, and update it when milestone status, blockers, dependencies, or next action change.
- An explicit user-selected Material artifact or correction overrides automatic queue order for that task. The agent must execute the requested official component, foundation, or style through the universal `material` routing workflow instead of refusing because the roadmap names another target.
- Official Material artifacts target the current canonical Material 3 Expressive contract. Follow `docs/material-3/source-of-truth.md` and applicable review policy: the coding agent closes every objective source, architecture, accessibility, behavior, geometry, ownership, and migration gate; the operator performs only final perceived visual comparison when required.
- When a PR adds, removes, consolidates, reclassifies, reprioritizes, or changes the public owner of a shared UI artifact, update the affected row in `docs/material-3/ui-library-inventory.md` in the same PR. Project-specific and generic UI are valid retained outcomes and must not be forced into the Material library.
- Update an `AGENTS.md` or skill only when a change establishes or changes a durable repository rule, ownership/dependency model, public-contract convention, or verification workflow. Do not edit instructions merely because one concrete API changed.

## Architecture and implementation workflow

- For non-trivial product, feature, cross-layer, shared UI, storage, diagnostics, Material, workflow, or architecture changes, use `architect-handoff` unless an applicable repository skill or policy defines a deterministic standard-authoring path that resolves every required decision from authoritative sources.
- Use `implementation-preflight` before non-trivial code edits. Do not begin implementation while a required handoff is missing or `not ready`, or while a deterministic standard-authoring preflight remains unresolved or `blocked`.
- Prefer the minimum complete design for confirmed requirements. Every added abstraction, state, layer, compatibility path, recovery mechanism, guarantee, or optimization must map to an explicit user request, current requirement, existing consumer, repository invariant, platform constraint, or measured need.
- Compare the proposed design with the simplest viable alternative. If fewer concepts satisfy the same acceptance criteria without breaking ownership, use the simpler design.
- Treat the ready handoff or repository-backed standard-authoring blueprint as the contract for implementation, PR description, and review. If new facts invalidate it, stop and update it explicitly.
- Preserve existing user scenarios unless the task explicitly changes them. Reachability alone is not preservation when discoverability, interaction tier, steps, or context regress.
- If two correction rounds still add concepts, workarounds, ownership drift, mixed responsibilities, or missing scenarios, stop patching and redo the architecture decision.

## Ownership and dependency direction

- `src/app`: bootstrap, routing, global shells, and global styles.
- `src/pages`: route and pane composition, navigation, and pane layout state.
- `src/widgets`: product-block composition from lower layers.
- `src/features`: user-triggered actions, flows, and feature state.
- `src/entities`: domain models, domain reads, entity operations, and small entity UI.
- `src/shared`: upper-layer-independent infrastructure, services, schemas, utilities, and shared UI.

Dependency rules:

- `shared` must not import upper layers.
- `entities` may import only `shared`.
- `features` may import `entities` and `shared`.
- `widgets` and `pages` may compose lower layers but must not own domain rules or duplicate lower-layer state.
- UI-facing layers may access background logic only through explicit public proxy/client APIs; do not directly import `*Service` modules.
- Keep behavior in the layer that owns it. Do not move logic into `shared`, a widget, or a page merely to remove duplication or reduce file count.
- Use public `index.ts` entry points when available. Do not hide dependency violations behind helpers, lifecycle hooks, or deep imports.
- Service and worker layers own persistence, protocol interpretation, indexing, lifecycle, cache invalidation, and canonical storage facts. UI layers request actions and render typed facts; they must not reconstruct service-owned state from implementation details.
- Define errors next to the boundary that detects them. UI-facing records must not expose clients, adapters, providers, credentials, callbacks, capabilities, or service bags.
- Do not duplicate schemas, type aliases, constants, or non-trivial algorithms across layers. Keep one owner and expose a narrow public contract.

## Required skills

Use the applicable skill instead of duplicating its rules in the task:

- `material`: universal entrypoint for any explicit Material component, foundation, style, interaction primitive, token system, migration, alignment, or correction; it resolves ownership and executes the specialized workflow;
- `material-library-status`: read-only Material program status, audit freshness, blockers, executable candidates, visual acceptance, and recommended next command;
- `material-library-next`: select and execute exactly one next automatic Material migration target when the user does not name one;
- `material-component`: component-family implementation compatibility entrypoint; it must reroute non-component Material requests to `material-foundation` rather than refuse them;
- `material-component-review`: independently review a user-named Material component family and persist its durable compliance audit;
- `material3-guidelines`: official Material sources, component/artifact choice, usage, composition, and product-facing UI/UX decisions;
- `material-component-authoring`: creation, migration, alignment, or material change of an official public Material component family, including legacy `MD*` components outside the canonical library;
- `material-foundation`: implement, migrate, align, or correct Material foundations and styles, including State Layer, ripple, focus, reference/system tokens, theme, units, typography, shape, elevation, motion, icons, accessibility, and adaptive/layout contracts; an explicit request is sufficient and does not require pre-existing consumers;
- `vue-component-implementation`: `.vue` components and UI composables;
- `shared-ui-implementation`: project-specific or generic shared UI primitives outside official Material component families;
- `test-first`: reproducible behavior changes, bug fixes, migrations, storage semantics, and transformations;
- `component-contract-testing`: small Vue render/props/emits/slots/wiring contracts;
- `ui-browser-behavior`: layout, focus, keyboard, pointer/touch, scrolling, overlays, browser APIs, and mobile behavior;
- `visual-regression-testing`: appearance and screenshot coverage;
- `mutation-testing`: high-risk pure/domain/service logic when applicable;
- `crdt-storage`: Automerge, VFS, storage, repository lifecycle, and managed resources;
- `diagnostic-events`: Sentry-backed diagnostics, privacy, and error reporting;
- `verification`: focused checks, failure handling, and final task/verify reporting.

## Implementation quality

- Prefer explicit, local, readable code over broad generic frameworks or hidden orchestration.
- Reuse existing project mechanisms and algorithms when they already own the behavior. Do not create a parallel implementation that can drift.
- Keep modules cohesive and responsibilities explicit. Treat 500+ line production files as an extraction review trigger, not an automatic rewrite; do not grow an ordinary implementation file beyond 500 lines without a clear cohesion-based reason.
- Separate behavior-preserving extraction from behavior changes when practical. Remove obsolete paths, exports, tests, and comments when their replacement is introduced unless compatibility is explicitly required.
- Keep public APIs narrow. Every touched public export must have accurate, complete TSDoc. Prefer IDs, primitives, small typed records, explicit props, emits, slots, and actions over broad configuration or mixed read/write objects.
- Keep validation, parsing, and extraction close to the boundary that defines them. Use typed collection helpers for typed records instead of local assertions that paper over `Object.keys`, `Object.values`, or `Object.entries` typing.
- Keep unit tests and their helpers colocated as sibling `*.test.ts` and `*.testUtils.ts` files. Do not introduce `__tests__` directories or export test helpers from production barrels; create shared test utilities only after unrelated modules need the same helper.
- Test files may be larger when scenarios remain uniform. Split them by behavior when setup becomes conditional, fixtures stop being local, or failures no longer identify one behavior.
- `!important` is forbidden. Shared UI changes require consumer and blast-radius review.
- Optimize user-visible behavior for mobile browsers, large datasets, and low-end devices; keep main-thread work bounded.

## Naming and repository conventions

- Use `pnpm` for package management and project commands. Use Conventional Commits.
- `pages` and `widgets` directories use PascalCase; other submodules use lower camel case.
- Vue components and class-centric files use PascalCase; other TypeScript files use lower camel case or lowercase.
- Feature modules use user-action names such as `<domain><Action>`; entity modules use stable domain concepts.
- Visual components use concrete surface suffixes such as `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, or `State`. Reserve `MD*` for shared Material-style primitives.
- `use*` exposes reactive or lifecycle-managed capabilities; `setup*` wires dependencies and cleanup; `define*` is side-effect-light; `create*` returns a fresh owned instance; `get*` derives or looks up; `is*` is boolean; `zod*` exports schemas; `*Service` is background infrastructure; `on*` names handlers; `$` suffix is reserved for raw RxJS observables.
- Add a child `AGENTS.md` only for stable local invariants that the parent cannot express cleanly. Child files refine rather than repeat parent rules.

## Mandatory verification

- Use the `verification` skill for targeted checks, fix mode, failure interpretation, and the final report.
- Use `pnpm verify --fix` only when safe automatic formatting or lint fixes are useful.
- Before reporting completion after edits, run the final read-only `pnpm verify`. Focused checks do not replace it, and the final command must not use `--fix`.
- Use `pnpm verify --only <label> --files ...` for focused feedback when supported. Do not substitute raw underlying test, lint, visual, mutation, or e2e commands for verify-managed checks.
- A minimum check named in a nested `AGENTS.md` describes required coverage, not a separate command boundary. Run its verify-managed equivalent whenever a matching label exists.
- Do not start duplicate expensive checks in parallel. Use `pnpm verify:status` and `.verify/logs` when verification is already active.
- If final verification fails or required verification is missing, do not claim the task is complete. Report the exact failure and remaining work.

Final response after edits must include:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining required work, verification, or blocker>

VERIFY RESULT
command: pnpm verify
status: passed | failed | not run | blocked by active local verification
reason if not run:
```

## Release

- `develop` is the active development branch; `main` is the stable public branch.
- Every PR into `develop` or `main` must increase `package.json` version, except the documented pre-tag repair and `main` to `develop` release-sync cases.
- `develop`/`main` synchronization PRs use merge commits, never squash or rebase.
- `pnpm verify` is the focused development gate. `pnpm verify:release` is the full release gate required for `main`.
- Follow `docs/release.md` and `docs/release-checklist.md` for the complete release policy.

## Agent environment compatibility

- `AGENTS.md` and `.agents/skills/*/SKILL.md` are canonical. Do not edit generated `CLAUDE.md` or `.claude/skills` directly.
- After changing the instruction tree, run `pnpm verify --fix` to regenerate compatibility files, then final `pnpm verify`.
