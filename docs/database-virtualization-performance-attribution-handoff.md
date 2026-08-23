# Database virtualization performance diagnostic handoff

Status: **superseded; do not execute**.

This current-head switch-only diagnostic was prepared after the earlier historical A/B workflow proved unsuitable for coding-agent execution. It is no longer the active PR #217 handoff.

## Why it is superseded

Manual testing of the current PR implementation in Chrome established additional user-visible regressions that this pass does not cover:

- the Short view -> Full view freeze is shorter than before but still perceptible;
- scrolling the large table also produces perceptible freezes/jank;
- table borders and corner radii no longer match the pre-virtualization appearance.

Repository inspection also shows two integration risks that require architecture review before another coding pass:

- `DatabaseDataTable.vue` now refreshes root/table bounding geometry from its own `onUpdated()` lifecycle, which runs on the component that changes virtual ranges during scrolling;
- the virtual table inserts leading/trailing column spacers and top/bottom row spacers as physical first/last table children, while `MDTable.vue` derives borders and corner radii from structural first/last-child selectors.

The previous handoff measured only the view switch and explicitly prohibited production/architecture correction. It therefore cannot resolve the newly confirmed scrolling and visual regressions.

## Current state

- Shared `useVirtualCollection` / TanStack ownership is not rejected by these findings.
- Bounded mounted work remains accepted evidence.
- Database table integration architecture is reopened for:
  - root-to-surface geometry refresh ownership/frequency;
  - steady-state vertical/horizontal scrolling responsiveness;
  - preservation of the existing `MDTable` visual boundary contract with spacer DOM.
- No coding-agent performance diagnostic should be started from this file.

## Next step

Resolve the Database table integration architecture from the new review findings, then prepare one replacement correction handoff covering implementation and faithful proof.

Historical checkout/worktree orchestration remains forbidden for coding-agent proof. Browser verification must continue through repository `pnpm verify` surfaces.
