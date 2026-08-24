# Database virtualization widget surface-offset diagnosis preflight

Authoring source: `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`.

## Goal

Capture concrete evidence showing whether `DatabaseViewWidget` supplies truthful root-to-layout offsets through the failing deep-state product lifecycle.

## Non-goals

No production correction, no shared/TanStack change, no relation-value fix, no test weakening.

## Confirmed current behavior

- Shared deep-state capability passes the exact `deep -> change while deep -> top -> deep` lifecycle on the same root/list.
- Top-level product E2E still fails 3/3 in desktop Chromium CI.
- Current widget producer uses `useElementBounding(root/layout)` plus current `root.scrollTop/scrollLeft` and manual refresh from `onMounted`/`onUpdated`.

## Owners / entry points

- Diagnosis target: `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`.
- Product proof: `tests/e2e/databaseVirtualizationFlows.spec.ts` moving-surface scenario.
- Shared virtualization and `DatabaseDataTable`: read-only for this pass.

## Minimum diagnostic design

Prefer temporary console/debug output emitted by `DatabaseViewWidget` at the named checkpoints and captured by verifier-managed E2E output. If a narrow temporary DOM diagnostic attribute is strictly necessary, it must be removed before handoff and must not remain in final tracked code.

For each checkpoint record:

- supplied vertical/horizontal offset;
- actual DOM-derived vertical/horizontal root-to-layout offset;
- root scrollTop/scrollLeft;
- relevant root/layout bounding tops/lefts;
- logical mounted first/last row if useful for correlation.

Checkpoints:

1. initial top;
2. settled first deep;
3. after card dismiss while still deep;
4. returned top;
5. second deep attempt.

## Pass order

1. Add the minimum temporary instrumentation required to expose the supplied value and current physical value.
2. Run focused moving-surface E2E with the normal verifier profile.
3. If normal profile does not reproduce, run the same focused check with `--profile github-actions`; this override is explicitly authorized for this CI-specific diagnosis only.
4. Repeat only enough to obtain one coherent failing trace; retry-pass is not success evidence.
5. Remove all temporary diagnostic production instrumentation.
6. Run focused format/lint if cleanup changed tracked files.
7. Run `pnpm verify --base origin/develop` with the normal local profile and report exact result.
8. Stop. Do not implement the correction in this pass.

## TEST IMPACT

- Contract/scenario: top-level widget supplies truthful root-to-layout surface offset during deep-state preceding-content removal.
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts`.
  - Additional proof: shared deep-state capability already passed and must remain unchanged.
  - Existing proof: physical surface movement + second deep tail requirement.
  - New/updated proof: diagnostic evidence only; do not permanently assert private widget implementation state.
  - Risk/platform matrix: desktop Chromium / GitHub Actions profile primary; Mobile Chrome comparison useful.
  - Durable ownership updates: architect-owned review/handoff only.

## Decision output

Return one of:

- `widget-offset-mismatch`: include first checkpoint where supplied and physical values diverge and numeric values before/after;
- `offsets-truthful-product-still-fails`: include numeric evidence for all checkpoints and exact failing logical range.

## Forbidden

- production correction;
- permanent `data-*` diagnostic API;
- shared virtualization edits;
- `virtualizer.measure()`;
- entity observer fallback;
- `nextTick`/rAF/timer workaround presented as fix;
- sleeps/timeout inflation/assertion weakening;
- direct Playwright/Vite/browser commands;
- mutating Git operations;
- `--profile github-actions` on the final branch gate.
