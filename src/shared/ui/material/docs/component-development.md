# Material component workflow

This is the only implementation workflow for an official public Material component family.

The purpose of the workflow is to keep the coding agent focused on one family, one resolved contract, and one ordered path from evidence to merge-ready implementation. Do not split the same implementation across competing planning, authoring, audit, or status workflows.

## Invariants

- Work on exactly one component family per task and PR.
- Follow the stages below in order.
- Do not begin production edits until Stage 1 is complete.
- Do not expand variants before the primary vertical slice is coherent.
- Do not migrate consumers before the library contract is complete.
- Do not report completion while an obsolete owner, compatibility path, unresolved decision, failed check, or required visual acceptance remains.
- Use repository code and consumers as compatibility evidence, not as Material authority.
- Use official Material sources as the authority for Material semantics and visible contracts.
- Create no registry, inventory, audit file, checklist, progress ledger, or second family contract.

## Stage 0 — Lock the task

Resolve and keep fixed for the task:

- one family;
- one change mode: `new-component`, `end-to-end-migration`, `library-relocation-only`, or `alignment-only`;
- one concrete objective;
- required user and component scenarios;
- explicit non-goals.

Use `end-to-end-migration` by default for a legacy official family. Use a narrower mode only when it produces a complete independently valid result and the reason is recorded in the family contract.

Do not include unrelated shared UI cleanup, another family, speculative foundation work, or product redesign.

**Exit gate:** the family, mode, objective, required scenarios, and non-goals are unambiguous.

## Stage 1 — Resolve the family contract

Before production edits:

1. inspect the current owner, public exports, direct consumers, tests, stories, snapshots, and known defects;
2. resolve the current official Material 3 Expressive requirements for the required scenarios;
3. identify the canonical owner under `components/<family>`;
4. define the minimum complete supported surface and explicit unsupported surface;
5. resolve public API, native semantics, accessibility, anatomy, DOM ownership, state ownership, token routing, and required proof;
6. inspect only foundation domains required by this family;
7. create or update `components/<family>/README.md`.

The family README is the only durable family contract. It must contain:

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

Omit only a field that is objectively inapplicable. Do not replace unresolved decisions with placeholders or defer them to implementation.

**Exit gate:** `Unresolved: none` and `Readiness: ready`. If this gate cannot be reached, stop and report the exact source, ownership, scenario, API, or cross-family decision that blocks it.

## Stage 2 — Implement one primary vertical slice

Choose one representative configuration that exercises the real component contract. Implement it end to end:

- canonical production component and public entry point;
- native semantic and accessible owner;
- required anatomy without unnecessary DOM nodes;
- actual token-to-rendered-property route;
- required state and interaction path;
- one stable bounded canonical Storybook story;
- focused proof at the lowest faithful layer.

Add or change a foundation only when the Stage 1 contract proves a current cross-family need. A foundation API must remain component-agnostic.

Do not implement every size, variant, configuration, or state before this slice is coherent.

**Exit gate:** the primary slice matches the family contract, renders coherently in Storybook, and its focused checks pass. Review the rendered output and implementation before expanding the family.

## Stage 3 — Complete the supported family

Expand only the supported surface recorded in the family contract:

- required components, variants, sizes, configurations, and states;
- invalid-combination handling;
- complete public props, emits, slots, attributes, and events;
- required keyboard, pointer, touch, focus, ripple, motion, cancellation, interruption, and cleanup behavior;
- materially distinct Storybook examples and behavior fixtures;
- proportional component, browser, pure, and visual proof.

Rules:

- Consumer-controlled semantic state must not gain a hidden internal copy.
- Browser-owned facts such as hover and focus-visible remain browser or foundation owned.
- Every canonical token has one declaration owner.
- Configuration selects token sources; state resolves output; rendering applies the final value to the actual DOM owner.
- Use the shortest explicit route. Do not add aliases, managers, generic resolvers, universal bases, or files that do not improve current clarity or proof.
- Do not create Cartesian Storybook matrices or tests for framework behavior the project does not own.

**Exit gate:** every supported route is implemented and proved; unsupported routes remain absent.

## Stage 4 — Migrate consumers and remove the old owner

For an end-to-end migration:

1. migrate every affected in-repository consumer through the curated public API;
2. preserve accepted product behavior except for named intentional deltas;
3. verify only integration risks introduced by the migration;
4. remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, and compatibility paths.

Do not keep two active family owners. Do not leave permanent aliases for a later cleanup PR.

**Exit gate:** all consumers use the canonical owner and no obsolete active path remains.

## Stage 5 — Review the complete result

Review the full resulting family, not only the latest diff. Compare:

- official sources;
- the family contract;
- production code and public exports;
- actual rendered Storybook output;
- tests and behavior fixtures;
- direct consumers;
- removed legacy ownership.

Inspect every applicable contract: ownership, supported surface, API, native semantics, accessibility, anatomy, DOM, states, lifecycle, tokens, rendered properties, behavior, motion, foundations, proof, migration, and cleanup.

Treat README text, tests, snapshots, stories, and green checks as claims or regression guards, not proof of Material correctness by themselves.

Fix all confirmed non-visual blockers and major issues before proceeding. When a correction invalidates the family contract, return to Stage 1 and update it. Otherwise remain in Stage 5 until the complete result is coherent.

When visible output changed, prepare:

- the canonical Storybook URL or story identifier;
- bounded screenshots or diffs;
- the official visual references used;
- expected deviations;
- confirmation that non-visual review is complete.

The coding agent records operator visual status only as `not required`, `required`, `accepted`, or `rejected`. It never invents acceptance.

**Exit gate:** no unresolved non-visual blocker or major issue remains, and required operator visual acceptance is recorded.

## Stage 6 — Verify and finish

1. run focused checks while implementing through repository verification tooling;
2. run final read-only `pnpm verify`;
3. update `docs/roadmap.md` only when the active family, status, blocker, or single next action changes;
4. report the final family, change mode, supported and unsupported surface, foundation impact, proof, consumer migration, removed ownership, visual status, verification, and exact remaining blockers.

**Exit gate:** final verification passes and every required acceptance gate is complete.

## Progression and recovery rules

- Do not stop after research, contract writing, Storybook preparation, a primary slice, or focused tests when implementation was requested.
- Do not ask the user to choose variants, APIs, files, foundations, or tests that official sources and repository evidence can resolve.
- Do not switch to a review-only workflow during implementation.
- Do not start another family because the current family is blocked.
- If new evidence invalidates the contract, return explicitly to Stage 1; do not patch around it.
- If two correction rounds retain the same defect, add workaround logic, or create ownership ambiguity, discard the patch strategy and reconstruct Stage 1 before continuing.

## Proof ownership

Use one primary proof owner per contract:

- component contract tests: API, defaults, native owner, explicit attributes, ARIA, controlled state, slots, emits, invalid combinations, and non-browser wiring;
- browser behavior tests: real focus, keyboard, pointer/touch, target area, overlay, responsive behavior, ripple, motion lifecycle, cancellation, interruption, and cleanup owned by the family;
- pure tests: extracted deterministic logic or lifecycle only;
- visual regression: bounded protection of an already accepted stable rendered contract;
- consumer checks: compatibility and composition risks introduced by migration;
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
