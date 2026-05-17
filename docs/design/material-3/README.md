# Material 3 project knowledge

This directory is the local Material 3 knowledge base for Mioframe UI work.

It is not a copy of the external Material documentation. It is a project-specific index of rules, tokens, component decisions, and review checks used before changing shared UI components or product screens.

## When to read this

Read this section before work that changes visual styling, design tokens, typography, colors, elevation, shape, motion, `src/shared/lib/md/tokens.css`, `src/shared/ui/MD*` components, dialogs, menus, tooltips, lists, tables, forms, navigation, empty states, progress states, or compact/mobile layout.

## Map

### Sources

- [sources.md](./sources.md) — indexed source list and limitations.

### Foundations

- [tokens](./foundations/tokens.md) — reference, system, and component tokens.
- [color](./foundations/color.md) — semantic color roles and surface hierarchy.
- [typography](./foundations/typography.md) — type scale usage in Mioframe.
- [shape, elevation, and motion](./foundations/shape-elevation-motion.md) — spatial and temporal hierarchy.
- [layout, accessibility, and states](./foundations/layout-accessibility-states.md) — compact-first layout, touch targets, focus, disabled states, and interaction states.

### Components

- [buttons](./components/buttons.md) — text, outlined, filled, tonal, icon buttons, FAB.
- [text input and selection](./components/text-input-selection.md) — text fields, checkboxes, chips.
- [dialogs, menus, and tooltips](./components/dialogs-menus-tooltips.md) — modal and temporary surfaces.
- [lists and navigation](./components/lists-navigation.md) — list items, tabs, navigation affordances.
- [progress and feedback](./components/progress-feedback.md) — circular/linear progress and loading states.

### Project rules

- [Mioframe UI rules](./project-rules/mioframe-ui-rules.md) — project-specific rules derived from Material 3.
- [Review checklist](./project-rules/review-checklist.md) — checklist for UI PR review.

## Source of truth order

1. Existing shared tokens in `src/shared/lib/md/tokens.css`.
2. Existing shared components in `src/shared/ui`.
3. These project rules.
4. Official Material 3 and Material Web documentation linked from [sources.md](./sources.md).

When external guidance and current implementation conflict, document the mismatch in the task or PR and decide whether to adapt the component, add a project exception, or keep the current behavior.

## Update rule

When a UI task introduces a new reusable pattern or intentionally deviates from Material 3, update this directory in the same PR.
