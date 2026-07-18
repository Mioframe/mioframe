# Material component testing architecture

This document defines proportional proof for public components in the Mioframe Material library.

Tests prove contracts the component or changed foundation actually owns. They do not retest Vue, CSS, browser internals, or subjective operator perception. They must still prove objective anatomy, geometry, ownership, and visible endpoints before operator handoff.

## Generalization boundary

Testing policy contains only cross-family risk and evidence rules.

Do not add family selectors, custom-property names, token values, DOM node names, bug symptoms, or expected family structures. Concrete scenarios belong in the owning family tests, README, and AUDIT.

A pilot defect may refine this document only through a risk statement and proof rule that can be applied to any family owning that risk.

## Principles

- Derive proof from the official family contract, project rules, and current change.
- Use the smallest set of layers that completely proves the implemented surface.
- Keep component contracts, browser behavior, pure logic, visual regression, independent review, and operator review in their owning layers.
- Green automation does not prove that a baseline matches Material 3 Expressive.
- Green automation does not override rejected operator feedback.
- A test proves a named risk only when its setup enters that risk.
- Numeric equality on the wrong owner is not conformance proof.
- Objective structural defects are agent-owned, not operator-owned.

## Proof layers

| Layer                  | Use when                                          | Purpose                                                                                                        |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Component contract     | Every new or migrated public component            | API, native owner, ARIA, defaults, slots, emits, controlled state, invalid combinations, and structural wiring |
| Canonical visual story | Visible output exists                             | Stable readable surface using real production anatomy                                                          |
| State matrix           | Multiple distinct visible routes exist            | Compare configurations, states, winners, and coexistence                                                       |
| Visual regression      | Stable visual contract has regression risk        | Detect unintended changes against a bounded baseline                                                           |
| Browser behavior       | Correctness depends on browser behavior or layout | Focus, input, hit testing, layout, clipping, measurement, cancellation, or runtime lifecycle                   |
| Pure behavior          | Extracted logic or lifecycle exists               | Helpers, composables, timing, cancellation, and cleanup                                                        |
| Consumer preservation  | Imports, wrappers, or usage change                | Preserve affected integration contracts                                                                        |
| Independent review     | Every new or migrated family                      | Compare implementation with project documentation, then documentation with Material                            |
| Operator review        | Final perceived fidelity remains                  | Explicit acceptance or concrete feedback in a user message                                                     |

Difficulty alone is not a reason to omit an owned contract.

## Proof causality

A test name, comment, timeout, or endpoint assertion does not establish that the named condition occurred.

To claim interruption, cancellation, replacement, fallback, or recovery proof:

1. establish the initial active state;
2. trigger the competing event before it settles;
3. prove the competing branch began;
4. prove the final public outcome and absence of stale state.

Waiting for the first endpoint proves sequential behavior, not interruption. Forced state proves appearance, not acquisition, trajectory, interruption, or cleanup.

## Component contract tests

Use colocated Vue Test Utils tests for applicable:

- defaults and supported configuration;
- native element and DOM-critical attributes;
- ARIA, disabled, readonly, and accessible-name ownership;
- slots and fixed anatomy;
- emits and controlled state;
- invalid combinations and normalization;
- non-browser foundation wiring;
- public Mioframe extensions.

Component tests may verify required structural elements and semantic roles. They do not prove computed layout, hit regions, clipping, focus-visible, ripple, or visual shape.

Prefer named contract assertions over complete rendered-tree snapshots.

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

## Browser behavior tests

Use isolated Storybook Playwright tests when correctness depends on behavior the component changes or constrains:

- custom keyboard activation or navigation;
- focus entry, movement, visibility, or restoration;
- pointer/touch acquisition, hit testing, gesture, capture, or cancellation;
- overlay and containment;
- layout, measurement, responsive, or container-dependent behavior;
- JavaScript or WAAPI lifecycle;
- final computed propagation that source review cannot establish reliably.

Use public input and assert public outcomes. Forced state and direct mutation do not prove browser behavior.

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

## Shared foundation proof

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs require representative proof.

Representative proof must:

- identify affected contract classes;
- exercise the changed source through final rendered output;
- include more than the motivating family when multiple families consume it;
- distinguish identical default output from actual override or state behavior.

Unchanged tests that never exercise the route are not representative proof.

## Canonical visual evidence

Every visible public component has one stable canonical story.

The story must:

- use real production anatomy;
- use representative real children when their geometry or behavior is claimed;
- present distinct visible states and configurations readably;
- expose the complete surface the operator is asked to review.

Use a state matrix only when multiple distinct visual routes exist. Do not build a Cartesian product.

## Visual regression

A visual baseline detects changes from the stored baseline. It does not prove Material correctness, correct anatomy, correct ownership, or operator acceptance.

Do not create or update a baseline until the underlying structural contract is understood. A baseline preserving malformed output is regression evidence for that output, not conformance evidence.

## Independent review

Before operator handoff, reviewer confirms:

- applicable ownership is complete and coherent;
- final properties are checked on correct owners;
- custom-property namespaces are valid;
- tests prove named risks causally;
- canonical stories use real anatomy;
- no objective defect is hidden behind operator review;
- README preserves current feedback accurately.

A high-severity anatomy, interaction, geometry, visible-endpoint, final-owner, namespace, or unchanged visible defect requires `non-compliant`.

## Operator review

Operator review is performed through normal user messages.

The operator evaluates final visible fidelity and perceived motion quality. The operator does not own discovery of incorrect anatomy, interaction bounds, visible ownership, CSS naming, clipping, or test insufficiency.

Only explicit user acceptance sets accepted status.

## Anti-overengineering

Use existing test infrastructure. Do not create:

- a production state-matrix component;
- runtime token or geometry registries;
- a generic component-test DSL;
- public test-only API;
- family-specific forced-state systems;
- frame-level infrastructure for ordinary CSS transitions;
- separate operator report files.

## Completion

Proof is complete only when applicable contracts are covered at correct layers, ownership relationships are coherent, final properties are asserted on correct owners, namespaces are valid, named-risk setups are causal, normalization branches agree, independent review records exact remaining work, visible evidence uses real anatomy, required operator acceptance is explicit, and applicable local verification passes.
