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
  - Full list-level selection is deferred in this pass. Item-level `selected` modes are removed from supported public API/status rather than presented as partial Material support.
- Deviation:
  - Full single-select and multi-select listbox behavior is not implemented in this pass because the repo has no shared roving-focus/listbox foundation and the task scope also requires a broad container/style migration. This remains a documented gap, not a claimed supported feature.
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

## Not supported in this pass

- public list selection modes
- listbox/option semantics
- roving keyboard behavior for selection lists
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
  - visual baselines will need careful refresh after geometry changes
