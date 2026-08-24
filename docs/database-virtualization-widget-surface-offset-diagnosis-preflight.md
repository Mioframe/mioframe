# Database virtualization widget surface-offset diagnosis preflight

Status: **Pass A of `docs/database-virtualization-completion-pass-preflight.md`**.

Authoring source: `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`.

## Goal

Capture concrete evidence showing whether `DatabaseViewWidget` supplies truthful root-to-layout offsets through the deep-state product lifecycle.

## Non-goals

No moving-surface production correction, no shared/TanStack change, no permanent diagnostics, no test weakening.

## Owners / entry points

- Diagnosis target: `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`.
- Product proof: `tests/e2e/databaseVirtualizationFlows.spec.ts` moving-surface scenario.
- Shared virtualization and `DatabaseDataTable`: read-only for Pass A diagnosis.

## Minimum diagnostic design

Prefer temporary console/debug output emitted by `DatabaseViewWidget` and captured by verifier-managed E2E output. A temporary DOM diagnostic attribute is allowed only if strictly necessary and must be removed before handoff.

For each checkpoint record:

- supplied vertical/horizontal offset;
- actual DOM-derived vertical/horizontal root-to-layout offset;
- root scrollTop/scrollLeft;
- relevant root/layout bounding top/left if useful.

Checkpoints:

1. initial top;
2. settled first deep;
3. after card dismiss while still deep;
4. returned top;
5. second deep attempt.

## Pass order

1. Add minimum temporary instrumentation.
2. Run focused moving-surface E2E with normal verifier profile.
3. If normal profile does not reproduce, run the same focused check with `--profile github-actions`; this override is authorized only for Pass A.
4. Capture at most one coherent failing trace if available; retry-pass is not success evidence.
5. Remove all temporary diagnostic instrumentation.
6. Return one result: `widget-offset-mismatch`, `offsets-truthful-product-still-fails`, or `not-reproduced` with observed numeric traces.
7. Do not implement moving-surface production correction.
8. Continue independent completion Passes B/C as specified by the consolidated preflight.

## TEST IMPACT

- Contract/scenario: top-level widget supplies truthful root-to-layout surface offset during deep-state preceding-content removal.
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts`.
  - Additional proof: accepted shared deep-state capability remains unchanged.
  - New/updated proof: diagnostic evidence only; no permanent private-state assertion.
  - Risk/platform matrix: desktop Chromium / GitHub Actions profile primary.

## Forbidden

Production moving-surface correction; permanent `data-*` diagnostic API; shared virtualization edits; `virtualizer.measure()`; entity observer fallback; speculative nextTick/rAF/timer workaround; sleeps/timeout inflation/assertion weakening; direct Playwright/Vite/browser commands; mutating Git operations; `--profile github-actions` on the final branch gate.
