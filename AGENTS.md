# /

Applies to the whole workspace. Applicable instructions are cumulative: a deeper `AGENTS.md` may add narrower constraints, but must not replace or weaken parent rules.

## Source of truth and instruction loading

- Current readable workspace files, the `AGENTS.md` tree, `.agents/skills/*/SKILL.md`, project documentation, code, and tests are the source of truth.
- Read the root and applicable nested `AGENTS.md` files before editing. Use relevant skills as operating instructions; do not restate their detailed policy in plans or reports.
- Inspect task-relevant files and direct dependencies first. Expand only when evidence shows wider impact.
- Verify uncertain workspace behavior, third-party semantics, and required behavior from available files or project commands. Otherwise report the fact as unresolved.
- `docs/testing/architecture.md` is the canonical project-wide testing policy.
- `docs/testing/storybook.md` is the canonical Storybook ownership, authoring, and target-placement policy; `docs/testing/migration-plan.md` records which target locations and verifier mechanisms are currently executable.
- `src/shared/ui/material/docs/component-workflow.md`, `component-contract.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `m3e-defects.md`, and `roadmap.md` are the canonical Material workflow and library records.
- Update an `AGENTS.md` or skill only for a durable rule, ownership model, public-contract convention, or verification workflow.

## Task scope

- Work only with task-relevant readable workspace files, file-oriented tools, and documented project commands.
- Load only the project rules and documentation required by the current task.
- When a project command fails before reaching its relevant check, record the exact visible failure, continue safe file work where possible, and report the remaining verification.

## Architecture and implementation workflow

- For non-trivial product, feature, cross-layer, shared UI, storage, diagnostics, workflow, or architecture changes, use `architect-handoff` unless an applicable deterministic skill resolves every required decision from authoritative sources.
- Use `implementation-preflight` before non-trivial code edits unless an applicable deterministic workflow explicitly owns an equivalent narrower implementation check. Official Material implementation and migration use their scoped Material skills and do not invoke the generic preflight.
- Official Material families follow the scoped `material-component` workflow; do not begin standalone Material implementation before its three-contract-ready gate.
- For explicit project, PR, architecture, implementation, or scoped code review, use `project-review`. It is a standalone reviewer protocol and is not automatically part of `material-component` or another implementation workflow. Persist active findings in the narrowest owner-local `REVIEW.md`; every finding must include linked evidence and a linked project/contract/authoritative basis.
- Do not begin implementation while a required handoff is missing or not ready, while deterministic preflight/checks are unresolved, or while task-specific proof ownership is unresolved.
- Prefer the minimum complete design for confirmed requirements. Every abstraction, state, layer, compatibility path, recovery mechanism, optimization, registry, mapping, or helper must map to a current requirement or verified invariant.
- Compare the proposal with the simplest viable alternative. If fewer concepts satisfy the same acceptance criteria without breaking ownership, use the simpler design.
- Treat the ready handoff or workspace-backed deterministic blueprint as the implementation contract. If new facts invalidate it, stop and update it explicitly.
- Preserve existing user scenarios unless the task explicitly changes them.
- If two correction rounds still reveal ownership drift, mixed responsibilities, unresolved scenarios, or growing workaround logic, return to architecture.

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
- Keep behavior in the layer that owns it. Do not move logic into `shared`, a widget, or a page merely to remove duplication.
- Use public `index.ts` entry points when available.
- Service and worker layers own persistence, protocol interpretation, indexing, lifecycle, cache invalidation, and canonical storage facts.
- Define errors next to the boundary that detects them.
- Do not duplicate schemas, type aliases, constants, or non-trivial algorithms across layers.
- Product and generic shared UI must consume official Material components through Mioframe `MD*` Vue APIs. Direct renderer imports, elements, types, and private variables are allowed only inside `src/shared/ui/material`.

## Required skills

Use the applicable skill instead of duplicating its rules:

- `vue-component-implementation`;
- `shared-ui-implementation`;
- `project-review`;
- `material-component`;
- `material-component-api-contract`;
- `material-component-token-contract`;
- `material-component-behavior-contract`;
- `material-component-implementation`;
- `material-component-migration`;
- `test-first`;
- `unit-testing`;
- `component-contract-testing`;
- `ui-browser-behavior`;
- `visual-regression-testing`;
- `mutation-testing`;
- `crdt-storage`;
- `diagnostic-events`;
- `verification`.

For Material-specific worker roles, source authority, resume/correction routing, and sequencing, follow `src/shared/ui/material/AGENTS.md` and `material-component`. Do not collapse isolated Material responsibilities into one context.

## Implementation quality

- Prefer explicit, local, readable code over broad generic frameworks or hidden orchestration.
- Reuse existing project mechanisms when they already own the behavior.
- Keep modules cohesive and responsibilities explicit. Treat 500+ line production files as an extraction review trigger, not an automatic rewrite.
- Separate behavior-preserving extraction from behavior changes when practical. Remove obsolete paths, exports, tests, and comments when their replacement is introduced unless compatibility is explicitly required.
- Keep public APIs narrow. Every touched public export must have accurate, complete TSDoc.
- Keep validation, parsing, and extraction close to the defining boundary.
- Follow `docs/testing/architecture.md`: one primary proof owner per contract, multiple proof types when required, the lowest faithful proof, and proportional coverage.
- Follow `docs/testing/storybook.md` for isolated UI stories and Storybook-owned browser/visual proof. Colocate `*.stories.ts` now; place browser/visual Playwright specs only where `docs/testing/migration-plan.md` says the current runner can discover them. Do not treat target colocation as already implemented.
- Keep complete cross-owner product scenarios centralized in application E2E; do not move them into Storybook fixtures.
- Keep unit tests and helpers colocated as sibling `*.test.ts` and `*.testUtils.ts` files. Do not introduce `__tests__` directories or export test helpers from production barrels.
- Split tests by behavior when setup becomes conditional or failures no longer identify one contract.
- `!important` is forbidden. Shared UI changes require consumer and blast-radius review.
- Keep main-thread work bounded for mobile browsers, large datasets, and low-end devices.

## Naming and workspace conventions

- Use `pnpm` for package management and project commands.
- `pages` and `widgets` directories use PascalCase; other submodules use lower camel case.
- Vue components and class-centric files use PascalCase; other TypeScript files use lower camel case or lowercase.
- Feature modules use user-action names; entity modules use stable domain concepts.
- Visual components use concrete surface suffixes such as `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, or `State`.
- `use*` exposes reactive or lifecycle-managed capabilities; `setup*` wires dependencies and cleanup; `define*` is side-effect-light; `create*` returns a fresh owned instance; `get*` derives or looks up; `is*` is boolean; `zod*` exports schemas; `*Service` is background infrastructure; `on*` names handlers; `$` is reserved for raw RxJS observables.
- Add a child `AGENTS.md` only for stable local invariants that the parent cannot express cleanly.

## Release versioning

- Coding agents must not manually bump `package.json` `version` for ordinary `develop` PRs. The architect/reviewer owns the `version:patch|minor|major` PR release-intent label; CI materializes the exact expected version from it. `main` and release sync-back behavior follow `docs/release.md`.

## Verification

- Keep the agent runtime's sandbox and permission system enabled. Mioframe's canonical verifier entry points (`pnpm verify ...`, `pnpm verify:release`, `pnpm verify:status`, and `pnpm verify:resume`) are repository-approved to run outside the generic agent sandbox only through the runtime's narrowly scoped command allow/exclusion or per-command approval/escalation mechanism. `verify` itself owns verification scope, locking, timeouts, resource limits, and containerized browser execution. Never enable unrestricted/full-access execution for the session, broaden approval to generic `pnpm`, `node`, or shell execution, or replace a blocked verifier invocation with a raw child command.
- Use `implementation-preflight` to resolve task-specific `TEST IMPACT` for ordinary non-trivial implementation; deterministic Material implementation/migration skills own their narrower proof checklist directly.
- During implementation or correction, coding agents may use `pnpm verify --only <label> --files ...` for the smallest useful verifier-managed feedback. Focused commands are optional iteration/diagnostic tools, not a mandatory final checklist.
- The default final local coding-agent handoff check is `pnpm verify` without `--full`. It automatically resolves the changed workspace to the smallest supported verification plan and prints the aggregated `VERIFY RESULT`.
- Do not confuse ordinary `pnpm verify` with full-project verification. Only `pnpm verify --full` / `pnpm verify:release` is unconditional full-project release scope, and coding agents do not run it merely to hand work back to the architect.
- Do not mechanically run format, lint, type-check, unit, browser, visual, E2E, mutation, or other labels one-by-one and then repeat the same work through `pnpm verify`. If no focused feedback is needed, run the final automatic command directly. If a focused rerun is useful after a failure, rerun only that failed scope while correcting it, then run the automatic `pnpm verify` once after corrections are stable.
- Use `pnpm verify --fix-only` only for safe automatic formatting, lint fixes, or instruction compatibility generation. Inspect resulting file changes before continuing; fix-only does not replace the final automatic `pnpm verify`.
- Do not substitute raw underlying test, lint, visual, mutation, or browser commands for verifier-managed checks except for narrow diagnosis explicitly allowed by the verification skill.
- Required contract proof must exist before handoff; the final automatic run and CI do not replace missing tests, architecture review, browser/visual evidence, or risk-specific verification.
- If the final automatic `pnpm verify` cannot complete because of a concrete environment, unrelated repository, or external blocker, report the exact blocker and a partial local verification result; do not replace it with a manually assembled complete list of `--only` checks.
- After the architect opens or updates a PR, GitHub CI is the authoritative final repository verification on the exact PR head. The architect owns semantic review, CI review, roadmap status, and merge readiness.
- If CI fails because of the PR, route the failure to the correct owner, fix it, use the smallest useful focused verifier-managed rerun if needed, then run the automatic `pnpm verify` once before handing the correction back. Do not rerun all unaffected labels individually.
- Do not claim merge readiness while required exact-head CI is missing or failing.

Final response after coding-agent edits must include:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL VERIFY RESULT
commands: <final pnpm verify, plus only focused verifier-managed commands actually useful during implementation/diagnosis>
status: passed | failed | partial | not run
reason if partial/not run: <reason the final automatic pnpm verify could not complete>

CI GATE
status: not owned by coding agent
```
