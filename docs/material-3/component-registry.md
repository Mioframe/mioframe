# Material 3 component registry

## Principle

The shared UI kit must be tracked as a registry that maps official Material 3 surfaces to project components, Storybook pages, tokens, verification, and deviations.

Do not migrate components only by local inspection. Use the registry to keep the UI kit coherent and avoid duplicating or partially reimplementing the same Material surface in multiple places.

## Source basis

Unless a row says otherwise, Material rows reference the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`. Historical fallback evidence from `Vyachean/m3-docs-cache` captured at `2026-05-19T05:56:22.642Z` remains a separate source.

The Button-family rows instead use the verified `Vyachean/m3-docs-cache` snapshot:

- commit: `49ffae58a61f86c28b23720696dc9d07b6945483`
- capturedAt: `2026-07-13T12:48:04.850Z`
- failedPageCount: `0`
- suspiciousPageCount: `0`
- coverageHealth: `verified`

See [Component family audit](./component-family-audit.md) for detailed family findings and [current Button audit](./audits/button.md) for the active pilot blockers.

## Related audit documents

- [Material 3 foundation audit](./foundation-audit.md)
- [Foundation audit details](./foundation-audit-details.md)
- [Component family audit](./component-family-audit.md)
- [Secondary component family audit](./secondary-component-family-audit.md)

## Status values

Use these values consistently:

- `missing`: no project component exists.
- `partial`: project component exists but is not fully aligned or verified.
- `aligned`: component has docs-backed API, tokens, Storybook, verification, documented deviations, external gates, and required operator acceptance.
- `project-specific`: component is not an official Material component but uses Material foundations.
- `deprecated`: component remains only as a compatibility surface.
- `blocked`: Material guidance is missing, conflicting, or unavailable.

## Registry row fields

Each row should record:

- Material surface;
- project component or components;
- status;
- Material docs checked;
- token and public API status;
- Storybook and browser verification status;
- deviations or unsupported features.

## Foundation audit snapshot

Rows below are intentionally conservative. `partial` does not mean Material 3 alignment. It means the implementation still has explicitly recorded alignment or verification work.

### Primary official surfaces

- Buttons: `MDButton` is `partial`.
  Canonical owner: `src/shared/ui/material/components/button`; physical relocation, root export, consumer migration, and legacy MDButton removal are implemented in PR #150.
  Material evidence: Button overview, specs, accessibility, motion pages, token graph, and the July 13 verified fallback snapshot. The repository must reconcile whether `guidelines.md` was inspected before terminal alignment is claimed.
  Current state: five styles, five sizes, round/square shapes, default/toggle variants, native semantics, loading extension, public token routing, Storybook, and focused tests exist under the canonical owner.
  Remaining work: the motion finding was closed through aliases to the same pre-existing duration/easing rather than a real dependency from the official spring inputs; the universal-selector elevation fix has an unresolved cross-family cascade blast radius; source/status records require reconciliation; current-head CI and operator visual acceptance remain external gates. See [`docs/material-3/audits/button.md`](./audits/button.md).
  Split Button and Button Groups remain unsupported.

- Icon buttons: `MDIconButton` is `partial`.
  Material docs checked: icon-button overview/specs and applicable motion pages via the July 13 verified fallback snapshot.
  Current state: official `filled` default, four styles, five sizes, three widths, two shapes, default/toggle variants, selected/disabled routing, component tokens, accessibility, Storybook, and core browser verification are implemented. Existing low-emphasis consumers explicitly request `standard`.
  Remaining work: icon-color motion ownership and final override verification. Loading and rich tooltip behavior are Mioframe extensions. Split Button and Button Groups are unsupported.

- Floating action buttons: `MDFab` and `MDExtendedFab` are `partial`; `FabContainer` is `project-specific`.
  Material docs checked: FAB and Extended FAB overview/specs plus applicable motion pages via the July 13 verified fallback snapshot.
  Current state: supported colors/sizes, token routing, accessibility, Storybook, and representative browser verification exist.
  Remaining work: child label/icon motion ownership and complete rendered-shadow/focus-indicator verification. Loading is a Mioframe extension. FAB disabled state, FAB Menu, legacy Small FAB, and lowered/surface FAB are unsupported. `FabContainer` owns placement only.

- Lists: `MDList`, `MDListItem`, and `MDListSelectionItem` are `partial`.
  Material docs checked: lists overview/specs/guidelines/accessibility plus applicable token and state-layer guidance.
  Current state: standard/segmented styles, explicit static/single-action/multi-action modes, list/listbox semantics, controlled selection, segmented geometry, current Expressive row heights, state routing, surface context, Storybook, and focused browser coverage are implemented.
  Remaining work: live Figma comparison and complete accessibility verification; selection rows currently use a shared check indicator rather than Material-specific radio/checkbox controls.

- Dialogs: shared `Dialog/*` surfaces are `partial`. Verify modal semantics, actions, focus, scroll, adaptive layout, and destructive flows.
- Text fields: `MDTextField` and `MDFieldContainer` are `partial`. Verify labels, supporting/error text, value contract, slots, and states.
- Selection controls: `MDCheckbox`, `MDCheckboxField`, and `MDSelectBase` are `partial`. Verify checkbox/select semantics, keyboard behavior, menu ownership, and accessibility.

- Switch: `MDSwitch` is `partial`.
  Current state: Material token layer, selected/disabled/presentation API, icon slots, click/keyboard/pointer interaction, target sizing, state layer, focus route, Storybook, unit tests, and browser scenarios exist.
  Remaining work: complete the independent stateful pilot after Button M1 reaches its terminal state; verify current source snapshot, focus/browser evidence, cancellation, and operator visual acceptance without reusing Button-specific assumptions.

- Chips: `MDChipBase` and chip wrappers are `partial`. Verify strict chip type contracts and invalid combinations.
- Menus: `MDMenuBase`, `MDMenuItemBase`, and `MDContextMenuButton` are `partial`. Verify positioning, keyboard, focus, selection, and context-menu extension.
- Bottom sheets: `MDBottomSheet*` surfaces are `partial`. Verify modal/persistent behavior, drag handle, focus, scroll, back behavior, and duplicate `*2` surfaces.

- Cards: `MDCard` is `aligned` as a Material card container/surface component.
  Scope: Material container variants, tokens, surface context, static/actionable interaction, state layer, ripple, focus, disabled, and dragged state. Consumer-owned card content is not missing component API.

- Tooltips: `MDPlainTooltip` is `partial`; `MDRichTooltip` is `project-specific` until its Material mapping is re-established from current sources.
- Snackbar: `MDSnackbar` is `partial`. Verify timeout/action/dismiss behavior, accessibility announcements, and responsive placement.
- Navigation: `MDNavigationBar`, `MDNavigationRail`, and `MDNavigationDrawer` are `partial`. Verify destination state, layout/adaptive transitions, accessibility, and badges.
- Tabs: `MDTabs` and tab surfaces are `partial`. Verify primary/secondary contracts, indicator, scrolling, keyboard behavior, and accessibility.
- App bars and toolbars: `MDAppBar` and `MDTopAppBar` are `partial`; project toolbar compositions remain outside official component ownership until mapped.
- Progress indicators: circular/linear components are `partial`. Verify determinate/indeterminate contracts, motion, accessibility, and token parity.
- Sliders: slider surfaces are `partial`. Verify value/range semantics, keyboard/pointer behavior, ticks, labels, and accessibility.
- Search: search surfaces are `partial`. Verify bar/view distinction, suggestions/results, keyboard behavior, and accessibility.
- Dividers: divider surfaces are `partial`. Verify inset/full-width variants, semantics, and tokens.
- Badges: badge surfaces are `partial`. Verify small/large contracts, content limits, placement ownership, and accessibility.
- Segmented buttons: segmented-button surfaces are `partial`. Verify single/multi selection, layout, states, and accessibility.

## Registry update rule

A coding agent without GitHub access updates factual implementation state but must keep the family non-terminal. A GitHub-enabled reviewer may set `aligned` only after commit-bound audit evidence, current-head CI, and required operator visual acceptance.
