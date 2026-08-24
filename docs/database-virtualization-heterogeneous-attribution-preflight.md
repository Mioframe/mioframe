# Database virtualization heterogeneous attribution preflight

Status: **completed**.

## Outcome

The verifier-managed Chromium diagnostic reproduced the heterogeneous performance problem and isolated `Number` as a reproducing fixture variant.

Observed Number-isolation switch samples:

- 631.3 ms with 3 Long Tasks, max 241 ms, total 520 ms;
- 635.5 ms with 3 Long Tasks, max 244 ms, total 523 ms.

Vertical scrolling also produced a 210 ms Long Task in one Number-isolation sample; the second sample was clean. Horizontal scrolling was clean in both samples.

Bounded mounted work and deep correctness passed. Temporary diagnostic tooling was removed.

## Architectural consequence

This preflight does **not** authorize a production correction.

The isolated label `Number` is not yet the narrow production owner because:

- Number and String inline renderers are structurally equivalent simple text/span UI;
- property/effective-value query infrastructure is shared;
- the diagnostic report does not establish that String and Number probes used identical stored-value density/shape.

Before selecting a correction owner, distinguish Number type from fixture/value-density effects with one controlled equal-density comparison or equivalent narrow attribution evidence.

No production, geometry, virtualization, worker/query/storage, Material, or shared-table change is authorized by this completed preflight.
