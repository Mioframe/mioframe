# Database virtualization heterogeneous attribution handoff

Status: **completed; Number isolation reproduces Chromium blocking, production owner still unresolved**.

## Result

Verifier-managed desktop Chromium reproduced the heterogeneous performance defect.

Scalar mix switch samples:

- 719.5 ms, no Long Tasks;
- 385.6 ms, no Long Tasks;
- 928.9 ms, no Long Tasks.

Number-isolation switch samples:

- 631.3 ms, 3 Long Tasks, max 241 ms, total 520 ms;
- 635.5 ms, 3 Long Tasks, max 244 ms, total 523 ms.

Vertical wheel scrolling:

- scalar mix: one 168 ms Long Task in sample 1, none in sample 2, one 183 ms Long Task in sample 3;
- Number isolation: one 210 ms Long Task in sample 1, none in sample 2.

Horizontal wheel scrolling produced no Long Tasks in any reported sample.

Mounted outer work remained bounded and deep correctness passed. The temporary diagnostic was removed and no tracked diagnostic files remain.

## Interpretation

`Number` is a confirmed reproducing fixture path, but `src/entities/databaseNumber` is **not** established as the root-cause owner.

`NumberValueInline` and `StringValueInline` are both trivial span/text renderers, and effective-value/property query infrastructure is shared across types. The current evidence therefore does not distinguish property type from fixture/value density, stored-value shape, query/subscription cost, or interaction with row measurement/layout.

The next architecture decision must be based on a controlled equal-density String-vs-Number comparison and/or equivalent evidence that isolates the cost below the fixture label.

Do not implement a Number-specific UI optimization, geometry change, TanStack/shared-virtualization change, worker/query/storage redesign, or Material change from this result alone.

The separate Database border/corner-radius blocker remains active.
