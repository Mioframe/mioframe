---
name: implementation-preflight
description: 'Use before non-trivial implementation work to identify owners, source of truth, minimum sufficient design, acceptance and risk matrices, work passes, and focused verification before production edits.'
---

# Implementation preflight

Use before non-trivial code edits. Keep the preflight short and bounded; do not repeat repository policy.

## Activation check

Use for production code, test behavior, tooling, CI, app configuration, storage semantics, diagnostics, browser behavior, or user-visible UI.

Do not use for trivial typo, formatting-only, comments-only, or mechanical rename changes with no behavior or ownership decision.

## Required preflight

For non-local changes, record:

0. **Authoring source**: ready handoff when one exists, otherwise the deterministic repository rules and source-of-truth workflow used to derive the design.
1. **Owner map**: source of truth, runtime owner, user-action owner, composition owner, error owner, and verification owner as applicable.
2. **Public entry points**: owning FSD layer and public APIs; no deep-import plan.
3. **Reuse**: existing helpers, components, schemas, services, tests, or dependencies that already own required behavior.
4. **Minimum sufficient design**: map every concept to a current scenario or owner boundary and reject unrequested flexibility.
5. **Acceptance matrix**: only reachable non-happy-path states required by the contract.
6. **Risk matrix**: only applicable browser, lifecycle, async, cache, tooling, accessibility, visual, or data-safety risks.
7. **Breadth and passes**: independent domains and the order that keeps the work incremental.
8. **Verification**: focused verify-managed checks for risky behavior and final verification.

A non-trivial task may proceed without a separate architecture handoff when repository rules provide a deterministic standard path and the preflight resolves every required decision from authoritative sources.

Use `blocked` when ownership, source evidence, required behavior, or verification cannot be resolved without inventing policy.

## Public Material component gate

For a new or materially changed public shared `MD*` component, record:

- `standard-authoring`: the agent can independently derive a ready family blueprint from required scenarios, official Material documentation, repository rules, current family contracts, and native semantics;
- `handoff-authoring`: an upstream handoff supplies an exact ready delta;
- `blocked`: an escalation condition from `docs/material-3/component-architecture.md` is present;
- `Architecture impact: none`: a strictly local unmigrated-component repair preserves the existing contract and unrelated output.

For `standard-authoring`, the preflight must confirm:

- source lookup is bounded to the relevant Material surface;
- required scenarios and non-goals determine the minimum supported surface;
- the family README blueprint is created or updated before production code;
- `Unresolved: none` and `Readiness: ready` are justified by source evidence;
- the smallest objective profile (`simple`, `configured`, or `stateful`) is selected;
- public API, native semantics, anatomy, token ownership, rendered-property matrix, files, and verification are resolved;
- optional abstractions satisfy the exact objective extraction conditions;
- unsupported Material features and project deviations are explicit.

A separate architect handoff is not required when these checks pass.

Use `blocked` when official guidance conflicts or is missing, requested behavior contradicts Material or native semantics, a new public project extension is required, existing API compatibility is unresolved, ownership crosses families, new generic infrastructure appears necessary, or required browser behavior cannot be verified.

The implementation agent must not convert a blocked decision into a local fallback, compatibility alias, broad option, or generic abstraction.

## Scoped rule application

Use applicable nested `AGENTS.md` and skills as detailed policy.

- Storage/service/worker/provider work: record canonical fact owner, public path to UI, error owner, recovery owner, and forbidden UI reconstruction.
- FSD work: record entity/feature/widget/page ownership and public APIs.
- Shared UI: apply `shared-ui-implementation`, `material3-guidelines`, and `component-architecture.md`; record authoring mode, current family blueprint, exact delta, consumers, and browser/visual evidence.
- Diagnostics: record the safe diagnostic boundary and privacy contract.

A scoped rule conflict is a blocker.

## Wide UI and refactor gate

For non-trivial UI or cross-layer refactors, also record:

- confirmed user scenarios and invariants;
- existing scenarios that must remain reachable;
- owner and public entry point for each changed behavior;
- settings or persisted state whose semantics change;
- shared UI blast radius;
- browser, visual, Storybook, e2e, mutation, and focused unit verification that applies.

Before completion, compare the diff with the preflight and accepted repository contracts. Fix any unrecorded scenario, owner, API, architecture, or minimum-design change.

## Breadth control

Count independent domains before editing.

- Four or more domains require explicit passes and focused verification after risky passes.
- Keep behavior-preserving cleanup separate from functional changes when practical.
- When work must remain in one branch, finish and verify each risky pass before starting the next.
- Do not broaden a component task into unrelated family migration or foundation work.

## Feature-flow guardrails

For create/open/import/export/setup/picker/dialog/storage/permission/recovery flows:

- include only applicable happy, cancellation, unsupported, denial, invalid, conflict, stale/race, partial failure, rollback, and recovery states;
- separate user intents with different acceptance or recovery rules;
- keep domain and storage invariants below UI;
- make allowed and disallowed targets explicit;
- keep outcomes typed and local;
- decide whether shared UI work is a separate prerequisite;
- remove obsolete paths with their replacement unless compatibility is required;
- after two correction rounds that still add ownership errors, concepts, workarounds, or missing scenarios, redo architecture instead of patching further.

## Bounded reuse search

Use targeted search or direct imports to find the current owner. Stop when ownership and reuse are clear. Do not perform broad exploration to justify abstraction.

## Output discipline

Keep the preflight to roughly 8-15 short lines plus verification. The family Material blueprint belongs in the repository README rather than duplicated in chat.

Before final handoff, state whether the diff matches the derived blueprint or ready handoff and whether any escalation condition appeared during implementation.