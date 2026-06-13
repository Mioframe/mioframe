# MDList implementation note

## Material note

- Relevant Material surfaces checked:
  - `components/lists/overview.md`
  - `components/lists/guidelines.md`
  - `components/lists/specs.md`
  - `components/lists/accessibility.md`
  - `foundations/design-tokens/overview.md`
- Relevant project policy checked:
  - `docs/material-3/component-registry.md`
  - `docs/material-3/component-family-audit.md`
  - `docs/material-3/shared-ui-api.md`
  - `docs/material-3/interaction-states.md`
  - `docs/material-3/verification.md`
- Figma nodes used as visual references:
  - `59106:13029` standard list, one-line
  - `59106:13049` standard list, multi-line
  - `59106:13164` segmented filled list, one-line
  - `59106:13069` segmented filled list, multi-line
  - `59106:13183` list item state matrix
  - `51964:63037` baseline one-line reference
- Decision impact:
  - `MDList` owns list style, grouping, shape, spacing, semantics, and any future list-level selection context.
  - `MDListItem` owns anatomy and valid interaction modes only.
  - Standard and segmented are the supported list styles.
  - List-level single-select and multi-select behavior is supported through controlled `selectionMode` plus `modelValue`.
  - Baseline rows keep 56dp / 72dp / 88dp minimum container heights; expressive rows use a 64dp one-line minimum and keep the 72dp / 88dp multi-line thresholds.
  - Menu surfaces override row minimum height through the shared `--md-comp-list-item-min-container-height` contract instead of stale item-local variables.
- Deviation:
  - Live Figma verification for the cited Lists page is currently blocked by the workspace Figma MCP Starter-plan rate limit.
  - Expressive height verification is derived from the current Material cache plus the shared list geometry after Figma MCP inspection was blocked; re-check against the Design Kit when the rate limit resets.
  - Selection rows currently use a shared checkmark indicator instead of Material-specific radio or checkbox controls.
- Verification surface:
  - focused unit tests for DOM structure and invalid combinations
  - Storybook matrix for supported list variants and states
  - Playwright browser/visual coverage for DOM/roles, target sizes, and list state geometry

## Owner map

- Source of truth: `src/shared/ui/Lists/*`
- Runtime owner: `MDList` provides style/semantics context; `MDListItem` consumes it
- User-action owner: consumers still own open/select/menu actions; shared UI only structures them
- UI composition owner: `MDList` and `MDListItem`
- Error owner: shared UI dev warnings for invalid public combinations
- Retry/navigation owner: unchanged in feature/widget consumers
- Verification owner: list-family unit tests, Storybook, Playwright visual/browser checks, final `pnpm verify`

## Supported in this pass

- List styles:
  - `standard`
  - `segmented`
- Item modes:
  - `static`
  - `single-action`
  - `multi-action`
- Anatomy:
  - leading icon
  - leading avatar
  - overline
  - label
  - supporting text
  - trailing text/icon content
  - trailing action
- Line counts:
  - one-line
  - two-line
  - three-line
- States:
  - enabled
  - disabled
  - hover
  - focus
  - pressed
  - dragged
  - selected through list-level selection mode

## Not supported in this pass

- expandable/swipe list variants
- project-specific grid layout on `MDList`/`MDListContainer`

## DOM contract

- Non-selectable lists render a list container (`div[role="list"]` by default, `ul` only when children are guaranteed `li` wrappers).
- Every item renders a stable outer wrapper with list-item semantics (`li` or `div[role="listitem"]`).
- Single-action items render the primary action as an internal `button` or `a`, not as the listitem root.
- Multi-action items render one internal primary action plus one independent trailing action region.
- No native interactive element may be nested inside another native interactive element.

## Mode contract

- Static:
  - no primary action surface
  - trailing content allowed, but it does not imply row action
- Single-action:
  - requires a real `@action` listener or `href`
  - full-row state layer belongs to the internal primary action
  - no secondary interactive control inside the primary action
- Single-select / multi-select:
  - selection is owned by `MDList`, not an item-level `selected` prop
  - rows require primitive `value` props
  - selected state uses `role="option"` and a non-color indicator
  - rows without a provided `value` render as disabled options and stay out of roving focus
  - nested trailing actions are invalid
- Multi-action:
  - requires a real primary action
  - requires at least one secondary action
  - primary state layer covers the row action surface only
  - trailing action stays independent

## Acceptance and risk notes

- Acceptance:
  - list style fully controls segmented vs standard geometry
  - consumers stop patching list-item radius directly
  - `ul` usage cannot produce invalid child structure
  - stories only show valid Material configurations
- Risks:
  - menu surfaces previously relied on `MDListContainer`; the migration must preserve overlay behavior after moving menus off list semantics
  - repository and home-like consumers currently patch shape locally; those overrides must be removed or narrowed
  - live Figma node verification may remain blocked until the plan limit resets or is upgraded
  - expressive row-height verification should still be re-checked against the Design Kit when Figma MCP access is available again
