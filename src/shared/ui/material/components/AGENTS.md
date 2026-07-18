# Material component-family instructions

Inherits `src/shared/ui/material/AGENTS.md`.

These rules apply to every official Material component family under this directory and to both `material-component-authoring` and `material-component-review`.

## Structural conformance is agent-owned

Operator visual review does not replace structural review. The implementing agent and independent reviewer must detect objective visible defects before asking the operator to accept the result.

They own verification of:

- official anatomy and DOM ownership;
- layout footprint and interaction geometry;
- visual-container geometry;
- content alignment and clipping;
- state-layer, ripple, outline, elevation, and focus-indicator bounds;
- resting, selected, disabled, hovered, focused, and pressed visible endpoints;
- the DOM element that owns every final rendered property;
- CSS custom-property naming and route correctness.

The operator owns final perceived fidelity, including whether motion feels natural. A result that is structurally wrong, visibly malformed, or inconsistent with official evidence must be rejected by the agent without waiting for operator feedback.

## Mandatory geometry ownership map

Before changing or approving any visible interactive component, identify the concrete DOM owner for every applicable role:

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

Record the map in the family README when the roles are not all owned by one obvious element.

A role may be shared by one element only when the resulting geometry is coherent and matches the official anatomy. Numeric token values do not prove that the correct element owns them.

A component is not `implemented and verified` while this map is missing, contradictory, or inconsistent with rendered bounds.

## Interaction and visual bounds

Keep semantic, layout, interaction, and visual-container bounds distinct when the official component requires it.

For a minimum interactive target larger than the visible container:

- the full target must have one coherent rectangular layout and hit region;
- layout must reserve the target space needed to prevent overlap with adjacent controls;
- the visual container remains the owner of background, outline, elevation, shape, state layer, and clipped ripple;
- focus indication follows the intended official visible target, not an unrelated oversized helper;
- hit testing must cover the complete intended target, including edges and corners;
- target regions must not overlap adjacent interactive controls.

Do not create an absolutely positioned descendant target that extends outside its semantic host and produces a cross-shaped, partial, overlapping, or non-layout interaction region.

Do not accept a browser test that clicks one convenient central point as proof of the entire target geometry. Test representative edges, corners, adjacency, and the relation between host, target, and visual-container bounds.

## Final rendered-owner proof

For every visible property route, prove all of:

1. the official meaning of the source token or documented project extension;
2. the concrete DOM element that officially owns the property;
3. the actual bounds of that owner;
4. the final computed/rendered property on that owner;
5. interaction with clipping, state precedence, and adjacent visual layers.

A declaration, alias, class name, test title, computed value on the wrong element, or screenshot baseline does not prove the route.

For shape tokens, verify the final visible shape on the actual visual container. Checking only a `border-radius` number is insufficient. The endpoint must remain visibly consistent with the official pressed/selected shape and must not accidentally become rectangular because of wrong ownership, box sizing, clipping, or radius resolution.

## Response to broad operator rejection

When the user says that a component looks wrong, crooked, malformed, or visually incorrect:

- set the family visual status to `rejected`;
- preserve the full visible surface as unresolved until investigated;
- inspect anatomy, geometry ownership, content composition, state endpoints, clipping, and motion before choosing a root cause;
- do not narrow the problem to the first plausible variable or previously discussed animation;
- do not move to `awaiting re-review` until production behavior changes and the complete affected surface has been rechecked.

An unchanged or newly reported visible defect is a high-severity finding. A technical route or passing test cannot downgrade it.

## CSS custom-property namespaces

Every custom property must belong to exactly one namespace:

### Official Material tokens

Use exact verified canonical names only:

```text
--md-ref-*
--md-sys-*
--md-comp-*
```

Do not shorten, paraphrase, translate to raw CSS terminology, or invent an official-looking token.

### Private Material implementation routes

Use:

```text
--md-private-<owner>-<semantic-name>
```

Private names describe the semantic Material role and route, not merely the CSS property used to render it.

Good examples:

```text
--md-private-button-rendered-container-shape
--md-private-button-rendered-container-color
--md-private-button-interaction-block-size
--md-private-state-pressed-state-layer-opacity
```

### Application-specific public tokens

Use `--app-*` only for genuine Mioframe application contracts outside Material vocabulary.

## Forbidden CSS custom-property naming

Do not create an unqualified ad-hoc `--md-<component>-*` namespace. In particular, names such as these are invalid:

```text
--md-button-border-radius
--md-button-height
--md-button-padding-left
--md-button-icon-gap
```

They look canonical but are neither exact official tokens nor explicitly private implementation routes. They also encode raw CSS properties instead of Material semantics.

Use an exact official component token when the value is part of the public Material contract. Otherwise use a narrowly scoped `--md-private-*` route only when runtime indirection is necessary.

Do not introduce a custom property for a constant used once. Prefer a direct declaration. Private aliases are justified only for real configuration, state resolution, inheritance, consumer override, or cross-element routing.

Do not expose private variables as consumer API or test them as if they were official tokens.

## CSS naming review

Authoring and review must inventory every custom-property declaration added or materially touched and classify it as:

- exact official token;
- private implementation route;
- application token;
- invalid or unnecessary alias.

Report as a finding when:

- an invented `--md-*` name looks public or canonical;
- an official token name is shortened or converted to a CSS-property name;
- a private route omits `private`;
- a private route describes the implementation mechanism instead of the semantic owner;
- a one-use constant is routed through an unnecessary variable;
- a variable is declared but does not affect the final rendered owner.

A visible property routed through an invalid namespace cannot be classified as fully implemented.

## Motion and shape review

For state-driven shape changes:

- identify the visual-container owner first;
- verify resting, pressed, selected, disabled, and simultaneous-state endpoints against official evidence;
- use real input for acquisition, release, and interruption;
- compare an intermediate state only when needed to prove the real route;
- reject an endpoint that is visibly wrong even when the numeric token lookup is correct;
- preserve operator rejection until an explicit acceptance message follows corrected production behavior.

Do not claim motion fixed when only event timing changed but the visible endpoint, owning geometry, or rendered shape remains wrong.

## Evidence standard

Automated screenshots detect regression against their baseline. They do not prove Material correctness.

A canonical story must render real production anatomy and representative real child components. Placeholder glyphs or helper geometry must not substitute for the actual visual contract being claimed.

Independent review must classify the family as `non-compliant` when a high-severity anatomy, geometry, target, shape, ownership, or unchanged operator-rejected defect remains.