---
name: material-component-contract
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates synthesis of an isolated canonical target and current-state audit into a complete alignment map, dependency map, prioritized correction units, and locked proof lanes.'
---

# Material component contract

Internal stage only. `material-component` must lock family, mode, objective, required scenarios, applicable platforms, and non-goals before invoking it.

## Required inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the read-only canonical-target result produced without implementation inspection;
- the read-only current-state audit produced after target lock;
- current repository evidence needed to verify both results.

Do not perform both investigations in one undifferentiated pass. If either isolated result is missing, return a blocker.

## Canonical target lock

Confirm the target was resolved before current component implementation, component tests, stories, snapshots, or prior family conclusions were inspected.

Record:

- applicable platforms;
- supported and unsupported surface;
- public API and invalid combinations;
- native semantics, form behavior, accessibility, anatomy, state, tokens, rendered properties, motion, adaptive behavior, and dependencies;
- official source names and verification dates;
- every unresolved source decision.

For every contradiction, absence, inference, or platform-specific rule, record:

```text
SOURCE DECISION
Concern:
Applicable platform:
Source A and statement:
Source B and statement:
Conflict or missing evidence:
Narrower applicable authority:
Decision:
Rationale:
Status: resolved | unresolved
```

Do not cancel explicit guidance only because a token is absent. Do not infer support only because a token exists. Do not apply Android, iOS, or Web guidance across platforms without an explicit decision. Reconcile diagrams, prose, specs, accessibility guidance, and tokens together.

Required unresolved decisions block dependent correction units. New evidence reopens the target; it is never silently inserted during implementation.

## Complete current-state assessment

After target lock, cover every category below or mark it `not-applicable` with a reason:

- API, defaults, invalid combinations, and attributes;
- native, keyboard, form, and event-propagation semantics;
- accessibility, focus, disabled behavior, and platform adaptations;
- anatomy, DOM, target area, and unnecessary nodes;
- semantic and transient state, precedence, cancellation, interruption, and cleanup;
- tokens, configuration, state routing, rendered properties, and public overrides;
- geometry, typography, icon placement, RTL, responsive behavior, and text scaling;
- complete motion implementation inventory, rapid input, interruption, reversal, cancellation, cleanup, and reduced motion;
- project extensions and their scenarios;
- external Material component dependencies;
- generic foundation dependencies;
- owners, exports, consumers, aliases, and obsolete paths;
- unit, component, browser, visual, consumer, and verification proof.

For each concern record canonical target, current behavior, classification, owner, dependency classification, proof classification, and exact correction.

Classify proof as `canonical-proof`, `compatibility-proof`, `implementation-detail-test`, `legacy-defect-preservation`, or `obsolete`.

## Mandatory motion implementation inventory

Search the complete family and directly owned foundations, not only changed files, for:

- CSS `transition` shorthand and longhands;
- CSS `animation` shorthand and longhands;
- every `@keyframes` definition and reference;
- WAAPI or `Element.animate` calls;
- `requestAnimationFrame`, motion timers, and animation classes;
- `transitionend` and `animationend` listeners;
- `will-change`;
- motion token/custom-property declarations and uses;
- every `prefers-reduced-motion` override.

Record every route:

```text
MOTION ROUTE
Owner/file/selector or runtime target:
Trigger and state edge:
Mechanism: transition | animation | WAAPI | JS
Properties or keyframes:
Initial and final values:
Duration, delay, easing, iterations, direction, fill:
Official token/source → private route → declaration:
Rendered target:
Interruption, reversal, cancellation, cleanup:
Reduced-motion result:
Performance impact:
Primary proof:
Classification: confirmed-compliant | project-extension | misaligned | unresolved | obsolete
Required correction: none | <exact correction>
```

The inventory is incomplete when any declaration, keyframe, runtime animation, listener, timer, or motion token is omitted.

A route cannot be `confirmed-compliant` when:

- a token is declared but does not drive the actual declaration;
- a keyframe is unused or unreachable from supported state;
- `transition: all` is used;
- the declaration lives on the wrong rendered owner or is shadowed by the cascade;
- shorthand resets or duplicate declarations silently change property, timing, delay, iteration, direction, or fill;
- initial/final values, interruption, cancellation, cleanup, or reduced-motion behavior are undefined;
- layout/paint-heavy animation has no concrete visual need or bounded performance reasoning;
- `will-change` is broad or permanently retained without a proven need;
- proof asserts only token/custom-property existence, keyframe text, snapshots, or framework/browser internals.

Static proof may protect exact token-to-declaration routing. User-visible acquisition, completion, interruption, reversal, cancellation, and reduced-motion behavior require browser proof through public input.

## Classification rules

`confirmed-compliant` requires all of:

- a resolved official requirement for the applicable platform;
- matching implementation evidence;
- correct ownership and dependency direction;
- faithful observable proof in the correct proof lane;
- no unresolved contradicting source.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect in the extension or dependency prevents completion.

Consumer dependence, passing tests, stable snapshots, or official-looking names never upgrade a concern.

Every shared dependency is classified as:

- `canonical-material-dependency`;
- `temporary-legacy-material-dependency`;
- `project-extension-dependency`;
- `generic-non-material-foundation`.

Repeated use does not make a Material component generic foundation.

## Correction units

Select the smallest complete unit in this priority order:

1. unresolved required source or platform decisions;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token and rendered-property routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion implementation and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

A lower-priority improvement cannot bypass a higher-priority blocker affecting the same surface.

Each unit records:

```text
CORRECTION UNIT
Gap:
Affected scenarios:
Canonical expected behavior:
Current defect:
Implementation owner:
Dependencies and blast radius:
Primary proof lane:
Why that lane owns the behavior:
Prepared failing observation:
Motion routes affected: none | <exact routes>
Motion code audit required: yes | no
Compatibility impact:
Visible impact:
Operator acceptance required: yes | no
Completion condition:
```

Proof lanes:

- unit/component for deterministic contracts and non-browser wiring;
- browser for layout, focus, keyboard, propagation, pointer/touch, target area, responsive behavior, and motion lifecycle;
- visual for screenshots only;
- consumer for integration and compatibility.

Visual specs must not contain browser-behavior success criteria or large computed-style matrices.

## Workflow state and README

Write the single family README with one current state block:

```text
MATERIAL WORKFLOW STATE
Family:
Mode:
Current objective:
Current stage: contract-review
Canonical target status: locked | reopened
Assessment status: complete | blocked
Contract review status: not-started | failed
Current correction unit: none | <exact unit>
Implementation status: not-started
Final review status: not-started
Operator visual status: not-required | required
Family alignment status: aligned | converging | blocked
Next gate: independent contract review
Blocker: none | <exact blocker>
```

The README also contains target, source decisions, full alignment map, dependency classification, decomposition, proof map, complete motion inventory, correction units, compatibility impact, representative consumers, and remaining gaps.

Do not leave contradictory stage descriptions or stale roadmap state.

## Exit gate

Return `Status: complete` only when the contract package is ready for independent contract review. This does not authorize production edits.

Pass only when target lock is credible, source conflicts are explicit, mandatory concerns are complete, the motion implementation inventory covers every route, classifications and dependencies are justified, the highest-priority unit is selected, proof lane is locked, and workflow state is consistent.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Current objective result: ready for contract review | blocked
Family alignment status: aligned | converging | blocked
Evidence:
Canonical target status:
Source decisions:
Assessment completeness:
Alignment classifications:
Dependency classifications:
Motion implementation inventory: complete | incomplete
Motion routes requiring correction:
Correction priority:
Current correction unit:
Proof lane:
Representative consumers:
Remaining known gaps:
Next correction unit:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production, proof, story, snapshot, or consumer edits;
- one-pass target and legacy assessment without isolation;
- deriving target from existing behavior;
- hidden source conflicts or platform assumptions;
- omitted concern categories or motion routes;
- blanket preservation or rewrite decisions;
- legacy proof treated as authority;
- `transition: all`, dead motion tokens, unused keyframes, or unclassified motion declarations accepted as compliant;
- lower-priority correction around a higher-priority blocker;
- wrong proof lane;
- roadmap updates or starting another stage;
- duplicate contracts, durable audits, registries, or progress ledgers.