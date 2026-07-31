# /

Applies to the whole workspace. Applicable instructions are cumulative: a deeper `AGENTS.md` may add narrower constraints, but must not replace or weaken parent rules.

## Source of truth and instruction loading

- Current readable workspace files, the `AGENTS.md` tree, `.agents/skills/*/SKILL.md`, project documentation, code, and tests are the source of truth.
- Read the root and applicable nested `AGENTS.md` files before editing. Use relevant skills as operating instructions; do not restate their detailed policy in plans or reports.
- Inspect task-relevant files and direct dependencies first. Expand only when evidence shows wider impact.
- Verify uncertain workspace behavior, third-party semantics, and required behavior from available files or project commands. Otherwise report the fact as unresolved.
- `docs/testing/architecture.md` is the canonical project-wide testing policy.
- `src/shared/ui/material/docs/component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, `m3e-defects.md`, and `roadmap.md` are the canonical Material workflow and library records.
- Update an `AGENTS.md` or skill only for a durable rule, ownership model, public-contract convention, or verification workflow.

## Task scope

- Work only with task-relevant readable workspace files, file-oriented tools, and documented project commands.
- Load only the project rules and documentation required by the current task.
- When a project command fails before reaching its relevant check, record the exact visible failure, continue safe file work where possible, and report the remaining verification.

## Architecture and implementation workflow

- For non-trivial product, feature, cross-layer, shared UI, storage, diagnostics, workflow, or architecture changes, use `architect-handoff` unless an applicable deterministic skill resolves every required decision from authoritative sources.
- Use `implementation-preflight` before non-trivial code edits. Do not begin implementation while a required handoff is missing or not ready, while deterministic preflight is unresolved, or while task-specific `TEST IMPACT` is unresolved.
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
- `material-component`;
- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`;
- `test-first`;
- `unit-testing`;
- `component-contract-testing`;
- `ui-browser-behavior`;
- `visual-regression-testing`;
- `mutation-testing`;
- `crdt-storage`;
- `diagnostic-events`;
- `verification`.

For the Material workflow, the thin orchestrator selects, launches, validates, and routes. Each design, architecture, implementation, migration, and review stage runs in a fresh worker context and consumes only workspace files, applicable rules, the component name, and canonical upstream artifacts. The review worker must be independent from workers that authored architecture, implementation, or migration. If isolated workers are unavailable, report the Material workflow as blocked rather than simulating isolation.

## Implementation quality

- Prefer explicit, local, readable code over broad generic frameworks or hidden orchestration.
- Reuse existing project mechanisms when they already own the behavior.
- Keep modules cohesive and responsibilities explicit. Treat 500+ line production files as an extraction review trigger, not an automatic rewrite.
- Separate behavior-preserving extraction from behavior changes when practical. Remove obsolete paths, exports, tests, and comments when their replacement is introduced unless compatibility is explicitly required.
- Keep public APIs narrow. Every touched public export must have accurate, complete TSDoc.
- Keep validation, parsing, and extraction close to the defining boundary.
- Follow `docs/testing/architecture.md`: one primary proof owner per contract, multiple proof types when required, the lowest faithful proof, and proportional coverage.
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

## Verification

- Use `implementation-preflight` to resolve task-specific `TEST IMPACT` and `verification` to run project checks.
- Use focused verifier commands during implementation and one final read-only completion gate after all edits and focused proof are complete.
- Use `pnpm verify --fix-only` only for safe automatic formatting, lint fixes, or instruction compatibility generation. Inspect resulting file changes before continuing.
- Use `pnpm verify --only <label> --files ...` for focused development feedback when supported.
- Do not substitute raw underlying test, lint, visual, mutation, or browser commands for verifier-managed checks except for narrow diagnosis explicitly allowed by the verification skill.
- Use `pnpm verify` as the ordinary final gate. Use `pnpm verify:release` only when the verification skill classifies the task as requiring full release-sensitive proof.
- Preserve the exact verifier command and scope when retrying a failed check.
- Do not start duplicate expensive checks. Use the verifier status and resume commands when another run is active.
- When a required project command cannot complete, report the exact visible failure and remaining verification.
- Do not claim completion while required proof is missing or failing.

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
