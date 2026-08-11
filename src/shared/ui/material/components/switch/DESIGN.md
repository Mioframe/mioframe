# Switch — official Material design

Artifact revision: 2026-08-10T19:28:25.068Z
Design contract revision: 2026-08-10T19:28:25.068Z
Status: current
Source revision: m3-docs cache 2026-07-20T16:16:49.323Z; DSDB 2026-07-01_06-10-02
Source checked at: 2026-08-10
Refresh check after: 2026-09-09
Revision summary: Normalized the complete official Switch contract into the current design-document schema.
Remaining blockers: none
Required return family: none
Required return stage: none

## Source ledger

| Official source                                              | Title                           | Snapshot                                                                                                 |
| ------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `https://m3.material.io/components/switch/overview`          | Switch Overview                 | 2026-07-20T16:12:33.651Z                                                                                 |
| `https://m3.material.io/components/switch/specs`             | Switch Specs                    | 2026-07-20T16:12:33.651Z                                                                                 |
| `https://m3.material.io/components/switch/guidelines`        | Switch Guidelines               | 2026-07-20T16:12:33.651Z                                                                                 |
| `https://m3.material.io/components/switch/accessibility`     | Switch Accessibility            | 2026-07-20T16:12:33.651Z                                                                                 |
| `designSystems/20543ce18892f7d9/components/33b1b2925d9ff561` | Switch component token resource | DSDB artifact `2026-07-01_06-10-02`; graph generated 2026-07-20T16:16:49.323Z; `unresolvedTokenCount: 0` |

The official source service was checked on 2026-08-10. Its verified local cache (`capturedAt` 2026-07-20T16:16:49.323Z) contains all four Switch tabs, `coverageHealth: verified`, zero failed or unresolved accepted routes, and a fully resolved Switch token resource (one token set, `md.comp.switch`, 78 tokens, 0 unresolved). The cache exceeds its seven-day TTL but no refresh was attempted or required for this pass: a targeted search for a newer or Expressive-specific Switch revision returned only the same four Switch pages plus a foundations page listing Switch as an example Expressive-era component, with no evidence of changed or additional official Switch content. The newest complete snapshot is used as the current official contract.

## Identity and purpose

A switch lets a person make a single binary selection — on/off or true/false — for a standalone setting or option, and the corresponding effect takes place immediately without a separate save step. Material recommends switches, not radio buttons, when the items in a list can be independently controlled, and states that the switch's current selection must be visible at a glance.

The switch's second anatomical part is officially named "Handle" and is annotated as "formerly 'thumb'" on the Specs page — the display name in the token catalogue and prose all use "handle."

Platform availability at this snapshot: Design Kit (Figma), Flutter, Jetpack Compose, Android Views (MDC-Android), and Web are each listed as **Available** — Switch does not carry a "Web Expressive: unavailable" caveat the way some newer Expressive-only components do. A foundations page ("Applying M3 Expressive") lists Switch among components used to build Expressive UI, but the Switch overview page states its M2-to-M3 differences without a separately labeled "Expressive update" section; the differences below are the only officially documented revision history for this component at this snapshot.

### Differences from M2

- **Accessibility** — the visual presentation is more accessible.
- **Color** — new color mappings meet Material's non-text-contrast requirements and support dynamic color.
- **Icons** — the handle can now optionally contain an icon.
- **Layout** — the track is taller and wider.

M2 switches used a circular handle that extended beyond the edge of the track. M3 switches use a taller, wider track, new color-role mappings, and an optionally icon-bearing handle.

### Distinction from adjacent selection controls

Checkboxes, radio buttons, and switches are the three official selection controls:

- **Checkboxes** — select one or more related options from a list.
- **Radio buttons** — select exactly one option from a list.
- **Switches** — select a standalone or more verbose option, such as a setting, and apply the effect immediately.

Switches control **binary** options (on/off, true/false), not **opposing** options where only one of several named choices applies (for example, List View vs. Map View). Opposing options belong to a connected button group, not a switch. A switch also cannot substitute for a button: people expect a call-to-action to be a button, not a switch.

## Anatomy and content

1. **Track — required.** The background shape the handle moves across.
2. **Handle — required** (formerly "thumb"). The primary interactive element; it slides between the two ends of the track and changes size across states.
3. **Icon — optional.** Sits inside the handle and visually emphasizes the current selection. Its meaning must be clear and unambiguous — for example a checkmark for on and an X for off. Ambiguous or non-binary icons (for example a moon or a pencil) are documented as something to avoid.

**Label text** is not part of the switch's own anatomy but is a required adjacent-content rule: switches should always be paired with an inline external label describing what the switch controls when it is on. Label text must not be placed inside the switch itself, because the resulting font size would be too small to remain accessible. Labels should stay short and direct and describe the "on" effect. The adjacent label uses the **on-surface** color role regardless of interaction state; adjacent supporting text may use **on-surface-variant**.

## Variants and configurations

Switch has one component form with a single required binary selection axis (unselected/off, selected/on) and one optional-content axis for the handle icon. The Specs page enumerates exactly three icon configurations:

| Configuration                          | Official contract                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Without icons                          | Handle shows no icon in either selection state.                                                                                             |
| Icon on selected switch                | Handle shows an icon only when selected (on); unselected (off) shows no icon.                                                               |
| Icon on selected and unselected switch | Handle shows an icon in both selection states, with each icon's meaning distinct and unambiguous (for example checkmark for on, X for off). |

No additional official size, shape, density, or color-scheme variant is published for Switch. The accessibility page explicitly advises against applying a reduced-density variant by default (see Accessibility).

## Geometry and layout

| Element         | Attribute            | Value                                      |
| --------------- | -------------------- | ------------------------------------------ |
| Track           | Height               | 32dp                                       |
| Track           | Width                | 52dp                                       |
| Track           | Outline width        | 2dp                                        |
| Track           | Shape                | `md.sys.shape.corner.full` (fully rounded) |
| Handle          | Height — unselected  | 16dp                                       |
| Handle          | Height — with icon   | 24dp                                       |
| Handle          | Height — selected    | 24dp                                       |
| Handle          | Height — pressed     | 28dp                                       |
| Handle          | Width — unselected   | 16dp                                       |
| Handle          | Width — with icon    | 24dp                                       |
| Handle          | Width — selected     | 24dp                                       |
| Handle          | Width — pressed      | 28dp                                       |
| Handle          | Shape                | `md.sys.shape.corner.full` (fully rounded) |
| Handle          | Elevation (enabled)  | `md.sys.elevation.level1` — 1dp            |
| Handle          | Elevation (disabled) | `md.sys.elevation.level0` — 0dp            |
| State layer     | Size                 | 40dp                                       |
| State layer     | Shape                | `md.sys.shape.corner.full` (fully rounded) |
| Target          | Size                 | 48dp                                       |
| Icon            | Size — selected      | 16dp                                       |
| Icon            | Size — unselected    | 16dp                                       |
| Focus indicator | Outer offset         | 2dp                                        |
| Focus indicator | Thickness            | 3dp                                        |

The handle grows from its unselected 16×16dp size to its selected 24×24dp size when toggled on, and grows further to 28×28dp while pressed in either selection state. The 40dp state layer and 48dp interactive target remain constant regardless of handle size. No numeric motion timing, easing curve, or spring parameters (comparable to Button's documented spring damping/stiffness for shape morphing) are published for the handle's slide or size change; see Source conflicts and unknowns.

## States and behavior

The Specs "States" section documents five states — **enabled, hovered, focused, pressed, disabled** — each illustrated for both selection values (unselected/off and selected/on) in light and dark themes; the complete state-by-selection-by-theme values are recorded in the token catalogue below.

Toggling behavior:

- A switch is successfully toggled when its handle slides to the opposite end of the track following an interaction (tap, click, drag release, or keyboard activation).
- The corresponding action takes effect **immediately** — there is no separate confirm/save step.
- The "on" (selected) state is visually indicated by a larger handle (24dp vs. 16dp unselected) and, when the icon configuration includes a selected-state icon, a distinguishing icon such as a checkmark.
- Touch interaction: tapping or dragging the handle grows its size, giving interaction feedback.
- Cursor interaction: hovering the switch (in either selection state) grows the hover area as a visual cue that the handle is interactive; clicking grows the handle further; the cursor changes from an arrow to a hand pointer over the switch.
- Pressed handle size (28×28dp) is documented independent of selection state, applying whether the switch is being pressed from unselected or selected.

Disabled state:

- Track opacity is reduced to 0.12 regardless of selection.
- Unselected disabled handle opacity is 0.38; selected disabled handle opacity is 1 (full opacity, but disabled-specific colors apply — see the token catalogue).
- Disabled icon opacity is 0.38 for both selected and unselected icons.
- Disabled handle elevation is `md.sys.elevation.level0` (0dp) — flat, no shadow — for both selection states.

No dragged, error, indeterminate, or read-only state is documented for Switch at this snapshot.

## Usage guidance

- Use switches to adjust settings and other standalone options whose effect should begin immediately, without a save action.
- Use switches (not radio buttons) when the items in a list can be independently controlled, and keep the current selection visible at a glance.
- Use switches to toggle a single item on or off, or to immediately activate or deactivate something.
- Do not use a switch for **opposing** options — where only one of several named choices should be active, such as List View vs. Map View. Use a connected button group instead.
- Alternate selection controls: use checkboxes to select multiple related options from a list; use radio buttons to select exactly one option from a list; use switches for standalone or more verbose options, such as settings.
- Do not use switches to select multiple options that require the person to save or confirm afterward — use checkboxes for that pattern instead.
- Do not use a switch as a substitute for a button; people expect a call-to-action to be a button.
- Icon content: use icons whose meaning is unambiguous for the binary states (for example X for off, checkmark for on). Avoid icons that are ambiguous or imply more than two states (for example a moon or a pencil icon).
- Label content: always pair a switch with adjacent inline label text describing what it controls when on. Keep labels short and direct. Never place label text inside the switch itself — the resulting text would be too small to remain accessible.
- Placement: switches are commonly arranged in stacked layouts, such as on settings screens.

## Accessibility

Use cases: people using assistive technology must be able to navigate to a switch with a keyboard or switch input, toggle it on and off, and receive appropriate feedback for the input type they are using.

Interaction and style:

- The handle increases in size to indicate interactivity for both touch and cursor interactions.
- **Touch** — tapping or dragging the handle grows its size, providing interaction feedback.
- **Cursor** — hovering the switch (in either selection state) grows the hover area as a visual cue that the handle is interactive; clicking grows the handle size; the pointer changes from an arrow to a hand cursor.

Density: do not apply a reduced-density switch by default, because that lowers the target below the 48×48 CSS-pixel best-practice minimum. Instead, offer a way for people to opt into a denser layout or theme, and keep every control used to change that density setting at a minimum of 48×48 CSS pixels each, so the setting stays easy to revert.

Initial focus: focus lands directly on the switch's handle, since the handle is the component's primary interactive element.

Keyboard navigation:

| Keys                   | Action                            |
| ---------------------- | --------------------------------- |
| **Tab**                | Focus lands on the switch handle. |
| **Space** or **Enter** | Toggles the handle on and off.    |

Labeling: the switch's accessibility label uses its adjacent visible label text when implemented correctly; assistive technology such as a screen reader announces the adjacent UI text followed by the component's role. When the visible label text is ambiguous on its own, the guidance is to make the adjacent label text itself more descriptive where possible — this reduces the need for a separate, more verbose accessible name (illustrated example: a switch visibly labeled "Photo album" paired with a more descriptive accessible label "Photo album access").

The inspected accessibility page does not name a specific accessibility role (for example, a named "switch" role) or platform-specific native semantics, and does not state a numeric minimum contrast ratio for switch parts against their background; the only related statement is the overview's general claim that M3's color mappings "meet Material's non-text-contrast requirements." See Source conflicts and unknowns.

## Complete official token catalogue

The following table is the complete `md.comp.switch` token set (78 tokens; the associated token resource reports `unresolvedTokenCount: 0`). Values are the resolved DSDB token-resource values. Two categories of raw-serialization discrepancy in the separately cached Specs page Markdown table are corrected here to the resolved value and recorded in Source conflicts and unknowns rather than silently: `handle.shadow-color` (cached Markdown shows the unresolved JSON fragment `{"alpha":1}` for both Light and Dark; resolved value is `#000000` for both) and `disabled.handle.elevation` (cached Markdown shows the literal placeholder `[unresolved]`; resolved value is `0dp`). A blank cell means the resolved token resource supplies no value for that role.

| Token                                                  | Name                                           | sys alias                                 | ref alias                        | Light                 | Dark                  | Light (High contrast) | Dark (High contrast) |
| ------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------- | -------------------------------- | --------------------- | --------------------- | --------------------- | -------------------- |
| md.comp.switch.unselected.pressed.track.outline.color  | Switch unselected pressed track outline color  | md.sys.color.outline                      | md.ref.palette.neutral-variant50 | #79747e               | #938f99               | #322f37               | #f5eefa              |
| md.comp.switch.focus.indicator.offset                  | Switch focus indicator offset                  | md.sys.state.focus-indicator.outer-offset |                                  | 2dp                   | 2dp                   |                       |                      |
| md.comp.switch.focus.indicator.color                   | Switch focus indicator color                   | md.sys.color.secondary                    | md.ref.palette.secondary40       | #625b71               | #ccc2dc               | #332d41               | #f6edff              |
| md.comp.switch.focus.indicator.thickness               | Switch focus indicator thickness               | md.sys.state.focus-indicator.thickness    |                                  | 3dp                   | 3dp                   |                       |                      |
| md.comp.switch.unselected.track.color                  | Switch unselected track color                  | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.track.color                    | Switch selected track color                    | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.track.shape                             | Switch track shape                             | md.sys.shape.corner.full                  |                                  | SHAPE_FAMILY_CIRCULAR | SHAPE_FAMILY_CIRCULAR |                       |                      |
| md.comp.switch.track.outline.width                     | Switch track outline width                     |                                           |                                  | 2dp                   | 2dp                   |                       |                      |
| md.comp.switch.unselected.track.outline.color          | Switch track outline color                     | md.sys.color.outline                      | md.ref.palette.neutral-variant50 | #79747e               | #938f99               | #322f37               | #f5eefa              |
| md.comp.switch.handle.width                            | Switch handle width                            |                                           |                                  | 20dp                  | 20dp                  |                       |                      |
| md.comp.switch.handle.height                           | Switch handle height                           |                                           |                                  | 20dp                  | 20dp                  |                       |                      |
| md.comp.switch.disabled.handle.elevation               | Switch disabled handle elevation               | md.sys.elevation.level0                   |                                  | 0dp                   | 0dp                   |                       |                      |
| md.comp.switch.disabled.handle.opacity                 | Switch disabled handle opacity                 |                                           |                                  | 0.38                  | 0.38                  |                       |                      |
| md.comp.switch.handle.elevation                        | Switch handle elevation                        | md.sys.elevation.level1                   |                                  | 1dp                   | 1dp                   |                       |                      |
| md.comp.switch.handle.shadow-color                     | Switch handle shadow color                     | md.sys.color.shadow                       | md.ref.palette.neutral0          | #000000               | #000000               |                       |                      |
| md.comp.switch.unselected.pressed.icon.color           | Switch unselected pressed icon color           | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.pressed.icon.color             | Switch selected pressed icon color             | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.pressed.state-layer.opacity  | Switch unselected pressed state layer opacity  | md.sys.state.pressed.state-layer-opacity  |                                  | 0.1                   | 0.1                   |                       |                      |
| md.comp.switch.unselected.pressed.state-layer.color    | Switch unselected pressed state layer color    | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.unselected.pressed.track.color          | Switch unselected pressed track color          | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.pressed.state-layer.opacity    | Switch selected pressed state layer opacity    | md.sys.state.pressed.state-layer-opacity  |                                  | 0.1                   | 0.1                   |                       |                      |
| md.comp.switch.selected.pressed.state-layer.color      | Switch selected pressed state layer color      | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.focus.icon.color             | Switch unselected focus icon color             | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.focus.icon.color               | Switch selected focus icon color               | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.focus.state-layer.opacity    | Switch unselected focus state layer opacity    | md.sys.state.focus.state-layer-opacity    |                                  | 0.1                   | 0.1                   |                       |                      |
| md.comp.switch.unselected.focus.state-layer.color      | Switch unselected focus state layer color      | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.unselected.focus.track.outline.color    | Switch unselected focus track outline color    | md.sys.color.outline                      | md.ref.palette.neutral-variant50 | #79747e               | #938f99               | #322f37               | #f5eefa              |
| md.comp.switch.unselected.focus.track.color            | Switch unselected focus track color            | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.focus.state-layer.opacity      | Switch selected focus state layer opacity      | md.sys.state.focus.state-layer-opacity    |                                  | 0.1                   | 0.1                   |                       |                      |
| md.comp.switch.selected.focus.state-layer.color        | Switch selected focus state layer color        | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.hover.icon.color             | Switch unselected hover icon color             | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.hover.icon.color               | Switch selected hover icon color               | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.hover.state-layer.opacity    | Switch unselected hover state layer opacity    | md.sys.state.hover.state-layer-opacity    |                                  | 0.08                  | 0.08                  |                       |                      |
| md.comp.switch.unselected.hover.state-layer.color      | Switch unselected hover state layer color      | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.unselected.hover.track.outline.color    | Switch unselected hover track outline color    | md.sys.color.outline                      | md.ref.palette.neutral-variant50 | #79747e               | #938f99               | #322f37               | #f5eefa              |
| md.comp.switch.unselected.hover.track.color            | Switch unselected hover track color            | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.hover.state-layer.opacity      | Switch selected hover state layer opacity      | md.sys.state.hover.state-layer-opacity    |                                  | 0.08                  | 0.08                  |                       |                      |
| md.comp.switch.selected.hover.state-layer.color        | Switch selected hover state layer color        | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.disabled.selected.handle.opacity        | Switch disabled selected handle opacity        |                                           |                                  | 1                     | 1                     |                       |                      |
| md.comp.switch.disabled.unselected.handle.opacity      | Switch disabled unselected handle opacity      |                                           |                                  | 0.38                  | 0.38                  |                       |                      |
| md.comp.switch.disabled.unselected.track.outline.color | Switch disabled unselected track outline color | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.unselected.handle.color                 | Switch unselected handle color                 | md.sys.color.outline                      | md.ref.palette.neutral-variant50 | #79747e               | #938f99               | #322f37               | #f5eefa              |
| md.comp.switch.selected.handle.color                   | Switch selected handle color                   | md.sys.color.on-primary                   | md.ref.palette.primary100        | #ffffff               | #381e72               | #ffffff               | #000000              |
| md.comp.switch.state-layer.shape                       | Switch state layer shape                       | md.sys.shape.corner.full                  |                                  | SHAPE_FAMILY_CIRCULAR | SHAPE_FAMILY_CIRCULAR |                       |                      |
| md.comp.switch.handle.shape                            | Switch handle shape                            | md.sys.shape.corner.full                  |                                  | SHAPE_FAMILY_CIRCULAR | SHAPE_FAMILY_CIRCULAR |                       |                      |
| md.comp.switch.pressed.handle.width                    | Switch pressed handle width                    |                                           |                                  | 28dp                  | 28dp                  |                       |                      |
| md.comp.switch.selected.handle.width                   | Switch selected handle width                   |                                           |                                  | 24dp                  | 24dp                  |                       |                      |
| md.comp.switch.with-icon.handle.width                  | Switch with icon handle width                  |                                           |                                  | 24dp                  | 24dp                  |                       |                      |
| md.comp.switch.unselected.handle.width                 | Switch unselected handle width                 |                                           |                                  | 16dp                  | 16dp                  |                       |                      |
| md.comp.switch.pressed.handle.height                   | Switch pressed handle height                   |                                           |                                  | 28dp                  | 28dp                  |                       |                      |
| md.comp.switch.selected.handle.height                  | Switch selected handle height                  |                                           |                                  | 24dp                  | 24dp                  |                       |                      |
| md.comp.switch.with-icon.handle.height                 | Switch with icon handle height                 |                                           |                                  | 24dp                  | 24dp                  |                       |                      |
| md.comp.switch.unselected.handle.height                | Switch unselected handle height                |                                           |                                  | 16dp                  | 16dp                  |                       |                      |
| md.comp.switch.unselected.focus.handle.color           | Switch unselected focus handle color           | md.sys.color.on-surface-variant           | md.ref.palette.neutral-variant30 | #49454f               | #cac4d0               | #000000               | #ffffff              |
| md.comp.switch.selected.focus.handle.color             | Switch selected focus handle color             | md.sys.color.primary-container            | md.ref.palette.primary90         | #eaddff               | #4f378b               | #4f378b               | #d0bcff              |
| md.comp.switch.selected.focus.track.color              | Switch selected focus track color              | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.hover.handle.color           | Switch unselected hover handle color           | md.sys.color.on-surface-variant           | md.ref.palette.neutral-variant30 | #49454f               | #cac4d0               | #000000               | #ffffff              |
| md.comp.switch.selected.hover.handle.color             | Switch selected hover handle color             | md.sys.color.primary-container            | md.ref.palette.primary90         | #eaddff               | #4f378b               | #4f378b               | #d0bcff              |
| md.comp.switch.selected.hover.track.color              | Switch selected hover track color              | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.unselected.icon.size                    | Switch unselected icon size                    |                                           |                                  | 16dp                  | 16dp                  |                       |                      |
| md.comp.switch.unselected.icon.color                   | Switch unselected icon color                   | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.selected.icon.size                      | Switch selected icon size                      |                                           |                                  | 16dp                  | 16dp                  |                       |                      |
| md.comp.switch.selected.icon.color                     | Switch selected icon color                     | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.state-layer.size                        | Switch state layer size                        |                                           |                                  | 40dp                  | 40dp                  |                       |                      |
| md.comp.switch.track.width                             | Switch track width                             |                                           |                                  | 52dp                  | 52dp                  |                       |                      |
| md.comp.switch.track.height                            | Switch track height                            |                                           |                                  | 32dp                  | 32dp                  |                       |                      |
| md.comp.switch.disabled.unselected.icon.opacity        | Switch disabled unselected icon opacity        |                                           |                                  | 0.38                  | 0.38                  |                       |                      |
| md.comp.switch.disabled.unselected.icon.color          | Switch disabled unselected icon color          | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.disabled.selected.icon.opacity          | Switch disabled selected icon opacity          |                                           |                                  | 0.38                  | 0.38                  |                       |                      |
| md.comp.switch.disabled.selected.icon.color            | Switch disabled selected icon color            | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.unselected.pressed.handle.color         | Switch unselected pressed handle color         | md.sys.color.on-surface-variant           | md.ref.palette.neutral-variant30 | #49454f               | #cac4d0               | #000000               | #ffffff              |
| md.comp.switch.selected.pressed.handle.color           | Switch selected pressed handle color           | md.sys.color.primary-container            | md.ref.palette.primary90         | #eaddff               | #4f378b               | #4f378b               | #d0bcff              |
| md.comp.switch.selected.pressed.track.color            | Switch selected pressed track color            | md.sys.color.primary                      | md.ref.palette.primary40         | #6750a4               | #d0bcff               | #381e72               | #f6edff              |
| md.comp.switch.disabled.unselected.handle.color        | Switch disabled unselected handle color        | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.disabled.unselected.track.color         | Switch disabled unselected track color         | md.sys.color.surface-container-highest    | md.ref.palette.neutral90         | #e6e0e9               | #36343b               |                       |                      |
| md.comp.switch.disabled.selected.handle.color          | Switch disabled selected handle color          | md.sys.color.surface                      | md.ref.palette.neutral98         | #fef7ff               | #141218               |                       |                      |
| md.comp.switch.disabled.selected.track.color           | Switch disabled selected track color           | md.sys.color.on-surface                   | md.ref.palette.neutral10         | #1d1b20               | #e6e0e9               | #000000               | #ffffff              |
| md.comp.switch.disabled.track.opacity                  | Switch disabled track opacity                  |                                           |                                  | 0.12                  | 0.12                  |                       |                      |

## Source conflicts and unknowns

1. **Handle shadow-color serialization.** The cached Specs page Markdown table serializes `md.comp.switch.handle.shadow-color` as the raw unresolved JSON fragment `{"alpha":1}` for both the Light and Dark roles. The associated resolved DSDB token resource (`unresolvedTokenCount: 0`) reports `#000000` for both roles. The catalogue above records the resolved value.
2. **Disabled handle elevation serialization.** The cached Specs page Markdown table shows the literal placeholder `[unresolved]` for `md.comp.switch.disabled.handle.elevation` in both Light and Dark. The resolved token resource reports `0dp` for both. The catalogue above records the resolved value.
3. **Light-high-contrast serialization on several on-surface / on-surface-variant tokens.** The cached Specs page Markdown table shows the raw fragment `{"alpha":1}` in the Light (High contrast) cell — while the Dark (High contrast) cell resolves normally to `#ffffff` — for: `unselected.pressed.state-layer.color`, `unselected.focus.state-layer.color`, `unselected.hover.state-layer.color`, `disabled.unselected.track.outline.color`, `disabled.selected.icon.color`, `unselected.focus.handle.color`, `unselected.hover.handle.color`, `unselected.pressed.handle.color`, `disabled.unselected.handle.color`, and `disabled.selected.track.color`. In every one of these cases the resolved token resource reports `#000000` for the Light (High contrast) role. The catalogue above records the resolved value for all ten tokens.
4. **Unpublished motion detail.** The Specs and Guidelines pages describe that the handle slides across the track and changes size on toggle, press, and hover, but no easing curve, spring damping/stiffness, duration, or keyframe timing is published for these transitions — unlike, for example, Button's documented pressed-shape spring parameters.
5. **Unpublished accessibility role and native semantics.** The Accessibility page documents keyboard commands, initial focus landing, and accessible-label sourcing, but does not name a specific accessibility role (for example, an explicit "switch" role) or platform-specific native semantics.
6. **Unpublished numeric contrast requirement.** No specific minimum contrast ratio (for example, a stated 3:1 requirement) is published on the Switch accessibility page for switch parts against their background; the only related statement is the Overview's general claim that the M3 color mappings "meet Material's non-text-contrast requirements."
7. **Cache freshness.** The verified local cache was captured 2026-07-20T16:16:49.323Z and exceeds its seven-day TTL as of this design pass (2026-08-10), with no refresh executed during this pass. A targeted search for newer or Switch-specific Expressive content returned no additional or contradictory official content, so the newest complete snapshot is used as current per the fixed fallback policy.

## Related official contracts

- **Radio button** — the alternate selection control for choosing exactly one option from a list; explicitly contrasted with Switch's standalone/verbose binary-option role in the Guidelines page. No Mioframe family `DESIGN.md` exists for this component at this snapshot.
- **Checkbox** — the alternate selection control for choosing one or more related options from a list, particularly when the selection requires an explicit save/confirm action; explicitly contrasted with Switch's immediate-effect role in the Guidelines page. No Mioframe family `DESIGN.md` exists for this component at this snapshot.
- **Connected button group / segmented buttons** — the documented alternative to a switch for **opposing** (mutually exclusive) options, such as List View vs. Map View. No Mioframe family `DESIGN.md` exists for this component at this snapshot.
- **Lists** — the Lists Guidelines page documents "trailing selection control — checkbox, radio button, switch" as one of a list item's possible trailing elements, i.e. Switch is a documented composition option within list items. No Mioframe family `DESIGN.md` exists for this component at this snapshot.

No additional official component token set, delegated foundation, or platform-specific measurement table beyond `md.comp.switch` is linked by the inspected Switch pages.
