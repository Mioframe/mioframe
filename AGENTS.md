# /

Applies to the whole repository. Applicable instructions are cumulative: a deeper `AGENTS.md` may add narrower constraints, but must not replace or weaken parent rules.

## Source of truth and instruction loading

- The current repository, its `AGENTS.md` tree, `.agents/skills/*/SKILL.md`, project documentation, code, and tests are the source of truth.
- Read the root and applicable nested `AGENTS.md` files before editing. Use the relevant skills as operating instructions; do not restate their detailed policy in plans or reports.
- Inspect only task-relevant files and direct dependencies first. Expand the search only when evidence shows a wider impact.
- If repository state, third-party semantics, or required behavior is unverified, verify it or report it as unresolved. Do not invent facts.
- `docs/testing/architecture.md` is the canonical project-wide testing policy. `docs/testing/migration-plan.md` records temporary gaps between that target and current `verify`; do not claim target resolver behavior before its migration step is implemented.
- `src/shared/ui/material/docs/architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, `m3e-defects.md`, and `roadmap.md` are the canonical Material library architecture, adapter contract, token ownership contract, public token API catalogue, upstream-defect registry, and migration records.
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
- When product or generic shared UI consumes an official Material component, it must use the Mioframe `MD*` Vue API. Native HTML and project-specific or generic shared UI remain valid when they are the correct owner. Direct `@m3e/web` imports, `m3e-*` elements, renderer element types, and `--m3e-*` variables are allowed only inside `src/shared/ui/material`.

## Required skills

Use the applicable skill instead of duplicating its rules in the task:

- `vue-component-implementation`: `.vue` components and UI composables;
- `shared-ui-implementation`: project-specific or generic shared UI primitives outside official Material component families;
- `material-component-adapter`: one official Material component or proven inseparable family implemented or migrated end to end as a stable Mioframe Vue API backed privately by the documented public `@m3e/web` contract when viable;
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

## Pull request workflow

- Local coding agents own repository files and local commands. The operator or architect owns PR title and body, draft/ready state, review threads, complete resulting-PR review, merge readiness, and merge execution.
- Keep a PR in draft while implementation, required proof, current-head verification, or review blockers remain. Mark it ready only after the current head has complete required checks, the full resulting diff has been reviewed, PR metadata is accurate, and no unresolved review threads remain.
- Green CI proves only that automated checks passed. It is not architecture approval or merge readiness. Re-review the current head after every pushed commit, including CI autofix commits.
- Branch prefixes are descriptive rather than an allow-list. Use a clear prefix such as `feature/`, `feat/`, `fix/`, `hotfix/`, `release-repair/`, `refactor/`, `docs/`, `chore/`, or `agent/` that reflects the work.

## Mandatory verification

- Use `implementation-preflight` to resolve task-specific `TEST IMPACT` before non-trivial edits and `verification` to inspect and execute repository verification.
- `TEST IMPACT` is a reviewable design record; `verify` never parses it. Automatic scope comes from status-aware Git diff, tests/imports, snapshots, and persistent repository impact metadata.
- Inferred verify scope is an optimization. A skipped or empty lane is not proof that it is unnecessary. Unknown relevant impact must use full owning-lane fallback.
- A new, moved, renamed, or removed Playwright spec must update its owning mapping or justified standalone entry in the same change. Source mappings contain production, story, fixture, or owned support paths; do not put spec paths in source prefixes to group tests.
- Use `pnpm verify --fix-only` when only safe automatic formatting, lint fixes, or instruction compatibility generation is needed. Inspect generated changes before verification. `pnpm verify --fix` is a combined convenience mode, not the default agent workflow and never the final gate.
- Use `pnpm verify --only <label> --files ...` for focused development feedback when supported. `--files` is not status-aware deletion/rename planning. Do not substitute raw underlying test, lint, visual, mutation, or E2E commands for verify-managed checks, including raw commands printed as diagnostics by a failed verify step.
- The top-level task owns exactly one final read-only completion gate after all implementation and focused or mode-specific proof are complete. Nested implementation/testing skills do not own separate final gates.
- For ordinary feature-branch or PR work, use `pnpm verify --base <parent-ref>`; use `origin/develop` for an ordinary branch and the actual parent feature branch for stacked work. Plain `pnpm verify` is sufficient only when the complete task is exactly the current uncommitted diff against `HEAD`, or exactly the single last commit selected by its documented fallback; it must not be reported as PR-wide proof otherwise.
- Until the focused release resolver is implemented, a change to build/release config, routing/base paths, manifest/PWA/service worker/channel isolation, release scripts, artifact assembly, or production-output dependencies requires `pnpm verify:release` as the single final completion gate. It replaces the ordinary `pnpm verify --base <parent-ref>` completion gate; never run both as final gates. Run any required mutation or other mode-specific proof before it through focused verify-managed commands.
- Preserve the invocation scope when retrying verification. Keep applicable `--base`, `--full`, `--profile`, `--files`, and `--only` arguments; remove `--fix` or `--fix-only` for the final read-only rerun. Do not follow a suggestion that silently falls back to plain `pnpm verify` or to a raw underlying command.
- Mutation should ultimately be selected from validated persistent high-risk targets. Until migration is complete, ordinary branch-diff verification may still execute broader legacy mutation inference; do not skip it or claim the target registry already exists.
- Preserve the current app E2E desktop/mobile matrix until a dedicated audited migration demonstrates safe project filtering.
- A minimum check named in a nested `AGENTS.md` describes required proof, not a separate command boundary. Run its verify-managed equivalent whenever a matching label exists.
- Do not start duplicate expensive checks in parallel. Use `pnpm verify:status` and `.verify/logs` when verification is already active. After `pnpm verify:resume`, rerun the exact completion-gate command printed when validated structured metadata is available; otherwise reconstruct the original scope explicitly. Never silently replace it with plain `pnpm verify`.
- If the final completion gate fails, repository impact metadata is invalid, or required proof is missing, do not claim the task is complete. Report the exact failure and remaining work.

Final response after edits must include:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining required work, verification, or blocker>

VERIFY RESULT
command: <exact final completion-gate command>
status: passed | failed | not run | blocked by active local verification
reason if not run:
```

## Release

- `develop` is the active development branch; `main` is the stable public branch.
- Every PR into `develop` or `main` must increase `package.json` version, except the documented pre-tag repair and `main` to `develop` release-sync cases.
- Ordinary feature, fix, refactor, docs, tooling, and agent PRs into `develop`, plus direct hotfix and pre-tag repair PRs into `main`, use squash merge.
- `develop` to `main` promotion PRs and `main` to `develop` release sync-back PRs use merge commits. Rebase merge is forbidden for all repository flows.
- `pnpm verify` is the focused development gate. Its target architecture includes automatic focused release proof for release-relevant changes. `pnpm verify:release` remains the unconditional full release gate required for `main`.
- Follow `docs/release.md` and `docs/release-checklist.md` for the complete release policy.

## Agent environment compatibility

- `AGENTS.md` and `.agents/skills/*/SKILL.md` are canonical. Do not edit generated `CLAUDE.md` or `.claude/skills` directly.
- After changing the instruction tree, run `pnpm verify --fix-only --base <parent-ref>` to regenerate compatibility files and inspect the generated diff. Then run the one applicable final completion gate: ordinary branch-diff verify, or `pnpm verify:release` when full/release proof is required.
