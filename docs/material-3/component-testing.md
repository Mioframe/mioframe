# Material component testing

This document extends `docs/testing/architecture.md` only with Material-specific proof and operator handoff. General proof ownership, execution lanes, `TEST IMPACT`, accessibility ownership, automatic impact metadata, and safe fallback remain defined by the project-wide testing architecture and testing skills.

## Generalization boundary

Testing policy contains only cross-family risk and evidence rules.

Do not add family selectors, custom-property names, token values, DOM node names, bug symptoms, or expected family structures. Concrete scenarios belong in the owning family tests, README, and AUDIT.

A pilot defect may refine this document only through a risk statement and proof rule that can be applied to any family owning that risk.

## Goal

Prove the accepted Material family contract with the smallest non-duplicative set of artifacts. Green automation protects accepted repository evidence; it does not prove correspondence with current canonical Material 3 Expressive sources.

- Derive proof from the official family contract, project rules, and current change.
- Use the smallest set of layers that completely proves the implemented surface.
- Keep component contracts, browser behavior, pure logic, visual regression, independent review, and operator review in their owning layers.
- Green automation does not prove that a baseline matches Material 3 Expressive.
- Green automation does not override rejected operator feedback.
- A test proves a named risk only when its setup enters that risk.
- Numeric equality on the wrong owner is not conformance proof.
- Objective structural defects are agent-owned, not operator-owned.

## Required family evidence

| Evidence                   | Requirement                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Component contract         | Mandatory for every new or migrated public component                                    |
| Canonical visual story     | Mandatory when the component renders visible output                                     |
| State matrix               | Only when multiple distinct component-owned visual routes exist                         |
| Visual regression          | When the accepted visible contract is stable and regression would be material           |
| Browser behavior           | Only when the family owns browser-dependent interaction                                 |
| Deterministic behavior     | Only when component/foundation logic owns deterministic decisions outside Vue rendering |
| Consumer preservation      | When imports, public API, wrappers, native owners, composition, or shared output change |
| Agent evidence review      | Mandatory before operator handoff                                                       |
| Operator visual acceptance | Required when accepted Material output is created or intentionally changed              |

Evidence may be omitted only because the family does not own that contract, not because correct proof is difficult.

## Source of proof

Derive `TEST IMPACT` from the accepted family blueprint and current migration scope:

- supported variants, sizes, states, slots, and extensions;
- native element, semantics, ARIA, and controlled-state ownership;
- component versus foundation ownership;
- token, shape, elevation, typography, icon, state, ripple, focus, motion, and layout routes;
- unsupported official capabilities and accepted deviations;
- affected consumers and removed legacy paths;
- required Storybook behavior, app E2E, visual, snapshot-owner, or other repository impact-metadata updates.

Do not create tests from a generic artifact checklist when the family does not own the corresponding contract.

## Proof causality

A test name, comment, timeout, or endpoint assertion does not establish that the named condition occurred.

To claim interruption, cancellation, replacement, fallback, or recovery proof:

1. establish the initial active state;
2. trigger the competing event before it settles;
3. prove the competing branch began;
4. prove the final public outcome and absence of stale state.

Waiting for the first endpoint proves sequential behavior, not interruption. Forced state proves appearance, not acquisition, trajectory, interruption, or cleanup.

## Component contract

Every new or migrated public Material component has a colocated `<Component>.test.ts` following `component-contract-testing`.

Cover applicable defaults, public configuration, native owner, explicit attributes, accessible name, ARIA, disabled/readonly semantics, slots, anatomy, emits, controlled state, invalid combinations, normalization, extensions, and non-browser foundation wiring.

Do not reproduce the visual state matrix or generic foundation behavior in component tests.

## Applicable geometry proof

When a visible interactive component has distinct or non-obvious geometry, browser proof identifies applicable concrete bounds:

```text
semantic host
layout footprint
interaction bounds
visual container
content bounds
state-layer bounds
ripple render and clip bounds
focus-indicator bounds
outline/elevation/shape owner
```

Mark non-applicable roles. Do not require an element solely to complete the list.

Prove applicable relationships:

- interaction geometry is coherent and contiguous;
- layout reserves required interaction space;
- adjacent interactive regions do not conflict;
- the visual container has the official size and placement;
- state layer and ripple use intended rendered and clipping bounds;
- focus indication follows its intended target;
- content remains correctly aligned and unclipped;
- background, outline, elevation, shape, and motion use their correct owners.

For custom or expanded interaction geometry, test representative interior, boundary, exterior, and adjacent-control points.

A single successful point is not proof of the complete interaction region.

Do not accept helper geometry that produces partial, disconnected, overlapping, or unreserved interaction regions.

## Final rendered-owner proof

For each visible route, assert the final property on the actual owner.

A computed token or variable on an ancestor, wrapper, or helper does not prove the visible result.

For shape:

- identify the official shape owner;
- assert applicable resting and state endpoints;
- verify clipping, box sizing, and corner composition do not change the intended result;
- reject a visibly incorrect endpoint even when a scalar source value matches.

A scalar radius assertion alone is insufficient when more than the scalar determines the rendered shape.

## CSS custom-property proof boundary

Tests may prove public overrides reach final owners. Tests must not normalize invalid naming.

Before testing, authoring and review classify touched variables as:

- exact official `--md-ref-*`, `--md-sys-*`, or `--md-comp-*`;
- justified `--md-private-<owner>-<semantic-role>` route;
- genuine `--app-*` token;
- invalid or unnecessary alias.

Do not write tests that bless an ad-hoc name shaped like `--md-<artifact>-<raw-css-property>`.

Private variables are implementation details, not consumer API. Test the official source or public extension and the final output, not a private alias itself unless a generic foundation boundary explicitly owns that bridge.

## Normalization and fallback proof

For every materially different input class, compare:

- actual returned, emitted, or rendered result;
- native semantics and accessibility;
- warning or error text;
- README and API documentation;
- test assertion.

A clamped result, ignored input, rejected combination, and fallback mode are different contracts.

## Canonical visual evidence

Every visibly rendered public component records one stable canonical story and bounded root in family documentation or audit. The story must:

- use real production anatomy;
- use representative real children when their geometry or behavior is claimed;
- present distinct visible states and configurations readably;
- expose the complete surface the operator is asked to review;
- use `StateMatrix` when multiple distinct component-owned visible routes exist;
- use bounded `Overview`, `Default`, or equivalent when one representative route is sufficient.

A state matrix includes only distinct visible outputs: supported configurations, semantic/transient states, simultaneous-state precedence, extensions, and deviations. Do not create Cartesian products, duplicate equivalent combinations, or one screenshot per cell.

A verification-only foundation adapter may prepare generic transient appearance when it remains outside public API, belongs to foundation testing, contains no family-specific routing, and claims appearance only.

## Visual regression

A visual baseline detects changes from the stored baseline. It does not prove Material correctness, correct anatomy, correct ownership, or operator acceptance.

Do not create or update a baseline until the underlying structural contract is understood. A baseline preserving malformed output is regression evidence for that output, not conformance evidence.

## Foundation ownership

Generic focus indicator, state layer, ripple, elevation, motion, and token-precedence behavior is proved once by the owning foundation.

A component family proves only:

- routing into the accepted foundation contract;
- family-specific anatomy or semantic ownership;
- documented extension or deviation;
- unique browser or visible output not already owned by foundation.

Do not repeat generic foundation matrices in every family.

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs require representative proof. Representative proof must:

- identify affected contract classes;
- exercise the changed source through final rendered output;
- include more than the motivating family when multiple families consume it;
- distinguish identical default output from actual override or state behavior.

Unchanged tests that never exercise the route are not representative proof.

## Motion proof boundary

Motion ownership is split:

- official documentation defines the requirement;
- project documentation defines an accepted Web adaptation;
- shared foundation implements and proves cross-family runtime behavior deeply once;
- component owns correct property, final owner, state routing, and family-specific endpoints;
- reviewer checks technical and canonical alignment;
- operator owns final perceived quality.

At component level prove applicable:

- real input activates the intended property on the correct owner;
- one meaningful intermediate state when needed;
- correct visible endpoints;
- safe interruption or cancellation;
- reduced motion when owned.

Do not claim motion fixed when timing changes but the final visible owner, endpoint, composition, or rendered property remains wrong.

Technical route proof never closes rejected operator feedback.

## Browser behavior

Use isolated Storybook behavior tests only when the family owns real focus, keyboard, pointer/touch, drag, expanded-target, overlay, responsive, motion, cancellation, cleanup, or browser-rendered property behavior.

Use public controls and real browser input. Forced state, direct Vue mutation, private methods, and synthetic internal events do not prove behavior.

A family with no browser-owned behavior records `Browser behavior: not applicable` with an ownership-based reason.

## Consumer preservation

When migration changes public usage:

1. identify actual affected consumers;
2. select representative materially different integration paths;
3. preserve complete product scenarios only where product behavior may change;
4. remove obsolete legacy tests and paths with their implementation;
5. update every affected Storybook behavior, app E2E, and visual impact mapping in the same change;
6. keep source mappings limited to production, story, fixture, or owned support paths rather than spec grouping.

A shared Material change does not automatically require unrelated product suites.

## Agent evidence review

A high-severity anatomy, interaction, geometry, visible-endpoint, final-owner, namespace, or unchanged visible defect requires `non-compliant`.

Before operator handoff, the coding agent confirms:

- official sources resolve the supported contract;
- component/foundation ownership is coherent;
- semantics, accessibility, lifecycle, and state ownership are correct;
- final properties are checked on correct owners, custom-property namespaces are valid, and named-risk setups are causal;
- distinct visible routes are represented proportionately and canonical stories use real anatomy;
- proof is non-duplicative and matches `TEST IMPACT`;
- repository impact metadata matches the actual changed sources, specs, stories, and baselines;
- changed consumers and obsolete paths are handled;
- README preserves current feedback accurately;
- no unresolved non-visual decision is delegated to operator review.

Report `passed` or `blocked`. Do not pass while source, architecture, accessibility, behavior, migration, proof, or impact ownership remains unresolved.

## Operator visual acceptance

The operator evaluates final visible fidelity and perceived motion quality. The operator does not own discovery of incorrect anatomy, interaction bounds, visible ownership, CSS naming, clipping, or test insufficiency. Only explicit user acceptance sets accepted status.

Operator comparison is required for:

- a first accepted canonical Material reference;
- intentional visible token, state-routing, shape, color, elevation, typography, icon, focus/ripple appearance, motion appearance, layout, or rendered foundation changes;
- an intentional baseline update caused by a changed visible contract.

Prepare:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Agent evidence review: passed | blocked (<reason>)
Official visual sources: <named evidence>
Expected deviations: none | <records>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

The operator checks visible fidelity only. An automated agent never reports operator acceptance as `accepted`.

## Automation policy

Use existing infrastructure. Add structural automation only after repeated migrations prove a precise low-maintenance need. Automation may validate deterministic paths, exports, story ids, specs, snapshot ownership, and prohibited test-only API; it must not infer semantic completeness or visual correctness from Markdown or screenshots.

## Forbidden

- production state-matrix components or runtime state/geometry registries;
- generic component-test DSLs;
- public test-only props, events, or branches;
- family-specific forced-state systems;
- frame-level infrastructure for ordinary CSS transitions;
- duplicate foundation suites in every family;
- mandatory artifact counts disconnected from actual family ownership;
- shared fixtures before multiple current families prove the same concrete need;
- stale or semantically overloaded test-impact mappings;
- separate operator report files.

## Completion

Material proof is complete when applicable contracts are covered at the correct proof types, canonical visual evidence is readable, browser behavior uses real input when owned, foundation behavior is not duplicated, consumers and obsolete paths are handled, repository impact metadata is consistent, agent evidence review passes, required operator acceptance is recorded, and repository verification passes.
