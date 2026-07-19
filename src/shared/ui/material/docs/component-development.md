# Material component workflow

This is the only implementation workflow for an official public Material component family.

The process has one external implementation entry point and three internal stage owners. Supporting source, foundation, Vue, testing, and verification skills do not create parallel plans or choose the next stage.

## Workflow map

```text
material-component
  0 lock one family and objective
  1 material-component-contract
  2 material-foundation when the resolved contract requires it
  3 material-component-implementation
      primary vertical slice
      → representative consumer validation
      → complete supported family
  4 material-component-adoption
  5 material-component-review
  6 verification
```

`material-component-review` may also be invoked directly for review-only work. It never becomes an implementation path.

## Invariants

- Work on exactly one component family per task and PR.
- `material-component` is the only implementation orchestrator.
- Internal stage skills do not invoke each other, choose another family, or update the roadmap.
- Follow the stages in order and pass each exit gate before advancing.
- Do not begin production edits until the family contract is ready.
- Validate the primary architecture in one real representative consumer before expanding the full family.
- Do not report completion while an obsolete owner, compatibility path, unresolved decision, failed check, or required visual acceptance remains.
- Use repository code and consumers as compatibility evidence, not Material authority.
- Use current official Material sources as authority for Material semantics and visible contracts.
- Create no registry, inventory, audit file, checklist, progress ledger, or second family contract.

## Stage 0 — Orchestrator locks the task

`material-component` resolves and keeps fixed:

- one family;
- one change mode: `new-component`, `end-to-end-migration`, `library-relocation-only`, or `alignment-only`;
- one concrete objective;
- required user and component scenarios;
- explicit non-goals;
- the current stage and its next exit gate.

A family name is optional only when `docs/roadmap.md` already names one active family. Do not infer another family from an inventory or begin a second family.

Use `end-to-end-migration` by default for a legacy official family. Use a narrower mode only when it produces a complete independently valid result and the reason is recorded in the family contract.

**Exit gate:** family, mode, objective, scenarios, non-goals, and current stage are unambiguous.

## Stage 1 — Contract

Owner: `material-component-contract`.

Before production edits:

1. inspect the current owner, public exports, direct consumers, tests, stories, snapshots, and known defects;
2. resolve the current official Material 3 Expressive requirements for the required scenarios;
3. identify the canonical owner under `components/<family>`;
4. define the minimum complete supported surface and explicit unsupported surface;
5. resolve public API, native semantics, accessibility, anatomy, DOM ownership, state ownership, token routing, and required proof;
6. identify only foundation domains required by this family;
7. create or update `components/<family>/README.md`.

The family README is the only durable family contract:

```text
MATERIAL COMPONENT CONTRACT

Change mode:
Family:
Components:
Objective:
Required scenarios:
Non-goals:
Current owner:
Canonical owner:
Public export:
Affected consumers:
Representative consumer:
Official sources and snapshot:
Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics and accessibility:
Anatomy and DOM ownership:
State ownership and lifecycle:
Token and rendered-property routing:
Required foundation dependencies:
Applicable proof:
Consumer migration:
Extensions or deviations: none | <records>
Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

Omit only objectively inapplicable fields. Do not replace unresolved decisions with placeholders or defer them to implementation.

When the contract proves that a cross-family foundation change is required, the orchestrator invokes `material-foundation` and resumes only after that foundation exit gate passes.

**Exit gate:** `Unresolved: none`, `Readiness: ready`, and every required foundation dependency is available.

## Stage 2 — Implementation

Owner: `material-component-implementation`.

### Checkpoint A — Primary vertical slice

Choose one representative configuration and implement it end to end:

- canonical production component and public entry point;
- native semantic and accessible owner;
- required anatomy without unnecessary DOM nodes;
- actual token-to-rendered-property route;
- required state and interaction path;
- one stable bounded canonical Storybook story;
- focused proof at the lowest faithful layer.

Do not implement every size, variant, configuration, or state before this slice is coherent.

### Checkpoint B — Representative consumer

Integrate the primary slice into the one representative consumer named by the contract and verify:

- public API usability in real composition;
- placement and parent-owned layout;
- attribute, slot, event, and state wiring;
- focus, keyboard, pointer, touch, disabled, and loading behavior when applicable;
- token inheritance and surrounding theme behavior;
- preservation of the required product scenario.

If this integration exposes an API, ownership, DOM, state, or foundation defect, return to Stage 1. Do not patch the consumer around a wrong library contract.

### Checkpoint C — Complete supported family

Expand only the supported surface recorded in the contract:

- required components, variants, sizes, configurations, and states;
- invalid-combination handling;
- complete public props, emits, slots, attributes, and events;
- required interaction, ripple, focus, motion, cancellation, interruption, disabled, failure, and cleanup behavior;
- materially distinct Storybook examples and behavior fixtures;
- proportional component, browser, pure, and visual proof.

Rules:

- Consumer-controlled semantic state must not gain a hidden internal copy.
- Browser-owned facts such as hover and focus-visible remain browser or foundation owned.
- Every canonical token has one declaration owner.
- Configuration selects token sources; state resolves output; rendering applies the final value to the actual DOM owner.
- Use the shortest explicit route. Do not add aliases, managers, generic resolvers, universal bases, or files that do not improve current clarity or proof.
- Do not create Cartesian Storybook matrices or tests for framework behavior the project does not own.

**Exit gate:** the representative consumer works, every supported family route is implemented and proved, and unsupported routes remain absent.

## Stage 3 — Adoption

Owner: `material-component-adoption`.

For an end-to-end migration:

1. migrate every remaining in-repository consumer through the curated public API;
2. preserve accepted product behavior except for named intentional deltas;
3. verify only integration risks introduced by the migration;
4. remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, and compatibility paths.

Do not keep two active family owners. Do not leave permanent aliases or deferred cleanup for another PR.

**Exit gate:** all consumers use the canonical owner and no obsolete active path remains.

## Stage 4 — Review

Owner: `material-component-review`.

Review the complete resulting family, not only the latest diff. Compare official sources, the family contract, production code, actual rendered Storybook output, tests, direct consumers, and removed legacy ownership.

README text, tests, snapshots, stories, and green checks are claims or regression guards, not proof of Material correctness by themselves.

The review reports consolidated findings and exactly one verdict. The orchestrator routes corrections back to:

- `material-component-contract` for source, ownership, supported-surface, API, anatomy-contract, state-contract, or foundation decisions;
- `material-component-implementation` for family implementation, behavior, token routing, Storybook, or proof defects;
- `material-component-adoption` for consumer, compatibility, parallel-owner, or cleanup defects.

After corrections, run the complete review again.

When visible output changed, prepare the canonical Storybook location, bounded screenshots or diffs, official visual references, expected deviations, and confirmation that non-visual review is complete. The agent never invents operator acceptance.

**Exit gate:** no unresolved blocker or major issue remains, and required operator visual acceptance is recorded.

## Stage 5 — Verification and finish

Owner: `verification` through the orchestrator.

1. run focused checks during the owning implementation stage;
2. run final read-only `pnpm verify`;
3. update `docs/roadmap.md` only when active family, status, blocker, or single next action changes;
4. report the final family, change mode, supported and unsupported surface, foundation impact, proof, consumer migration, removed ownership, review verdict, visual status, verification, and exact remaining blockers.

**Exit gate:** final verification passes and every required acceptance gate is complete.

## Stage result contract

Every internal stage returns:

```text
MATERIAL STAGE RESULT

Family:
Stage: contract | implementation | adoption | review
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Blocker: none | <exact blocker>
```

Only `material-component` chooses and starts the next stage.

## Progression and recovery

- Every intermediate report names the family, current stage, current objective, next exit gate, and exact blocker or `none`.
- Do not stop after research, contract writing, Storybook preparation, a primary slice, or focused tests when end-to-end implementation was requested.
- Do not ask the user to choose variants, APIs, files, foundations, or tests that official sources and repository evidence can resolve.
- Do not start another family because the current family is blocked.
- If new evidence invalidates the contract, return explicitly to Stage 1.
- If two correction rounds retain the same defect, add workaround logic, or create ownership ambiguity, discard the patch strategy and reconstruct the contract before continuing.

## Proof ownership

- component contract tests: API, defaults, native owner, explicit attributes, ARIA, controlled state, slots, emits, invalid combinations, and non-browser wiring;
- browser behavior tests: real focus, keyboard, pointer/touch, target area, overlay, responsive behavior, ripple, motion lifecycle, cancellation, interruption, and cleanup owned by the family;
- pure tests: extracted deterministic logic or lifecycle only;
- visual regression: bounded protection of an already accepted stable rendered contract;
- consumer checks: compatibility and composition risks introduced by representative integration or migration;
- repository verification: format, lint, types, tests, build, and dependency guards selected by `verify`.

Generic foundation behavior is proved once by its owner. A family proves only its routing into that contract and its own semantics, anatomy, behavior, and rendering.

## Forbidden

- product or domain dependencies inside the Material family;
- public APIs shaped around one Mioframe consumer;
- speculative variants, abstractions, managers, registries, validators, extension points, or foundations;
- universal base components or cross-family component state machines;
- unnecessary DOM nodes;
- generic component test DSLs or public test-only API;
- fixed file profiles or mandatory artifact counts;
- screenshots used as proof of behavior or official correctness;
- permanent compatibility aliases, duplicated owners, or deferred cleanup;
- a second implementation workflow.