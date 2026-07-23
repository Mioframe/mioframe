# /

Applies to the whole repository. Applicable instructions are cumulative: a deeper `AGENTS.md` may add narrower constraints, but must not replace or weaken parent rules.

## Source of truth and instruction loading

- The current repository, its `AGENTS.md` tree, `.agents/skills/*/SKILL.md`, project documentation, code, and tests are the source of truth.
- Read the root and applicable nested `AGENTS.md` files before editing. Use the relevant skills as operating instructions; do not restate their detailed policy in plans or reports.
- Inspect only task-relevant files and direct dependencies first. Expand the search only when evidence shows a wider impact.
- If repository state, third-party semantics, or required behavior is unverified, verify it or report it as unresolved. Do not invent facts.
- `docs/testing/architecture.md` is the canonical project-wide testing policy. `docs/testing/migration-plan.md` records temporary gaps between that target and current `verify`; do not claim target resolver behavior before its migration step is implemented.
- Update an `AGENTS.md` or skill only when a change establishes or changes a durable repository rule, ownership/dependency model, public-contract convention, or verification workflow. Do not edit instructions merely because one concrete API changed.

## Architecture and implementation workflow

- For non-trivial product, feature, cross-layer, shared UI, storage, diagnostics, workflow, or architecture changes, use `architect-handoff` unless an applicable repository skill or policy defines a deterministic standard-authoring path that resolves every required decision from authoritative sources.
- Use `implementation-preflight` before non-trivial code edits. Do not begin implementation while a required handoff is missing or `not ready`, while a deterministic standard-authoring preflight remains unresolved or `blocked`, or while task-specific `TEST IMPACT` is unresolved.
- Prefer the minimum complete design for confirmed requirements. Every added abstraction, state, layer, compatibility path, recovery mechanism, guarantee, optimization, test registry, impact mapping, or helper must map to a current requirement, existing consumer, repository invariant, platform constraint, or measured need.
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

- `vue-component-implementation`: `.vue` components and UI composables;
- `shared-ui-implementation`: project-specific or generic shared UI primitives;
- `material-component-design`: source-only `DESIGN.md` for one official Material component resolved through the configured `material3` MCP snapshot; no direct-site scraping or repository implementation analysis;
- `test-first`: one meaningful red/green check for changed observable behavior when applicable;
- `unit-testing`: deterministic pure/domain/service/storage/CRDT and module-boundary proof in the `unit-tests` lane;
- `component-contract-testing`: Vue public API, native semantics, ARIA ownership, and non-browser wiring in the `unit-tests` lane;
- `ui-browser-behavior`: real browser proof in isolated Storybook or complete app E2E according to ownership;
- `visual-regression-testing`: canonical visual stories, bounded screenshots, baseline updates, and operator visual handoff;
- `mutation-testing`: narrow audits and persistent ownership for high-risk deterministic logic;
- `crdt-storage`: Automerge, VFS, storage, repository lifecycle, and managed resources;
- `diagnostic-events`: Sentry-backed diagnostics, privacy, and error reporting;
- `verification`: inspect and execute automatic verify planning, use focused overrides, handle failures, and report final task/verify status.

## Implementation quality

- Prefer explicit, local, readable code over broad generic frameworks or hidden orchestration.
- Reuse existing project mechanisms and algorithms when they already own the behavior. Do not create a parallel implementation that can drift.
- Keep modules cohesive and responsibilities explicit. Treat 500+ line production files as an extraction review trigger, not an automatic rewrite; do not grow an ordinary implementation file beyond 500 lines without a clear cohesion-based reason.
- Separate behavior-preserving extraction from behavior changes when practical. Remove obsolete paths, exports, tests, and comments when their replacement is introduced unless compatibility is explicitly required.
- Keep public APIs narrow. Every touched public export must have accurate, complete TSDoc. Prefer IDs, primitives, small typed records, explicit props, emits, slots, and actions over broad configuration or mixed read/write objects.
- Keep validation, parsing, and extraction close to the boundary that defines them. Use typed collection helpers for typed records instead of local assertions that paper over `Object.keys`, `Object.values`, or `Object.entries` typing.
- Follow `docs/testing/architecture.md`: one primary proof owner per contract, multiple proof types when one change affects multiple contracts, the lowest faithful proof, proportional coverage, and repository-backed automatic impact metadata.
- Keep unit tests and their helpers colocated as sibling `*.test.ts` and `*.testUtils.ts` files. Do not introduce `__tests__` directories or export test helpers from production barrels; create shared test utilities only after unrelated modules need the same helper.
- Test files may be larger when scenarios remain uniform. Split them by behavior when setup becomes conditional, fixtures stop being local, or failures no longer identify one behavior.
- `!important` is forbidden. Shared UI changes require consumer and blast-radius review.
- Optimize user-visible behavior for mobile browsers, large datasets, and low-end devices; keep main-thread work bounded.

## Naming and repository conventions

- Use `pnpm` for package management and project commands. Use Conventional Commits.
- `pages` and `widgets` directories use PascalCase; other submodules use lower camel case.
- Vue components and class-centric files use PascalCase; other TypeScript files use lower camel case or lowercase.
- Feature modules use user-action names such as `<domain><Action>`; entity modules use stable domain concepts.
- Visual components use concrete surface suffixes such as `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, or `State`.
- `use*` exposes reactive or lifecycle-managed capabilities; `setup*` wires dependencies and cleanup; `define*` is side-effect-light; `create*` returns a fresh owned instance; `get*` derives or looks up; `is*` is boolean; `zod*` exports schemas; `*Service` is background infrastructure; `on*` names handlers; `$` suffix is reserved for raw RxJS observables.
- Add a child `AGENTS.md` only for stable local invariants that the parent cannot express cleanly. Child files refine rather than repeat parent rules.

## Mandatory verification

- Use `implementation-preflight` to resolve task-specific `TEST IMPACT` before non-trivial edits and `verification` to inspect and execute repository verification.
- `TEST IMPACT` is a reviewable design record; `verify` never parses it. Automatic scope comes from status-aware Git diff, tests/imports, snapshots, and persistent repository impact metadata.
- Inferred verify scope is an optimization. A skipped or empty lane is not proof that it is unnecessary. Unknown relevant impact must use full owning-lane fallback.
- A new, moved, renamed, or removed Playwright spec must update its owning mapping or justified standalone entry in the same change. Source mappings contain production, story, fixture, or owned support paths; do not put spec paths in source prefixes to group tests.
- Release-only contracts must have repository-owned impact mapping to build, artifact, or release-smoke proof. Until the focused release resolver is implemented, explicitly run `pnpm verify:release` for changes to build/release config, routing/base paths, manifest/PWA/service worker/channel isolation, release scripts, artifact assembly, or production-output dependencies.
- Use `pnpm verify --fix` only when safe automatic formatting, lint fixes, or instruction compatibility generation are useful.
- Before reporting completion after edits, run final read-only `pnpm verify`. Focused checks do not replace it, and the final command must not use `--fix`.
- Use `pnpm verify --only <label> --files ...` for focused feedback when supported. `--files` is not status-aware deletion/rename planning. Do not substitute raw underlying test, lint, visual, mutation, or E2E commands for verify-managed checks.
- Mutation should ultimately be selected from validated persistent high-risk targets. Until migration is complete, final `pnpm verify` may still execute broader legacy mutation inference; do not skip it or claim the target registry already exists.
- Preserve the current app E2E desktop/mobile matrix until a dedicated audited migration demonstrates safe project filtering.
- A minimum check named in a nested `AGENTS.md` describes required proof, not a separate command boundary. Run its verify-managed equivalent whenever a matching label exists.
- Do not start duplicate expensive checks in parallel. Use `pnpm verify:status` and `.verify/logs` when verification is already active.
- If final verification fails, repository impact metadata is invalid, or required proof is missing, do not claim the task is complete. Report the exact failure and remaining work.

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
- `pnpm verify` is the focused development gate. Its target architecture includes automatic focused release proof for release-relevant changes. `pnpm verify:release` remains the unconditional full release gate required for `main`.
- Follow `docs/release.md` and `docs/release-checklist.md` for the complete release policy.

## Agent environment compatibility

- `AGENTS.md` and `.agents/skills/*/SKILL.md` are canonical. Do not edit generated `CLAUDE.md` or `.claude/skills` directly.
- After changing the instruction tree, run `pnpm verify --fix` to regenerate compatibility files, then final `pnpm verify`.