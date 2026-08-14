# Checkbox — official Material design

Artifact revision: 2026-08-12T20:03:37.994Z
Design contract revision: 2026-08-12T14:38:31.628Z
Status: current
Source revision: m3-docs cache 2026-07-20T16:16:49.323Z; DSDB 2026-07-01_06-10-02
Source checked at: 2026-08-12
Refresh check after: 2026-09-11
Revision summary: Metadata-only refresh: the prior artifact revision's factual execution timestamp (2026-08-13T01:00:00.000Z) was later than the runtime clock, making the file mechanically invalid. Independently re-verified against the official source service (`material_docs_cache_status`, `get_component_tokens`, `search_material_docs` for "checkbox expressive"): cache `capturedAt` is unchanged at 2026-07-20T16:16:49.323Z with identical route-coverage counts, and the full resolved 81-token `md.comp.checkbox` catalogue (including the "focusd" typo and the unpublished high-contrast values on `selected.disabled.icon.color`) is byte-identical to the previously recorded catalogue. No normalized official Checkbox content changed, so the design contract revision is preserved; only the artifact revision and this summary were corrected to a valid current-clock timestamp.
Remaining blockers: none
Required return family: none
Required return stage: none

## Source ledger

| Official source                                              | Title                             | Snapshot                                                                                                 |
| ------------------------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `https://m3.material.io/components/checkbox/overview`        | Checkbox Overview                 | 2026-07-20T16:12:33.651Z                                                                                 |
| `https://m3.material.io/components/checkbox/specs`           | Checkbox Specs                    | 2026-07-20T16:12:33.651Z                                                                                 |
| `https://m3.material.io/components/checkbox/guidelines`      | Checkbox Guidelines               | 2026-07-20T16:12:33.651Z                                                                                 |
| `https://m3.material.io/components/checkbox/accessibility`   | Checkbox Accessibility            | 2026-07-20T16:12:33.651Z                                                                                 |
| `designSystems/20543ce18892f7d9/components/31f16b44fe03b0c0` | Checkbox component token resource | DSDB artifact `2026-07-01_06-10-02`; graph generated 2026-07-20T16:16:49.323Z; `unresolvedTokenCount: 0` |

The official source service was checked on 2026-08-12. Its verified local cache (`capturedAt` 2026-07-20T16:16:49.323Z, `coverageHealth: verified`, zero failed or unresolved accepted routes) contains all four Checkbox tabs and a fully resolved Checkbox token resource (one token set, `md.comp.checkbox`, 81 tokens, 0 unresolved). The cache exceeds its seven-day TTL but no refresh was attempted or required for this pass: targeted searches for a newer or Expressive-specific Checkbox revision (`"checkbox expressive"`, structured searches for `"trailing selection control checkbox"` and `"checkbox indeterminate"`, and a route-catalog search for `checkbox`) returned only the same four Checkbox pages, related-component and foundations pages (Lists, glossary, segmented buttons, "Applying M3 Expressive"), and unresolved/skipped platform `go`/`develop` routes with no evidence of changed or additional official Checkbox content. The newest complete snapshot is used as the current official contract. Route-catalog metadata marks the four component-specific sub-routes `coverageStatus: stale` (cache-age bookkeeping) while the canonical `/components/checkbox` and `/components/checkboxes` routes report `coverageStatus: covered`; this is cache-freshness bookkeeping, not evidence of missing or changed content.

## Identity and purpose

A checkbox lets a person select one or more related options from a list, or turn a single item on or off in a desktop environment. The official glossary defines it as "a component allowing users to select one or more items from a set. Checkboxes can turn an option on or off." Selected items are documented as visually more prominent than unselected items, and checkbox labels should be scannable.

Checkboxes should be used instead of switches when multiple, related options can be selected from a list: checkboxes visually group similar items effectively and take up less space than switches would if used for the same list.

### Distinction from adjacent selection controls

Checkboxes, radio buttons, and switches are documented as the three main official selection controls, all helping people make choices such as selecting options or switching settings on or off:

- **Checkboxes** — select one or more related options from a list.
- **Radio buttons** — select a single option from a list.
- **Switches** — select standalone or more verbose options in a list, such as settings.

### Differences from M2

- **Color** — new color mappings and compatibility with dynamic color.
- **States** — new indeterminate states, as well as error states for unselected, selected, and indeterminate (see Source conflicts and unknowns: the resolved token catalogue contains no `indeterminate`-named tokens and no `indeterminate.error.*` tokens, despite this explicit textual claim).

Platform availability at this snapshot: Design Kit (Figma), Flutter, Jetpack Compose, Android Views (MDC-Android), and Web are each listed as **Available**. No "Web Expressive: unavailable" caveat is present for Checkbox. No dedicated "Expressive update" section or Expressive-specific revision history beyond the "Differences from M2" list above was found for Checkbox at this snapshot (see Source ledger).

## Anatomy and content

The Specs page anatomy diagram and the Guidelines page anatomy diagram both enumerate exactly two required parts:

1. **Container — required.** The 18×18dp shape that forms the checkbox's outer boundary.
2. **Icon — required.** The mark drawn inside the container.

Neither the Specs nor Guidelines anatomy sections state whether the icon renders visibly in the unselected state, or only in selected/indeterminate states (see Source conflicts and unknowns — the token catalogue nonetheless defines `unselected.icon.color` and related unselected-icon-color-by-interaction-state tokens).

**Label text** is not part of the checkbox's own two-part anatomy but is a required adjacent-content and interaction rule: users should be able to select either the checkbox itself or its adjacent text label to toggle the option (see Accessibility). The adjacent text label uses the **on-surface** color role, and this color stays the same whether the checkbox is selected or unselected, and whether the label or component is being interacted with.

## Variants and configurations

Checkbox has one component form with a documented tri-state selection axis and an error-validation axis:

| Selection value | Official description                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unselected      | The default, unchecked state.                                                                                                                                                                  |
| Selected        | The checked state.                                                                                                                                                                             |
| Indeterminate   | A parent-checkbox-only documented value: shown when some, but not all, of a parent checkbox's child checkboxes are checked. Selecting an indeterminate checkbox checks all of its child items. |

Parent/child grouping behavior (Guidelines, Accessibility):

- When the parent checkbox is checked, all child checkboxes are checked.
- If the parent checkbox is unchecked, all child checkboxes are unchecked.
- If some, but not all, child checkboxes are checked, the parent checkbox becomes indeterminate.
- Checkboxes can be selected or unselected independently of the state of other checkboxes in the same group (outside the documented parent/indeterminate relationship).

**Error/validation state**: the Overview's "Differences from M2" list states error states exist "for unselected, selected, and indeterminate." The resolved token catalogue defines `unselected.error.*` and `selected.error.*` token families (container/outline/icon/state-layer colors and outline widths across enabled, hover, focus, and pressed) but defines no `indeterminate`-named or `indeterminate.error.*` tokens at all (see Source conflicts and unknowns). No other official page describes what triggers the error state, how it is set, or how it differs behaviorally from the non-error states beyond color.

No additional official size, shape, or density variant is published for Checkbox. The Accessibility page explicitly advises against applying a reduced-density variant by default (see Accessibility).

## Geometry and layout

| Element           | Attribute                                                | Value                                       |
| ----------------- | -------------------------------------------------------- | ------------------------------------------- |
| Container         | Width                                                    | 18dp                                        |
| Container         | Height                                                   | 18dp                                        |
| Container         | Size (token)                                             | 18dp                                        |
| Container         | Corner shape                                             | `SHAPE_FAMILY_ROUNDED_CORNERS` — 2dp        |
| Container outline | Width — unselected, enabled/hover/pressed/error variants | 2dp                                         |
| Container outline | Width — selected (all interaction/error variants)        | 0dp (no outline; filled container)          |
| Icon              | Size                                                     | 18dp                                        |
| Icon              | Alignment                                                | Center-aligned                              |
| State layer       | Size                                                     | 40dp                                        |
| State layer       | Shape                                                    | `md.sys.shape.corner.full` — fully circular |
| Target            | Size                                                     | 48dp                                        |
| Focus indicator   | Outer offset                                             | 2dp                                         |
| Focus indicator   | Thickness                                                | 3dp                                         |

No size, shape, or geometry change across interaction states (hover/focus/pressed/disabled) is documented for the container, icon, or state layer — unlike Switch, whose handle grows across states. The Measurements diagram and table describe only the single 18dp container / 40dp state-layer / 48dp target set of dimensions, applied uniformly. No numeric motion timing, easing curve, or keyframe data (for example for the checkmark/dash icon draw-in or the container's selected-color transition) is published on any of the four inspected pages; see Source conflicts and unknowns.

## States and behavior

The Specs "States" section documents five states — **enabled, disabled, hovered, focused, pressed** — illustrated side by side in light and dark themes. The page does not state how many selection values (unselected/selected/indeterminate) are shown per illustrated state; the complete state-by-selection-by-error token values are recorded in the token catalogue below.

Toggling and grouping behavior (Guidelines, Accessibility):

- A checkbox clearly and instantly communicates its selected state when toggled.
- Multiple checkboxes in a list can be selected independently.
- Users may select either the checkbox itself or its adjacent text label to toggle the option.
- If a checkbox is used to turn something on or off, the corresponding action should be executed immediately.
- Parent/child (indeterminate) behavior: see Variants and configurations.

Disabled state (from the resolved token catalogue):

- Unselected disabled outline color uses **on-surface** (not the enabled unselected outline's **on-surface-variant**), with outline width unchanged at 2dp and container opacity 0.38.
- Selected disabled container color uses **on-surface** (not the enabled selected container's **primary**), with container opacity 0.38 and container outline width 0dp (matching the enabled selected state's borderless container).
- Selected disabled icon color uses **surface** (`#fef7ff` light / `#141218` dark) — this role has no published high-contrast values, unlike most other checkbox color tokens (see Source conflicts and unknowns).
- Disabled icon opacity is 0.38 for both selected and unselected icons.

No dragged or read-only state is documented for Checkbox at this snapshot.

## Usage guidance

- Use checkboxes to select one or more options from a list, present a list containing sub-selections, turn an item on or off in a desktop environment, or visually group similar options together.
- Use checkboxes instead of switches when multiple, related options can be selected from a list — checkboxes visually group similar items and take up less space than switches.
- Do not use switches for a list where multiple options should be selectable; use checkboxes instead, since checkboxes imply the items are related and take up less visual space.
- Alternate selection controls: use radio buttons to select a single option from a list; use switches for standalone or more verbose options, such as settings.
- Use a parent checkbox with child checkboxes to make it more efficient to select or deselect many related items at once (see Variants and configurations for the indeterminate relationship).
- If a checkbox is used to turn something on or off, execute the action immediately.
- **Responsive layout**: in expanded window sizes, placing checkboxes within a contained region such as a side sheet can help group related controls and available actions.
- **List composition**: the Lists Guidelines page documents "trailing selection control — checkbox, radio button, switch" as one of a list item's possible optional trailing elements, and the Lists Specs page documents checkbox as an allowed leading- or trailing-slot selection control alongside radio button and switch; it further states "Use checkboxes to select multiple items" as list-level selection-control guidance. Full Lists ownership belongs to a Lists family design artifact, not this document.

## Accessibility

Use cases: people using assistive technology must be able to navigate to a checkbox, toggle it on and off, and get appropriate feedback based on input type as documented under Interaction & style.

Interaction and style:

- Users should be able to select either the text label or the checkbox itself to select an option.
- The parent checkbox has three states: selected, unselected, and indeterminate.
- Checkboxes can be selected or unselected regardless of the state of other checkboxes in the same group.
- If some, but not all, child checkboxes are checked, the parent checkbox becomes indeterminate; selecting an indeterminate parent checkbox checks all of its child checkboxes.

Density: do not apply a reduced-density checkbox by default, because that lowers the target below the 48×48 CSS-pixel best-practice minimum. Instead, offer a way for people to opt into a denser layout or theme, and keep every control used to change that density setting at a minimum of 48×48 CSS pixels each, so the setting stays easy to revert.

Keyboard navigation — reproduced exactly as documented on the Checkbox Accessibility page:

| Keys                        | Actions                                           |
| --------------------------- | ------------------------------------------------- |
| **Tab**                     | Moves focus to enabled chip or chip group         |
| **Space** or **Enter**      | Activates, selects, or deselects the focused chip |
| **Backspace** or **Delete** | Removes currently focused input chip              |
| **Arrows**                  | Moves focus between chips                         |

This table's wording ("chip," "chip group," "input chip") does not match Checkbox terminology or the surrounding page content, which otherwise discusses only checkboxes; see Source conflicts and unknowns. It is preserved verbatim as the only officially published Checkbox keyboard-navigation table at this snapshot.

Labeling: if the UI text is correctly linked to the checkbox, assistive technology (such as a screen reader) reads the UI text followed by the component's role. The accessibility label for an individual checkbox is typically the same as its adjacent text label.

The inspected accessibility page does not name a specific accessibility role (for example, a named "checkbox" role) or platform-specific native semantics, and does not state a numeric minimum contrast ratio for checkbox parts against their background. Unlike Switch's overview (which makes a general "meets Material's non-text-contrast requirements" claim), no equivalent general contrast statement appears anywhere on the four inspected Checkbox pages; see Source conflicts and unknowns.

## Complete official token catalogue

The following table is the complete `md.comp.checkbox` token set (81 tokens; the associated token resource reports `unresolvedTokenCount: 0`). Values are the resolved DSDB token-resource values. A blank cell means the resolved token resource supplies no value for that role. Several raw-serialization discrepancies between the cached Specs page Markdown table and the resolved DSDB token resource are corrected here to the resolved value and recorded in Source conflicts and unknowns rather than silently: eight `selected...outline.width` tokens show the raw literal placeholder `[unresolved]` in the cached Markdown and resolve to `0dp`; twenty-one color tokens show the raw unresolved JSON fragment `{"alpha":1}` in one high-contrast cell (Light HC for on-surface/on-surface-variant-aliased tokens, Dark HC for on-primary/on-error-aliased tokens) and resolve to `#000000`.

| Token                                                      | Name                                               | sys alias                                 | ref alias                        | Light                            | Dark                             | Light (High contrast) | Dark (High contrast) |
| ---------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- | --------------------- | -------------------- |
| md.comp.checkbox.unselected.error.focus.outline.color      | Checkbox unselected error focus outline color      | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.focus.indicator.outline.offset            | Checkbox focus indicator offset                    | md.sys.state.focus-indicator.outer-offset |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.focus.indicator.thickness                 | Checkbox focus indicator thickness                 | md.sys.state.focus-indicator.thickness    |                                  | 3dp                              | 3dp                              |                       |                      |
| md.comp.checkbox.focus.indicator.color                     | Checkbox focus indicator color                     | md.sys.color.secondary                    | md.ref.palette.secondary40       | #625b71                          | #ccc2dc                          | #332d41               | #f6edff              |
| md.comp.checkbox.container.width                           | Checkbox container width                           |                                           |                                  | 18dp                             | 18dp                             |                       |                      |
| md.comp.checkbox.container.height                          | Checkbox container height                          |                                           |                                  | 18dp                             | 18dp                             |                       |                      |
| md.comp.checkbox.container.shape                           | Checkbox container shape                           |                                           |                                  | SHAPE_FAMILY_ROUNDED_CORNERS 2dp | SHAPE_FAMILY_ROUNDED_CORNERS 2dp |                       |                      |
| md.comp.checkbox.unselected.error.outline.color            | Checkbox unselected error outline color            | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.selected.error.container.color            | Checkbox selected error container color            | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.unselected.outline.width                  | Checkbox unselected outline width                  |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.selected.outline.width                    | Checkbox selected outline width                    |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.unselected.outline.color                  | Checkbox unselected outline color                  | md.sys.color.on-surface-variant           | md.ref.palette.neutral-variant30 | #49454f                          | #cac4d0                          | #000000               | #ffffff              |
| md.comp.checkbox.container.size                            | Checkbox container size                            |                                           |                                  | 18dp                             | 18dp                             |                       |                      |
| md.comp.checkbox.selected.container.color                  | Checkbox selected container color                  | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.unselected.error.pressed.outline.width    | Checkbox unselected error pressed outline width    |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.selected.error.pressed.outline.width      | Checkbox selected error pressed outline width      |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.selected.error.focus.outline.width        | Checkbox selected error focus outline width        |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.unselected.error.focus.outline.width      | Checkbox unselected error focusd outline width     |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.selected.error.hover.outline.width        | Checkbox selected error hover outline width        |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.unselected.error.hover.outline.width      | Checkbox unselected error hover outline width      |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.error.focus.state-layer.opacity           | Checkbox error focus state layer opacity           | md.sys.state.focus.state-layer-opacity    |                                  | 0.1                              | 0.1                              |                       |                      |
| md.comp.checkbox.unselected.pressed.icon.color             | Checkbox unselected pressed icon color             | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.unselected.focus.icon.color               | Checkbox unselected focus icon color               | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.unselected.hover.icon.color               | Checkbox unselected hover icon color               | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.disabled.unselected.icon.opacity          | Checkbox disabled unselected icon opacity          |                                           |                                  | 0.38                             | 0.38                             |                       |                      |
| md.comp.checkbox.disabled.unselected.icon.color            | Checkbox disabled unselected icon color            | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.disabled.selected.icon.opacity            | Checkbox disabled selected icon opacity            |                                           |                                  | 0.38                             | 0.38                             |                       |                      |
| md.comp.checkbox.disabled.selected.icon.color              | Checkbox disabled selected icon color              | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.unselected.icon.color                     | Checkbox unselected icon color                     | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.selected.error.pressed.icon.color         | Checkbox selected error pressed icon color         | md.sys.color.on-error                     | md.ref.palette.error100          | #ffffff                          | #601410                          | #ffffff               | #000000              |
| md.comp.checkbox.selected.error.pressed.container.color    | Checkbox selected error pressed container color    | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.unselected.error.pressed.outline.color    | Checkbox unselected error pressed outline color    | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.error.pressed.state-layer.opacity         | Checkbox error pressed state layer opacity         | md.sys.state.pressed.state-layer-opacity  |                                  | 0.1                              | 0.1                              |                       |                      |
| md.comp.checkbox.error.pressed.state-layer.color           | Checkbox error pressed state layer color           | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.selected.pressed.outline.width            | Checkbox selected pressed outline width            |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.selected.pressed.container.color          | Checkbox selected pressed container color          | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.selected.pressed.state-layer.opacity      | Checkbox selected pressed state layer opacity      | md.sys.state.pressed.state-layer-opacity  |                                  | 0.1                              | 0.1                              |                       |                      |
| md.comp.checkbox.selected.pressed.state-layer.color        | Checkbox selected pressed state layer color        | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.unselected.pressed.outline.width          | Checkbox unselected pressed outline width          |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.unselected.pressed.outline.color          | Checkbox unselected pressed outline color          | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.unselected.pressed.state-layer.opacity    | Checkbox unselected pressed state layer opacity    | md.sys.state.pressed.state-layer-opacity  |                                  | 0.1                              | 0.1                              |                       |                      |
| md.comp.checkbox.unselected.pressed.state-layer.color      | Checkbox unselected pressed state layer color      | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.selected.error.focus.icon.color           | Checkbox selected error focus icon color           | md.sys.color.on-error                     | md.ref.palette.error100          | #ffffff                          | #601410                          | #ffffff               | #000000              |
| md.comp.checkbox.selected.error.focus.container.color      | Checkbox selected error focus container color      | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.error.focus.state-layer.color             | Checkbox error focus state layer color             | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.selected.focus.outline.width              | Checkbox selected focus outline width              |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.selected.focus.container.color            | Checkbox selected focus container color            | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.unselected.focus.outline.width            | Checkbox unselected focus outline width            |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.unselected.focus.outline.color            | Checkbox unselected focus outline color            | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.selected.error.hover.icon.color           | Checkbox selected error hover icon color           | md.sys.color.on-error                     | md.ref.palette.error100          | #ffffff                          | #601410                          | #ffffff               | #000000              |
| md.comp.checkbox.selected.error.hover.container.color      | Checkbox selected error hover container color      | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.unselected.error.hover.outline.color      | Checkbox unselected error hover outline color      | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.error.hover.state-layer.opacity           | Checkbox error hover state layer opacity           | md.sys.state.hover.state-layer-opacity    |                                  | 0.08                             | 0.08                             |                       |                      |
| md.comp.checkbox.error.hover.state-layer.color             | Checkbox error hover state layer color             | md.sys.color.error                        | md.ref.palette.error40           | #b3261e                          | #f2b8b5                          | #601410               | #fceeee              |
| md.comp.checkbox.selected.hover.outline.width              | Checkbox selected hover outline width              |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.selected.hover.container.color            | Checkbox selected hover container color            | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.unselected.hover.outline.width            | Checkbox unselected hover outline width            |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.unselected.hover.outline.color            | Checkbox unselected hover outline color            | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.selected.disabled.icon.color              | Checkbox selected disabled icon color              | md.sys.color.surface                      | md.ref.palette.neutral98         | #fef7ff                          | #141218                          |                       |                      |
| md.comp.checkbox.selected.disabled.container.outline.width | Checkbox selected disabled container outline width |                                           |                                  | 0dp                              | 0dp                              |                       |                      |
| md.comp.checkbox.selected.disabled.container.opacity       | Checkbox selected disabled container opacity       |                                           |                                  | 0.38                             | 0.38                             |                       |                      |
| md.comp.checkbox.selected.disabled.container.color         | Checkbox selected disabled container color         | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.unselected.disabled.container.opacity     | Checkbox unselected disabled container opacity     |                                           |                                  | 0.38                             | 0.38                             |                       |                      |
| md.comp.checkbox.unselected.disabled.outline.width         | Checkbox unselected disabled outline width         |                                           |                                  | 2dp                              | 2dp                              |                       |                      |
| md.comp.checkbox.unselected.disabled.outline.color         | Checkbox unselected disabled outline color         | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.state-layer.shape                         | Checkbox state layer shape                         | md.sys.shape.corner.full                  |                                  | SHAPE_FAMILY_CIRCULAR            | SHAPE_FAMILY_CIRCULAR            |                       |                      |
| md.comp.checkbox.selected.error.icon.color                 | Checkbox selected error icon color                 | md.sys.color.on-error                     | md.ref.palette.error100          | #ffffff                          | #601410                          | #ffffff               | #000000              |
| md.comp.checkbox.selected.icon.color                       | Checkbox selected icon color                       | md.sys.color.on-primary                   | md.ref.palette.primary100        | #ffffff                          | #381e72                          | #ffffff               | #000000              |
| md.comp.checkbox.icon.size                                 | Checkbox icon size                                 |                                           |                                  | 18dp                             | 18dp                             |                       |                      |
| md.comp.checkbox.unselected.focus.state-layer.opacity      | Checkbox unselected focus state layer opacity      | md.sys.state.focus.state-layer-opacity    |                                  | 0.1                              | 0.1                              |                       |                      |
| md.comp.checkbox.unselected.focus.state-layer.color        | Checkbox unselected focus state layer color        | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.selected.focus.icon.color                 | Checkbox selected focus icon color                 | md.sys.color.on-primary                   | md.ref.palette.primary100        | #ffffff                          | #381e72                          | #ffffff               | #000000              |
| md.comp.checkbox.selected.focus.state-layer.opacity        | Checkbox selected focus state layer opacity        | md.sys.state.focus.state-layer-opacity    |                                  | 0.1                              | 0.1                              |                       |                      |
| md.comp.checkbox.selected.focus.state-layer.color          | Checkbox selected focus state layer color          | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.unselected.hover.state-layer.opacity      | Checkbox unselected hover state layer opacity      | md.sys.state.hover.state-layer-opacity    |                                  | 0.08                             | 0.08                             |                       |                      |
| md.comp.checkbox.unselected.hover.state-layer.color        | Checkbox unselected hover state layer color        | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20                          | #e6e0e9                          | #000000               | #ffffff              |
| md.comp.checkbox.selected.hover.icon.color                 | Checkbox selected hover icon color                 | md.sys.color.on-primary                   | md.ref.palette.primary100        | #ffffff                          | #381e72                          | #ffffff               | #000000              |
| md.comp.checkbox.selected.hover.state-layer.opacity        | Checkbox selected hover state layer opacity        | md.sys.state.hover.state-layer-opacity    |                                  | 0.08                             | 0.08                             |                       |                      |
| md.comp.checkbox.selected.hover.state-layer.color          | Checkbox selected hover state layer color          | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4                          | #d0bcff                          | #381e72               | #f6edff              |
| md.comp.checkbox.state-layer.size                          | Checkbox state layer size                          |                                           |                                  | 40dp                             | 40dp                             |                       |                      |
| md.comp.checkbox.selected.pressed.icon.color               | Checkbox selected pressed icon color               | md.sys.color.on-primary                   | md.ref.palette.primary100        | #ffffff                          | #381e72                          | #ffffff               | #000000              |

## Source conflicts and unknowns

1. **Indeterminate has no dedicated tokens.** The Overview, Guidelines, and Accessibility pages all describe "indeterminate" as a distinct, named parent-checkbox selection value (alongside unselected and selected), and the Overview explicitly claims "error states for unselected, selected, and indeterminate." No token in the resolved 81-token `md.comp.checkbox` set contains "indeterminate" in its name, and no `indeterminate.error.*` family exists at all. It is unresolved from official sources whether indeterminate visually reuses the `selected.*` role tokens with a substituted icon glyph, or is simply unspecified at the token level.
2. **Unresolved outline-width serialization on selected variants.** The cached Specs page Markdown table serializes eight `md.comp.checkbox.selected*.outline.width` tokens (base, error, error-pressed, error-focus, error-hover, pressed, focus, hover, and disabled-container-outline-width) as the literal placeholder `[unresolved]`. The associated resolved DSDB token resource (`unresolvedTokenCount: 0`) reports `0dp` for all eight in both Light and Dark. The catalogue above records the resolved value.
3. **High-contrast alpha-fragment serialization.** The cached Specs page Markdown table serializes the raw unresolved JSON fragment `{"alpha":1}` instead of a color value in one high-contrast cell for twenty-one tokens: thirteen `on-surface`/`on-surface-variant`-aliased tokens show this in their **Light (High contrast)** cell (`unselected.outline.color`, `unselected.pressed.icon.color`, `unselected.focus.icon.color`, `unselected.hover.icon.color`, `unselected.icon.color`, `selected.pressed.state-layer.color`, `unselected.pressed.outline.color`, `unselected.focus.outline.color`, `unselected.hover.outline.color`, `selected.disabled.container.color`, `unselected.disabled.outline.color`, `unselected.focus.state-layer.color`, `unselected.hover.state-layer.color`); eight `on-primary`/`on-error`-aliased tokens show this in their **Dark (High contrast)** cell (`selected.error.pressed.icon.color`, `selected.error.focus.icon.color`, `selected.error.hover.icon.color`, `selected.error.icon.color`, `selected.icon.color`, `selected.focus.icon.color`, `selected.hover.icon.color`, `selected.pressed.icon.color`). In every case the resolved DSDB token resource reports `#000000` for the affected cell. The catalogue above records the resolved value for all twenty-one tokens.
4. **Selected-disabled-icon color has no published high-contrast values.** `md.comp.checkbox.selected.disabled.icon.color` (aliased to `md.sys.color.surface` / `md.ref.palette.neutral98`) reports only Light and Dark values (`#fef7ff` / `#141218`) in both the cached page and the resolved token resource; no Light (High contrast) or Dark (High contrast) value is published for this token, unlike most other checkbox color tokens.
5. **Official display-name typo.** The token `md.comp.checkbox.unselected.error.focus.outline.width` carries the official display name "Checkbox unselected error **focusd** outline width" (missing the final "e") in both the cached Markdown and the resolved token resource. Preserved verbatim per source-fidelity requirements.
6. **Keyboard-navigation table references the wrong component.** The Checkbox Accessibility page's published "Keyboard navigation" table uses chip terminology throughout — "Moves focus to enabled **chip** or **chip group**," "Activates, selects, or deselects the focused **chip**," "Removes currently focused input **chip**," "Moves focus between **chips**" — with no checkbox-specific wording anywhere in the table, while the rest of the page discusses only checkboxes. This appears to be a copy/paste artifact from a Chips accessibility page, but no corrected or checkbox-specific keyboard table is published anywhere in the inspected Checkbox sources. It is reproduced verbatim in Accessibility above as the only official Checkbox keyboard-navigation content at this snapshot; Space/Enter is the only row whose action ("Activates, selects, or deselects the focused chip") plausibly maps to checkbox toggling, and Tab plausibly maps to focus movement — Backspace/Delete "removes currently focused input chip" and Arrows "moves focus between chips" do not correspond to any documented checkbox interaction.
7. **Unpublished motion detail.** No easing curve, duration, spring parameter, or keyframe timing is published for the checkbox's selected/unselected/indeterminate icon transition or container color transition, unlike some other components' documented motion physics.
8. **Unpublished accessibility role and native semantics.** The Accessibility page documents interaction/style behavior, density guidance, the (chip-referencing) keyboard table, and label-sourcing behavior, but does not name a specific accessibility role (for example, an explicit "checkbox" role) or platform-specific native semantics.
9. **No general contrast-requirement statement.** Unlike Switch's Overview page (which states its M3 color mappings "meet Material's non-text-contrast requirements"), no equivalent general contrast claim, and no specific numeric minimum contrast ratio, is published anywhere on the four inspected Checkbox pages.
10. **Anatomy does not state unselected-icon visibility.** The Specs and Guidelines anatomy sections both list exactly two parts (Container, Icon) without stating whether the Icon part is visibly rendered in the unselected state; see Anatomy and content.
11. **Cache freshness.** The verified local cache was captured 2026-07-20T16:16:49.323Z and exceeds its seven-day TTL as of this design pass (2026-08-12), with no refresh executed during this pass. Targeted searches for newer or Checkbox-specific Expressive content returned no additional or contradictory official content, so the newest complete snapshot is used as current per the fixed fallback policy.

## Related official contracts

- **Switch** — the alternate selection control for a standalone or more verbose binary option whose effect applies immediately; explicitly contrasted with Checkbox's multi-select/related-options role in the Guidelines page. A Mioframe family `DESIGN.md` already exists for Switch at `src/shared/ui/material/components/switch/DESIGN.md`.
- **Radio button** — the alternate selection control for choosing a single option from a list; explicitly contrasted with Checkbox's multi-select role in the Guidelines page. No Mioframe family `DESIGN.md` exists for this component at this snapshot.
- **Segmented buttons** — the Segmented buttons Accessibility page states that multi-select segmented buttons "behave like checkboxes: more than one option can be selected," with an accessibility label of "Checkbox" for that mode. No Mioframe family `DESIGN.md` exists for this component at this snapshot.
- **Lists** — the Lists Specs and Guidelines pages document checkbox as an allowed leading- or trailing-slot "selection control" (alongside radio button and switch) and state "Use checkboxes to select multiple items" as list-level guidance. No Mioframe family `DESIGN.md` exists for this component at this snapshot.
- **Material glossary** ("Material A-Z") — defines Checkbox as "a component allowing users to select one or more items from a set. Checkboxes can turn an option on or off," consistent with the Overview and Guidelines pages.

No additional official component token set, delegated foundation, or platform-specific measurement table beyond `md.comp.checkbox` is linked by the inspected Checkbox pages.
