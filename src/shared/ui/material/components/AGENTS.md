# Material component-family instructions

Inherits `src/shared/ui/material/AGENTS.md`.

These rules apply to every official Material component family under this directory and to both `material-component-authoring` and `material-component-review`.

## Generalization boundary

Shared instructions contain only cross-family invariants that can be applied without knowing which component exposed them.

A defect found in one family may justify a shared rule only when the rule can be stated and verified for any applicable family.

Keep concrete family facts in the owning family documents:

```text
components/<official-docs-slug>/README.md
components/<official-docs-slug>/AUDIT.md
```

Do not place these in shared skills or architecture documents:

- family class names, selectors, or DOM node names;
- family-specific custom-property names;
- one family’s expected token values or state endpoints;
- one family’s bug symptoms or proposed DOM structure;
- examples that are later treated as mandatory implementation shapes.

Examples in shared policy illustrate syntax only. They never establish component behavior.

## Structural conformance is agent-owned

Operator visual review does not replace structural review. The implementing agent and independent reviewer must detect objective defects before asking the operator to accept the result.

They own verification of applicable:

- official anatomy and DOM ownership;
- layout footprint and interaction geometry;
- visual-container geometry;
- content alignment and clipping;
- state-layer, ripple, outline, elevation, and focus-indicator ownership and bounds;
- visible state endpoints and simultaneous-state precedence;
- the concrete owner of every final rendered property;
- CSS custom-property naming and route correctness.

The operator owns final perceived fidelity. A result that is structurally wrong, visibly malformed, or inconsistent with official evidence must be rejected by the agent without waiting for operator feedback.

## Geometry ownership map

For a visible interactive component, identify every applicable concrete owner:

```text
semantic host
layout footprint
interaction bounds
visual container
content bounds
state-layer bounds
ripple event host
ripple render and clip bounds
focus-indicator bounds
outline and elevation owner
shape and motion owner
```

Mark non-applicable roles explicitly rather than inventing an element for symmetry.

Record the map in the family README when ownership is not obvious from one coherent element.

A role may be shared by one element only when the resulting structure matches official anatomy and produces coherent rendered geometry. Numeric token equality does not prove correct ownership.

A component is not `implemented and verified` while applicable ownership is missing, contradictory, or inconsistent with rendered output.

## Interaction and visual bounds

Keep semantic, layout, interaction, and visual-container bounds distinct when the official contract requires it.

When the intended interaction area differs from the visible container:

- it must form one coherent, contiguous hit region;
- layout must reserve the space required to prevent accidental overlap;
- adjacent interactive regions must remain unambiguous;
- visual properties remain on the official visual owner;
- focus and ripple behavior must follow their official targets;
- browser proof must cover representative interior, boundary, exterior, and adjacency points.

Do not use a helper that extends outside its semantic/layout ownership when the result is partial, disconnected, overlapping, or dependent on unreserved space.

A single successful click point is not proof of the complete interaction geometry.

## Final rendered-owner proof

For every visible property route, prove:

1. official meaning or explicit project-extension meaning;
2. valid source and namespace;
3. correct concrete owner;
4. relevant owner bounds;
5. final computed and rendered output;
6. state precedence, clipping, and interaction with adjacent layers.

A declaration, alias, class name, test title, value on the wrong element, or screenshot baseline does not prove the route.

For shape, verify the complete visible result on the official shape owner. A scalar radius alone is insufficient when ownership, clipping, box geometry, corner model, or state composition can change the rendered shape.

## Response to broad operator rejection

When the user reports that a component looks wrong or visibly malformed:

- set the family visual status to `rejected`;
- preserve the complete affected visible surface as unresolved;
- inspect anatomy, geometry ownership, content composition, clipping, state endpoints, and motion before choosing a root cause;
- do not narrow the issue to the first plausible variable or the previously discussed defect;
- do not move to `awaiting re-review` until production behavior changes and the complete affected surface has been rechecked.

An unchanged or newly discovered visible defect is a high-severity finding. Passing tests or a technically connected route cannot downgrade it.

## CSS custom-property namespaces

Every custom property belongs to exactly one namespace.

### Official Material tokens

Use exact verified canonical names only:

```text
--md-ref-*
--md-sys-*
--md-comp-*
```

Do not shorten, paraphrase, omit semantic segments, translate to raw CSS terminology, or invent an official-looking token.

### Private Material implementation routes

Use:

```text
--md-private-<owner>-<semantic-role>
```

Private names describe semantic ownership and purpose, not merely the CSS property used to render the value.

### Application-specific public tokens

Use `--app-*` only for genuine Mioframe application contracts outside Material vocabulary.

### Invalid naming

Do not create an unqualified ad-hoc namespace shaped like:

```text
--md-<artifact>-<raw-css-property>
```

Such a name looks canonical while being neither an exact official token nor an explicitly private route.

Use an exact official token, a justified private semantic route, an application token, or a direct declaration when indirection is unnecessary.

Do not create a custom property for a one-use constant. Private aliases are justified only by real configuration, state resolution, inheritance, consumer override, cross-element routing, or foundation bridging.

Authoring and review inventory every custom property added or materially touched and classify it as:

- exact official token;
- private implementation route;
- application token;
- invalid or unnecessary alias.

A visible property routed through an invalid namespace cannot be classified as fully implemented.

## Motion and state review

For state-driven visible changes:

- identify the final visible owner first;
- verify all applicable resting and state endpoints against official evidence;
- use real input for acquisition, release, interruption, and cancellation when lifecycle is owned;
- sample an intermediate state only when needed to prove the real route;
- reject a visibly incorrect endpoint even when a source value is numerically correct;
- preserve operator rejection until corrected production behavior is explicitly accepted.

Do not claim motion fixed when only event timing changed but the final visible owner, endpoint, composition, or rendered property remains wrong.

## Evidence standard

Automated screenshots detect regression against their baseline. They do not prove Material correctness.

A canonical story must render real production anatomy and representative real children when their geometry or behavior is part of the claimed contract. Placeholder content may be used only when it does not alter the property being verified.

Independent review must report `non-compliant` when a high-severity anatomy, geometry, interaction, visible-endpoint, ownership, namespace, or unchanged operator-rejected defect remains.
