---
name: implementation-preflight
description: 'Use this skill before non-trivial implementation work to reduce corrective commits by identifying the owner layer, reusable project code, acceptance matrix, risk matrix, task breadth, work passes, and focused verification before the first production edit.'
---

# Implementation preflight

Use this skill before non-trivial code edits. Keep the preflight short and bounded; do not turn it into broad repository exploration.

## Activation check

Use this skill when the task will likely change production code, test behavior, tooling, CI, app configuration, storage semantics, diagnostics, browser behavior, or user-visible UI.

Do not use this skill for trivial typo fixes, formatting-only changes, comments-only changes, or mechanical renames with no behavior or ownership decisions.

## Required preflight

Answer these before the first production edit:

1. **Owner**: which FSD layer owns the behavior, and which public entry points should be used?
2. **Reuse**: what existing helpers, components, configs, schemas, services, tests, or dependencies already cover nearby behavior?
3. **Acceptance matrix**: what non-happy-path states must work in the first implementation?
4. **Risk matrix**: which browser, lifecycle, async, cache, CI/tooling, accessibility, visual, or data-safety risks apply?
5. **Breadth and passes**: which independent domains are touched, and what order keeps the work incremental?
6. **Verification**: what focused check proves the riskiest behavior, and what final verification is required?

For user-visible UI or UX changes, run the `material3-guidelines` skill as part of this preflight before choosing component structure, layout, interaction behavior, or visual verification.

## Wide UI and refactor gate

For non-trivial UI, UX, or cross-layer refactors, do not edit production code until the preflight also records:

- confirmed domain invariants from the task, existing code, and later user clarifications;
- existing user scenarios that must remain reachable, especially menus, navigation, settings, status indicators, and shared surfaces being replaced;
- the FSD owner layer for each changed behavior and the public API entry points that must be used instead of deep imports;
- settings, preferences, persisted state, or feature flags that the change reads, removes, or changes semantically;
- shared UI primitives affected by the change and their consumer blast radius;
- browser, visual, Storybook, e2e, mutation, and focused unit verification required for the changed surface.

Before final handoff, compare the diff against this gate. If a scenario, invariant, owner layer, or public API decision changed during implementation, update the preflight and fix the implementation before claiming completion.

## Breadth control

Before editing, count independent domains in the task. Examples of separate domains include domain read models, storage semantics, diagnostics, navigation, shared UI primitives, browser layout, e2e coverage, visual snapshots, tooling, and copy/language normalization.

- If the task touches four or more independent domains, split the work into explicit passes and run focused verification after each risky pass.
- Keep behavior-preserving cleanup separate from functional changes when practical.
- If the user did not explicitly ask to finish one existing branch, prefer proposing a split into smaller tasks before starting a broad corrective implementation.
- If the task must stay in one branch, make the pass order explicit and do not start the next risky pass until the previous one has a focused check.

## Feature-flow guardrails

Use these rules for create/open/import/export, setup, picker, dialog, storage, permission, recovery, and other multi-step user flows.

- Start with a scenario matrix that covers the happy path, user cancellation, unsupported platform/API, permission denial, invalid input, duplicate/conflict state, stale data/race, partial failure, rollback failure, and recovery action when those states can occur.
- Separate different user intents into different feature contracts before coding. Do not begin with a generic all-in-one composable, dialog, or state machine when flows have different acceptance rules, UX copy, domain invariants, or recovery paths.
- Define an ownership map before the first production edit: user action state belongs in `features`, domain read/display state in `entities`, persistence and lifecycle ordering in `shared/service`, pure parsing or detection in `shared/lib`, and screen composition in `widgets` or `pages`.
- Keep domain and storage invariants below UI layers. UI may ask for an action and display the result, but uniqueness, reserved names, marker detection, persisted-record normalization, migrations, and lifecycle ordering must be enforced by the owner of the data.
- Make allowed and disallowed target states explicit before implementation. Prefer refusing invalid targets with clear recovery over accepting broad inputs and compensating later with warning dialogs.
- Keep flow outcomes typed and local to the boundary that needs them. Avoid broad `status` protocols, command choreography, or result objects that mix field issues, transport failures, domain conflicts, and UI navigation unless several independent callers need the protocol.
- If a feature needs a shared UI primitive change, decide whether that primitive change is a separate prerequisite. When it remains in the feature PR, keep it minimal, Material-verified, and independently tested so the feature review does not hide shared UI regressions.
- Delete obsolete code paths, facades, providers, and tests in the same pass that introduces their replacement unless backwards compatibility is required. Do not leave dual flows for review to reconcile.
- When two consecutive review rounds uncover ownership mistakes, mixed responsibilities, or new user scenarios, stop patching and redo this preflight. Update the scenario matrix, ownership map, and verification matrix before more edits.
- Prefer tests for domain invariants and extracted state transitions before component wiring. Component tests should verify only contracts that the component owns; browser behavior, layout, focus, gestures, and Material visual states require browser or visual verification.

## Bounded reuse search

Before creating a new helper, component, config, dependency, or test pattern, check reuse with targeted repository search or direct imports.

Use focused searches for names related to the domain, behavior, helper, config, dependency, and test pattern. Stop once the owner and reuse decision are clear.

Do not start with broad repository exploration unless targeted search shows the impact is wider than expected.

## Acceptance and risk matrix guidance

Include only states relevant to the task, but consider:

- unavailable or disabled integrations;
- missing browser APIs or unsupported runtime;
- async pending, cancellation, stale completion, and repeated toggles;
- invalid, malformed, or hostile input;
- cache invalidation after create, update, delete, or failed lookup;
- data-safety-sensitive values in diagnostics, URLs, names, ids, and content;
- accessibility structure and heading hierarchy for rendered UI;
- Material 3 component choice, placement, adaptive layout, focus, keyboard, touch, motion, and visual state guidance when UI/UX changes are involved;
- CI, build, Storybook, Playwright, verify, fix, or verbose modes when tooling changes.

The first implementation should cover the applicable matrix, not only the happy path. If a matrix item is intentionally not covered, state why.

## Output discipline

Keep the preflight concise. A useful preflight is usually 5-10 lines plus a short verification note.

Do not repeat generic repository rules. Name only the rules and risks that apply to the current task.