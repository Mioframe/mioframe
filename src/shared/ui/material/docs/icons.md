# Material 3 iconography

## Principle

Icons in shared Material UI follow current official icon and component guidance. Icon behavior is part of the component contract, not an arbitrary slot detail.

## Source

Use official Material documentation for component-specific icon usage. A component specification overrides generic icon preferences when it defines size, placement, selected state, or accessibility behavior.

## Material Symbols

Use the project Material Symbols primitive unless a current product requirement needs a custom icon.

Keep applicable properties explicit:

- icon name;
- size;
- fill;
- weight;
- grade;
- optical size;
- selected and unselected treatment;
- semantic or decorative status.

## Component ownership

The component owns icon placement, sizing, state routing, and accessible-name requirements defined by its supported official surface.

The icon primitive owns symbol rendering. It does not choose product icons or infer component state.

Arbitrary slotted icon content remains consumer-owned unless the public component contract explicitly defines how it participates in selection or state styling.

## Accessibility

Icons are decorative when the surrounding control already has a sufficient accessible name. They are semantic when they are the only visible label or communicate required state.

Icon-only controls require or derive an explicit accessible name. Do not rely on glyph names as user-facing labels unless intentionally documented.

## Custom icons

Custom SVG or non-Material icons are allowed when:

- Material Symbols has no appropriate symbol;
- the icon represents a product-specific concept;
- ownership is documented as project-specific;
- sizing, color, state treatment, and accessibility still satisfy the containing component contract.

## Verification

Verify icon changes at the relevant layer:

- component tests for slot, state, and accessibility wiring;
- browser checks for rendered size or state behavior when layout is involved;
- visual evidence for alignment, fill, color, and geometry changes;
- font readiness where Material Symbols rendering is part of the assertion.
