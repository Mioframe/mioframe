# Shape, elevation, and motion

Shape, elevation, and motion define hierarchy. In Mioframe they should clarify structure and state, not decorate the UI.

## Shape

Use Material shape tokens instead of arbitrary border radii.

Common local roles:

- `--md-sys-shape-corner-extra-small` — compact text field containers and small surfaces;
- `--md-sys-shape-corner-small` — chips, small containers, compact cards;
- `--md-sys-shape-corner-medium` — medium containers and menus;
- `--md-sys-shape-corner-large` — larger panels and sheets;
- `--md-sys-shape-corner-extra-large` — dialogs and prominent surfaces;
- `--md-sys-shape-corner-full` — pills, buttons, FAB-like controls.

Project rules:

- Do not reduce rounded Material controls to square corners without an explicit product reason.
- Use full shape for pill controls and primary action buttons when following M3 button patterns.
- Use larger corners for modal or elevated surfaces than for dense inline controls.
- Keep shape consistent inside a component family.

## Elevation

Elevation should communicate layering, temporary surfaces, and user focus.

Use existing tokens:

- `--md-sys-elevation-level0` — no elevation;
- `--md-sys-elevation-level1` — subtle raised surface;
- `--md-sys-elevation-level2` and above — temporary surfaces, menus, dialogs, overlays, or active drag/focus contexts.

Project rules:

- Prefer surface color hierarchy before adding shadows.
- Do not add elevation to every card or list item.
- Use elevation for overlays, menus, dialogs, floating actions, and active surfaces.
- Avoid nested high-elevation surfaces.

## Motion

Motion should explain state changes and preserve orientation.

Use existing tokens:

- `--md-sys-motion-duration-short*` for small state changes;
- `--md-sys-motion-duration-medium*` for component transitions;
- `--md-sys-motion-duration-long*` only for large surface transitions;
- `--md-sys-motion-easing-emphasized-*` for important spatial transitions;
- `--md-sys-motion-easing-standard-*` for ordinary UI changes.

Project rules:

- Do not add decorative animation without user-task value.
- Respect `prefers-reduced-motion` for non-essential motion.
- Keep loading/progress animation deterministic and non-distracting.
- Avoid motion that delays basic data entry or navigation.

## Review checklist

- Does shape communicate component type and hierarchy?
- Is elevation used only where layering matters?
- Does motion clarify the transition rather than distract?
- Is reduced motion respected?
- Are tokens used instead of raw values?
