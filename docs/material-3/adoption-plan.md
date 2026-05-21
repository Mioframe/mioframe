# Material 3 adoption plan

## Principle

Adopt Material 3 incrementally through foundation-first, component-family work. Do not perform broad visual rewrites without first defining the token, API, Storybook, verification, and deviation contract.

## Phase 1: Policies

Add and review the Material 3 foundation and implementation policies:

- source of truth;
- units;
- tokens;
- baseline theme;
- component tokens;
- token validation;
- component registry;
- component conversion checklist;
- interaction states;
- accessibility;
- layout and adaptive behavior;
- density and spacing;
- iconography;
- overlays;
- shared UI API;
- Storybook;
- verification;
- deviations.

This phase should not reorganize shared UI source files or change component behavior.

Resolved foundation decisions:

- `sp` is the target Material typography authoring unit; existing Material typography `pt` usage is legacy and should be migrated during the foundation audit.
- `dp` remains the target Material measurement authoring unit.
- `--app-*` is the neutral namespace for app-specific CSS custom properties outside Material token vocabulary.
- Canonical `--md-comp-*` tokens are defined at the component definition boundary.
- Start with a tokenized Material baseline theme with mandatory light and dark schemes.
- Future base palette customization must update reference/system tokens rather than component CSS.
- Do not keep old shared UI APIs only for internal compatibility; update in-repository consumers in the same focused migration.
- Overlay containment ownership already exists through `useOverlayContainer`, `TeleportContainer`, child teleported container registration, and outside-interaction containment. Preserve and reuse that model instead of introducing a numeric z-index ownership model by default.

## Phase 2: Foundation audit

Audit existing implementation against the policies:

- `src/shared/lib/md/tokens.css`;
- PostCSS custom unit handling, including adding `sp` support before typography migration relies on it;
- `MDState` and state layer primitives;
- icon primitives and Material Symbols handling;
- overlay primitives: `useOverlayContainer`, `TeleportContainer`, teleported container registry, outside-interaction containment, escape/back stacking, focus trap behavior, and any remaining local z-index usage;
- public `MD*` component props;
- Storybook story hierarchy and coverage;
- visual regression coverage.

The audit must produce:

- an expanded component registry;
- a token inventory and validation plan;
- a typography token migration from legacy `pt` to Material `sp`;
- a baseline light/dark theme plan;
- an overlay containment review based on the existing shared overlay primitives, with focused follow-ups only for gaps;
- a shared UI API migration list without compatibility-only aliases unless technically necessary;
- a Storybook coverage plan;
- a prioritized component-family conversion order.

## Phase 3: Buttons pilot

Use Buttons as the first component family because the current implementation already maps closely to the Material 3 button model.

Pilot scope:

- `MDButton`;
- `MDIconButton`;
- `MDFab` and related FAB helpers;
- deprecated button compatibility exports.

The pilot must establish the practical pattern for:

- component tokens defined at the component boundary;
- token validation;
- public prop naming;
- icon handling;
- density, spacing, and target area handling;
- invalid Material combinations;
- Storybook documentation;
- visual regression surfaces;
- documented deviations.

Use [Component conversion checklist](./component-conversion-checklist.md) as the pilot completion gate.

## Phase 4: Core components

After the Buttons pilot is accepted, convert component families in dependency and usage order:

1. Lists;
2. Dialogs;
3. Text fields and selection controls;
4. Chips and menus;
5. Navigation, app bars, toolbars, and sheets;
6. Cards, progress indicators, tooltips, dividers, and project-specific surfaces.

Every converted component family must update [Component registry](./component-registry.md) and document remaining deviations.

## Phase 5: Structure cleanup

Only after the policies and pilot prove the pattern should the code structure be reorganized.

Possible later structure:

```text
src/shared/lib/md/
  index.css
  units.css
  tokens/
    ref.css
    sys.color.css
    sys.typescale.css
    sys.shape.css
    sys.elevation.css
    sys.motion.css
    sys.state.css
    comp/
      button.css
      icon-button.css
      list.css
      dialog.css
```

Do not perform this reorganization before the foundation audit unless a focused change requires it.
