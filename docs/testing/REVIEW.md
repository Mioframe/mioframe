# Review

Verdict: blocked

## Scope reviewed

- Pass G representative benchmark and finish-completion evidence for verifier modernization after the latest correction round.

## Blockers

### B1 — the recorded Pass G benchmark does not cover the required representative set

Owner: `docs/testing/verify-modernization.md`

Problem: a durable benchmark is now recorded, but it contains only 11 cases and explicitly omits unchanged Pass B/D/E classes. The finish plan requires the final benchmark to represent the complete final verifier system, and the canonical representative table includes classes that are absent from the recorded results.

Evidence:

- [`verify-modernization.md`](verify-modernization.md) lists representative classes including feature source, Material component, registered mutation source, and unregistered adjacent source.
- the recorded Pass G result table does not contain those four required classes; in particular there is no final recorded mutation-selection case despite Pass D being part of the finish system.
- the recorded text states that Pass B/D/E were not re-benchmarked because the latest correction did not change them. That is valid for a correction delta, but there was no earlier durable Pass G record that already covered the omitted classes.
- the current record says there are no newly introduced false positives, while the same table intentionally shows the known conservative source-adjacent Markdown full fallback; the final record should identify accepted existing false positives/over-selection explicitly rather than only discuss newly introduced ones.

Basis:

- [`verify-finish-plan.md`](verify-finish-plan.md), Pass G: benchmark representative change classes from `verify-modernization.md` and record selected/skipped checks, trigger reasons, duration, false positives, potential false negatives, critical path/merge latency, aggregate expensive compute, and output behavior.
- the completion criteria require the recorded benchmark to remain valid after the latest correction/review round.

Risk: the persisted finish evidence cannot support the stop decision for the whole A-G system, especially mutation ownership, because some required representative behaviors exist only in earlier chat/handoff history rather than repository source of truth.

Required final state:

- after the remaining Pass C external-ownership blocker is fixed, record the complete representative set from the canonical benchmark table, including at minimum feature source, Material component, registered mutation source, and unregistered adjacent source;
- keep existing useful correction-specific cases such as root config and `tests/e2e/**` fixture source;
- record selected/skipped behavior and trigger reason for each final representative class;
- state accepted conservative false positives/over-selection explicitly, including the known unclassified source-adjacent Markdown fallback where applicable;
- record only actually measured local timing;
- keep exact-head CI critical-path / merge-latency explicitly pending until architect-owned PR CI exists;
- do not add benchmark tooling or infrastructure.

Verification: the final recorded table must correspond to the final planner implementation, cover every canonical representative class, and contain no known false-negative case from semantic review.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A standalone benchmark framework or historical performance database is not required.
