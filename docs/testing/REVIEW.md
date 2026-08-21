# Review

Verdict: blocked

## Scope reviewed

- Pass G representative benchmark and finish-completion evidence for verifier modernization after the latest correction round.

## Blockers

### B1 — the recorded Pass G benchmark does not cover the required final system

Owner: `docs/testing/verify-modernization.md`

Problem: a durable benchmark is now recorded, but it contains only a correction subset and explicitly omits unchanged Pass B/D/E classes. The finish plan requires the final benchmark to represent the complete final verifier system. Pass C has also gained an explicit ownership-mechanism acceptance matrix after repeated review findings, so the final benchmark must demonstrate the final external-ownership behavior rather than only the earlier root/import cases.

Evidence:

- [`verify-modernization.md`](verify-modernization.md) lists canonical representative classes including feature source, Material component, registered mutation source, and unregistered adjacent source; those classes are absent from the current recorded result table.
- the current record states that unchanged Pass B/D/E classes were not re-benchmarked because the latest correction did not change them. That is valid for a regression delta, but there was no earlier durable final Pass G record covering the omitted classes.
- [`verify-unit-impact-correction.md`](verify-unit-impact-correction.md) now requires final representative evidence for ordinary import ownership, exact external ownership, runtime/tool discovery, bounded repository scans, existence/absence ownership, and delegated `vitest related` behavior.
- the current benchmark predates the final scan/runtime-discovery acceptance model.

Basis:

- [`verify-finish-plan.md`](verify-finish-plan.md), Pass G: benchmark representative change classes from `verify-modernization.md` and record selected/skipped checks, trigger reasons, duration, false positives, potential false negatives, critical path/merge latency, aggregate expensive compute, and output behavior.
- the completion criteria require the recorded benchmark to remain valid after the latest correction/review round.

Risk: the persisted finish evidence cannot support the stop decision for the whole A-G system, especially mutation and external unit ownership, because some required behavior exists only in earlier handoffs or local planner tests rather than the durable final record.

Required final state:

- after `scripts/lib/REVIEW.md` is resolved, record the complete canonical representative set from `verify-modernization.md`, including at minimum feature source, Material component, registered mutation source, and unregistered adjacent source;
- keep useful correction-specific cases such as root imported config and `tests/e2e/**` Vitest helper source;
- add representative final Pass C cases for:
  - runtime-discovered config ownership (`eslint.config.mjs`);
  - one broad repository-scan boundary owner;
  - Material `components/*/tokens.css` scan ownership;
  - Playwright spec inventory ownership through `playwright.lanes.test.ts`;
  - an exact existence/absence owner;
  - an ordinary import owner that remains selected after its redundant external mapping is removed;
- record selected/skipped behavior and trigger reason for each representative class;
- state accepted conservative false positives/over-selection explicitly, including the known unclassified source-adjacent Markdown fallback where applicable;
- record only actually measured local timing;
- keep exact-head CI critical-path / merge-latency explicitly pending until architect-owned PR CI exists;
- do not add benchmark tooling or infrastructure.

Verification: the final recorded table must correspond to the final planner implementation, cover every canonical representative class and the new Pass C ownership mechanisms, and contain no known false-negative case from semantic review.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A standalone benchmark framework or historical performance database is not required.
