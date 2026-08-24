# Database virtualization heterogeneous attribution preflight

Status: **completed; no further PR #217 action**.

## Outcome

The verifier-managed Chromium diagnostic reproduced the heterogeneous performance problem and isolated `Number` as a reproducing fixture variant.

Observed Number-isolation switch samples:

- 631.3 ms with 3 Long Tasks, max 241 ms, total 520 ms;
- 635.5 ms with 3 Long Tasks, max 244 ms, total 523 ms.

Vertical scrolling also produced a 210 ms Long Task in one Number-isolation sample; the second sample was clean. Horizontal scrolling was clean in both samples.

Bounded mounted work and deep correctness passed. Temporary diagnostic tooling was removed.

## Scope decision

This preflight does **not** authorize a production correction in PR #217.

The isolated label `Number` is not the established production owner because Number/String renderers are trivial and value/property query infrastructure is shared.

Further equal-density String-vs-Number attribution and the eventual performance correction move to the separate follow-up recorded in `docs/database-chrome-jank-follow-up.md`.

The active PR #217 implementation contract is now `docs/database-virtualization-integration-correction-handoff.md` plus its preflight.
