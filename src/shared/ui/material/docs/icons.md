# Material 3 iconography

## Principle

Icons in shared Material UI must follow official Material 3 icon guidance and component specs. Icon behavior is part of the component contract, not an arbitrary slot detail.

## Source

Use official Material 3 documentation through MCP or `m3-docs-cache` fallback for component-specific icon usage. Component specs override generic icon preferences when they define size, placement, selected state, or accessibility behavior.

## Icon system

Use the project Material icon primitive for Material Symbols unless a component or product requirement needs a custom icon.

When using Material Symbols, keep these concerns explicit:

- icon name;
- size;
- fill;
- weight;
- grade;
- optical size;
- selected/unselected state;
- accessible name or decorative status.

## Component usage

Component-specific icon rules must follow the relevant Material component docs.

Examples:

- button icons should use the component-defined leading or trailing placement rules;
- toggle components should define selected and unselected icon behavior when Material guidance requires different icon styles;
- navigation icons should expose selected state clearly;
- list icons and avatars should match the list item layout and density rules.

## Accessibility

Icons are decorative when the surrounding component has a sufficient accessible name. Icons are semantic when they are the only visible label or communicate required state.

Semantic icon-only controls must require or derive an accessible name. Do not rely on the icon glyph name as the user-facing accessible label unless it is intentionally stable and understandable.

## Custom icons

Custom SVG or non-Material icons are allowed only when:

- Material Symbols does not provide an appropriate icon;
- the icon represents a product-specific concept;
- the icon is documented as project-specific;
- sizing, color, selected state, and accessibility still follow Material component guidance.

## Verification

Icon changes should be verified through Storybook or browser smoke checks when they affect size, alignment, state, accessibility, or visual output. For shared visual primitives, include the affected icon states in visual regression coverage.
