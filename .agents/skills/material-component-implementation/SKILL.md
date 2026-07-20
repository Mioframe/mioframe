---
name: material-component-implementation
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively after an independent contract gate passes to execute one approved correction unit with its locked owner, dependencies, proof lane, compatibility impact, and completion condition.'
---

# Material component implementation

Internal stage only. Use it only after:

```text
Canonical target status: locked
Assessment status: complete
Contract review status: passed
Current correction unit: <exact unit>
```

Every required foundation prerequisite must also be available.

## Inputs

Read root and nested `AGENTS.md`, Material architecture and component workflow, the current family README, the passed contract-gate result, current production owners, affected consumers, public exports, stories, tests, and verification mappings.

Use `vue-component-implementation` whenever a `.vue` file or UI composable is changed. Use `ui-browser-behavior` whenever a transition, animation, WAAPI/JS motion route, focus/pointer lifecycle, layout, or responsive behavior is added, changed, or preserved as compliant. Use `visual-regression-testing` whenever visible output or accepted motion appearance changes.

## Responsibility

Execute exactly one approved correction unit:

```text
locked proof preparation
→ expected failing observation when applicable
→ smallest approved owner correction or local owner replacement
→ focused verification
→ affected browser and representative-consumer validation
→ visual handoff when required
→ alignment-map and workflow-state update
```

Do not select another gap or expand the objective.

## Locked contract

The following are immutable during implementation unless new evidence returns the workflow to contract:

- canonical target and source decisions;
- applicable platforms and supported surface;
- concern and dependency classifications;
- correction priority and selected unit;
- implementation owner and blast radius;
- primary proof lane and expected observation;
- compatibility and operator-acceptance requirements;
- motion inventory and approved motion routes.

Do not silently rewrite README contract sections. Report an exact contract blocker and preserve completed unaffected work.

## Proof ownership

Use the approved lane:

- unit/component proof for deterministic API, normalization, native attributes, state precedence, non-browser wiring, and narrow token-to-declaration routing;
- browser proof for layout, focus, keyboard, form behavior, event propagation, pointer/touch, target area, responsive behavior, platform behavior, animation acquisition, completion, interruption, reversal, cancellation, and reduced-motion lifecycle;
- visual proof for screenshots only;
- consumer proof for integration and compatibility.

Visual specs must not contain behavior success criteria or large computed-style assertion matrices. Do not use snapshots to establish Material correctness.

Before production edits, create or prepare the smallest faithful proof and confirm the expected failure when executable pre-code proof applies. A prepared browser or visual scenario must still exist before implementation even when a red automated check is not appropriate.

## Implementation ownership

Implement only the documented owner and required dependencies.

- preserve owners classified `confirmed-compliant` or valid `project-extension` unless new evidence invalidates them;
- correct incrementally when ownership is sound and the gap is local;
- replace only the smallest owner when its contract is predominantly wrong or incremental repair would add more workaround logic;
- never rewrite the family merely to appear new;
- keep public Vue artifacts thin composition roots;
- separate deterministic logic, lifecycle, styles, rendered-property routing, and motion only when ownership or proof becomes clearer;
- do not add wrappers or DOM nodes merely for separation.

A dependency classified `temporary-legacy-material-dependency` remains explicit; do not relabel it generic to avoid prerequisite work.

## Mandatory motion code audit

Before editing motion and again before implementation exit, search the complete family and directly owned foundations for:

- CSS `transition` shorthand and longhands;
- CSS `animation` shorthand and longhands;
- every `@keyframes` definition and reference;
- WAAPI or `Element.animate` calls;
- `requestAnimationFrame`, motion timers, and animation classes;
- `transitionend` and `animationend` listeners;
- `will-change`;
- motion token/custom-property declarations and uses;
- every `prefers-reduced-motion` override.

For each route verify and keep documented:

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
Classification:
```

Code requirements:

- enumerate transition properties explicitly; `transition: all` is forbidden;
- a declared motion token must drive the actual transition/animation or be classified obsolete/unsupported;
- keyframes must be referenced by a reachable supported state; unused keyframes are obsolete;
- transition and animation declarations must live on the element that owns the rendered property and must not be shadowed by later cascade rules;
- check shorthand resets and duplicate declarations so duration, delay, easing, iteration, fill, and property lists are not silently replaced;
- define stable initial and final values; do not rely on accidental `auto`, missing keyframe endpoints, or stale classes;
- rapid repeated input and mid-flight state changes must retarget, reverse, cancel, or complete according to the locked contract without snapping to unrelated geometry;
- WAAPI animations, frames, timers, classes, and listeners must be cancelled or cleaned up on replacement, cancellation, disable, and unmount;
- reduced motion must preserve the final semantic and visual state while removing or shortening non-essential motion according to the locked platform decision;
- prefer compositor-friendly properties when they can faithfully express the contract; animation of layout or paint-heavy properties requires a concrete visual need and bounded performance reasoning;
- `will-change` must be narrow and temporary or have a documented persistent need;
- avoid synchronous layout read/write loops and per-frame reactive churn;
- tests that only assert custom-property existence, keyframe text, or framework internals do not prove working motion.

Static routing proof may verify exact declarations, but any user-visible animation lifecycle requires browser proof through public input. Do not test Vue, the browser animation engine, or third-party library internals; test Mioframe's routing and observable result.

## Visible changes

When visible output changes:

- prepare the canonical Storybook surface;
- compare against official visual evidence;
- use the visual lane only for screenshot protection;
- record baseline handling;
- set operator visual status to `required` until explicit acceptance;
- do not report acceptance on the operator's behalf.

## Representative consumers

Validate every materially affected consumer category when API, native behavior, event propagation, layout interaction, token inheritance, visible output, motion behavior, or extension behavior changes.

Do not patch consumers around a wrong library contract.

## Workflow state

After the unit, update the family README coherently:

```text
Current stage: final-review | adoption
Contract review status: passed
Implementation status: complete | blocked
Current correction unit: <exact unit>
Operator visual status: not-required | required | accepted | rejected
Family alignment status: aligned | converging | blocked
Next gate:
Blocker: none | <exact blocker>
```

Update detailed target, assessment, proof, correction, and motion-inventory sections only from evidence. Remove stale statements such as `documentation-only` after production changes.

The implementation stage does not update the roadmap or start another stage.

## Exit gate

Pass only when:

- the approved unit meets its completion condition;
- proof is in the locked lane and passes;
- actual changes stay within approved ownership and blast radius;
- dependencies remain correctly classified;
- the complete motion code audit agrees with actual declarations and runtime routes;
- every changed or confirmed motion route has correct token routing, lifecycle, reduced-motion behavior, performance reasoning, and applicable browser proof;
- affected consumers work without workarounds;
- visible evidence and operator status are honest;
- alignment map and workflow state are consistent;
- no required foundation or contract gap remains for the unit;
- the repository is independently valid even when the family remains `converging`.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: implementation
Status: complete | blocked
Exit gate: passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Contract gate result: passed
Evidence:
Correction unit completed:
Preserved confirmed owners:
Locally replaced owners:
Dependency result:
Proof lane and result:
Motion implementation audit: passed | failed
Motion routes changed or confirmed:
Representative-consumer result:
Visual and operator result:
Workflow-state changes:
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production edits without a passed contract gate;
- changing target, classifications, dependency type, correction priority, proof lane, or motion inventory in place;
- implementing a different or lower-priority gap;
- preserving code because it is legacy or replacing it only to reduce similarity;
- tests that protect implementation details or known defects as canonical behavior;
- behavior assertions in visual specs;
- `transition: all`, dead motion tokens, unused keyframes, shadowed/conflicting motion declarations, or unbounded `will-change`;
- visible changes without required operator handoff;
- monoliths that hide independent owners or fragmentation that only moves lines;
- consumer migration or obsolete-owner removal unless adoption delegated it;
- roadmap updates or starting another stage;
- speculative abstractions, managers, registries, validators, aliases, or extension points;
- unnecessary DOM nodes or full-family rewrites without owner-level justification.
