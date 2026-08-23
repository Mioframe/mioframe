# Database virtualization production results — PR #217

Date: 2026-08-23  
Branch: `fix/database-large-data-performance`  
Repository HEAD while measured: `da16207afd0a5ff0be0381081963e8b9f53d6146`  
Measured source: the PR #217 migration worktree at that head, including its uncommitted implementation changes.

## Method

The real Database product was loaded through the existing JSON-import UI. Each
fixture had current-schema Database data, all-string properties, and only two
persisted values per row (`Filter` and `Label`). The short view selected 20
rows by `Filter = short`; the measured action was the real view-sheet selection
of `Full view` for the same document. This keeps G1 sparse while still
presenting its 30,000 × 300 = 9,000,000 logical row/property intersections.
The deterministic seed was `pr-217-production-v1`; no sort was configured.
The production collections used their fixed `overscan: 4` policy, with 48 px
row and 160 px property estimates. The rectangular matrix intentionally uses
no variable-height value; the separate product proof covers that shape.

For each sample, a fresh Chromium browser context loaded the document and
settled in the short view before a capture-phase in-page observer recorded the
real selection. The observer used `MessageChannel`, the first
`requestAnimationFrame`, `PerformanceObserver` Long Tasks, and the first
requestAnimationFrame with the full logical table metadata plus a settled
mounted row/property intersection. The same run then proved the last logical
row, last property, and last label after deep two-axis scrolling. No timing is
derived from the Playwright command duration.

The samples ran through the verifier with no test retries in desktop Chromium
149.0.7827.55 on Linux, 640 × 480 viewport, one Playwright worker, and the
production Vite build/preview. The verifier container reported 2 CPUs, 6 GiB
memory, and 8 GiB memory swap. All samples used fresh browser contexts after
the preview had started; this is not a separate cold-process versus warm-cache
comparison.

Three controlled samples were collected for every case. `yield`, `rAF`, and
`usable` are milliseconds. `LT` is `count / maximum / total` in milliseconds.
`mounted` is `data rows / property headers / expensive value cells` after the
full-view switch.

## Raw results

| Case | Logical shape | Sample | Yield |  rAF | Usable | LT count/max/total |     Mounted | Correctness |
| ---- | ------------: | -----: | ----: | ---: | -----: | -----------------: | ----------: | ----------- |
| S0   |       100 × 8 |      1 |  21.9 | 20.3 |  853.0 |      1 / 209 / 209 | 12 / 8 / 96 | pass        |
| S0   |       100 × 8 |      2 |  14.8 | 11.0 |  331.8 |        1 / 50 / 50 | 12 / 8 / 96 | pass        |
| S0   |       100 × 8 |      3 |  14.8 | 11.1 |  318.7 |        1 / 51 / 51 | 12 / 8 / 96 | pass        |
| R1   |     1,000 × 8 |      1 |  14.4 | 12.4 |  428.0 |        1 / 77 / 77 | 12 / 8 / 96 | pass        |
| R1   |     1,000 × 8 |      2 |  31.1 | 27.7 |  352.4 |        1 / 57 / 57 | 12 / 8 / 96 | pass        |
| R1   |     1,000 × 8 |      3 |  14.9 |  9.6 |  313.6 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| R2   |     3,000 × 8 |      1 |  15.0 | 13.8 |  391.7 |        1 / 64 / 64 | 12 / 8 / 96 | pass        |
| R2   |     3,000 × 8 |      2 |  14.5 | 11.3 |  349.9 |        1 / 54 / 54 | 12 / 8 / 96 | pass        |
| R2   |     3,000 × 8 |      3 |  14.3 | 11.8 |  332.8 |        1 / 68 / 68 | 12 / 8 / 96 | pass        |
| R3   |    10,000 × 8 |      1 |  16.4 | 15.3 |  404.8 |        1 / 72 / 72 | 12 / 8 / 96 | pass        |
| R3   |    10,000 × 8 |      2 |  14.8 | 10.6 |  335.5 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| R3   |    10,000 × 8 |      3 |  14.4 | 10.0 |  284.2 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| R4   |    30,000 × 8 |      1 |  12.5 | 11.6 |  670.9 |        1 / 81 / 81 | 12 / 8 / 96 | pass        |
| R4   |    30,000 × 8 |      2 |  15.2 | 10.7 |  330.4 |        1 / 67 / 67 | 12 / 8 / 96 | pass        |
| R4   |    30,000 × 8 |      3 |  15.3 |  9.4 |  443.6 |        1 / 91 / 91 | 12 / 8 / 96 | pass        |
| C1   |      100 × 50 |      1 |  30.4 | 16.8 |  425.2 |        1 / 70 / 70 | 12 / 8 / 96 | pass        |
| C1   |      100 × 50 |      2 |  15.2 | 10.7 |  341.0 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| C1   |      100 × 50 |      3 |  14.8 |  9.9 |  278.3 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| C2   |     100 × 100 |      1 |  10.6 |  9.7 |  294.6 |        1 / 56 / 56 | 12 / 8 / 96 | pass        |
| C2   |     100 × 100 |      2 |  14.2 |  9.8 |  307.0 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| C2   |     100 × 100 |      3 |  11.4 | 10.0 |  311.2 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| C3   |     100 × 300 |      1 |  14.3 | 11.6 |  339.5 |        1 / 50 / 50 | 12 / 8 / 96 | pass        |
| C3   |     100 × 300 |      2 |  10.9 | 10.0 |  280.2 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| C3   |     100 × 300 |      3 |  13.9 | 11.5 |  382.9 |        1 / 52 / 52 | 12 / 8 / 96 | pass        |
| G1   |  30,000 × 300 |      1 |  21.5 | 20.4 |  479.0 |        1 / 89 / 89 | 12 / 8 / 96 | pass        |
| G1   |  30,000 × 300 |      2 |  11.5 | 10.1 |  482.7 |        1 / 89 / 89 | 12 / 8 / 96 | pass        |
| G1   |  30,000 × 300 |      3 |  10.8 |  9.8 |  388.9 |        1 / 76 / 76 | 12 / 8 / 96 | pass        |

## Per-case summary

| Case | Median yield | Median rAF | Median usable | Worst usable | Long-task total across samples | Worst Long Task |
| ---- | -----------: | ---------: | ------------: | -----------: | -----------------------------: | --------------: |
| S0   |         14.8 |       11.1 |         331.8 |        853.0 |                            310 |             209 |
| R1   |         14.9 |       12.4 |         352.4 |        428.0 |                            134 |              77 |
| R2   |         14.5 |       11.8 |         349.9 |        391.7 |                            186 |              68 |
| R3   |         14.8 |       10.6 |         335.5 |        404.8 |                             72 |              72 |
| R4   |         15.2 |       10.7 |         443.6 |        670.9 |                            239 |              91 |
| C1   |         15.2 |       10.7 |         341.0 |        425.2 |                             70 |              70 |
| C2   |         11.4 |        9.8 |         307.0 |        311.2 |                             56 |              56 |
| C3   |         13.9 |       11.5 |         339.5 |        382.9 |                            102 |              52 |
| G1   |         11.5 |       10.1 |         479.0 |        482.7 |                            254 |              89 |

## Findings

- Every matrix case, including G1, retained exactly 12 mounted data rows, 8
  mounted property headers, and 96 expensive value cells for this fixed
  viewport and overscan. G1 therefore did not instantiate its 9,000,000
  logical cell cross product in the mounted DOM.
- Each measured short-to-full switch reached the exact full logical row and
  column counts and then reached the deep final row/property/value sentinels.
- G1 stayed below the 100 ms main-thread research target in all three samples
  (76–89 ms maximum Long Task) despite its 30,000 × 300 logical shape.
- The one 209 ms Long Task occurred only in S0 sample 1. It is not correlated
  with row or column scale: R1 through G1 in that same sample set were at most
  91 ms, and the two later S0 samples were 50–51 ms. The Long Task API does not
  attribute that isolated initial segment to worker, transfer, Vue, DOM, or
  layout work. It is therefore classified as an isolated, non-scale-correlated
  startup-context outlier, not evidence for a secondary cross-layer
  optimization. No worker/query/transfer/paging/cache change was introduced.

The rectangular timing matrix uses sparse strings by design. The existing
Database product browser proof separately covers representative dynamic row
height, progressive property width/remount, sticky surfaces, and the explicit
nested relation scroll root with independent two-axis ranges. Those checks are
correctness/geometry proof rather than a substitute timing benchmark.
That centralized owner is registered for both desktop Chromium and Mobile
Chrome; its focused product run passed all 22 project/spec executions.
