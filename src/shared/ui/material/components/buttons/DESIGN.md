---
document: material-component-design
component: Buttons
canonical-slug: buttons
material-source: m3.material.io
source-snapshot: 2026-07-20
status: review-ready
approval: pending
---

# Buttons

## Sources

| ID   | Official page         | URL                                                     | Evidence used                                                                                                                                                        |
| ---- | --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M3-1 | Buttons Overview      | https://m3.material.io/components/buttons/overview      | Purpose summary, variant/configuration/size counts, M3 Expressive update (toggle variant, shapes, sizes), differences from M2, platform availability                 |
| M3-2 | Buttons Specs         | https://m3.material.io/components/buttons/specs         | Variants, configurations, full token tables (color × 5, size × 5, deprecated legacy tables), anatomy, color mapping, states, shape morph, measurements, corner sizes |
| M3-3 | Buttons Guidelines    | https://m3.material.io/components/buttons/guidelines    | Usage guidance, toggle button behavior, anatomy content rules, per-color-style choice guidance, adaptive/resizing/presentation behavior                              |
| M3-4 | Buttons Accessibility | https://m3.material.io/components/buttons/accessibility | Assistive-technology use cases, color contrast, 200% text size, rapid-click motion, keyboard navigation, accessible labeling                                         |
| M3-5 | All buttons           | https://m3.material.io/components/all-buttons           | Family and related-component boundary, emphasis-based choice guidance, hierarchy and placement guidance                                                              |

## Component identity

- Official title: Buttons
- Category: Not specified by the inspected Material sources
- Canonical slug: buttons
- Family boundary: This artifact covers the "Buttons" (common buttons) component only: the Default and Toggle variants across the five color configurations (elevated, filled, filled tonal, outlined, text). Icon buttons, Segmented buttons, Split buttons, Button groups, Floating action button (FAB), Extended FAB, and FAB menu are separately documented Material components with their own overview/specs/guidelines/accessibility pages and are out of scope (M3-5).

## Purpose and choice guidance

### Purpose

Buttons communicate actions that people can take. They are typically placed throughout the UI in dialogs, modal windows, forms, cards, and toolbars, and can be placed within standard button groups (M3-3).

### Use when

- A discrete, one-shot action is needed and visual prominence should reflect the action's importance via color style: filled for important/final actions that complete a flow (e.g. Save, Join now, Confirm); tonal for lower-priority actions needing more emphasis than an outline (e.g. Next in onboarding); outlined for medium-emphasis actions that are important but not primary; text for the lowest-priority actions; elevated only when the button needs visual separation from a visually prominent background (M3-3).
- A binary selection is needed (Save/Favorite-style toggling): use the Toggle variant, which is available for elevated, filled, tonal, and outlined color styles (M3-1, M3-2, M3-3).
- Actions belong in a button group with primary and secondary members; buttons of different sizes within a group communicate emphasis (M3-3).

### Do not use when

- A screen already has one high-emphasis action: don't add multiple filled buttons; the filled style should be used sparingly, ideally for a single action per page (M3-3).
- The layout risks clutter: too many buttons disrupt visual hierarchy; consider a navigation rail, chips, text links, or icon buttons for additional/low-priority actions instead (M3-3).
- Placing an outlined or text button on a visually prominent background (images, video): both styles depend on color/stroke for recognizability and should be placed on simple backgrounds, or customized for contrast (M3-3).
- A toggle button needs the text color style: "There is no toggle text button" (M3-2).

### Alternative components

From the emphasis-ordered "Choosing buttons" guidance (M3-5):

- Higher emphasis than any common-button color style: Extended FAB, FAB, FAB menu (primary/most common screen action); Split button (key action with multiple options); Button group (multiple key actions shown together).
- Lower emphasis / more compact than any common-button color style: Icon button (optional supplementary actions such as "Bookmark" or "Star").

## Official family and related components

| Component or member          | Relationship                                                        | Source |
| ---------------------------- | ------------------------------------------------------------------- | ------ |
| Button (default)             | Member of this component (variant)                                  | M3-5   |
| Toggle button                | Member of this component (variant)                                  | M3-5   |
| Icon button                  | Separately documented Material component (`icon-buttons`)           | M3-5   |
| Toggle icon button           | Part of the separately documented Icon buttons component            | M3-5   |
| Split button                 | Separately documented Material component (`split-button`)           | M3-5   |
| Standard button group        | Separately documented Material component (`button-groups`)          | M3-5   |
| Connected button group       | Part of the separately documented Button groups component           | M3-5   |
| Floating action button (FAB) | Separately documented Material component (`floating-action-button`) | M3-5   |
| Extended FAB                 | Separately documented Material component (`extended-fab`)           | M3-5   |
| FAB menu                     | Separately documented Material component (`fab-menu`)               | M3-5   |

## Variants

| Variant            | Purpose or emphasis                    | Distinguishing properties                                                                                                                                                                                                              | Source           |
| ------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Default            | Single-shot, non-selectable action     | No selected/unselected state; uses the base (non-toggle) color/state token set for its configured color style                                                                                                                          | M3-1, M3-2       |
| Toggle (selection) | Binary selection (e.g. Save, Favorite) | Adds selected/unselected states with distinct color mapping per state; resting container shape morphs between round and square on selection; not available for the text color style; introduced in the M3 Expressive update (May 2025) | M3-1, M3-2, M3-3 |

## Configurations

| Configuration              | Required content                                        | Optional content | Constraints                                                                                                                                                                             | Source     |
| -------------------------- | ------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Color: Elevated            | Container, label text                                   | Leading icon     | Same color mapping as tonal but with a shadow (elevation); use only when visual separation from a prominent background is required; used sparingly, higher elevation increases emphasis | M3-2, M3-3 |
| Color: Filled              | Container, label text                                   | Leading icon     | Primary color mapping; highest visual impact after the FAB; use sparingly, ideally one per page                                                                                         | M3-2, M3-3 |
| Color: Filled tonal        | Container, label text                                   | Leading icon     | Secondary color mapping; medium-low emphasis, more than an outline                                                                                                                      | M3-2, M3-3 |
| Color: Outlined            | Container (stroke only, no fill by default), label text | Leading icon     | Stroke around container; container fill invisible at rest but opacity/state layers behave like other styles when disabled/hovered/focused/pressed                                       | M3-2, M3-3 |
| Color: Text                | Label text                                              | Leading icon     | Container invisible except when hovered, focused, or pressed; label color must be recognizable against surrounding non-button text; no toggle variant                                   | M3-2, M3-3 |
| Shape: Round               | Container                                               | —                | Fully rounded (`full`) corners at every size, in both default and pressed states unless morphed                                                                                         | M3-2       |
| Shape: Square              | Container                                               | —                | Corner radius varies by size (12dp at XS/S, 16dp at M, 28dp at L/XL); both round and square buttons share the same pressed-state corner radius                                          | M3-2       |
| Small button padding: 16dp | —                                                       | —                | M3 Expressive recommended leading/trailing padding for the Small size, matching the padding scale of the other new sizes                                                                | M3-1, M3-2 |
| Small button padding: 24dp | —                                                       | —                | Original M3 Small padding; no longer recommended under M3 Expressive                                                                                                                    | M3-1, M3-2 |

## Sizes and density

| Size or density     | Dimensions                                                                                                                                                                                       | Content sizing                                                     | Target size                                                                                                                                                | Source |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Extra small (XS)    | Container height 32dp; leading/trailing space 12dp; icon–label space 8dp; outline width 1dp (outlined); round shape full; square shape corner 12dp; pressed-shape corner 8dp                     | Label: label-large type (Roboto Flex 500, 14sp/20sp); icon 20dp    | 48×48dp minimum stated for icon buttons at this size (M3-2 "Target areas"); not stated explicitly for label-bearing buttons at this size (see Source gaps) | M3-2   |
| Small (S) — default | Container height 40dp; leading/trailing space 16dp (24dp legacy, not recommended); icon–label space 8dp; outline width 1dp; round shape full; square shape corner 12dp; pressed-shape corner 8dp | Label: label-large type (Roboto Flex 500, 14sp/20sp); icon 20dp    | 48×48dp minimum stated for icon buttons at this size (M3-2 "Target areas"); not stated explicitly for label-bearing buttons at this size (see Source gaps) | M3-2   |
| Medium (M)          | Container height 56dp; leading/trailing space 24dp; icon–label space 8dp; outline width 1dp; round shape full; square shape corner 16dp; pressed-shape corner 12dp                               | Label: title-medium type (Roboto Flex 500, 16sp/24sp); icon 24dp   | Not specified by the inspected Material sources                                                                                                            | M3-2   |
| Large (L)           | Container height 96dp; leading/trailing space 48dp; icon–label space 12dp; outline width 2dp; round shape full; square shape corner 28dp; pressed-shape corner 16dp                              | Label: headline-small type (Roboto Flex 400, 24sp/32sp); icon 32dp | Not specified by the inspected Material sources                                                                                                            | M3-2   |
| Extra large (XL)    | Container height 136dp; leading/trailing space 64dp; icon–label space 16dp; outline width 3dp; round shape full; square shape corner 28dp; pressed-shape corner 16dp                             | Label: headline-large type (Roboto Flex 400, 32sp/40sp); icon 40dp | Not specified by the inspected Material sources                                                                                                            | M3-2   |

## Anatomy

| Part           | Required or optional | Design role                                                                                                                                                                                 | Source     |
| -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Container      | Required             | Holds the label text and optional icon; shape and color follow the selected shape/color configuration; for the text color style the container is only visually present on hover/focus/press | M3-2, M3-3 |
| Label text     | Required             | Describes the action a tap will perform; the most important element of the button                                                                                                           | M3-2, M3-3 |
| Icon (leading) | Optional             | Visually communicates the action and draws attention; placed before the label on the leading (reading-direction) edge                                                                       | M3-2, M3-3 |

## Content guidance

| Area                          | Requirement or recommendation                                                                                                                                                               | Strength                 | Source |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------ |
| Label length                  | Ideally 1–3 words                                                                                                                                                                           | Recommendation           | M3-3   |
| Label case                    | Sentence case: capitalize only the first word and proper nouns (e.g. "Book with Flights")                                                                                                   | Requirement              | M3-3   |
| Label wrapping/truncation     | Don't truncate or wrap; label text must remain fully visible on a single line                                                                                                               | Requirement (Don't)      | M3-3   |
| Icon placement                | Leading side, before the label text; mirrors to the trailing edge for right-to-left languages                                                                                               | Requirement              | M3-3   |
| Icon count                    | Don't use two icons in the same button                                                                                                                                                      | Requirement (Don't)      | M3-3   |
| Icon/label alignment          | Keep the icon and label horizontally grouped and centered; don't vertically stack them or anchor them to opposite edges                                                                     | Requirement (Don't)      | M3-3   |
| Toggle label changes          | If the label text changes between selected and unselected states, keep the character count a similar length between the two; don't change it dramatically                                   | Recommendation           | M3-3   |
| Outlined/text style placement | Use caution placing outlined or text buttons on visually prominent backgrounds (images, video) or next to visually similar elements (e.g. chips); consider a filled or tonal button instead | Recommendation (caution) | M3-3   |
| Container width               | Width dynamically fits the label text and shouldn't be set narrower than the label; width can be responsive but shouldn't be allowed to stretch into very long, sparsely filled buttons     | Requirement              | M3-3   |

## State model

### States

| State                            | Meaning                             | Visual change                                                                                                                                                                                                                                                         | Source     |
| -------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Enabled                          | Default interactive state           | Baseline container/label/icon colors per the selected color configuration                                                                                                                                                                                             | M3-2       |
| Disabled                         | Non-interactive                     | Container/label/icon rendered at on-surface with reduced opacity (container 0.1, label/icon 0.38 in the current token set); elevation drops to level0 for elevated/filled/tonal                                                                                       | M3-2       |
| Hovered                          | Pointer hover                       | State layer added at 0.08 opacity over the role color; elevated style's elevation increases (level1 → level2, 1dp → 3dp); filled/tonal gain a level1 (1dp) hover elevation                                                                                            | M3-2       |
| Focused                          | Keyboard or programmatic focus      | State layer added at 0.1 opacity over the role color                                                                                                                                                                                                                  | M3-2       |
| Pressed                          | Active pointer/keyboard press       | State layer added at 0.1 opacity over the role color; container corner radius morphs toward the size's pressed-shape value (both round and square buttons share this pressed shape)                                                                                   | M3-2       |
| Selected (Toggle variant only)   | Toggle button is in its "on" state  | Distinct selected container/label/icon color roles (e.g. filled: label/icon switch from on-surface-variant to on-primary, container switches to primary); resting shape swaps from round to square, or from square to round if the unselected resting shape is square | M3-1, M3-2 |
| Unselected (Toggle variant only) | Toggle button is in its "off" state | Uses the toggle-unselected color role mapping (distinct from both the default variant and the selected state); resting shape defaults to round                                                                                                                        | M3-2       |

### State combinations

| Combination                                 | Allowed                                         | Result                                                                    | Source |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Toggle unselected + hovered/focused/pressed | Allowed                                         | Interaction state layer is applied on top of the unselected color mapping | M3-2   |
| Toggle selected + hovered/focused/pressed   | Allowed                                         | Interaction state layer is applied on top of the selected color mapping   | M3-2   |
| Toggle variant + Text color style           | Not allowed                                     | "There is no toggle text button"                                          | M3-2   |
| Disabled + hovered/focused/pressed          | Not specified by the inspected Material sources | Not specified by the inspected Material sources                           | —      |

## Interaction behavior

| Input or condition               | Observable behavior                                                                                                                                                                                                                                                                                                 | Source     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Tab key                          | Moves keyboard focus to a button                                                                                                                                                                                                                                                                                    | M3-4       |
| Space or Enter                   | Activates the focused button                                                                                                                                                                                                                                                                                        | M3-4       |
| Pointer or keyboard press        | Enters the pressed state; container corner radius morphs toward the size's pressed-shape value; returns to the resting/hover shape on release                                                                                                                                                                       | M3-2       |
| Activating a Toggle button       | Switches the selected/unselected state; container shape swaps between round and square; color mapping switches to the corresponding selected/unselected roles; the associated icon should switch between an outlined glyph (unselected) and a filled glyph (selected), or increase weight if no filled glyph exists | M3-1, M3-3 |
| Rapid repeated clicks/taps (web) | A modified motion curve is applied to avoid resonant effects from overlapping animations                                                                                                                                                                                                                            | M3-4       |

## Visual specification

### Dimensions and layout

| Element                        | Token or value                                                                                           | Conditions                               | Source     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- |
| Container height               | 32dp (XS) / 40dp (S) / 56dp (M) / 96dp (L) / 136dp (XL)                                                  | Per size                                 | M3-2       |
| Leading/trailing padding       | 12dp (XS) / 16dp (S, recommended) or 24dp (S, legacy, not recommended) / 24dp (M) / 48dp (L) / 64dp (XL) | Per size                                 | M3-1, M3-2 |
| Icon–label spacing             | 8dp (XS, S, M) / 12dp (L) / 16dp (XL)                                                                    | Per size, when a leading icon is present | M3-2       |
| Outline width (Outlined style) | 1dp (XS, S, M) / 2dp (L) / 3dp (XL)                                                                      | Per size                                 | M3-2       |
| Container width                | Fits label text content; not fixed narrower than the label; can be responsive                            | —                                        | M3-3       |

### Color

| Column 1                          | 1. Default                                     | 2. Toggle unselected                           | 3. Toggle selected                   |
| --------------------------------- | ---------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| Elevated container / icon & label | Surface container low / Primary                | Surface container low / Primary                | Primary / On primary                 |
| Filled container / icon & label   | Primary / On primary                           | Surface container / On surface variant         | Primary / On primary                 |
| Tonal container / icon & label    | Secondary container / On secondary container   | Secondary container / On secondary container   | Secondary / On secondary             |
| Outlined container / icon & label | Outline variant (outline) / On surface variant | Outline variant (outline) / On surface variant | Inverse surface / Inverse on surface |
| Text icon & label                 | Primary                                        | — (no toggle text button)                      | — (no toggle text button)            |

Source: M3-2. Full per-state, per-role token mappings (enabled, disabled, hovered, focused, pressed, selected, unselected) are listed in [Material token inventory](#material-token-inventory).

### Typography

| Element            | Typescale role or value                       | Source |
| ------------------ | --------------------------------------------- | ------ |
| Label text (XS, S) | `label-large` — Roboto Flex 500, 14sp/20sp    | M3-2   |
| Label text (M)     | `title-medium` — Roboto Flex 500, 16sp/24sp   | M3-2   |
| Label text (L)     | `headline-small` — Roboto Flex 400, 24sp/32sp | M3-2   |
| Label text (XL)    | `headline-large` — Roboto Flex 400, 32sp/40sp | M3-2   |

### Shape and outline

| Variant or element             | State                                | Token or value                                                                                                                                 | Source     |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Round shape, any size          | Resting (unselected/default)         | `md.sys.shape.corner.full` (fully rounded)                                                                                                     | M3-2       |
| Square shape                   | Resting (unselected/default)         | 12dp (XS/S) / 16dp (M) / 28dp (L/XL), via `md.sys.shape.corner.medium`/`large`/`extra-large`                                                   | M3-2       |
| Round or square shape          | Pressed                              | 8dp (XS/S) / 12dp (M) / 16dp (L/XL), via `md.sys.shape.corner.small`/`medium`/`large`; both round and square buttons share this pressed radius | M3-2       |
| Toggle, resting round default  | Selected                             | Swaps to square (12dp XS/S, 16dp M, 28dp L/XL)                                                                                                 | M3-1, M3-2 |
| Toggle, resting square default | Selected                             | Swaps to round (`full`)                                                                                                                        | M3-1, M3-2 |
| Outlined style                 | Enabled/hover/focus/pressed/disabled | Outline width 1dp (XS/S/M), 2dp (L), 3dp (XL); disabled outline color `md.sys.color.outline-variant`                                           | M3-2       |

### Elevation

| Variant or element | State                                  | Token or value                                | Source |
| ------------------ | -------------------------------------- | --------------------------------------------- | ------ |
| Elevated           | Enabled                                | `md.sys.elevation.level1` (1dp)               | M3-2   |
| Elevated           | Hovered                                | `md.sys.elevation.level2` (3dp)               | M3-2   |
| Elevated           | Focused / Pressed                      | `md.sys.elevation.level1` (1dp)               | M3-2   |
| Elevated           | Disabled                               | `md.sys.elevation.level0`                     | M3-2   |
| Filled             | Enabled / Focused / Pressed / Disabled | `md.sys.elevation.level0`                     | M3-2   |
| Filled             | Hovered                                | `md.sys.elevation.level1` (1dp)               | M3-2   |
| Tonal              | Enabled / Focused / Pressed / Disabled | `md.sys.elevation.level0`                     | M3-2   |
| Tonal              | Hovered                                | `md.sys.elevation.level1` (1dp)               | M3-2   |
| Outlined, Text     | All states                             | No elevation tokens defined (flat, no shadow) | M3-2   |

### State layers and focus

| State                                         | Layer, indicator, or opacity                                                                                                                                                                    | Source |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Hovered                                       | State layer opacity `md.sys.state.hover.state-layer-opacity` (0.08), tinted with the variant's role color                                                                                       | M3-2   |
| Focused                                       | State layer opacity `md.sys.state.focus.state-layer-opacity` (0.1), tinted with the variant's role color                                                                                        | M3-2   |
| Pressed                                       | State layer opacity `md.sys.state.pressed.state-layer-opacity` (0.1), tinted with the variant's role color                                                                                      | M3-2   |
| Focus ring / indicator (current token family) | Not specified by the inspected Material sources — the current `md.comp.button.<color>.*` token family defines only state-layer color/opacity, not a separate focus-ring token (see Source gaps) | M3-2   |

### Icons

| Context      | Size, placement, or behavior                                                                                                                  | Source     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Leading icon | 20dp (XS, S) / 24dp (M) / 32dp (L) / 40dp (XL); placed on the leading edge before the label; color matches the label text color at each state | M3-2, M3-3 |
| Toggle icon  | Should use an outlined glyph when unselected and a filled glyph when selected; if no filled glyph exists, increase icon weight instead        | M3-3       |
| Icon count   | Exactly zero or one leading icon; never two icons in the same button                                                                          | M3-3       |

## Material token inventory

The following tables reproduce the current (non-deprecated) `md.comp.button.*` token sets exactly as published on the Buttons Specs page (M3-2), grouped by the same color and size token-set headings used by the source. The source also publishes five `[Deprecated]` legacy per-variant token tables (`md.comp.text-button.*`, `md.comp.filled-button.*`, `md.comp.outlined-button.*`, `md.comp.elevated-button.*`, `md.comp.filled-tonal-button.*`); these are superseded by the current family below and are not restated (see Source gaps).

### Button - Color - Filled

| Design role                                                             | Official component token                                   | Official system role or value            | Source |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- | ------ |
| Button filled hovered container elevation                               | md.comp.button.filled.hovered.container.elevation          | md.sys.elevation.level1                  | M3-2   |
| Button filled label color - toggle (selected)                           | md.comp.button.filled.selected.label-text.color            | md.sys.color.on-primary                  | M3-2   |
| Button filled label color - toggle (unselected)                         | md.comp.button.filled.unselected.label-text.color          | md.sys.color.on-surface-variant          | M3-2   |
| Button filled container color                                           | md.comp.button.filled.container.color                      | md.sys.color.primary                     | M3-2   |
| Button filled container color - toggle (unselected)                     | md.comp.button.filled.unselected.container.color           | md.sys.color.surface-container           | M3-2   |
| Button filled container color - toggle (selected)                       | md.comp.button.filled.selected.container.color             | md.sys.color.primary                     | M3-2   |
| Button filled shadow color                                              | md.comp.button.filled.container.shadow-color               | md.sys.color.shadow                      | M3-2   |
| Button filled elevation                                                 | md.comp.button.filled.container.elevation                  | md.sys.elevation.level0                  | M3-2   |
| Button filled label color                                               | md.comp.button.filled.label-text.color                     | md.sys.color.on-primary                  | M3-2   |
| Button filled icon color                                                | md.comp.button.filled.icon.color                           | md.sys.color.on-primary                  | M3-2   |
| Button filled icon color - toggle (unselected)                          | md.comp.button.filled.unselected.icon.color                | md.sys.color.on-surface-variant          | M3-2   |
| Button filled icon color - toggle (selected)                            | md.comp.button.filled.selected.icon.color                  | md.sys.color.on-primary                  | M3-2   |
| Button filled disabled container color                                  | md.comp.button.filled.disabled.container.color             | md.sys.color.on-surface                  | M3-2   |
| Button filled disabled container opacity                                | md.comp.button.filled.disabled.container.opacity           | 0.1                                      | M3-2   |
| Button filled disabled container elevation                              | md.comp.button.filled.disabled.container.elevation         | md.sys.elevation.level0                  | M3-2   |
| Button filled disabled label color                                      | md.comp.button.filled.disabled.label-text.color            | md.sys.color.on-surface                  | M3-2   |
| Button filled disabled label opacity                                    | md.comp.button.filled.disabled.label-text.opacity          | 0.38                                     | M3-2   |
| Button filled disabled icon color                                       | md.comp.button.filled.disabled.icon.color                  | md.sys.color.on-surface                  | M3-2   |
| Button filled disabled icon opacity                                     | md.comp.button.filled.disabled.icon.opacity                | 0.38                                     | M3-2   |
| Button filled hovered container state layer color                       | md.comp.button.filled.hovered.state-layer.color            | md.sys.color.on-primary                  | M3-2   |
| Button filled hovered container state layer color - toggle (unselected) | md.comp.button.filled.unselected.hovered.state-layer.color | md.sys.color.on-surface-variant          | M3-2   |
| Button filled hovered container state layer color - toggle (selected)   | md.comp.button.filled.selected.hovered.state-layer.color   | md.sys.color.on-primary                  | M3-2   |
| Button filled hovered container state layer opacity                     | md.comp.button.filled.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-2   |
| Button filled hovered label color                                       | md.comp.button.filled.hovered.label-text.color             | md.sys.color.on-primary                  | M3-2   |
| Button filled hovered label color - toggle (unselected)                 | md.comp.button.filled.unselected.hovered.label-text.color  | md.sys.color.on-surface-variant          | M3-2   |
| Button filled hovered label color - toggle (selected)                   | md.comp.button.filled.selected.hovered.label-text.color    | md.sys.color.on-primary                  | M3-2   |
| Button filled hovered icon color                                        | md.comp.button.filled.hovered.icon.color                   | md.sys.color.on-primary                  | M3-2   |
| Button filled hovered icon color - toggle (unselected)                  | md.comp.button.filled.unselected.hovered.icon.color        | md.sys.color.on-surface-variant          | M3-2   |
| Button filled hovered icon color - toggle (selected)                    | md.comp.button.filled.selected.hovered.icon.color          | md.sys.color.on-primary                  | M3-2   |
| Button filled focused container state layer color                       | md.comp.button.filled.focused.state-layer.color            | md.sys.color.on-primary                  | M3-2   |
| Button filled focused container state layer color - toggle (unselected) | md.comp.button.filled.unselected.focused.state-layer.color | md.sys.color.on-surface-variant          | M3-2   |
| Button filled focused container state layer color - toggle (selected)   | md.comp.button.filled.selected.focused.state-layer.color   | md.sys.color.on-primary                  | M3-2   |
| Button filled focused container state layer opacity                     | md.comp.button.filled.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-2   |
| Button filled focused container state layer elevation                   | md.comp.button.filled.focused.container.elevation          | md.sys.elevation.level0                  | M3-2   |
| Button filled focused label color                                       | md.comp.button.filled.focused.label-text.color             | md.sys.color.on-primary                  | M3-2   |
| Button filled focused label color - toggle (unselected)                 | md.comp.button.filled.unselected.focused.label-text.color  | md.sys.color.on-surface-variant          | M3-2   |
| Button filled focused label color - toggle (selected)                   | md.comp.button.filled.selected.focused.label-text.color    | md.sys.color.on-primary                  | M3-2   |
| Button filled focused icon color                                        | md.comp.button.filled.focused.icon.color                   | md.sys.color.on-primary                  | M3-2   |
| Button filled focused icon color - toggle (unselected)                  | md.comp.button.filled.unselected.focused.icon.color        | md.sys.color.on-surface-variant          | M3-2   |
| Button filled focused icon color - toggle (selected)                    | md.comp.button.filled.selected.focused.icon.color          | md.sys.color.on-primary                  | M3-2   |
| Button filled pressed container state layer color                       | md.comp.button.filled.pressed.state-layer.color            | md.sys.color.on-primary                  | M3-2   |
| Button filled pressed container state layer color - toggle (unselected) | md.comp.button.filled.unselected.pressed.state-layer.color | md.sys.color.on-surface-variant          | M3-2   |
| Button filled pressed container state layer color - toggle (selected)   | md.comp.button.filled.selected.pressed.state-layer.color   | md.sys.color.on-primary                  | M3-2   |
| Button filled pressed container state layer opacity                     | md.comp.button.filled.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-2   |
| Button filled pressed container state layer elevation                   | md.comp.button.filled.pressed.container.elevation          | md.sys.elevation.level0                  | M3-2   |
| Button filled pressed label color                                       | md.comp.button.filled.pressed.label-text.color             | md.sys.color.on-primary                  | M3-2   |
| Button filled pressed label color - toggle (unselected)                 | md.comp.button.filled.unselected.pressed.label-text.color  | md.sys.color.on-surface-variant          | M3-2   |
| Button filled pressed label color - toggle (selected)                   | md.comp.button.filled.selected.pressed.label-text.color    | md.sys.color.on-primary                  | M3-2   |
| Button filled pressed icon color                                        | md.comp.button.filled.pressed.icon.color                   | md.sys.color.on-primary                  | M3-2   |
| Button filled pressed icon color - toggle (unselected)                  | md.comp.button.filled.unselected.pressed.icon.color        | md.sys.color.on-surface-variant          | M3-2   |
| Button filled pressed icon color - toggle (selected)                    | md.comp.button.filled.selected.pressed.icon.color          | md.sys.color.on-primary                  | M3-2   |

### Button - Size - Xsmall

| Design role                                    | Official component token                                                    | Official system role or value               | Source |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| Button xsmall container height                 | md.comp.button.xsmall.container.height                                      | 32dp                                        | M3-2   |
| Button xsmall outline width                    | md.comp.button.xsmall.outlined.outline.width                                | 1dp                                         | M3-2   |
| Button xsmall icon size                        | md.comp.button.xsmall.icon.size                                             | 20dp                                        | M3-2   |
| Button xsmall label size                       | md.comp.button.xsmall.label-text                                            | md.sys.typescale.label-large                | M3-2   |
| Button xsmall shape round                      | md.comp.button.xsmall.container.shape.round                                 | md.sys.shape.corner.full                    | M3-2   |
| Button xsmall leading space                    | md.comp.button.xsmall.leading-space                                         | 12dp                                        | M3-2   |
| Button xsmall between icon label space         | md.comp.button.xsmall.icon-label-space                                      | 8dp                                         | M3-2   |
| Button xsmall trailing space                   | md.comp.button.xsmall.trailing-space                                        | 12dp                                        | M3-2   |
| Button xsmall shape square                     | md.comp.button.xsmall.container.shape.square                                | md.sys.shape.corner.medium                  | M3-2   |
| Button xsmall shape pressed morph              | md.comp.button.xsmall.pressed.container.shape                               | md.sys.shape.corner.small                   | M3-2   |
| Button xsmall shape spring animation damping   | md.comp.button.xsmall.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-2   |
| Button xsmall selected container shape square  | md.comp.button.xsmall.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-2   |
| Button xsmall selected container shape round   | md.comp.button.xsmall.selected.container.shape.round                        | md.sys.shape.corner.medium                  | M3-2   |
| Button xsmall shape spring animation stiffness | md.comp.button.xsmall.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-2   |

### Button - Size - Small

| Design role                                   | Official component token                                                   | Official system role or value               | Source |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| Button small container height                 | md.comp.button.small.container.height                                      | 40dp                                        | M3-2   |
| Button small outline width                    | md.comp.button.small.outlined.outline.width                                | 1dp                                         | M3-2   |
| Button small label size                       | md.comp.button.small.label-text                                            | md.sys.typescale.label-large                | M3-2   |
| Button small icon size                        | md.comp.button.small.icon.size                                             | 20dp                                        | M3-2   |
| Button small shape round                      | md.comp.button.small.container.shape.round                                 | md.sys.shape.corner.full                    | M3-2   |
| Button small leading space                    | md.comp.button.small.leading-space                                         | 16dp                                        | M3-2   |
| Button small between icon label space         | md.comp.button.small.icon-label-space                                      | 8dp                                         | M3-2   |
| Button small trailing space                   | md.comp.button.small.trailing-space                                        | 16dp                                        | M3-2   |
| Button small shape square                     | md.comp.button.small.container.shape.square                                | md.sys.shape.corner.medium                  | M3-2   |
| Button small shape pressed morph              | md.comp.button.small.pressed.container.shape                               | md.sys.shape.corner.small                   | M3-2   |
| Button small shape spring animation damping   | md.comp.button.small.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-2   |
| Button small shape spring animation stiffness | md.comp.button.small.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-2   |
| Button small selected container shape round   | md.comp.button.small.selected.container.shape.round                        | md.sys.shape.corner.medium                  | M3-2   |
| Button small selected container shape square  | md.comp.button.small.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-2   |

### Button - Size - Medium

| Design role                                    | Official component token                                                    | Official system role or value               | Source |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| Button medium container height                 | md.comp.button.medium.container.height                                      | 56dp                                        | M3-2   |
| Button medium outline width                    | md.comp.button.medium.outlined.outline.width                                | 1dp                                         | M3-2   |
| Button medium label size                       | md.comp.button.medium.label-text                                            | md.sys.typescale.title-medium               | M3-2   |
| Button medium icon size                        | md.comp.button.medium.icon.size                                             | 24dp                                        | M3-2   |
| Button medium shape round                      | md.comp.button.medium.container.shape.round                                 | md.sys.shape.corner.full                    | M3-2   |
| Button medium leading space                    | md.comp.button.medium.leading-space                                         | 24dp                                        | M3-2   |
| Button medium between icon label space         | md.comp.button.medium.icon-label-space                                      | 8dp                                         | M3-2   |
| Button medium trailing space                   | md.comp.button.medium.trailing-space                                        | 24dp                                        | M3-2   |
| Button medium shape square                     | md.comp.button.medium.container.shape.square                                | md.sys.shape.corner.large                   | M3-2   |
| Button medium shape pressed morph              | md.comp.button.medium.pressed.container.shape                               | md.sys.shape.corner.medium                  | M3-2   |
| Button medium shape spring animation damping   | md.comp.button.medium.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-2   |
| Button medium shape spring animation stiffness | md.comp.button.medium.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-2   |
| Button medium selected container shape round   | md.comp.button.medium.selected.container.shape.round                        | md.sys.shape.corner.large                   | M3-2   |
| Button medium selected container shape square  | md.comp.button.medium.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-2   |

### Button - Size - Large

| Design role                                   | Official component token                                                   | Official system role or value               | Source |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| Button large container height                 | md.comp.button.large.container.height                                      | 96dp                                        | M3-2   |
| Button large outline width                    | md.comp.button.large.outlined.outline.width                                | 2dp                                         | M3-2   |
| Button large label size                       | md.comp.button.large.label-text                                            | md.sys.typescale.headline-small             | M3-2   |
| Button large icon size                        | md.comp.button.large.icon.size                                             | 32dp                                        | M3-2   |
| Button large shape round                      | md.comp.button.large.container.shape.round                                 | md.sys.shape.corner.full                    | M3-2   |
| Button large leading space                    | md.comp.button.large.leading-space                                         | 48dp                                        | M3-2   |
| Button large between icon label space         | md.comp.button.large.icon-label-space                                      | 12dp                                        | M3-2   |
| Button large trailing space                   | md.comp.button.large.trailing-space                                        | 48dp                                        | M3-2   |
| Button large shape square                     | md.comp.button.large.container.shape.square                                | md.sys.shape.corner.extra-large             | M3-2   |
| Button large shape pressed morph              | md.comp.button.large.pressed.container.shape                               | md.sys.shape.corner.large                   | M3-2   |
| Button large shape spring animation damping   | md.comp.button.large.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-2   |
| Button large shape spring animation stiffness | md.comp.button.large.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-2   |
| Button large selected container shape round   | md.comp.button.large.selected.container.shape.round                        | md.sys.shape.corner.extra-large             | M3-2   |
| Button large selected container shape square  | md.comp.button.large.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-2   |

### Button - Size - Xlarge

| Design role                                    | Official component token                                                    | Official system role or value               | Source |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| Button xlarge container height                 | md.comp.button.xlarge.container.height                                      | 136dp                                       | M3-2   |
| Button xlarge outline width                    | md.comp.button.xlarge.outlined.outline.width                                | 3dp                                         | M3-2   |
| Button xlarge label size                       | md.comp.button.xlarge.label-text                                            | md.sys.typescale.headline-large             | M3-2   |
| Button xlarge icon size                        | md.comp.button.xlarge.icon.size                                             | 40dp                                        | M3-2   |
| Button xlarge shape round                      | md.comp.button.xlarge.container.shape.round                                 | md.sys.shape.corner.full                    | M3-2   |
| Button xlarge leading space                    | md.comp.button.xlarge.leading-space                                         | 64dp                                        | M3-2   |
| Button xlarge between icon label space         | md.comp.button.xlarge.icon-label-space                                      | 16dp                                        | M3-2   |
| Button xlarge trailing space                   | md.comp.button.xlarge.trailing-space                                        | 64dp                                        | M3-2   |
| Button xlarge shape square                     | md.comp.button.xlarge.container.shape.square                                | md.sys.shape.corner.extra-large             | M3-2   |
| Button xlarge shape pressed morph              | md.comp.button.xlarge.pressed.container.shape                               | md.sys.shape.corner.large                   | M3-2   |
| Button xlarge shape spring animation damping   | md.comp.button.xlarge.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-2   |
| Button xlarge shape spring animation stiffness | md.comp.button.xlarge.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-2   |
| Button xlarge selected container shape round   | md.comp.button.xlarge.selected.container.shape.round                        | md.sys.shape.corner.extra-large             | M3-2   |
| Button xlarge selected container shape square  | md.comp.button.xlarge.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-2   |

### Button - Color - Elevated

| Design role                                                               | Official component token                                     | Official system role or value            | Source |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------ |
| Button elevated hovered container elevation                               | md.comp.button.elevated.hovered.container.elevation          | md.sys.elevation.level2                  | M3-2   |
| Button elevated label color - toggle (selected)                           | md.comp.button.elevated.selected.label-text.color            | md.sys.color.on-primary                  | M3-2   |
| Button elevated label color - toggle (unselected)                         | md.comp.button.elevated.unselected.label-text.color          | md.sys.color.primary                     | M3-2   |
| Button elevated shadow color                                              | md.comp.button.elevated.container.shadow-color               | md.sys.color.shadow                      | M3-2   |
| Button elevated container color                                           | md.comp.button.elevated.container.color                      | md.sys.color.surface-container-low       | M3-2   |
| Button elevated container color - toggle (unselected)                     | md.comp.button.elevated.unselected.container.color           | md.sys.color.surface-container-low       | M3-2   |
| Button elevated container color - toggle (selected)                       | md.comp.button.elevated.selected.container.color             | md.sys.color.primary                     | M3-2   |
| Button elevated elevation                                                 | md.comp.button.elevated.container.elevation                  | md.sys.elevation.level1                  | M3-2   |
| Button elevated label color                                               | md.comp.button.elevated.label-text.color                     | md.sys.color.primary                     | M3-2   |
| Button elevated icon color                                                | md.comp.button.elevated.icon.color                           | md.sys.color.primary                     | M3-2   |
| Button elevated icon color - toggle (unselected)                          | md.comp.button.elevated.unselected.icon.color                | md.sys.color.primary                     | M3-2   |
| Button elevated icon color - toggle (selected)                            | md.comp.button.elevated.selected.icon.color                  | md.sys.color.on-primary                  | M3-2   |
| Button elevated disabled container color                                  | md.comp.button.elevated.disabled.container.color             | md.sys.color.on-surface                  | M3-2   |
| Button elevated disabled container opacity                                | md.comp.button.elevated.disabled.container.opacity           | 0.1                                      | M3-2   |
| Button elevated disabled container elevation                              | md.comp.button.elevated.disabled.container.elevation         | md.sys.elevation.level0                  | M3-2   |
| Button elevated disabled label color                                      | md.comp.button.elevated.disabled.label-text.color            | md.sys.color.on-surface                  | M3-2   |
| Button elevated disabled label opacity                                    | md.comp.button.elevated.disabled.label-text.opacity          | 0.38                                     | M3-2   |
| Button elevated disabled icon color                                       | md.comp.button.elevated.disabled.icon.color                  | md.sys.color.on-surface                  | M3-2   |
| Button elevated disabled icon opacity                                     | md.comp.button.elevated.disabled.icon.opacity                | 0.38                                     | M3-2   |
| Button elevated hovered container state layer color                       | md.comp.button.elevated.hovered.state-layer.color            | md.sys.color.primary                     | M3-2   |
| Button elevated hovered container state layer color - toggle (unselected) | md.comp.button.elevated.unselected.hovered.state-layer.color | md.sys.color.primary                     | M3-2   |
| Button elevated hovered container state layer color - toggle (selected)   | md.comp.button.elevated.selected.hovered.state-layer.color   | md.sys.color.on-primary                  | M3-2   |
| Button elevated hovered container state layer opacity                     | md.comp.button.elevated.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-2   |
| Button elevated hovered label color                                       | md.comp.button.elevated.hovered.label-text.color             | md.sys.color.primary                     | M3-2   |
| Button elevated hovered label color - toggle (unselected)                 | md.comp.button.elevated.unselected.hovered.label-text.color  | md.sys.color.primary                     | M3-2   |
| Button elevated hovered label color - toggle (selected)                   | md.comp.button.elevated.selected.hovered.label-text.color    | md.sys.color.on-primary                  | M3-2   |
| Button elevated hovered icon color                                        | md.comp.button.elevated.hovered.icon.color                   | md.sys.color.primary                     | M3-2   |
| Button elevated hovered icon color - toggle (unselected)                  | md.comp.button.elevated.unselected.hovered.icon.color        | md.sys.color.primary                     | M3-2   |
| Button elevated hovered icon color - toggle (selected)                    | md.comp.button.elevated.selected.hovered.icon.color          | md.sys.color.on-primary                  | M3-2   |
| Button elevated pressed container state layer color                       | md.comp.button.elevated.pressed.state-layer.color            | md.sys.color.primary                     | M3-2   |
| Button elevated pressed container state layer color - toggle (unselected) | md.comp.button.elevated.unselected.pressed.state-layer.color | md.sys.color.primary                     | M3-2   |
| Button elevated pressed container state layer color - toggle (selected)   | md.comp.button.elevated.selected.pressed.state-layer.color   | md.sys.color.on-primary                  | M3-2   |
| Button elevated pressed container state layer opacity                     | md.comp.button.elevated.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-2   |
| Button elevated pressed container state layer elevation                   | md.comp.button.elevated.pressed.container.elevation          | md.sys.elevation.level1                  | M3-2   |
| Button elevated pressed label color                                       | md.comp.button.elevated.pressed.label-text.color             | md.sys.color.primary                     | M3-2   |
| Button elevated pressed label color - toggle (unselected)                 | md.comp.button.elevated.unselected.pressed.label-text.color  | md.sys.color.primary                     | M3-2   |
| Button elevated pressed label color - toggle (selected)                   | md.comp.button.elevated.selected.pressed.label-text.color    | md.sys.color.on-primary                  | M3-2   |
| Button elevated pressed icon color                                        | md.comp.button.elevated.pressed.icon.color                   | md.sys.color.primary                     | M3-2   |
| Button elevated pressed icon color - toggle (unselected)                  | md.comp.button.elevated.unselected.pressed.icon.color        | md.sys.color.primary                     | M3-2   |
| Button elevated pressed icon color - toggle (selected)                    | md.comp.button.elevated.selected.pressed.icon.color          | md.sys.color.on-primary                  | M3-2   |
| Button elevated focused container state layer color                       | md.comp.button.elevated.focused.state-layer.color            | md.sys.color.primary                     | M3-2   |
| Button elevated focused container state layer color - toggle (unselected) | md.comp.button.elevated.unselected.focused.state-layer.color | md.sys.color.primary                     | M3-2   |
| Button elevated focused container state layer color - toggle (selected)   | md.comp.button.elevated.selected.focused.state-layer.color   | md.sys.color.on-primary                  | M3-2   |
| Button elevated focused container state layer opacity                     | md.comp.button.elevated.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-2   |
| Button elevated focused container state layer elevation                   | md.comp.button.elevated.focused.container.elevation          | md.sys.elevation.level1                  | M3-2   |
| Button elevated focused label color                                       | md.comp.button.elevated.focused.label-text.color             | md.sys.color.primary                     | M3-2   |
| Button elevated focused label color - toggle (unselected)                 | md.comp.button.elevated.unselected.focused.label-text.color  | md.sys.color.primary                     | M3-2   |
| Button elevated focused label color - toggle (selected)                   | md.comp.button.elevated.selected.focused.label-text.color    | md.sys.color.on-primary                  | M3-2   |
| Button elevated focused icon color                                        | md.comp.button.elevated.focused.icon.color                   | md.sys.color.primary                     | M3-2   |
| Button elevated focused icon color - toggle (unselected)                  | md.comp.button.elevated.unselected.focused.icon.color        | md.sys.color.primary                     | M3-2   |
| Button elevated focused icon color - toggle (selected)                    | md.comp.button.elevated.selected.focused.icon.color          | md.sys.color.on-primary                  | M3-2   |

### Button - Color - Text

| Design role                             | Official component token                        | Official system role or value            | Source |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------- | ------ |
| Button text label color                 | md.comp.button.text.label-text.color            | md.sys.color.primary                     | M3-2   |
| Button text icon color                  | md.comp.button.text.icon.color                  | md.sys.color.primary                     | M3-2   |
| Button text hovered state layer color   | md.comp.button.text.hovered.state-layer.color   | md.sys.color.primary                     | M3-2   |
| Button text hovered state layer opacity | md.comp.button.text.hovered.state-layer.opacity | md.sys.state.hover.state-layer-opacity   | M3-2   |
| Button text hovered label color         | md.comp.button.text.hovered.label-text.color    | md.sys.color.primary                     | M3-2   |
| Button text hovered icon color          | md.comp.button.text.hovered.icon.color          | md.sys.color.primary                     | M3-2   |
| Button text focused state layer color   | md.comp.button.text.focused.state-layer.color   | md.sys.color.primary                     | M3-2   |
| Button text focused state layer opacity | md.comp.button.text.focused.state-layer.opacity | md.sys.state.focus.state-layer-opacity   | M3-2   |
| Button text focused label color         | md.comp.button.text.focused.label-text.color    | md.sys.color.primary                     | M3-2   |
| Button text focused icon color          | md.comp.button.text.focused.icon.color          | md.sys.color.primary                     | M3-2   |
| Button text pressed state layer color   | md.comp.button.text.pressed.state-layer.color   | md.sys.color.primary                     | M3-2   |
| Button text pressed state layer opacity | md.comp.button.text.pressed.state-layer.opacity | md.sys.state.pressed.state-layer-opacity | M3-2   |
| Button text pressed label color         | md.comp.button.text.pressed.label-text.color    | md.sys.color.primary                     | M3-2   |
| Button text pressed icon color          | md.comp.button.text.pressed.icon.color          | md.sys.color.primary                     | M3-2   |
| Button text disabled label color        | md.comp.button.text.disabled.label-text.color   | md.sys.color.on-surface                  | M3-2   |
| Button text disabled label opacity      | md.comp.button.text.disabled.label-text.opacity | 0.38                                     | M3-2   |
| Button text disabled icon color         | md.comp.button.text.disabled.icon.color         | md.sys.color.on-surface                  | M3-2   |
| Button text disabled icon opacity       | md.comp.button.text.disabled.icon.opacity       | 0.38                                     | M3-2   |
| Button text disabled container color    | md.comp.button.text.disabled.container.color    | md.sys.color.on-surface                  | M3-2   |
| Button text disabled container opacity  | md.comp.button.text.disabled.container.opacity  | 0.1                                      | M3-2   |

### Button - Color - Outlined

| Design role                                                               | Official component token                                     | Official system role or value            | Source |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------ |
| Button outlined outline color                                             | md.comp.button.outlined.outline.color                        | md.sys.color.outline-variant             | M3-2   |
| Button outlined container color - toggle (selected)                       | md.comp.button.outlined.selected.container.color             | md.sys.color.inverse-surface             | M3-2   |
| Button outlined label color                                               | md.comp.button.outlined.label-text.color                     | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined label color - toggle (unselected)                         | md.comp.button.outlined.unselected.label-text.color          | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined label color - toggle (selected)                           | md.comp.button.outlined.selected.label-text.color            | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined icon color                                                | md.comp.button.outlined.icon.color                           | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined icon color - toggle (unselected)                          | md.comp.button.outlined.unselected.icon.color                | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined icon color - toggle (selected)                            | md.comp.button.outlined.selected.icon.color                  | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined disabled outline color                                    | md.comp.button.outlined.disabled.outline.color               | md.sys.color.outline-variant             | M3-2   |
| Button outlined hovered state layer color                                 | md.comp.button.outlined.hovered.state-layer.color            | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined hovered state layer color - toggle (unselected)           | md.comp.button.outlined.unselected.hovered.state-layer.color | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined hovered state layer color - toggle (selected)             | md.comp.button.outlined.selected.hovered.state-layer.color   | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined hovered state layer opacity                               | md.comp.button.outlined.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-2   |
| Button outlined hovered outline color                                     | md.comp.button.outlined.hovered.outline.color                | md.sys.color.outline-variant             | M3-2   |
| Button outlined hovered outline color - toggle (unselected)               | md.comp.button.outlined.unselected.hovered.outline.color     | md.sys.color.outline-variant             | M3-2   |
| Button outlined hovered label color                                       | md.comp.button.outlined.hovered.label-text.color             | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined hovered label color - toggle (unselected)                 | md.comp.button.outlined.unselected.hovered.label-text.color  | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined hovered label color - toggle (selected)                   | md.comp.button.outlined.selected.hovered.label-text.color    | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined hovered icon color                                        | md.comp.button.outlined.hovered.icon.color                   | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined hovered icon color - toggle (unselected)                  | md.comp.button.outlined.unselected.hovered.icon.color        | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined hovered icon color - toggle (selected)                    | md.comp.button.outlined.selected.hovered.icon.color          | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined focused container state layer color                       | md.comp.button.outlined.focused.state-layer.color            | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined focused container state layer color - toggle (unselected) | md.comp.button.outlined.unselected.focused.state-layer.color | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined focused container state layer color - toggle (selected)   | md.comp.button.outlined.selected.focused.state-layer.color   | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined focused container state layer opacity                     | md.comp.button.outlined.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-2   |
| Button outlined focused outline color                                     | md.comp.button.outlined.focused.outline.color                | md.sys.color.outline-variant             | M3-2   |
| Button outlined focused outline color - toggle (unselected)               | md.comp.button.outlined.unselected.focused.outline.color     | md.sys.color.outline-variant             | M3-2   |
| Button outlined focused label color                                       | md.comp.button.outlined.focused.label-text.color             | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined focused label color - toggle (unselected)                 | md.comp.button.outlined.unselected.focused.label-text.color  | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined focused label color - toggle (selected)                   | md.comp.button.outlined.selected.focused.label-text.color    | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined focused icon color                                        | md.comp.button.outlined.focused.icon.color                   | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined focused icon color - toggle (unselected)                  | md.comp.button.outlined.unselected.focused.icon.color        | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined focused icon color - toggle (selected)                    | md.comp.button.outlined.selected.focused.icon.color          | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined pressed container state layer color                       | md.comp.button.outlined.pressed.state-layer.color            | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined pressed container state layer color - toggle (unselected) | md.comp.button.outlined.unselected.pressed.state-layer.color | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined pressed container state layer color - toggle (selected)   | md.comp.button.outlined.selected.pressed.state-layer.color   | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined pressed container state layer opacity                     | md.comp.button.outlined.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-2   |
| Button outlined pressed outline color                                     | md.comp.button.outlined.pressed.outline.color                | md.sys.color.outline-variant             | M3-2   |
| Button outlined pressed outline color - toggle (unselected)               | md.comp.button.outlined.unselected.pressed.outline.color     | md.sys.color.outline-variant             | M3-2   |
| Button outlined pressed label color                                       | md.comp.button.outlined.pressed.label-text.color             | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined pressed label color - toggle (unselected)                 | md.comp.button.outlined.unselected.pressed.label-text.color  | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined pressed label color - toggle (selected)                   | md.comp.button.outlined.selected.pressed.label-text.color    | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined pressed icon color                                        | md.comp.button.outlined.pressed.icon.color                   | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined pressed icon color - toggle (unselected)                  | md.comp.button.outlined.unselected.pressed.icon.color        | md.sys.color.on-surface-variant          | M3-2   |
| Button outlined pressed icon color - toggle (selected)                    | md.comp.button.outlined.selected.pressed.icon.color          | md.sys.color.inverse-on-surface          | M3-2   |
| Button outlined disabled icon opacity                                     | md.comp.button.outlined.disabled.icon.opacity                | 0.38                                     | M3-2   |
| Button outlined disabled container opacity                                | md.comp.button.outlined.disabled.container.opacity           | 0.1                                      | M3-2   |
| Button outlined disabled label opacity                                    | md.comp.button.outlined.disabled.label-text.opacity          | 0.38                                     | M3-2   |
| Button outlined disabled icon color                                       | md.comp.button.outlined.disabled.icon.color                  | md.sys.color.on-surface                  | M3-2   |
| Button outlined disabled label color                                      | md.comp.button.outlined.disabled.label-text.color            | md.sys.color.on-surface                  | M3-2   |
| Button outlined disabled outline color (unselected)                       | md.comp.button.outlined.unselected.disabled.outline.color    | md.sys.color.outline-variant             | M3-2   |
| Button outlined disabled container color (selected)                       | md.comp.button.outlined.selected.disabled.container.color    | md.sys.color.on-surface                  | M3-2   |

### Button - Color - Tonal

| Design role                                                            | Official component token                                  | Official system role or value            | Source |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- | ------ |
| Button tonal hovered container elevation                               | md.comp.button.tonal.hovered.container.elevation          | md.sys.elevation.level1                  | M3-2   |
| Button tonal container color                                           | md.comp.button.tonal.container.color                      | md.sys.color.secondary-container         | M3-2   |
| Button tonal container color - toggle (unselected)                     | md.comp.button.tonal.unselected.container.color           | md.sys.color.secondary-container         | M3-2   |
| Button tonal container color - toggle (selected)                       | md.comp.button.tonal.selected.container.color             | md.sys.color.secondary                   | M3-2   |
| Button tonal shadow color                                              | md.comp.button.tonal.container.shadow-color               | md.sys.color.shadow                      | M3-2   |
| Button tonal elevation                                                 | md.comp.button.tonal.container.elevation                  | md.sys.elevation.level0                  | M3-2   |
| Button tonal label color                                               | md.comp.button.tonal.label-text.color                     | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal label color - toggle (unselected)                         | md.comp.button.tonal.unselected.label-text.color          | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal label color - toggle (selected)                           | md.comp.button.tonal.selected.label-text.color            | md.sys.color.on-secondary                | M3-2   |
| Button tonal icon color                                                | md.comp.button.tonal.icon.color                           | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal icon color - toggle (unselected)                          | md.comp.button.tonal.unselected.icon.color                | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal icon color - toggle (selected)                            | md.comp.button.tonal.selected.icon.color                  | md.sys.color.on-secondary                | M3-2   |
| Button tonal disabled container color                                  | md.comp.button.tonal.disabled.container.color             | md.sys.color.on-surface                  | M3-2   |
| Button tonal disabled container opacity                                | md.comp.button.tonal.disabled.container.opacity           | 0.1                                      | M3-2   |
| Button tonal disabled container elevation                              | md.comp.button.tonal.disabled.container.elevation         | md.sys.elevation.level0                  | M3-2   |
| Button tonal disabled label color                                      | md.comp.button.tonal.disabled.label-text.color            | md.sys.color.on-surface                  | M3-2   |
| Button tonal disabled icon color                                       | md.comp.button.tonal.disabled.icon.color                  | md.sys.color.on-surface                  | M3-2   |
| Button tonal disabled icon opacity                                     | md.comp.button.tonal.disabled.icon.opacity                | 0.38                                     | M3-2   |
| Button tonal disabled label opacity                                    | md.comp.button.tonal.disabled.label-text.opacity          | 0.38                                     | M3-2   |
| Button tonal hovered container state layer color                       | md.comp.button.tonal.hovered.state-layer.color            | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal hovered container state layer color - toggle (unselected) | md.comp.button.tonal.unselected.hovered.state-layer.color | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal hovered container state layer color - toggle (selected)   | md.comp.button.tonal.selected.hovered.state-layer.color   | md.sys.color.on-secondary                | M3-2   |
| Button tonal hovered container state layer opacity                     | md.comp.button.tonal.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-2   |
| Button tonal hovered label color                                       | md.comp.button.tonal.hovered.label-text.color             | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal hovered label color - toggle (unselected)                 | md.comp.button.tonal.unselected.hovered.label-text.color  | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal hovered label color - toggle (selected)                   | md.comp.button.tonal.selected.hovered.label-text.color    | md.sys.color.on-secondary                | M3-2   |
| Button tonal hovered icon color                                        | md.comp.button.tonal.hovered.icon.color                   | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal hovered icon color - toggle (unselected)                  | md.comp.button.tonal.unselected.hovered.icon.color        | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal hovered icon color - toggle (selected)                    | md.comp.button.tonal.selected.hovered.icon.color          | md.sys.color.on-secondary                | M3-2   |
| Button tonal focused container state layer color                       | md.comp.button.tonal.focused.state-layer.color            | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal focused container state layer color - toggle (unselected) | md.comp.button.tonal.unselected.focused.state-layer.color | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal focused container state layer color - toggle (selected)   | md.comp.button.tonal.selected.focused.state-layer.color   | md.sys.color.on-secondary                | M3-2   |
| Button tonal focused container state layer opacity                     | md.comp.button.tonal.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-2   |
| Button tonal focused container state layer elevation                   | md.comp.button.tonal.focused.container.elevation          | md.sys.elevation.level0                  | M3-2   |
| Button tonal focused label color                                       | md.comp.button.tonal.focused.label-text.color             | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal focused label color - toggle (unselected)                 | md.comp.button.tonal.unselected.focused.label-text.color  | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal focused label color - toggle (selected)                   | md.comp.button.tonal.selected.focused.label-text.color    | md.sys.color.on-secondary                | M3-2   |
| Button tonal focused icon color                                        | md.comp.button.tonal.focused.icon.color                   | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal focused icon color - toggle (unselected)                  | md.comp.button.tonal.unselected.focused.icon.color        | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal focused icon color - toggle (selected)                    | md.comp.button.tonal.selected.focused.icon.color          | md.sys.color.on-secondary                | M3-2   |
| Button tonal pressed container state layer color                       | md.comp.button.tonal.pressed.state-layer.color            | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal pressed container state layer color - toggle (unselected) | md.comp.button.tonal.unselected.pressed.state-layer.color | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal pressed container state layer color - toggle (selected)   | md.comp.button.tonal.selected.pressed.state-layer.color   | md.sys.color.on-secondary                | M3-2   |
| Button tonal pressed container state layer opacity                     | md.comp.button.tonal.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-2   |
| Button tonal pressed container state layer elevation                   | md.comp.button.tonal.pressed.container.elevation          | md.sys.elevation.level0                  | M3-2   |
| Button tonal pressed label color                                       | md.comp.button.tonal.pressed.label-text.color             | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal pressed label color - toggle (unselected)                 | md.comp.button.tonal.unselected.pressed.label-text.color  | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal pressed label color - toggle (selected)                   | md.comp.button.tonal.selected.pressed.label-text.color    | md.sys.color.on-secondary                | M3-2   |
| Button tonal pressed icon color                                        | md.comp.button.tonal.pressed.icon.color                   | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal pressed icon color - toggle (unselected)                  | md.comp.button.tonal.unselected.pressed.icon.color        | md.sys.color.on-secondary-container      | M3-2   |
| Button tonal pressed icon color - toggle (selected)                    | md.comp.button.tonal.selected.pressed.icon.color          | md.sys.color.on-secondary                | M3-2   |

## Motion

| Transition                  | Trigger                                                  | From                                                     | To                                                           | Duration                                                                                                                                                                                                                                                      | Easing                                          | Source     |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------- |
| Press shape morph           | Pointer or keyboard press (pressed state entered/exited) | Resting corner radius (round `full`, or square per size) | Pressed corner radius per size (8dp XS/S, 12dp M, 16dp L/XL) | Spring motion (not duration/easing): damping `md.sys.motion.spring.fast.spatial.damping` = 0.6, stiffness `md.sys.motion.spring.fast.spatial.stiffness` = 800, tokenized per size (e.g. `md.comp.button.small.pressed.container.corner-size.motion.spring.*`) | M3-2                                            |
| Toggle selection shape swap | Toggle button selected/unselected change                 | Resting shape before the change (round or square)        | Opposite resting shape (square or round)                     | Not specified by the inspected Material sources beyond the press-morph spring tokens above (see Source gaps)                                                                                                                                                  | Not specified by the inspected Material sources | M3-1, M3-2 |
| Rapid-click smoothing (web) | Multiple rapid clicks/taps in succession                 | —                                                        | —                                                            | Not specified by the inspected Material sources (described only as "a modified motion curve")                                                                                                                                                                 | Not specified by the inspected Material sources | M3-4       |

### Interruption and reduced motion

Not specified by the inspected Material sources. No interruption-handling or reduced-motion guidance for button shape-morph or rapid-click motion is stated on the inspected Overview, Specs, Guidelines, or Accessibility pages.

## Accessibility

| Area                           | Published Material requirement                                                                                                                                                                                                 | Source |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Assistive technology use cases | People must be able to use a button to perform an action, and to navigate to and activate a button, with assistive technology                                                                                                  | M3-4   |
| Color contrast                 | Enabled buttons need a 3:1 contrast ratio with the background; measured from the container for elevated, filled, and tonal styles, and from the label text for outlined and text styles                                        | M3-4   |
| 200% text size                 | Button labels should be kept concise enough to fit within two lines after text size is increased to 200% (Android); if a label is truncated beyond this, provide an alternative way to access the full content in a single tap | M3-4   |
| Rapid-click motion             | On the web, use a modified motion curve to avoid resonant effects from overlapping animations when rapid clicks/taps are expected                                                                                              | M3-4   |
| Keyboard navigation            | Tab moves focus to a button; Space or Enter activates it                                                                                                                                                                       | M3-4   |
| Accessible label               | The accessibility label should match the visible label text (e.g. "Done", "Send", "Reply"); it can contain extra contextual information if necessary                                                                           | M3-4   |

## Directionality and adaptation

| Condition                  | Required behavior                                                                                                                                        | Source |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Right-to-left languages    | Leading icon placement mirrors to the trailing edge (right of the label in LTR becomes left of the label in RTL)                                         | M3-3   |
| Compact window             | Buttons may be end-aligned below related content                                                                                                         | M3-3   |
| Large/expanded window      | Buttons may be start-aligned beside related content instead of below it                                                                                  | M3-3   |
| Any width change           | Icon and label stay grouped and centered as button width changes; don't anchor icon and label to opposite edges                                          | M3-3   |
| Any width change           | Container width should not be allowed to stretch into very long, sparsely filled buttons; constrain width or place buttons beside other elements instead | M3-3   |
| Screens of different sizes | Item order, including button order, must remain consistent between large and small screens for screen reader and keyboard navigation                     | M3-3   |

## Canonical conformance matrix

| ID    | Member         | Variant | Size        | Configuration                    | State              | Scheme or direction          | Requirements covered                                                     |
| ----- | -------------- | ------- | ----------- | -------------------------------- | ------------------ | ---------------------------- | ------------------------------------------------------------------------ |
| CB-01 | Common buttons | Default | Small       | Filled, round                    | Enabled            | Light, LTR                   | Baseline anatomy, color mapping, typography, dimensions                  |
| CB-02 | Common buttons | Default | Small       | Filled, round                    | Disabled           | Light, LTR                   | Disabled opacity/elevation tokens                                        |
| CB-03 | Common buttons | Default | Small       | Filled, round                    | Hovered            | Light, LTR                   | Hover state layer opacity, filled hover elevation                        |
| CB-04 | Common buttons | Default | Small       | Filled, round                    | Focused            | Light, LTR                   | Focus state layer opacity, keyboard interaction                          |
| CB-05 | Common buttons | Default | Small       | Filled, round                    | Pressed            | Light, LTR                   | Pressed state layer opacity, press shape morph                           |
| CB-06 | Common buttons | Default | Medium      | Elevated, round                  | Enabled            | Dark, LTR                    | Elevated shadow/elevation tokens, dark scheme, medium size typography    |
| CB-07 | Common buttons | Default | Large       | Tonal, square                    | Enabled            | Light, LTR                   | Square shape corner radius at size, tonal color mapping                  |
| CB-08 | Common buttons | Default | Extra large | Outlined, round                  | Enabled            | Light, RTL                   | Outline width at size, icon mirroring in RTL                             |
| CB-09 | Common buttons | Default | Extra small | Text                             | Enabled            | Light, LTR                   | Text style container-invisible-at-rest rule, no-toggle-text-button rule  |
| CB-10 | Common buttons | Toggle  | Small       | Filled, round (unselected)       | Unselected         | Light, LTR                   | Toggle-unselected color mapping, resting round shape                     |
| CB-11 | Common buttons | Toggle  | Small       | Filled, square (selected)        | Selected           | Light, LTR                   | Toggle-selected color mapping, round→square shape swap                   |
| CB-12 | Common buttons | Toggle  | Medium      | Outlined                         | Selected + Hovered | Light, LTR                   | Allowed state combination (selected + interaction state layer)           |
| CB-13 | Common buttons | Default | Small       | Filled, round                    | Enabled            | Light (high contrast), LTR   | High-contrast color role substitution                                    |
| CB-14 | Common buttons | Default | Small       | Filled, round, with leading icon | Enabled            | Light, LTR                   | Icon anatomy, icon size/spacing at size, icon–label alignment            |
| CB-15 | Common buttons | Default | Small       | Filled, round, long label        | Enabled            | Light, LTR (200% text scale) | Label no-wrap/no-truncate rule, 200% text size accessibility requirement |

## Source conflicts

None.

## Source gaps

- The 48×48dp minimum target-size requirement on the Buttons Specs page's "Target areas" section is stated for "extra small and small icon buttons"; the inspected Buttons pages do not state an explicit minimum target size for extra-small or small buttons that carry a text label (M3-2).
- Motion timing (duration/easing or spring parameters) for the toggle selected/unselected resting-shape swap, independent of the press-morph spring tokens, is not specified by the inspected Material sources.
- Interruption-handling and reduced-motion behavior for button shape-morph and rapid-click motion are not specified by the inspected Material sources.
- The current `md.comp.button.<color>.*` token family does not define a keyboard focus-ring/indicator token (offset, thickness, color). Only the deprecated legacy per-variant token sets (e.g. `md.comp.filled-button.focus.indicator.*`) define such tokens; they are superseded and not restated as current guidance.
- The exact motion curve for the web "rapid clicks" smoothing behavior is described only qualitatively ("a modified motion curve"); no named curve, duration, or easing value is published (M3-4).
- A formal taxonomy "Category" label for this component is not stated by the inspected sources.

## Design acceptance criteria

- [x] The official target and family boundary are deterministic.
- [x] Every applicable official component page was inspected.
- [x] The complete official surface is represented.
- [x] Variants, configurations, sizes, and states are distinct.
- [x] Every normative claim is traceable to an inspected source.
- [x] Missing guidance and conflicts are explicit.
- [x] The conformance matrix covers every documented dimension.
- [x] No Mioframe architecture, code, test, or migration decision is present.
