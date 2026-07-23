# Material 3 interaction states

## Principle

Material interaction states must use shared state capabilities instead of unrelated per-component hover, focus, pressed, or dragged mechanisms.

Visual similarity without correct acquisition, release, cancellation, disabled behavior, and state composition is incomplete.

## Vocabulary

Use official state names where applicable:

- enabled;
- disabled;
- hover;
- focused;
- pressed;
- dragged;
- selected;
- loading or progress when the component explicitly communicates work.

## Ownership

Separate:

- semantic state controlled through the public component contract;
- browser state such as hover and focus-visible;
- pointer or keyboard acquisition and release;
- component-owned transient gesture or animation state;
- visual state-layer and ripple rendering.

Do not keep hidden copies of consumer-controlled semantic state.

Shared state, ripple, and focus primitives expose generic capability only. Component-specific state precedence and final property routing remain component-owned.

## Combined states

States may coexist, such as selected with hover or disabled with selected. Define precedence per rendered property when combinations affect output.

Do not assume one universal state priority for color, shape, elevation, outline, icon, and motion.

## Focus

Focus is real browser behavior, not only styling. Preserve native focusability where possible and verify focus-visible acquisition and keyboard behavior in a browser when changed.

## Ripple and state layers

Use official component state-layer colors and opacities where published. Generic default opacity roles include:

- hover: `--md-sys-state-hover-state-layer-opacity`;
- focused: `--md-sys-state-focus-state-layer-opacity`;
- pressed: `--md-sys-state-pressed-state-layer-opacity`;
- dragged: `--md-sys-state-dragged-state-layer-opacity`.

Disabling or replacing a required state layer, ripple, or focus indication requires an explicit supported-contract reason.

## Verification

- Real input proves acquisition, release, cancellation, focus movement, and actionability.
- Forced states prove appearance only.
- Component tests prove semantic-state wiring and explicit foundation inputs.
- Browser tests prove browser-owned interaction.
- Visual evidence proves distinct rendered state output.
