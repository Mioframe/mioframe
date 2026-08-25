# Database virtualization production results — PR #217

> **Current validity:** this is a historical measurement record. Structural boundedness is confirmed. The canonical verifier-managed sparse all-string control is fast (S0 median 281.1 ms, G1 median 321.5 ms, zero Long Tasks), while the earlier non-verifier 1.6–2.5 s run is retained only as environment/protocol warning evidence. Residual heterogeneous-content Chromium jank is explicitly deferred to `docs/database-chrome-jank-follow-up.md` and is not a PR #217 merge criterion.

Date: 2026-08-23  
Branch: `fix/database-large-data-performance`  
Repository HEAD while measured: `da16207afd0a5ff0be0381081963e8b9f53d6146`  
Measured source: the PR #217 migration worktree at that head, including its uncommitted implementation changes.

## Method

The real Database product was loaded through the existing JSON-import UI. Each fixture had current-schema Database data, all-string properties, and only two persisted values per row (`Filter` and `Label`). The short view selected 20 rows by `Filter = short`; the measured action was the real view-sheet selection of `Full view` for the same document. This keeps G1 sparse while still presenting its 30,000 × 300 = 9,000,000 logical row/property intersections. The deterministic seed was `pr-217-production-v1`; no sort was configured.

For each sample, a fresh Chromium browser context loaded the document and settled in the short view before a capture-phase in-page observer recorded the real selection. The observer used `MessageChannel`, the first `requestAnimationFrame`, `PerformanceObserver` Long Tasks, and the first requestAnimationFrame with the full logical table metadata plus a settled mounted row/property intersection. The same run then proved the last logical row, last property, and last label after deep two-axis scrolling. No timing is derived from Playwright command duration.

The samples ran through the verifier with no test retries in desktop Chromium 149.0.7827.55 on Linux, 640 × 480 viewport, one Playwright worker, and the production Vite build/preview. The verifier container reported 2 CPUs, 6 GiB memory, and 8 GiB memory swap.

Three controlled samples were collected for every case. `yield`, `rAF`, and `usable` are milliseconds. `LT` is `count / maximum / total` in milliseconds. `mounted` is `data rows / property headers / expensive value cells` after the full-view switch.

## Initial matrix

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

The initial matrix established bounded mounted work and no scale-correlated >100 ms Long Tasks in G1. The isolated S0 first-sample 209 ms Long Task was not correlated with dataset scale.

## Final simplification-correction revalidation

Date: 2026-08-23  
Repository HEAD while measured: `68a71e89d03713452946819cb52ba80a64157424`

| Case | Sample | Yield |  rAF | Usable | LT count/max/total |     Mounted | Correctness |
| ---- | -----: | ----: | ---: | -----: | -----------------: | ----------: | ----------- |
| S0   |      1 |  15.0 | 10.0 |  278.4 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| S0   |      2 |  14.9 | 10.1 |  304.9 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| S0   |      3 |  14.9 | 11.9 |  319.2 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| G1   |      1 |  11.9 | 10.8 |  350.5 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| G1   |      2 |  15.4 | 10.8 |  348.2 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| G1   |      3 |  11.7 | 10.8 |  411.8 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |

S0 median usable: 304.9 ms. G1 median usable: 350.5 ms. No Long Tasks were observed in these six samples.

## Non-verifier current-geometry warning run

Date: 2026-08-24  
Measured production state: `8d62ba1f8adc66ebb82dd0734afc82824e112f6c`

| Case | Sample | Yield |  rAF | Usable | LT count/max/total |     Mounted | Correctness |
| ---- | -----: | ----: | ---: | -----: | -----------------: | ----------: | ----------- |
| S0   |      1 |   4.8 |  0.9 | 1603.3 |      2 / 291 / 564 | 12 / 8 / 96 | pass        |
| S0   |      2 |   3.9 | 12.6 | 1582.5 |      3 / 313 / 644 | 12 / 8 / 96 | pass        |
| S0   |      3 |  20.9 |  1.2 | 1950.8 |      3 / 292 / 613 | 12 / 8 / 96 | pass        |
| G1   |      1 |  20.3 |  0.7 | 2516.8 |      3 / 301 / 697 | 12 / 8 / 96 | pass        |
| G1   |      2 |   4.6 |  1.4 | 1950.7 |      4 / 412 / 863 | 12 / 8 / 96 | pass        |
| G1   |      3 |   3.3 | 14.5 | 2013.1 |      3 / 429 / 862 | 12 / 8 / 96 | pass        |

This run remained structurally bounded but is **not** accepted as evidence of a general current-runtime regression because the canonical verifier-owned run below does not reproduce it.

## Canonical current-head verifier control — slowdown not reproduced

Date: 2026-08-24  
Measured production-equivalent head: `1c1a3789ef66cc950eba543566502aec8567f3ec`  
Execution: verifier-managed current checkout only.

Command:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts
```

| Case | Sample | Yield |  rAF | Usable | LT count/max/total |     Mounted | Correctness |
| ---- | -----: | ----: | ---: | -----: | -----------------: | ----------: | ----------- |
| S0   |      1 |  14.9 | 11.0 |  269.8 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| S0   |      2 |  15.2 | 10.2 |  281.1 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| S0   |      3 |  14.9 | 10.6 |  283.8 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| G1   |      1 |  29.0 | 12.0 |  323.5 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| G1   |      2 |  29.1 | 12.3 |  321.5 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |
| G1   |      3 |  15.0 |  9.9 |  305.9 |          0 / 0 / 0 | 12 / 8 / 96 | pass        |

Summary:

- S0 median usable: 281.1 ms;
- G1 median usable: 321.5 ms;
- worst Long Task: 0 ms;
- bounded mounted work: pass;
- 9M logical intersections materialized: no;
- deep correctness: pass;
- temporary diagnostic spec removed; tracked diagnostic files remaining: none.

Interpretation: the sparse all-string current implementation is responsive in the canonical verifier environment. The previous slow warning run was therefore environment/protocol-sensitive rather than proof of a universal runtime regression.

## Current unresolved performance scenario — heterogeneous Chrome content

Operator testing on the same laptop reports:

- a real Database with different property types still has a perceptible Short -> Full delay in Chrome;
- vertical/ordinary table scrolling in Chrome produces freezes/jank;
- Firefox on the same laptop does not exhibit the same problem.

This scenario is materially different from the benchmark above because the benchmark is an all-string sparse rectangle. Production heterogeneous cells dispatch to distinct Boolean, Number, String, Date, and Relation render paths, and relation values can compose nested Database UI inside an outer cell.

Required follow-up is therefore **not** another all-string S0/G1 run and not historical A/B. Use one deterministic heterogeneous fixture through repository verifier surfaces in Chrome and Firefox, retain the all-string case as control, cover both Short -> Full and sustained vertical/horizontal scrolling, and narrow the first property/render path that reproduces the Chrome-only cost before choosing a production correction owner.
