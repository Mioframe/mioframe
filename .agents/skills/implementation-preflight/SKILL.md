---
name: implementation-preflight
description: 'Use this skill before non-trivial implementation work to reduce corrective commits by identifying owner boundaries, reusable project code, acceptance matrix, risk matrix, task breadth, work passes, and focused verification before the first production edit.'
---

# Implementation preflight

Use this skill before non-trivial code edits. Keep the preflight short and bounded; do not turn it into broad repository exploration.

## Activation check

Use this skill when the task will likely change production code, test behavior, tooling, CI, app configuration, storage semantics, diagnostics, browser behavior, or user-visible UI.

Do not use this skill for trivial typo fixes, formatting-only changes, comments-only changes, or mechanical renames with no behavior or ownership decisions.

## Required preflight

Answer these before the first production edit:

0. **Upstream handoff check**: if the task includes an architecture handoff, do not repeat the full handoff. Restate only the decisions that affect the planned edits, verify the planned edits match that handoff, and do not replace it with a different architecture. If a non-trivial task has no handoff and ownership, source of truth, or expected final state is unclear, stop before production edits.
1. **Owner map**: identify source of truth, runtime owner, user-action owner, UI composition owner, error owner, retry/navigation owner, and verification owner when they apply.
2. **Public entry points**: which FSD layer owns the behavior, and which public APIs should be used instead of deep imports?
3. **Reuse**: what existing helpers, components, configs, schemas, services, tests, or dependencies already cover nearby behavior?
4. **Acceptance matrix**: what non-happy-path states must work in the first implementation?
5. **Risk matrix**: which browser, lifecycle, async, cache, CI/tooling, accessibility, visual, or data-safety risks apply?
6. **Breadth and passes**: which independent domains are touched, and what order keeps the work incremental?
7. **Verification**: what focused check proves the riskiest behavior, and what final verification is required?

If any owner in the owner map is unclear for a cross-layer change, stop and resolve the architecture before editing.

For user-visible UI or UX changes, run the `material3-guidelines` skill as part of this preflight before choosing component structure, layout, interaction behavior, or visual verification. For copy-only or wiring-only changes that keep existing components and Material behavior unchanged, record `Material impact: none` instead of doing a Material lookup.

## Wide UI and refactor gate

For non-trivial UI, UX, or cross-layer refactors, do not edit production code until the preflight also records:

- confirmed domain invariants from the task, existing code, and later user clarifications;
- existing user scenarios that must remain reachable, especially menus, navigation, settings, status indicators, and shared surfaces being replaced;
- the FSD owner layer for each changed behavior and the public API entry points that must be used instead of deep imports;
- the service or worker that owns any storage, lifecycle, protocol, cache, or indexing fact used by the UI;
- the boundary that owns typed errors or recovery states introduced by the change;
- the layer that owns retry or navigation after a completed flow;
- settings, preferences, persisted state, or feature flags that the change reads, removes, or changes semantically;
- shared UI primitives affected by the change and their consumer blast radius;
- browser, visual, Storybook, e2e, mutation, and focused unit verification required for the changed surface.

Before final handoff, compare the diff against this gate. If a scenario, invariant, owner layer, or public API decision changed during implementation, update the preflight and fix the implementation before claiming completion.

## Service and worker source-of-truth gate

For behavior that depends on storage layout, repository lifecycle, indexing, synchronization, cache state, filesystem semantics, document discovery, permissions, or protocol details, identify the owner before coding.

- Service and worker code owns heavy data operations, storage/protocol interpretation, indexing, lifecycle, cache invalidation, and canonical existence/initialization facts.
- Entity APIs expose service-owned facts to UI layers in typed, reactive, safe forms.
- UI layers may request actions and render facts, but must not reconstruct service-owned facts from implementation details such as marker files, storage file names, cache keys, raw directory entries, or protocol artifacts.
- If UI needs a fact that only the service can know reliably, extend the service/entity public API instead of deriving the fact in a widget, page, feature, or entity UI helper.
- Keep expensive scans, parsing, storage inspection, repository discovery, and lifecycle decisions out of the UI thread when the existing architecture provides service or web-worker ownership for them.

Treat these as architecture smells that require redesign before production edits:

- UI code decides whether storage, repository, or document state exists by inspecting service implementation details;
- a widget/page duplicates service indexing or lifecycle checks already owned by a worker/service;
- an entity is introduced only to rename a service-owned concept and then infer its state outside the service;
- a feature action compensates for missing service invariants with UI checks instead of enforcing the invariant at the service owner;
- a helper in `entities`, `features`, `widgets`, or `pages` parses marker files, storage filenames, raw adapter artifacts, or cache keys to decide canonical state.

The preferred flow is: service or worker determines canonical facts, entity exposes them, widget/page composes and renders them declaratively.

## Declarative FSD composition gate

For UI work that touches `entities`, `features`, `widgets`, or `pages`, record the model/UI/action/composition split before coding:

- **Entity model** owns stable entity facts, domain read models, and small derived entity state. It must not expose screen view-state objects that combine loading, error, user-facing message, ready status, and widget/page-specific branch order.
- **Entity UI** may render the entity and emit semantic selection events. It must not import feature actions; pass action surfaces from widgets/pages through slots when entity UI needs trailing buttons.
- **Features** own user-triggered actions such as create, import, rename, remove, dialogs, sheets, action menus, and explicit recovery actions.
- **Widgets/pages** compose entities, entity UI, features, and shared UI. They may choose loading/error/recovery/content branch order, but should keep those dependencies visible through named computed values and template branches.

Treat these as architecture smells that require redesign before production edits:

- entity exports named `ViewState`, `ReadyState`, `Presentation`, `Classification`, or another combined object for a specific screen;
- entity model includes `status: 'loading' | 'error' | 'ready'`, screen fallback copy, or UI error messages;
- widget/page bypasses an existing entity public API and wires shared services or observable queries directly for entity reads;
- widget/page hides recovery, error, loading, and content precedence inside a helper when straightforward computed values and template branches would be clearer;
- a section component is moved toward entity UI while still importing feature actions directly.

Prefer small, named derived facts such as `has*`, `is*`, `get*State`, and `get*Entries` over vague combined values. If a combined state object is still necessary, document why explicit computed dependencies are insufficient and which layer owns that object.

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
- Define the owner map before the first production edit: source of truth, runtime owner, user-action owner, UI composition owner, error owner, retry/navigation owner, and verification owner when they apply.
- Keep domain and storage invariants below UI layers. UI may ask for an action and display the result, but uniqueness, reserved names, marker detection, persisted-record normalization, migrations, and lifecycle ordering must be enforced by the owner of the data.
- Make allowed and disallowed target states explicit before implementation. Prefer refusing invalid targets with clear recovery over accepting broad inputs and compensating later with warning dialogs.
- Keep flow outcomes typed and local to the boundary that needs them. Avoid broad `status` protocols, command choreography, or result objects that mix field issues, transport failures, domain conflicts, and UI navigation unless several independent callers need the protocol.
- If a feature needs a shared UI primitive change, decide whether that primitive change is a separate prerequisite. When it remains in the feature PR, keep it minimal, Material-verified, and independently tested so the feature review does not hide shared UI regressions.
- Delete obsolete code paths, facades, providers, and tests in the same pass that introduces their replacement unless backwards compatibility is required. Do not leave dual flows for review to reconcile.
- When two consecutive review rounds uncover ownership mistakes, mixed responsibilities, or new user scenarios, stop patching and redo this preflight. Update the scenario matrix, owner map, and verification matrix before more edits.
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

Before final handoff, report whether the resulting diff still matches the architecture handoff when one exists. If it does not, fix the implementation or explicitly report the architectural divergence.
