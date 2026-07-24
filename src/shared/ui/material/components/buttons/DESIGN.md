---
document: material-component-design
component: Buttons
canonical-slug: buttons
material-source: material3-mcp
material-origin: m3.material.io
source-snapshot: 2026-07-20T16:16:49.323Z
source-cache-schema: not reported by material3 MCP
generated-at: 2026-07-24
status: review-ready
approval: pending
---

# Buttons

## Source provenance

- MCP source: `material3`
- Cache generated at: 2026-07-20T16:16:49.323Z (`material_docs_cache_status.capturedAt`)
- Cache schema/version: not reported by material3 MCP
- Cache freshness/status: `isFresh: true`, `coverageHealth: verified`
- Canonical component route: `/components/buttons`

## Source coverage

| Source ID | MCP record or route                                                       | Official title                     | Original URL                                                                          | Coverage or resolution | Evidence used or disposition                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M3-R0     | `/components/buttons` (canonical route)                                   | Buttons                            | https://m3.material.io/components/buttons                                             | inspected (`covered`)  | `get_route` reports `coverage.status: covered`; `sharedCoverageGroup` spans the 4 tab output paths, all `savedOutputPaths`, none failed/skipped                                 |
| M3-1      | `/components/buttons/overview`                                            | Buttons — Overview                 | https://m3.material.io/components/buttons/overview                                    | inspected              | `get_page(view: structured)`; purpose, variant/color/size summary, M3 Expressive update, differences from M2                                                                    |
| M3-2      | `/components/buttons/specs`                                               | Buttons — Specs                    | https://m3.material.io/components/buttons/specs                                       | inspected              | `get_page(view: structured)`; variants, configurations, anatomy, color mapping, states, shape morph, measurements, target areas, corner sizes, tokens                           |
| M3-3      | `/components/buttons/guidelines`                                          | Buttons — Guidelines               | https://m3.material.io/components/buttons/guidelines                                  | inspected              | `get_page(view: structured)`; usage, toggle-button behavior, anatomy content rules, per-color-style choice guidance, adaptive design                                            |
| M3-4      | `/components/buttons/accessibility`                                       | Buttons — Accessibility            | https://m3.material.io/components/buttons/accessibility                               | inspected              | `get_page(view: structured)`; use cases, color contrast, 200% text size, rapid clicks, keyboard navigation, labeling elements                                                   |
| M3-T1     | `token-table:designSystems/20543ce18892f7d9/components/1c4257f8804f9478`  | Buttons — Baseline tokens          | dsdb-resource (referenced from Specs "Tokens & specs" and "Baseline tokens" headings) | inspected              | `get_component_tokens`; current `md.comp.button.*` color/size token sets, plus 5 `[Deprecated]` legacy per-variant sets (see Material token inventory)                          |
| M3-S1     | `status-table:designSystems/030656e0a1083ef1/components/4c66f2c4b2f2cb18` | Buttons — Availability & resources | dsdb-resource (referenced from Overview "Availability & resources" heading)           | not applicable         | Platform-availability status table; no template section requires platform-availability data. Resource confirmed `resolved` via `get_component_resources`, not further inspected |
| —         | 71 image/video resources referenced across the 4 tab pages                | (illustrative media)               | firebasestorage.googleapis.com asset URLs                                             | not applicable         | `get_component_resources` confirms all `status: resolved`; illustrative only, not a source of normative text per the skill's evidence rules                                     |

Every route returned by `get_component_tabs` (`overview`, `specs`, `guidelines`, `accessibility`) was inspected. `get_route` queried directly on each sub-route path reports `coverage.status: stale` with reason `"no verified identity or unambiguous component route match"`; `explain_route_coverage` confirms the same explanation. This is because the routing graph models the 4 tabs as children of the single canonical route `/components/buttons`, not as independently identified routes — the canonical route's own `coverage.status` is `covered`, with a `sharedCoverageGroup` whose `expectedOutputPaths` and `savedOutputPaths` list all 4 tab output files (`overview.md`, `specs.md`, `guidelines.md`, `accessibility.md`) and no `failedOutputPaths`/`skippedOutputPaths`. `get_page(view: structured)` successfully returned full structured content for all 4 tab routes. Coverage is therefore resolved: `covered` at the canonical-route level, not a blocker.

`get_component_resources` reports 73 resources for `buttons`, all `status: resolved` (images, videos, 1 token-table, 1 status-table); 0 unresolved.

## Component identity

- Official title: Buttons
- Category: not reported by material3 MCP
- Canonical slug: buttons
- Family boundary: This artifact covers the "Buttons" (common buttons) component only — the Default and Toggle variants across the five color configurations (elevated, filled, filled tonal, outlined, text). Icon buttons, Segmented buttons, Split button, Button groups, Floating action button (FAB), Extended FAB, and FAB menu are separately catalogued Material components (confirmed via `list_material_components`) with their own overview/specs/guidelines/accessibility routes and are out of scope.

## Purpose and choice guidance

### Purpose

Buttons communicate actions that people can take. They are typically placed throughout the UI in dialogs, modal windows, forms, cards, and toolbars, and can be placed within standard button groups (M3-3).

### Use when

- A discrete, one-shot action is needed and visual prominence should reflect the action's importance via color style: filled for important, final actions that complete a flow (e.g. Save, Join now, Confirm); tonal for a lower-priority action needing more emphasis than an outline (e.g. Next in an onboarding flow); outlined for medium-emphasis actions that are important but not primary; text for the lowest-priority actions, especially when presenting multiple options; elevated only when the button needs visual separation from a visually prominent background (M3-3).
- A binary selection is needed (e.g. Save, Favorite): use the Toggle variant, available for elevated, filled, tonal, and outlined color styles (M3-1, M3-2, M3-3).
- Buttons belong in a button group with primary and secondary members; different button sizes within a group communicate emphasis (M3-3).

### Do not use when

- A screen already has one high-emphasis action: the filled style has the most visual impact after the FAB and should be used sparingly, ideally for only one action per page (M3-3).
- The layout risks clutter: too many buttons disrupt visual hierarchy; consider a navigation rail, a set of chips, text links, or icon buttons for additional or low-priority actions instead (M3-3).
- Placing an outlined or text button on a visually prominent background (images, video): both depend on color/stroke to be recognizable and should be placed on simple backgrounds, or customized (e.g. contrasting container fill) for legibility (M3-3).
- A toggle button needs the text color style: "There is no toggle text button" (M3-2).

### Alternative components

Not specified by the inspected Material MCP records as a distinct emphasis-ordered "choosing buttons" ranking. The Guidelines page names, as alternatives to adding more buttons: navigation rail, chips, text links, and icon buttons for low-priority or overflow actions (M3-3); the FAB is named as the component with higher visual impact than the filled button (M3-3).

## Official family and related components

| Requirement ID | Component or member          | Relationship                                                                                                                   | Source ID               |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| FAM-01         | Button (default)             | Member of this component (variant)                                                                                             | M3-1, M3-2              |
| FAM-02         | Toggle button                | Member of this component (variant)                                                                                             | M3-1, M3-2              |
| FAM-03         | Icon button                  | Separately catalogued Material component (`icon-buttons`)                                                                      | M3-3 (mention), catalog |
| FAM-04         | Segmented buttons            | Separately catalogued Material component (`segmented-buttons`)                                                                 | catalog                 |
| FAM-05         | Split button                 | Separately catalogued Material component (`split-button`)                                                                      | catalog                 |
| FAM-06         | Button group (standard)      | Separately catalogued Material component (`button-groups`); buttons and icon buttons can be used inside a button group         | M3-3, catalog           |
| FAM-07         | Floating action button (FAB) | Separately catalogued Material component (`floating-action-button`); named as having more visual impact than the filled button | M3-3, catalog           |
| FAM-08         | Extended FAB                 | Separately catalogued Material component (`extended-fab`)                                                                      | catalog                 |
| FAM-09         | FAB menu                     | Separately catalogued Material component (`fab-menu`)                                                                          | catalog                 |

`catalog` = `list_material_components` (confirms canonical slugs only; component pages for FAM-03–FAM-09 were not inspected, per the skill's rule to follow a related route only when the component graph links it and the component's own records do not already define the requirement — this component's family boundary is fully defined by its own Overview/Specs/Guidelines records).

## Variants

| Requirement ID | Variant            | Purpose or emphasis                    | Distinguishing properties                                                                                                                                                                                                              | Source ID        |
| -------------- | ------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| VAR-01         | Default            | Single-shot, non-selectable action     | No selected/unselected state; uses the base (non-toggle) color/state token set for its configured color style                                                                                                                          | M3-1, M3-2       |
| VAR-02         | Toggle (selection) | Binary selection (e.g. Save, Favorite) | Adds selected/unselected states with distinct color mapping per state; resting container shape morphs between round and square on selection; not available for the text color style; introduced in the M3 Expressive update (May 2025) | M3-1, M3-2, M3-3 |

## Configurations

| Requirement ID | Configuration              | Required content                                        | Optional content | Constraints                                                                                                                                                                                     | Source ID  |
| -------------- | -------------------------- | ------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| CFG-01         | Color: Elevated            | Container, label text                                   | Leading icon     | Same color mapping as tonal but with a shadow (elevation); use only when the button requires visual separation from a prominent background; used sparingly, higher elevation increases emphasis | M3-2, M3-3 |
| CFG-02         | Color: Filled              | Container, label text                                   | Leading icon     | Primary color mapping; most visual impact after the FAB; use sparingly, ideally one action per page; can use tertiary colors in some cases                                                      | M3-2, M3-3 |
| CFG-03         | Color: Filled tonal        | Container, label text                                   | Leading icon     | Secondary color mapping; useful where a lower-priority button needs slightly more emphasis than an outline                                                                                      | M3-2, M3-3 |
| CFG-04         | Color: Outlined            | Container (stroke only, no fill by default), label text | Leading icon     | Stroke around the container; container fill invisible at rest, but opacity and state layers behave the same as other styles when disabled, hovered, focused, or pressed                         | M3-2, M3-3 |
| CFG-05         | Color: Text                | Label text                                              | Leading icon     | Container invisible except when hovered, focused, or pressed; label color must be recognizable from surrounding non-button text; no toggle variant                                              | M3-2, M3-3 |
| CFG-06         | Shape: Round               | Container                                               | —                | Fully rounded (`full`) corners at every size, at rest                                                                                                                                           | M3-2       |
| CFG-07         | Shape: Square              | Container                                               | —                | Corner radius varies by size (12dp XS/S, 16dp M, 28dp L/XL); square containers have more subtle rounding that changes with button size                                                          | M3-2, M3-3 |
| CFG-08         | Small button padding: 16dp | —                                                       | —                | M3 Expressive: recommended, matches the padding scale of the other new sizes                                                                                                                    | M3-1, M3-2 |
| CFG-09         | Small button padding: 24dp | —                                                       | —                | Original M3 Small padding; no longer recommended under M3 Expressive                                                                                                                            | M3-1, M3-2 |

## Sizes and density

| Requirement ID | Size or density     | Dimensions                                                                                                                                                                                                          | Content sizing                                                  | Target size                                                            | Source ID  |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| SIZ-01         | Extra small (XS)    | Container height 32dp; leading/trailing space 12dp; icon–label space 8dp; outline width 1dp (outlined); round shape `full`; square shape corner 12dp; pressed-shape corner 8dp                                      | Label: `label-large` (Roboto Flex 500, 14sp/20sp); icon 20dp    | Not specified for label-bearing buttons at this size (see Source gaps) | M3-2       |
| SIZ-02         | Small (S) — default | Container height 40dp; leading/trailing space 16dp (recommended) or 24dp (legacy, not recommended); icon–label space 8dp; outline width 1dp; round shape `full`; square shape corner 12dp; pressed-shape corner 8dp | Label: `label-large` (Roboto Flex 500, 14sp/20sp); icon 20dp    | Not specified for label-bearing buttons at this size (see Source gaps) | M3-1, M3-2 |
| SIZ-03         | Medium (M)          | Container height 56dp; leading/trailing space 24dp; icon–label space 8dp; outline width 1dp; round shape `full`; square shape corner 16dp; pressed-shape corner 12dp                                                | Label: `title-medium` (Roboto Flex 500, 16sp/24sp); icon 24dp   | Not specified by the inspected Material MCP records                    | M3-2       |
| SIZ-04         | Large (L)           | Container height 96dp; leading/trailing space 48dp; icon–label space 12dp; outline width 2dp; round shape `full`; square shape corner 28dp; pressed-shape corner 16dp                                               | Label: `headline-small` (Roboto Flex 400, 24sp/32sp); icon 32dp | Not specified by the inspected Material MCP records                    | M3-2       |
| SIZ-05         | Extra large (XL)    | Container height 136dp; leading/trailing space 64dp; icon–label space 16dp; outline width 3dp; round shape `full`; square shape corner 28dp; pressed-shape corner 16dp                                              | Label: `headline-large` (Roboto Flex 400, 32sp/40sp); icon 40dp | Not specified by the inspected Material MCP records                    | M3-2       |

The Specs page's "Target areas" section states: "Extra small and small icon buttons must have a target size of 48x48dp or larger to be accessible." This is scoped explicitly to icon buttons (a separate component, FAM-03), not to this component's label-bearing default/toggle buttons at XS/S — see Source gaps.

## Anatomy

| Requirement ID | Part           | Required or optional | Design role                                                                                                                                                                              | Source ID  |
| -------------- | -------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ANA-01         | Container      | Required             | Holds the label text and optional icon; shape and color follow the selected shape/color configuration; for the text color style, the container is visible only on hover, focus, or press | M3-2, M3-3 |
| ANA-02         | Label text     | Required             | Describes the action a tap will perform; the most important element of the button                                                                                                        | M3-2, M3-3 |
| ANA-03         | Icon (leading) | Optional             | Visually communicates the action and draws attention; placed on the leading (reading-direction) side, before the label                                                                   | M3-2, M3-3 |

## Content guidance

| Requirement ID | Area                          | Requirement or recommendation                                                                                                                                        | Strength                 | Conditions or exceptions | Source ID |
| -------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------ | --------- |
| CNT-01         | Label length                  | Ideally 1–3 words                                                                                                                                                    | Recommendation           | —                        | M3-3      |
| CNT-02         | Label case                    | Sentence case: capitalize only the first word and proper nouns (e.g. "Book with Flights", not "BOOK WITH FLIGHTS")                                                   | Requirement              | —                        | M3-3      |
| CNT-03         | Label wrapping/truncation     | Don't truncate or wrap label text; it should always be fully visible on a single line                                                                                | Requirement (Don't)      | —                        | M3-3      |
| CNT-04         | Icon placement                | Leading side, before the label text; mirrors to the trailing edge in right-to-left languages                                                                         | Requirement              | —                        | M3-3      |
| CNT-05         | Icon count                    | Don't use two icons in the same button                                                                                                                               | Requirement (Don't)      | —                        | M3-3      |
| CNT-06         | Icon/label alignment          | Keep the icon and label horizontally grouped and centered; don't vertically align them in the center of the button                                                   | Requirement (Don't)      | —                        | M3-3      |
| CNT-07         | Toggle label changes          | If the label text changes between selected and unselected states, keep the character count a similar length; don't change it dramatically                            | Recommendation           | Toggle variant only      | M3-3      |
| CNT-08         | Outlined/text style placement | Outlined and text buttons depend on color to be recognizable from other text/elements; use caution next to visually similar elements (e.g. chips) or large text      | Recommendation (caution) | —                        | M3-3      |
| CNT-09         | Container width               | Width dynamically fits the label text and shouldn't be set narrower than the label; width can be responsive but shouldn't stretch into long, sparsely filled buttons | Requirement              | —                        | M3-3      |
| CNT-10         | Text style: no underline      | Don't underline the text button; use hyperlinked body text instead to emphasize links                                                                                | Requirement (Don't)      | Text color style only    | M3-3      |

## State model

### States

| Requirement ID | State                            | Meaning                             | Visual change                                                                                                                                                                                                                                                         | Source ID  |
| -------------- | -------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| STA-01         | Enabled                          | Default interactive state           | Baseline container/label/icon colors per the selected color configuration                                                                                                                                                                                             | M3-2       |
| STA-02         | Disabled                         | Non-interactive                     | Container/label/icon rendered at on-surface with reduced opacity (container 0.1, label/icon 0.38 in the current token set); elevation drops to level0 for elevated/filled/tonal                                                                                       | M3-2       |
| STA-03         | Hovered                          | Pointer hover                       | State layer added at 0.08 opacity over the role color; elevated style's elevation increases (level1 → level2, 1dp → 3dp); filled/tonal gain a level1 (1dp) hover elevation                                                                                            | M3-2       |
| STA-04         | Focused                          | Keyboard or programmatic focus      | State layer added at 0.1 opacity over the role color                                                                                                                                                                                                                  | M3-2       |
| STA-05         | Pressed                          | Active pointer/keyboard press       | State layer added at 0.1 opacity over the role color; container corner radius morphs toward the size's pressed-shape value (round and square buttons share this pressed shape)                                                                                        | M3-2       |
| STA-06         | Selected (Toggle variant only)   | Toggle button is in its "on" state  | Distinct selected container/label/icon color roles (e.g. filled: label/icon switch from on-surface-variant to on-primary, container switches to primary); resting shape swaps from round to square, or from square to round if the unselected resting shape is square | M3-1, M3-2 |
| STA-07         | Unselected (Toggle variant only) | Toggle button is in its "off" state | Uses the toggle-unselected color role mapping (distinct from both the default variant and the selected state); resting shape defaults to round                                                                                                                        | M3-2       |

### State combinations

| Requirement ID | Combination                                 | Allowed                                             | Result                                                                    | Source ID |
| -------------- | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- | --------- |
| SCM-01         | Toggle unselected + hovered/focused/pressed | Allowed                                             | Interaction state layer is applied on top of the unselected color mapping | M3-2      |
| SCM-02         | Toggle selected + hovered/focused/pressed   | Allowed                                             | Interaction state layer is applied on top of the selected color mapping   | M3-2      |
| SCM-03         | Toggle variant + Text color style           | Not allowed                                         | "There is no toggle text button"                                          | M3-2      |
| SCM-04         | Disabled + hovered/focused/pressed          | Not specified by the inspected Material MCP records | Not specified by the inspected Material MCP records                       | —         |

## Interaction behavior

| Requirement ID | Input or condition               | Observable behavior                                                                                                                                                                                                                                                                         | Source ID  |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| INT-01         | Tab key                          | Moves keyboard focus to a button                                                                                                                                                                                                                                                            | M3-4       |
| INT-02         | Space or Enter                   | Activates the focused button                                                                                                                                                                                                                                                                | M3-4       |
| INT-03         | Pointer or keyboard press        | Enters the pressed state; container corner radius morphs toward the size's pressed-shape value; returns to the resting/hover shape on release                                                                                                                                               | M3-2       |
| INT-04         | Activating a Toggle button       | Switches the selected/unselected state; container shape swaps between round and square; color mapping switches to the corresponding selected/unselected roles; when toggled, the icon should switch from an outlined glyph to a filled glyph (or increase weight if no filled glyph exists) | M3-1, M3-3 |
| INT-05         | Rapid repeated clicks/taps (web) | A modified motion curve is applied to avoid resonant effects from overlapping animations                                                                                                                                                                                                    | M3-4       |

## Visual specification

### Dimensions and layout

| Requirement ID | Element                        | Token or value                                                                                           | Conditions                               | Source ID  |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- |
| DIM-01         | Container height               | 32dp (XS) / 40dp (S) / 56dp (M) / 96dp (L) / 136dp (XL)                                                  | Per size                                 | M3-2       |
| DIM-02         | Leading/trailing padding       | 12dp (XS) / 16dp (S, recommended) or 24dp (S, legacy, not recommended) / 24dp (M) / 48dp (L) / 64dp (XL) | Per size                                 | M3-1, M3-2 |
| DIM-03         | Icon–label spacing             | 8dp (XS, S, M) / 12dp (L) / 16dp (XL)                                                                    | Per size, when a leading icon is present | M3-2       |
| DIM-04         | Outline width (Outlined style) | 1dp (XS, S, M) / 2dp (L) / 3dp (XL)                                                                      | Per size                                 | M3-2       |
| DIM-05         | Container width                | Fits label text content; not fixed narrower than the label; can be responsive                            | —                                        | M3-3       |

### Color

| Requirement ID | Variant or element                | State             | Token or role                                      | Source ID |
| -------------- | --------------------------------- | ----------------- | -------------------------------------------------- | --------- |
| COL-01         | Elevated container / icon & label | Default           | `surface-container-low` / `primary`                | M3-2      |
| COL-02         | Elevated container / icon & label | Toggle unselected | `surface-container-low` / `primary`                | M3-2      |
| COL-03         | Elevated container / icon & label | Toggle selected   | `primary` / `on-primary`                           | M3-2      |
| COL-04         | Filled container / icon & label   | Default           | `primary` / `on-primary`                           | M3-2      |
| COL-05         | Filled container / icon & label   | Toggle unselected | `surface-container` / `on-surface-variant`         | M3-2      |
| COL-06         | Filled container / icon & label   | Toggle selected   | `primary` / `on-primary`                           | M3-2      |
| COL-07         | Tonal container / icon & label    | Default           | `secondary-container` / `on-secondary-container`   | M3-2      |
| COL-08         | Tonal container / icon & label    | Toggle unselected | `secondary-container` / `on-secondary-container`   | M3-2      |
| COL-09         | Tonal container / icon & label    | Toggle selected   | `secondary` / `on-secondary`                       | M3-2      |
| COL-10         | Outlined container / icon & label | Default           | `outline-variant` (outline) / `on-surface-variant` | M3-2      |
| COL-11         | Outlined container / icon & label | Toggle unselected | `outline-variant` (outline) / `on-surface-variant` | M3-2      |
| COL-12         | Outlined container / icon & label | Toggle selected   | `inverse-surface` / `inverse-on-surface`           | M3-2      |
| COL-13         | Text icon & label                 | Default           | `primary`                                          | M3-2      |
| COL-14         | Text icon & label                 | Toggle (any)      | Not applicable — no toggle text button             | M3-2      |

Full per-state, per-role token mappings (enabled, disabled, hovered, focused, pressed, selected, unselected) are in [Material token inventory](#material-token-inventory).

### Typography

| Requirement ID | Element            | Typescale role or value                       | Source ID |
| -------------- | ------------------ | --------------------------------------------- | --------- |
| TYP-01         | Label text (XS, S) | `label-large` — Roboto Flex 500, 14sp/20sp    | M3-2      |
| TYP-02         | Label text (M)     | `title-medium` — Roboto Flex 500, 16sp/24sp   | M3-2      |
| TYP-03         | Label text (L)     | `headline-small` — Roboto Flex 400, 24sp/32sp | M3-2      |
| TYP-04         | Label text (XL)    | `headline-large` — Roboto Flex 400, 32sp/40sp | M3-2      |

### Shape and outline

| Requirement ID | Variant or element             | State                                | Token or value                                                                                                      | Source ID  |
| -------------- | ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| SHP-01         | Round shape, any size          | Resting (unselected/default)         | `md.sys.shape.corner.full` (fully rounded)                                                                          | M3-2       |
| SHP-02         | Square shape                   | Resting (unselected/default)         | 12dp (XS/S, `medium`) / 16dp (M, `large`) / 28dp (L/XL, `extra-large`)                                              | M3-2       |
| SHP-03         | Round or square shape          | Pressed                              | 8dp (XS/S, `small`) / 12dp (M, `medium`) / 16dp (L/XL, `large`); round and square buttons share this pressed radius | M3-2       |
| SHP-04         | Toggle, resting round default  | Selected                             | Swaps to square (12dp XS/S, 16dp M, 28dp L/XL)                                                                      | M3-1, M3-2 |
| SHP-05         | Toggle, resting square default | Selected                             | Swaps to round (`full`)                                                                                             | M3-1, M3-2 |
| SHP-06         | Outlined style                 | Enabled/hover/focus/pressed/disabled | Outline width 1dp (XS/S/M), 2dp (L), 3dp (XL); disabled outline color `md.sys.color.outline-variant`                | M3-2       |

### Elevation

| Requirement ID | Variant or element | State                                  | Token or value                                | Source ID |
| -------------- | ------------------ | -------------------------------------- | --------------------------------------------- | --------- |
| ELV-01         | Elevated           | Enabled                                | `md.sys.elevation.level1` (1dp)               | M3-2      |
| ELV-02         | Elevated           | Hovered                                | `md.sys.elevation.level2` (3dp)               | M3-2      |
| ELV-03         | Elevated           | Focused / Pressed                      | `md.sys.elevation.level1` (1dp)               | M3-2      |
| ELV-04         | Elevated           | Disabled                               | `md.sys.elevation.level0`                     | M3-2      |
| ELV-05         | Filled             | Enabled / Focused / Pressed / Disabled | `md.sys.elevation.level0`                     | M3-2      |
| ELV-06         | Filled             | Hovered                                | `md.sys.elevation.level1` (1dp)               | M3-2      |
| ELV-07         | Tonal              | Enabled / Focused / Pressed / Disabled | `md.sys.elevation.level0`                     | M3-2      |
| ELV-08         | Tonal              | Hovered                                | `md.sys.elevation.level1` (1dp)               | M3-2      |
| ELV-09         | Outlined, Text     | All states                             | No elevation tokens defined (flat, no shadow) | M3-2      |

### State layers and focus

| Requirement ID | State                                       | Layer, indicator, or opacity                                                                                                                                                                  | Source ID |
| -------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FOC-01         | Hovered                                     | State layer opacity `md.sys.state.hover.state-layer-opacity` (0.08), tinted with the variant's role color                                                                                     | M3-2      |
| FOC-02         | Focused                                     | State layer opacity `md.sys.state.focus.state-layer-opacity` (0.1), tinted with the variant's role color                                                                                      | M3-2      |
| FOC-03         | Pressed                                     | State layer opacity `md.sys.state.pressed.state-layer-opacity` (0.1), tinted with the variant's role color                                                                                    | M3-2      |
| FOC-04         | Focus ring/indicator (current token family) | Not specified by the inspected Material MCP records — the current `md.comp.button.<color>.*` family defines only state-layer color/opacity, not a separate focus-ring token (see Source gaps) | M3-2      |

### Icons

| Requirement ID | Context      | Size, placement, or behavior                                                                                                                  | Source ID  |
| -------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ICO-01         | Leading icon | 20dp (XS, S) / 24dp (M) / 32dp (L) / 40dp (XL); placed on the leading edge before the label; color matches the label text color at each state | M3-2, M3-3 |
| ICO-02         | Toggle icon  | Should use an outlined glyph when unselected and a filled glyph when selected; if no filled glyph exists, increase icon weight instead        | M3-3       |
| ICO-03         | Icon count   | Exactly zero or one leading icon; never two icons in the same button                                                                          | M3-3       |

## Material token inventory

The following tables reproduce the current (non-deprecated) `md.comp.button.*` token sets exactly as returned by `get_component_tokens` for `buttons` (resource `token-table:designSystems/20543ce18892f7d9/components/1c4257f8804f9478`, source M3-T1), grouped by the same 10 token-set names published on the Specs page: `Button - Color - Elevated`, `Button - Color - Filled`, `Button - Color - Tonal`, `Button - Color - Outlined`, `Button - Color - Text`, `Button - Size - Xsmall`, `Button - Size - Small`, `Button - Size - Medium`, `Button - Size - Large`, `Button - Size - Xlarge`. The "Official system role or value" column uses the token's first published alias (its `md.sys.*` system role) when one exists, otherwise the token's literal published value (dp/opacity/typescale/shape-family).

The same resource also publishes 5 `[Deprecated]` legacy per-variant token sets (`md.comp.text-button.*`, `md.comp.filled-button.*`, `md.comp.outlined-button.*`, `md.comp.elevated-button.*`, `md.comp.filled-tonal-button.*`). These are superseded by the current `md.comp.button.*` family above and are not restated row-by-row (see Source gaps for the one normative difference: legacy focus-indicator tokens).

### Button - Color - Filled

| Design role                                                             | Official component token                                   | Official system role or value            | Source ID |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- | --------- |
| Button filled hovered container elevation                               | md.comp.button.filled.hovered.container.elevation          | md.sys.elevation.level1                  | M3-T1     |
| Button filled label color - toggle (selected)                           | md.comp.button.filled.selected.label-text.color            | md.sys.color.on-primary                  | M3-T1     |
| Button filled label color - toggle (unselected)                         | md.comp.button.filled.unselected.label-text.color          | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled container color                                           | md.comp.button.filled.container.color                      | md.sys.color.primary                     | M3-T1     |
| Button filled container color - toggle (unselected)                     | md.comp.button.filled.unselected.container.color           | md.sys.color.surface-container           | M3-T1     |
| Button filled container color - toggle (selected)                       | md.comp.button.filled.selected.container.color             | md.sys.color.primary                     | M3-T1     |
| Button filled shadow color                                              | md.comp.button.filled.container.shadow-color               | md.sys.color.shadow                      | M3-T1     |
| Button filled elevation                                                 | md.comp.button.filled.container.elevation                  | md.sys.elevation.level0                  | M3-T1     |
| Button filled label color                                               | md.comp.button.filled.label-text.color                     | md.sys.color.on-primary                  | M3-T1     |
| Button filled icon color                                                | md.comp.button.filled.icon.color                           | md.sys.color.on-primary                  | M3-T1     |
| Button filled icon color - toggle (unselected)                          | md.comp.button.filled.unselected.icon.color                | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled icon color - toggle (selected)                            | md.comp.button.filled.selected.icon.color                  | md.sys.color.on-primary                  | M3-T1     |
| Button filled disabled container color                                  | md.comp.button.filled.disabled.container.color             | md.sys.color.on-surface                  | M3-T1     |
| Button filled disabled container opacity                                | md.comp.button.filled.disabled.container.opacity           | 0.1                                      | M3-T1     |
| Button filled disabled container elevation                              | md.comp.button.filled.disabled.container.elevation         | md.sys.elevation.level0                  | M3-T1     |
| Button filled disabled label color                                      | md.comp.button.filled.disabled.label-text.color            | md.sys.color.on-surface                  | M3-T1     |
| Button filled disabled label opacity                                    | md.comp.button.filled.disabled.label-text.opacity          | 0.38                                     | M3-T1     |
| Button filled disabled icon color                                       | md.comp.button.filled.disabled.icon.color                  | md.sys.color.on-surface                  | M3-T1     |
| Button filled disabled icon opacity                                     | md.comp.button.filled.disabled.icon.opacity                | 0.38                                     | M3-T1     |
| Button filled hovered container state layer color                       | md.comp.button.filled.hovered.state-layer.color            | md.sys.color.on-primary                  | M3-T1     |
| Button filled hovered container state layer color - toggle (unselected) | md.comp.button.filled.unselected.hovered.state-layer.color | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled hovered container state layer color - toggle (selected)   | md.comp.button.filled.selected.hovered.state-layer.color   | md.sys.color.on-primary                  | M3-T1     |
| Button filled hovered container state layer opacity                     | md.comp.button.filled.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-T1     |
| Button filled hovered label color                                       | md.comp.button.filled.hovered.label-text.color             | md.sys.color.on-primary                  | M3-T1     |
| Button filled hovered label color - toggle (unselected)                 | md.comp.button.filled.unselected.hovered.label-text.color  | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled hovered label color - toggle (selected)                   | md.comp.button.filled.selected.hovered.label-text.color    | md.sys.color.on-primary                  | M3-T1     |
| Button filled hovered icon color                                        | md.comp.button.filled.hovered.icon.color                   | md.sys.color.on-primary                  | M3-T1     |
| Button filled hovered icon color - toggle (unselected)                  | md.comp.button.filled.unselected.hovered.icon.color        | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled hovered icon color - toggle (selected)                    | md.comp.button.filled.selected.hovered.icon.color          | md.sys.color.on-primary                  | M3-T1     |
| Button filled focused container state layer color                       | md.comp.button.filled.focused.state-layer.color            | md.sys.color.on-primary                  | M3-T1     |
| Button filled focused container state layer color - toggle (unselected) | md.comp.button.filled.unselected.focused.state-layer.color | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled focused container state layer color - toggle (selected)   | md.comp.button.filled.selected.focused.state-layer.color   | md.sys.color.on-primary                  | M3-T1     |
| Button filled focused container state layer opacity                     | md.comp.button.filled.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-T1     |
| Button filled focused container state layer elevation                   | md.comp.button.filled.focused.container.elevation          | md.sys.elevation.level0                  | M3-T1     |
| Button filled focused label color                                       | md.comp.button.filled.focused.label-text.color             | md.sys.color.on-primary                  | M3-T1     |
| Button filled focused label color - toggle (unselected)                 | md.comp.button.filled.unselected.focused.label-text.color  | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled focused label color - toggle (selected)                   | md.comp.button.filled.selected.focused.label-text.color    | md.sys.color.on-primary                  | M3-T1     |
| Button filled focused icon color                                        | md.comp.button.filled.focused.icon.color                   | md.sys.color.on-primary                  | M3-T1     |
| Button filled focused icon color - toggle (unselected)                  | md.comp.button.filled.unselected.focused.icon.color        | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled focused icon color - toggle (selected)                    | md.comp.button.filled.selected.focused.icon.color          | md.sys.color.on-primary                  | M3-T1     |
| Button filled pressed container state layer color                       | md.comp.button.filled.pressed.state-layer.color            | md.sys.color.on-primary                  | M3-T1     |
| Button filled pressed container state layer color - toggle (unselected) | md.comp.button.filled.unselected.pressed.state-layer.color | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled pressed container state layer color - toggle (selected)   | md.comp.button.filled.selected.pressed.state-layer.color   | md.sys.color.on-primary                  | M3-T1     |
| Button filled pressed container state layer opacity                     | md.comp.button.filled.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-T1     |
| Button filled pressed container state layer elevation                   | md.comp.button.filled.pressed.container.elevation          | md.sys.elevation.level0                  | M3-T1     |
| Button filled pressed label color                                       | md.comp.button.filled.pressed.label-text.color             | md.sys.color.on-primary                  | M3-T1     |
| Button filled pressed label color - toggle (unselected)                 | md.comp.button.filled.unselected.pressed.label-text.color  | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled pressed label color - toggle (selected)                   | md.comp.button.filled.selected.pressed.label-text.color    | md.sys.color.on-primary                  | M3-T1     |
| Button filled pressed icon color                                        | md.comp.button.filled.pressed.icon.color                   | md.sys.color.on-primary                  | M3-T1     |
| Button filled pressed icon color - toggle (unselected)                  | md.comp.button.filled.unselected.pressed.icon.color        | md.sys.color.on-surface-variant          | M3-T1     |
| Button filled pressed icon color - toggle (selected)                    | md.comp.button.filled.selected.pressed.icon.color          | md.sys.color.on-primary                  | M3-T1     |

### Button - Size - Xsmall

| Design role                                    | Official component token                                                    | Official system role or value               | Source ID |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | --------- |
| Button xsmall container height                 | md.comp.button.xsmall.container.height                                      | 32dp                                        | M3-T1     |
| Button xsmall outline width                    | md.comp.button.xsmall.outlined.outline.width                                | 1dp                                         | M3-T1     |
| Button xsmall icon size                        | md.comp.button.xsmall.icon.size                                             | 20dp                                        | M3-T1     |
| Button xsmall label size                       | md.comp.button.xsmall.label-text                                            | md.sys.typescale.label-large                | M3-T1     |
| Button xsmall shape round                      | md.comp.button.xsmall.container.shape.round                                 | md.sys.shape.corner.full                    | M3-T1     |
| Button xsmall leading space                    | md.comp.button.xsmall.leading-space                                         | 12dp                                        | M3-T1     |
| Button xsmall between icon label space         | md.comp.button.xsmall.icon-label-space                                      | 8dp                                         | M3-T1     |
| Button xsmall trailing space                   | md.comp.button.xsmall.trailing-space                                        | 12dp                                        | M3-T1     |
| Button xsmall shape square                     | md.comp.button.xsmall.container.shape.square                                | md.sys.shape.corner.medium                  | M3-T1     |
| Button xsmall shape pressed morph              | md.comp.button.xsmall.pressed.container.shape                               | md.sys.shape.corner.small                   | M3-T1     |
| Button xsmall shape spring animation damping   | md.comp.button.xsmall.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-T1     |
| Button xsmall selected container shape square  | md.comp.button.xsmall.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-T1     |
| Button xsmall selected container shape round   | md.comp.button.xsmall.selected.container.shape.round                        | md.sys.shape.corner.medium                  | M3-T1     |
| Button xsmall shape spring animation stiffness | md.comp.button.xsmall.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-T1     |

### Button - Size - Small

| Design role                                   | Official component token                                                   | Official system role or value               | Source ID |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | --------- |
| Button small container height                 | md.comp.button.small.container.height                                      | 40dp                                        | M3-T1     |
| Button small outline width                    | md.comp.button.small.outlined.outline.width                                | 1dp                                         | M3-T1     |
| Button small label size                       | md.comp.button.small.label-text                                            | md.sys.typescale.label-large                | M3-T1     |
| Button small icon size                        | md.comp.button.small.icon.size                                             | 20dp                                        | M3-T1     |
| Button small shape round                      | md.comp.button.small.container.shape.round                                 | md.sys.shape.corner.full                    | M3-T1     |
| Button small leading space                    | md.comp.button.small.leading-space                                         | 16dp                                        | M3-T1     |
| Button small between icon label space         | md.comp.button.small.icon-label-space                                      | 8dp                                         | M3-T1     |
| Button small trailing space                   | md.comp.button.small.trailing-space                                        | 16dp                                        | M3-T1     |
| Button small shape square                     | md.comp.button.small.container.shape.square                                | md.sys.shape.corner.medium                  | M3-T1     |
| Button small shape pressed morph              | md.comp.button.small.pressed.container.shape                               | md.sys.shape.corner.small                   | M3-T1     |
| Button small shape spring animation damping   | md.comp.button.small.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-T1     |
| Button small shape spring animation stiffness | md.comp.button.small.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-T1     |
| Button small selected container shape round   | md.comp.button.small.selected.container.shape.round                        | md.sys.shape.corner.medium                  | M3-T1     |
| Button small selected container shape square  | md.comp.button.small.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-T1     |

### Button - Size - Medium

| Design role                                    | Official component token                                                    | Official system role or value               | Source ID |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | --------- |
| Button medium container height                 | md.comp.button.medium.container.height                                      | 56dp                                        | M3-T1     |
| Button medium outline width                    | md.comp.button.medium.outlined.outline.width                                | 1dp                                         | M3-T1     |
| Button medium label size                       | md.comp.button.medium.label-text                                            | md.sys.typescale.title-medium               | M3-T1     |
| Button medium icon size                        | md.comp.button.medium.icon.size                                             | 24dp                                        | M3-T1     |
| Button medium shape round                      | md.comp.button.medium.container.shape.round                                 | md.sys.shape.corner.full                    | M3-T1     |
| Button medium leading space                    | md.comp.button.medium.leading-space                                         | 24dp                                        | M3-T1     |
| Button medium between icon label space         | md.comp.button.medium.icon-label-space                                      | 8dp                                         | M3-T1     |
| Button medium trailing space                   | md.comp.button.medium.trailing-space                                        | 24dp                                        | M3-T1     |
| Button medium shape square                     | md.comp.button.medium.container.shape.square                                | md.sys.shape.corner.large                   | M3-T1     |
| Button medium shape pressed morph              | md.comp.button.medium.pressed.container.shape                               | md.sys.shape.corner.medium                  | M3-T1     |
| Button medium shape spring animation damping   | md.comp.button.medium.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-T1     |
| Button medium shape spring animation stiffness | md.comp.button.medium.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-T1     |
| Button medium selected container shape round   | md.comp.button.medium.selected.container.shape.round                        | md.sys.shape.corner.large                   | M3-T1     |
| Button medium selected container shape square  | md.comp.button.medium.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-T1     |

### Button - Size - Large

| Design role                                   | Official component token                                                   | Official system role or value               | Source ID |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | --------- |
| Button large container height                 | md.comp.button.large.container.height                                      | 96dp                                        | M3-T1     |
| Button large outline width                    | md.comp.button.large.outlined.outline.width                                | 2dp                                         | M3-T1     |
| Button large label size                       | md.comp.button.large.label-text                                            | md.sys.typescale.headline-small             | M3-T1     |
| Button large icon size                        | md.comp.button.large.icon.size                                             | 32dp                                        | M3-T1     |
| Button large shape round                      | md.comp.button.large.container.shape.round                                 | md.sys.shape.corner.full                    | M3-T1     |
| Button large leading space                    | md.comp.button.large.leading-space                                         | 48dp                                        | M3-T1     |
| Button large between icon label space         | md.comp.button.large.icon-label-space                                      | 12dp                                        | M3-T1     |
| Button large trailing space                   | md.comp.button.large.trailing-space                                        | 48dp                                        | M3-T1     |
| Button large shape square                     | md.comp.button.large.container.shape.square                                | md.sys.shape.corner.extra-large             | M3-T1     |
| Button large shape pressed morph              | md.comp.button.large.pressed.container.shape                               | md.sys.shape.corner.large                   | M3-T1     |
| Button large shape spring animation damping   | md.comp.button.large.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-T1     |
| Button large shape spring animation stiffness | md.comp.button.large.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-T1     |
| Button large selected container shape round   | md.comp.button.large.selected.container.shape.round                        | md.sys.shape.corner.extra-large             | M3-T1     |
| Button large selected container shape square  | md.comp.button.large.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-T1     |

### Button - Size - Xlarge

| Design role                                    | Official component token                                                    | Official system role or value               | Source ID |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | --------- |
| Button xlarge container height                 | md.comp.button.xlarge.container.height                                      | 136dp                                       | M3-T1     |
| Button xlarge outline width                    | md.comp.button.xlarge.outlined.outline.width                                | 3dp                                         | M3-T1     |
| Button xlarge label size                       | md.comp.button.xlarge.label-text                                            | md.sys.typescale.headline-large             | M3-T1     |
| Button xlarge icon size                        | md.comp.button.xlarge.icon.size                                             | 40dp                                        | M3-T1     |
| Button xlarge shape round                      | md.comp.button.xlarge.container.shape.round                                 | md.sys.shape.corner.full                    | M3-T1     |
| Button xlarge leading space                    | md.comp.button.xlarge.leading-space                                         | 64dp                                        | M3-T1     |
| Button xlarge between icon label space         | md.comp.button.xlarge.icon-label-space                                      | 16dp                                        | M3-T1     |
| Button xlarge trailing space                   | md.comp.button.xlarge.trailing-space                                        | 64dp                                        | M3-T1     |
| Button xlarge shape square                     | md.comp.button.xlarge.container.shape.square                                | md.sys.shape.corner.extra-large             | M3-T1     |
| Button xlarge shape pressed morph              | md.comp.button.xlarge.pressed.container.shape                               | md.sys.shape.corner.large                   | M3-T1     |
| Button xlarge shape spring animation damping   | md.comp.button.xlarge.pressed.container.corner-size.motion.spring.damping   | md.sys.motion.spring.fast.spatial.damping   | M3-T1     |
| Button xlarge shape spring animation stiffness | md.comp.button.xlarge.pressed.container.corner-size.motion.spring.stiffness | md.sys.motion.spring.fast.spatial.stiffness | M3-T1     |
| Button xlarge selected container shape round   | md.comp.button.xlarge.selected.container.shape.round                        | md.sys.shape.corner.extra-large             | M3-T1     |
| Button xlarge selected container shape square  | md.comp.button.xlarge.selected.container.shape.square                       | md.sys.shape.corner.full                    | M3-T1     |

### Button - Color - Elevated

| Design role                                                               | Official component token                                     | Official system role or value            | Source ID |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | --------- |
| Button elevated hovered container elevation                               | md.comp.button.elevated.hovered.container.elevation          | md.sys.elevation.level2                  | M3-T1     |
| Button elevated label color - toggle (selected)                           | md.comp.button.elevated.selected.label-text.color            | md.sys.color.on-primary                  | M3-T1     |
| Button elevated label color - toggle (unselected)                         | md.comp.button.elevated.unselected.label-text.color          | md.sys.color.primary                     | M3-T1     |
| Button elevated shadow color                                              | md.comp.button.elevated.container.shadow-color               | md.sys.color.shadow                      | M3-T1     |
| Button elevated container color                                           | md.comp.button.elevated.container.color                      | md.sys.color.surface-container-low       | M3-T1     |
| Button elevated container color - toggle (unselected)                     | md.comp.button.elevated.unselected.container.color           | md.sys.color.surface-container-low       | M3-T1     |
| Button elevated container color - toggle (selected)                       | md.comp.button.elevated.selected.container.color             | md.sys.color.primary                     | M3-T1     |
| Button elevated elevation                                                 | md.comp.button.elevated.container.elevation                  | md.sys.elevation.level1                  | M3-T1     |
| Button elevated label color                                               | md.comp.button.elevated.label-text.color                     | md.sys.color.primary                     | M3-T1     |
| Button elevated icon color                                                | md.comp.button.elevated.icon.color                           | md.sys.color.primary                     | M3-T1     |
| Button elevated icon color - toggle (unselected)                          | md.comp.button.elevated.unselected.icon.color                | md.sys.color.primary                     | M3-T1     |
| Button elevated icon color - toggle (selected)                            | md.comp.button.elevated.selected.icon.color                  | md.sys.color.on-primary                  | M3-T1     |
| Button elevated disabled container color                                  | md.comp.button.elevated.disabled.container.color             | md.sys.color.on-surface                  | M3-T1     |
| Button elevated disabled container opacity                                | md.comp.button.elevated.disabled.container.opacity           | 0.1                                      | M3-T1     |
| Button elevated disabled container elevation                              | md.comp.button.elevated.disabled.container.elevation         | md.sys.elevation.level0                  | M3-T1     |
| Button elevated disabled label color                                      | md.comp.button.elevated.disabled.label-text.color            | md.sys.color.on-surface                  | M3-T1     |
| Button elevated disabled label opacity                                    | md.comp.button.elevated.disabled.label-text.opacity          | 0.38                                     | M3-T1     |
| Button elevated disabled icon color                                       | md.comp.button.elevated.disabled.icon.color                  | md.sys.color.on-surface                  | M3-T1     |
| Button elevated disabled icon opacity                                     | md.comp.button.elevated.disabled.icon.opacity                | 0.38                                     | M3-T1     |
| Button elevated hovered container state layer color                       | md.comp.button.elevated.hovered.state-layer.color            | md.sys.color.primary                     | M3-T1     |
| Button elevated hovered container state layer color - toggle (unselected) | md.comp.button.elevated.unselected.hovered.state-layer.color | md.sys.color.primary                     | M3-T1     |
| Button elevated hovered container state layer color - toggle (selected)   | md.comp.button.elevated.selected.hovered.state-layer.color   | md.sys.color.on-primary                  | M3-T1     |
| Button elevated hovered container state layer opacity                     | md.comp.button.elevated.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-T1     |
| Button elevated hovered label color                                       | md.comp.button.elevated.hovered.label-text.color             | md.sys.color.primary                     | M3-T1     |
| Button elevated hovered label color - toggle (unselected)                 | md.comp.button.elevated.unselected.hovered.label-text.color  | md.sys.color.primary                     | M3-T1     |
| Button elevated hovered label color - toggle (selected)                   | md.comp.button.elevated.selected.hovered.label-text.color    | md.sys.color.on-primary                  | M3-T1     |
| Button elevated hovered icon color                                        | md.comp.button.elevated.hovered.icon.color                   | md.sys.color.primary                     | M3-T1     |
| Button elevated hovered icon color - toggle (unselected)                  | md.comp.button.elevated.unselected.hovered.icon.color        | md.sys.color.primary                     | M3-T1     |
| Button elevated hovered icon color - toggle (selected)                    | md.comp.button.elevated.selected.hovered.icon.color          | md.sys.color.on-primary                  | M3-T1     |
| Button elevated pressed container state layer color                       | md.comp.button.elevated.pressed.state-layer.color            | md.sys.color.primary                     | M3-T1     |
| Button elevated pressed container state layer color - toggle (unselected) | md.comp.button.elevated.unselected.pressed.state-layer.color | md.sys.color.primary                     | M3-T1     |
| Button elevated pressed container state layer color - toggle (selected)   | md.comp.button.elevated.selected.pressed.state-layer.color   | md.sys.color.on-primary                  | M3-T1     |
| Button elevated pressed container state layer opacity                     | md.comp.button.elevated.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-T1     |
| Button elevated pressed container state layer elevation                   | md.comp.button.elevated.pressed.container.elevation          | md.sys.elevation.level1                  | M3-T1     |
| Button elevated pressed label color                                       | md.comp.button.elevated.pressed.label-text.color             | md.sys.color.primary                     | M3-T1     |
| Button elevated pressed label color - toggle (unselected)                 | md.comp.button.elevated.unselected.pressed.label-text.color  | md.sys.color.primary                     | M3-T1     |
| Button elevated pressed label color - toggle (selected)                   | md.comp.button.elevated.selected.pressed.label-text.color    | md.sys.color.on-primary                  | M3-T1     |
| Button elevated pressed icon color                                        | md.comp.button.elevated.pressed.icon.color                   | md.sys.color.primary                     | M3-T1     |
| Button elevated pressed icon color - toggle (unselected)                  | md.comp.button.elevated.unselected.pressed.icon.color        | md.sys.color.primary                     | M3-T1     |
| Button elevated pressed icon color - toggle (selected)                    | md.comp.button.elevated.selected.pressed.icon.color          | md.sys.color.on-primary                  | M3-T1     |
| Button elevated focused container state layer color                       | md.comp.button.elevated.focused.state-layer.color            | md.sys.color.primary                     | M3-T1     |
| Button elevated focused container state layer color - toggle (unselected) | md.comp.button.elevated.unselected.focused.state-layer.color | md.sys.color.primary                     | M3-T1     |
| Button elevated focused container state layer color - toggle (selected)   | md.comp.button.elevated.selected.focused.state-layer.color   | md.sys.color.on-primary                  | M3-T1     |
| Button elevated focused container state layer opacity                     | md.comp.button.elevated.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-T1     |
| Button elevated focused container state layer elevation                   | md.comp.button.elevated.focused.container.elevation          | md.sys.elevation.level1                  | M3-T1     |
| Button elevated focused label color                                       | md.comp.button.elevated.focused.label-text.color             | md.sys.color.primary                     | M3-T1     |
| Button elevated focused label color - toggle (unselected)                 | md.comp.button.elevated.unselected.focused.label-text.color  | md.sys.color.primary                     | M3-T1     |
| Button elevated focused label color - toggle (selected)                   | md.comp.button.elevated.selected.focused.label-text.color    | md.sys.color.on-primary                  | M3-T1     |
| Button elevated focused icon color                                        | md.comp.button.elevated.focused.icon.color                   | md.sys.color.primary                     | M3-T1     |
| Button elevated focused icon color - toggle (unselected)                  | md.comp.button.elevated.unselected.focused.icon.color        | md.sys.color.primary                     | M3-T1     |
| Button elevated focused icon color - toggle (selected)                    | md.comp.button.elevated.selected.focused.icon.color          | md.sys.color.on-primary                  | M3-T1     |

### Button - Color - Text

| Design role                             | Official component token                        | Official system role or value            | Source ID |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------- | --------- |
| Button text label color                 | md.comp.button.text.label-text.color            | md.sys.color.primary                     | M3-T1     |
| Button text icon color                  | md.comp.button.text.icon.color                  | md.sys.color.primary                     | M3-T1     |
| Button text hovered state layer color   | md.comp.button.text.hovered.state-layer.color   | md.sys.color.primary                     | M3-T1     |
| Button text hovered state layer opacity | md.comp.button.text.hovered.state-layer.opacity | md.sys.state.hover.state-layer-opacity   | M3-T1     |
| Button text hovered label color         | md.comp.button.text.hovered.label-text.color    | md.sys.color.primary                     | M3-T1     |
| Button text hovered icon color          | md.comp.button.text.hovered.icon.color          | md.sys.color.primary                     | M3-T1     |
| Button text focused state layer color   | md.comp.button.text.focused.state-layer.color   | md.sys.color.primary                     | M3-T1     |
| Button text focused state layer opacity | md.comp.button.text.focused.state-layer.opacity | md.sys.state.focus.state-layer-opacity   | M3-T1     |
| Button text focused label color         | md.comp.button.text.focused.label-text.color    | md.sys.color.primary                     | M3-T1     |
| Button text focused icon color          | md.comp.button.text.focused.icon.color          | md.sys.color.primary                     | M3-T1     |
| Button text pressed state layer color   | md.comp.button.text.pressed.state-layer.color   | md.sys.color.primary                     | M3-T1     |
| Button text pressed state layer opacity | md.comp.button.text.pressed.state-layer.opacity | md.sys.state.pressed.state-layer-opacity | M3-T1     |
| Button text pressed label color         | md.comp.button.text.pressed.label-text.color    | md.sys.color.primary                     | M3-T1     |
| Button text pressed icon color          | md.comp.button.text.pressed.icon.color          | md.sys.color.primary                     | M3-T1     |
| Button text disabled label color        | md.comp.button.text.disabled.label-text.color   | md.sys.color.on-surface                  | M3-T1     |
| Button text disabled label opacity      | md.comp.button.text.disabled.label-text.opacity | 0.38                                     | M3-T1     |
| Button text disabled icon color         | md.comp.button.text.disabled.icon.color         | md.sys.color.on-surface                  | M3-T1     |
| Button text disabled icon opacity       | md.comp.button.text.disabled.icon.opacity       | 0.38                                     | M3-T1     |
| Button text disabled container color    | md.comp.button.text.disabled.container.color    | md.sys.color.on-surface                  | M3-T1     |
| Button text disabled container opacity  | md.comp.button.text.disabled.container.opacity  | 0.1                                      | M3-T1     |

### Button - Color - Outlined

| Design role                                                               | Official component token                                     | Official system role or value            | Source ID |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | --------- |
| Button outlined outline color                                             | md.comp.button.outlined.outline.color                        | md.sys.color.outline-variant             | M3-T1     |
| Button outlined container color - toggle (selected)                       | md.comp.button.outlined.selected.container.color             | md.sys.color.inverse-surface             | M3-T1     |
| Button outlined label color                                               | md.comp.button.outlined.label-text.color                     | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined label color - toggle (unselected)                         | md.comp.button.outlined.unselected.label-text.color          | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined label color - toggle (selected)                           | md.comp.button.outlined.selected.label-text.color            | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined icon color                                                | md.comp.button.outlined.icon.color                           | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined icon color - toggle (unselected)                          | md.comp.button.outlined.unselected.icon.color                | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined icon color - toggle (selected)                            | md.comp.button.outlined.selected.icon.color                  | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined disabled outline color                                    | md.comp.button.outlined.disabled.outline.color               | md.sys.color.outline-variant             | M3-T1     |
| Button outlined hovered state layer color                                 | md.comp.button.outlined.hovered.state-layer.color            | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined hovered state layer color - toggle (unselected)           | md.comp.button.outlined.unselected.hovered.state-layer.color | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined hovered state layer color - toggle (selected)             | md.comp.button.outlined.selected.hovered.state-layer.color   | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined hovered state layer opacity                               | md.comp.button.outlined.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-T1     |
| Button outlined hovered outline color                                     | md.comp.button.outlined.hovered.outline.color                | md.sys.color.outline-variant             | M3-T1     |
| Button outlined hovered outline color - toggle (unselected)               | md.comp.button.outlined.unselected.hovered.outline.color     | md.sys.color.outline-variant             | M3-T1     |
| Button outlined hovered label color                                       | md.comp.button.outlined.hovered.label-text.color             | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined hovered label color - toggle (unselected)                 | md.comp.button.outlined.unselected.hovered.label-text.color  | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined hovered label color - toggle (selected)                   | md.comp.button.outlined.selected.hovered.label-text.color    | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined hovered icon color                                        | md.comp.button.outlined.hovered.icon.color                   | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined hovered icon color - toggle (unselected)                  | md.comp.button.outlined.unselected.hovered.icon.color        | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined hovered icon color - toggle (selected)                    | md.comp.button.outlined.selected.hovered.icon.color          | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined focused container state layer color                       | md.comp.button.outlined.focused.state-layer.color            | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined focused container state layer color - toggle (unselected) | md.comp.button.outlined.unselected.focused.state-layer.color | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined focused container state layer color - toggle (selected)   | md.comp.button.outlined.selected.focused.state-layer.color   | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined focused container state layer opacity                     | md.comp.button.outlined.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-T1     |
| Button outlined focused outline color                                     | md.comp.button.outlined.focused.outline.color                | md.sys.color.outline-variant             | M3-T1     |
| Button outlined focused outline color - toggle (unselected)               | md.comp.button.outlined.unselected.focused.outline.color     | md.sys.color.outline-variant             | M3-T1     |
| Button outlined focused label color                                       | md.comp.button.outlined.focused.label-text.color             | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined focused label color - toggle (unselected)                 | md.comp.button.outlined.unselected.focused.label-text.color  | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined focused label color - toggle (selected)                   | md.comp.button.outlined.selected.focused.label-text.color    | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined focused icon color                                        | md.comp.button.outlined.focused.icon.color                   | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined focused icon color - toggle (unselected)                  | md.comp.button.outlined.unselected.focused.icon.color        | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined focused icon color - toggle (selected)                    | md.comp.button.outlined.selected.focused.icon.color          | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined pressed container state layer color                       | md.comp.button.outlined.pressed.state-layer.color            | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined pressed container state layer color - toggle (unselected) | md.comp.button.outlined.unselected.pressed.state-layer.color | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined pressed container state layer color - toggle (selected)   | md.comp.button.outlined.selected.pressed.state-layer.color   | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined pressed container state layer opacity                     | md.comp.button.outlined.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-T1     |
| Button outlined pressed outline color                                     | md.comp.button.outlined.pressed.outline.color                | md.sys.color.outline-variant             | M3-T1     |
| Button outlined pressed outline color - toggle (unselected)               | md.comp.button.outlined.unselected.pressed.outline.color     | md.sys.color.outline-variant             | M3-T1     |
| Button outlined pressed label color                                       | md.comp.button.outlined.pressed.label-text.color             | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined pressed label color - toggle (unselected)                 | md.comp.button.outlined.unselected.pressed.label-text.color  | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined pressed label color - toggle (selected)                   | md.comp.button.outlined.selected.pressed.label-text.color    | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined pressed icon color                                        | md.comp.button.outlined.pressed.icon.color                   | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined pressed icon color - toggle (unselected)                  | md.comp.button.outlined.unselected.pressed.icon.color        | md.sys.color.on-surface-variant          | M3-T1     |
| Button outlined pressed icon color - toggle (selected)                    | md.comp.button.outlined.selected.pressed.icon.color          | md.sys.color.inverse-on-surface          | M3-T1     |
| Button outlined disabled icon opacity                                     | md.comp.button.outlined.disabled.icon.opacity                | 0.38                                     | M3-T1     |
| Button outlined disabled container opacity                                | md.comp.button.outlined.disabled.container.opacity           | 0.1                                      | M3-T1     |
| Button outlined disabled label opacity                                    | md.comp.button.outlined.disabled.label-text.opacity          | 0.38                                     | M3-T1     |
| Button outlined disabled icon color                                       | md.comp.button.outlined.disabled.icon.color                  | md.sys.color.on-surface                  | M3-T1     |
| Button outlined disabled label color                                      | md.comp.button.outlined.disabled.label-text.color            | md.sys.color.on-surface                  | M3-T1     |
| Button outlined disabled outline color (unselected)                       | md.comp.button.outlined.unselected.disabled.outline.color    | md.sys.color.outline-variant             | M3-T1     |
| Button outlined disabled container color (selected)                       | md.comp.button.outlined.selected.disabled.container.color    | md.sys.color.on-surface                  | M3-T1     |

### Button - Color - Tonal

| Design role                                                            | Official component token                                  | Official system role or value            | Source ID |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- | --------- |
| Button tonal hovered container elevation                               | md.comp.button.tonal.hovered.container.elevation          | md.sys.elevation.level1                  | M3-T1     |
| Button tonal container color                                           | md.comp.button.tonal.container.color                      | md.sys.color.secondary-container         | M3-T1     |
| Button tonal container color - toggle (unselected)                     | md.comp.button.tonal.unselected.container.color           | md.sys.color.secondary-container         | M3-T1     |
| Button tonal container color - toggle (selected)                       | md.comp.button.tonal.selected.container.color             | md.sys.color.secondary                   | M3-T1     |
| Button tonal shadow color                                              | md.comp.button.tonal.container.shadow-color               | md.sys.color.shadow                      | M3-T1     |
| Button tonal elevation                                                 | md.comp.button.tonal.container.elevation                  | md.sys.elevation.level0                  | M3-T1     |
| Button tonal label color                                               | md.comp.button.tonal.label-text.color                     | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal label color - toggle (unselected)                         | md.comp.button.tonal.unselected.label-text.color          | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal label color - toggle (selected)                           | md.comp.button.tonal.selected.label-text.color            | md.sys.color.on-secondary                | M3-T1     |
| Button tonal icon color                                                | md.comp.button.tonal.icon.color                           | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal icon color - toggle (unselected)                          | md.comp.button.tonal.unselected.icon.color                | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal icon color - toggle (selected)                            | md.comp.button.tonal.selected.icon.color                  | md.sys.color.on-secondary                | M3-T1     |
| Button tonal disabled container color                                  | md.comp.button.tonal.disabled.container.color             | md.sys.color.on-surface                  | M3-T1     |
| Button tonal disabled container opacity                                | md.comp.button.tonal.disabled.container.opacity           | 0.1                                      | M3-T1     |
| Button tonal disabled container elevation                              | md.comp.button.tonal.disabled.container.elevation         | md.sys.elevation.level0                  | M3-T1     |
| Button tonal disabled label color                                      | md.comp.button.tonal.disabled.label-text.color            | md.sys.color.on-surface                  | M3-T1     |
| Button tonal disabled icon color                                       | md.comp.button.tonal.disabled.icon.color                  | md.sys.color.on-surface                  | M3-T1     |
| Button tonal disabled icon opacity                                     | md.comp.button.tonal.disabled.icon.opacity                | 0.38                                     | M3-T1     |
| Button tonal disabled label opacity                                    | md.comp.button.tonal.disabled.label-text.opacity          | 0.38                                     | M3-T1     |
| Button tonal hovered container state layer color                       | md.comp.button.tonal.hovered.state-layer.color            | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal hovered container state layer color - toggle (unselected) | md.comp.button.tonal.unselected.hovered.state-layer.color | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal hovered container state layer color - toggle (selected)   | md.comp.button.tonal.selected.hovered.state-layer.color   | md.sys.color.on-secondary                | M3-T1     |
| Button tonal hovered container state layer opacity                     | md.comp.button.tonal.hovered.state-layer.opacity          | md.sys.state.hover.state-layer-opacity   | M3-T1     |
| Button tonal hovered label color                                       | md.comp.button.tonal.hovered.label-text.color             | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal hovered label color - toggle (unselected)                 | md.comp.button.tonal.unselected.hovered.label-text.color  | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal hovered label color - toggle (selected)                   | md.comp.button.tonal.selected.hovered.label-text.color    | md.sys.color.on-secondary                | M3-T1     |
| Button tonal hovered icon color                                        | md.comp.button.tonal.hovered.icon.color                   | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal hovered icon color - toggle (unselected)                  | md.comp.button.tonal.unselected.hovered.icon.color        | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal hovered icon color - toggle (selected)                    | md.comp.button.tonal.selected.hovered.icon.color          | md.sys.color.on-secondary                | M3-T1     |
| Button tonal focused container state layer color                       | md.comp.button.tonal.focused.state-layer.color            | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal focused container state layer color - toggle (unselected) | md.comp.button.tonal.unselected.focused.state-layer.color | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal focused container state layer color - toggle (selected)   | md.comp.button.tonal.selected.focused.state-layer.color   | md.sys.color.on-secondary                | M3-T1     |
| Button tonal focused container state layer opacity                     | md.comp.button.tonal.focused.state-layer.opacity          | md.sys.state.focus.state-layer-opacity   | M3-T1     |
| Button tonal focused container state layer elevation                   | md.comp.button.tonal.focused.container.elevation          | md.sys.elevation.level0                  | M3-T1     |
| Button tonal focused label color                                       | md.comp.button.tonal.focused.label-text.color             | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal focused label color - toggle (unselected)                 | md.comp.button.tonal.unselected.focused.label-text.color  | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal focused label color - toggle (selected)                   | md.comp.button.tonal.selected.focused.label-text.color    | md.sys.color.on-secondary                | M3-T1     |
| Button tonal focused icon color                                        | md.comp.button.tonal.focused.icon.color                   | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal focused icon color - toggle (unselected)                  | md.comp.button.tonal.unselected.focused.icon.color        | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal focused icon color - toggle (selected)                    | md.comp.button.tonal.selected.focused.icon.color          | md.sys.color.on-secondary                | M3-T1     |
| Button tonal pressed container state layer color                       | md.comp.button.tonal.pressed.state-layer.color            | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal pressed container state layer color - toggle (unselected) | md.comp.button.tonal.unselected.pressed.state-layer.color | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal pressed container state layer color - toggle (selected)   | md.comp.button.tonal.selected.pressed.state-layer.color   | md.sys.color.on-secondary                | M3-T1     |
| Button tonal pressed container state layer opacity                     | md.comp.button.tonal.pressed.state-layer.opacity          | md.sys.state.pressed.state-layer-opacity | M3-T1     |
| Button tonal pressed container state layer elevation                   | md.comp.button.tonal.pressed.container.elevation          | md.sys.elevation.level0                  | M3-T1     |
| Button tonal pressed label color                                       | md.comp.button.tonal.pressed.label-text.color             | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal pressed label color - toggle (unselected)                 | md.comp.button.tonal.unselected.pressed.label-text.color  | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal pressed label color - toggle (selected)                   | md.comp.button.tonal.selected.pressed.label-text.color    | md.sys.color.on-secondary                | M3-T1     |
| Button tonal pressed icon color                                        | md.comp.button.tonal.pressed.icon.color                   | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal pressed icon color - toggle (unselected)                  | md.comp.button.tonal.unselected.pressed.icon.color        | md.sys.color.on-secondary-container      | M3-T1     |
| Button tonal pressed icon color - toggle (selected)                    | md.comp.button.tonal.selected.pressed.icon.color          | md.sys.color.on-secondary                | M3-T1     |

## Motion

| Requirement ID | Transition                  | Trigger                                                  | From                                                     | To                                                           | Motion model                                                                                                     | Published parameters                                                                                                                                                                                  | Source ID  |
| -------------- | --------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| MOT-01         | Press shape morph           | Pointer or keyboard press (pressed state entered/exited) | Resting corner radius (round `full`, or square per size) | Pressed corner radius per size (8dp XS/S, 12dp M, 16dp L/XL) | Spring (not duration/easing)                                                                                     | `md.sys.motion.spring.fast.spatial.damping` = 0.6, `md.sys.motion.spring.fast.spatial.stiffness` = 800; tokenized per size, e.g. `md.comp.button.small.pressed.container.corner-size.motion.spring.*` | M3-T1      |
| MOT-02         | Toggle selection shape swap | Toggle button selected/unselected change                 | Resting shape before the change (round or square)        | Opposite resting shape (square or round)                     | Not specified by the inspected Material MCP records beyond the press-morph spring tokens above (see Source gaps) | Not specified by the inspected Material MCP records                                                                                                                                                   | M3-1, M3-2 |
| MOT-03         | Rapid-click smoothing (web) | Multiple rapid clicks/taps in succession                 | —                                                        | —                                                            | Not specified by the inspected Material MCP records (described only as "a modified motion curve")                | Not specified by the inspected Material MCP records                                                                                                                                                   | M3-4       |

### Interruption and reduced motion

| Requirement ID | Condition                                                   | Published behavior                                                                                                                                                                             | Source ID |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| MOT-04         | Any (press morph, toggle shape swap, rapid-click smoothing) | Not specified by the inspected Material MCP records — no interruption-handling or reduced-motion guidance for button motion appears on the Overview, Specs, Guidelines, or Accessibility pages | —         |

## Accessibility

| Requirement ID | Area                           | Published Material requirement                                                                                                                                                                                                                                                     | Conditions or exceptions | Source ID |
| -------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- |
| ACC-01         | Assistive technology use cases | People must be able to use a button to perform an action, and to navigate to and activate a button, with assistive technology                                                                                                                                                      | —                        | M3-4      |
| ACC-02         | Color contrast                 | Enabled buttons need a 3:1 contrast ratio with the background; measured from the container for elevated, filled, and tonal styles, and from the label text for outlined and text styles                                                                                            | —                        | M3-4      |
| ACC-03         | 200% text size                 | Avoid excessive text wrapping or truncation by choosing concise strings; on Android, button labels should be kept concise enough to fit within two lines after text size is increased to 200%; if truncated, provide an alternative way to access the full content in a single tap | —                        | M3-4      |
| ACC-04         | Rapid-click motion             | On the web, use a modified motion curve to avoid resonant effects from overlapping animations when rapid clicks/taps are expected                                                                                                                                                  | —                        | M3-4      |
| ACC-05         | Keyboard navigation            | Tab navigates to a button; Space or Enter activates it                                                                                                                                                                                                                             | —                        | M3-4      |
| ACC-06         | Accessible label               | The accessibility label should match the visible label text (e.g. "Done", "Send", "Reply"); it can contain extra contextual information if necessary                                                                                                                               | —                        | M3-4      |

## Directionality and adaptation

| Requirement ID | Condition                  | Required behavior                                                                                                                                        | Source ID |
| -------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| ADA-01         | Right-to-left languages    | Leading icon placement mirrors to the trailing edge (right of the label in LTR becomes left of the label in RTL)                                         | M3-3      |
| ADA-02         | Compact window             | Buttons may be end-aligned below related content                                                                                                         | M3-3      |
| ADA-03         | Large/expanded window      | Buttons may be start-aligned beside related content instead of below it                                                                                  | M3-3      |
| ADA-04         | Any width change           | Icon and label stay grouped and centered as button width changes; don't anchor icon and label to opposite edges                                          | M3-3      |
| ADA-05         | Any width change           | Container width should not be allowed to stretch into very long, sparsely filled buttons; constrain width or place buttons beside other elements instead | M3-3      |
| ADA-06         | Screens of different sizes | Item order, including button order, must remain consistent between large and small screens for screen reader and keyboard navigation                     | M3-3      |

## Cross-section consistency

| Check                              | Result | Related requirement IDs                                                   | Resolution or conflict ID                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content vs accessibility           | pass   | CNT-03, CNT-02, ACC-03, ACC-06                                            | Label no-wrap/no-truncate (CNT-03) is consistent with the 200%-text-size two-line guidance (ACC-03); sentence-case labeling (CNT-02) is consistent with the accessible-label-matches-visible-label rule (ACC-06)                                                               |
| States vs interaction              | pass   | STA-05, SHP-03, INT-03, STA-06, INT-04                                    | Pressed-state shape morph (STA-05, SHP-03) matches the press interaction behavior (INT-03); Toggle selected/unselected state (STA-06) matches toggle activation behavior (INT-04)                                                                                              |
| Visual summaries vs token tables   | pass   | DIM-01–DIM-04, COL-01–COL-13, ELV-01–ELV-09, SHP-01–SHP-06, TYP-01–TYP-04 | Size dimension summaries (DIM) match the `Button - Size - *` token tables; color summaries (COL) match the `Button - Color - *` token tables; elevation (ELV) and shape (SHP) summaries match their token entries in the same tables                                           |
| Motion vs token inventory and gaps | pass   | MOT-01, MOT-02, MOT-04                                                    | Press-morph spring parameters (MOT-01) are backed by the size token tables (`*.pressed.container.corner-size.motion.spring.*`); the toggle shape-swap transition (MOT-02) and interruption/reduced-motion behavior (MOT-04) are recorded as source gaps, not invented values   |
| Family boundary vs related records | pass   | FAM-01–FAM-09                                                             | Component identity's family boundary (Default/Toggle × 5 color styles only) matches the Official family and related components table, which places Icon buttons, Segmented buttons, Split button, Button groups, FAB, Extended FAB, and FAB menu outside this artifact's scope |

## Canonical conformance matrix

| ID    | Member         | Variant | Size        | Configuration                    | State              | Scheme or direction          | Requirement IDs                                                               | Token references                                                                                                       | Source IDs        |
| ----- | -------------- | ------- | ----------- | -------------------------------- | ------------------ | ---------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------- |
| CB-01 | Common buttons | Default | Small       | Filled, round                    | Enabled            | Light, LTR                   | VAR-01, CFG-02, CFG-06, SIZ-02, ANA-01–ANA-02, STA-01, DIM-01, COL-04, TYP-01 | md.comp.button.filled.container.color, md.comp.button.filled.label-text.color, md.comp.button.small.container.height   | M3-2, M3-T1       |
| CB-02 | Common buttons | Default | Small       | Filled, round                    | Disabled           | Light, LTR                   | STA-02                                                                        | md.comp.button.filled.disabled.container.opacity, md.comp.button.filled.disabled.label-text.opacity                    | M3-2, M3-T1       |
| CB-03 | Common buttons | Default | Small       | Filled, round                    | Hovered            | Light, LTR                   | STA-03, FOC-01, ELV-06                                                        | md.comp.button.filled.hovered.state-layer.opacity, md.comp.button.filled.hovered.container.elevation                   | M3-2, M3-T1       |
| CB-04 | Common buttons | Default | Small       | Filled, round                    | Focused            | Light, LTR                   | STA-04, FOC-02, INT-01                                                        | md.comp.button.filled.focused.state-layer.opacity                                                                      | M3-2, M3-4, M3-T1 |
| CB-05 | Common buttons | Default | Small       | Filled, round                    | Pressed            | Light, LTR                   | STA-05, FOC-03, INT-03, SHP-03, MOT-01                                        | md.comp.button.small.pressed.container.shape, md.comp.button.small.pressed.container.corner-size.motion.spring.damping | M3-2, M3-T1       |
| CB-06 | Common buttons | Default | Medium      | Elevated, round                  | Enabled            | Dark, LTR                    | CFG-01, SIZ-03, DIM-01, COL-01, ELV-01, TYP-02                                | md.comp.button.elevated.container.color, md.comp.button.elevated.container.elevation                                   | M3-2, M3-T1       |
| CB-07 | Common buttons | Default | Large       | Tonal, square                    | Enabled            | Light, LTR                   | CFG-03, CFG-07, SIZ-04, SHP-02, COL-07                                        | md.comp.button.large.container.shape.square, md.comp.button.tonal.container.color                                      | M3-2, M3-T1       |
| CB-08 | Common buttons | Default | Extra large | Outlined, round                  | Enabled            | Light, RTL                   | CFG-04, SIZ-05, DIM-04, ADA-01                                                | md.comp.button.xlarge.outlined.outline.width                                                                           | M3-2, M3-3, M3-T1 |
| CB-09 | Common buttons | Default | Extra small | Text                             | Enabled            | Light, LTR                   | CFG-05, ANA-01, COL-13, SCM-03                                                | md.comp.button.text.label-text.color                                                                                   | M3-2, M3-T1       |
| CB-10 | Common buttons | Toggle  | Small       | Filled, round (unselected)       | Unselected         | Light, LTR                   | VAR-02, STA-07, COL-05                                                        | md.comp.button.filled.unselected.container.color                                                                       | M3-2, M3-T1       |
| CB-11 | Common buttons | Toggle  | Small       | Filled, square (selected)        | Selected           | Light, LTR                   | STA-06, SHP-04, INT-04, COL-06                                                | md.comp.button.filled.selected.container.color, md.comp.button.small.selected.container.shape.square                   | M3-1, M3-2, M3-T1 |
| CB-12 | Common buttons | Toggle  | Medium      | Outlined                         | Selected + Hovered | Light, LTR                   | SCM-02, COL-12                                                                | md.comp.button.outlined.selected.hovered.state-layer.color                                                             | M3-2, M3-T1       |
| CB-13 | Common buttons | Default | Small       | Filled, round                    | Enabled            | Light (high contrast), LTR   | COL-04                                                                        | md.comp.button.filled.label-text.color (role: `light-high-contrast`)                                                   | M3-T1             |
| CB-14 | Common buttons | Default | Small       | Filled, round, with leading icon | Enabled            | Light, LTR                   | ANA-03, ICO-01, CNT-04, CNT-06, DIM-03                                        | md.comp.button.small.icon.size, md.comp.button.small.icon-label-space                                                  | M3-2, M3-3        |
| CB-15 | Common buttons | Default | Small       | Filled, round, long label        | Enabled            | Light, LTR (200% text scale) | CNT-03, ACC-03                                                                | —                                                                                                                      | M3-3, M3-4        |

## Source conflicts

None.

## Source gaps

- The 48×48dp minimum target-size requirement on the Specs page's "Target areas" section is stated explicitly for "extra small and small icon buttons"; the inspected Buttons pages do not state an explicit minimum target size for extra-small or small default/toggle buttons that carry a text label (M3-2).
- Motion timing (duration/easing or spring parameters) for the toggle selected/unselected resting-shape swap, independent of the press-morph spring tokens, is not specified by the inspected Material MCP records.
- Interruption-handling and reduced-motion behavior for button shape-morph and rapid-click motion are not specified by the inspected Material MCP records.
- The current `md.comp.button.<color>.*` token family does not define a keyboard focus-ring/indicator token (offset, thickness, color). Only the deprecated legacy per-variant token sets (e.g. `md.comp.filled-button.focus.indicator.*`, present in the same `token-table` resource under `[Deprecated] Button - Filled` etc.) define such tokens; they are superseded and not restated as current guidance.
- The exact motion curve for the web "rapid clicks" smoothing behavior is described only qualitatively ("a modified motion curve"); no named curve, duration, or easing value is published (M3-4).
- A formal taxonomy "Category" label for this component is not reported by the inspected material3 MCP records.
- The MCP cache schema/version is not reported by the `material_docs_cache_status` tool; only `capturedAt`, freshness, and coverage-health fields are available.

## Design acceptance criteria

- [x] The official target and family boundary are deterministic.
- [x] MCP snapshot provenance is recorded (cache `capturedAt`; schema/version explicitly reported unavailable).
- [x] Every component route is accounted for in Source coverage.
- [x] Token-table groups and unresolved resources are accounted for (0 unresolved of 73).
- [x] The complete official surface represented by the MCP snapshot is documented.
- [x] Variants, configurations, sizes, and states are distinct.
- [x] Every behavior/design requirement has a requirement ID and source ID.
- [x] Every token row uses an official token name and source ID.
- [x] Cross-section consistency checks pass or blocking conflicts are recorded.
- [x] Missing guidance and conflicts are explicit.
- [x] The conformance matrix references only defined requirements, official tokens, and sources.
- [x] Motion is represented using its published model and parameters.
- [x] No Mioframe architecture, code, test, or migration decision is present.
