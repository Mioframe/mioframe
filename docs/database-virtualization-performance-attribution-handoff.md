# Database virtualization performance diagnostic handoff

Status: **ready**.

This contract replaces the previous historical A/B attribution pass for PR #217.

## Goal

Determine whether the reported current-geometry slowdown reproduces on the **current PR head** inside the canonical verifier-owned application E2E environment.

This pass does not identify the historical first-bad commit and does not implement a production correction.

## Confirmed current evidence

- Structural scalability is already confirmed on the current production implementation: S0/G1 retained 12 mounted rows / 8 property headers / 96 expensive cells and passed deep correctness.
- A prior temporary measurement reported S0 usable 1582.5–1950.8 ms and G1 usable 1950.7–2516.8 ms with repeated 291–429 ms Long Tasks.
- Historical `68a71e89...` evidence was much faster, but reproducing historical refs through manual checkout/worktree orchestration is no longer part of the coding-agent task.
- The prior diagnostic workflow was too broad and mixed repository orchestration with performance proof.

## Non-goals

- no historical checkout, detached worktree, bisect, reset, rebase, cherry-pick, or ref movement;
- no direct Playwright, Vite, browser-launch, or shell-built benchmark orchestration;
- no production, geometry, virtualization, worker, query, storage, paging, cache, index, API, or state change;
- no permanent benchmark or diagnostic infrastructure;
- no full R1/R2/R3/R4/C1/C2/C3 matrix.

## Ownership

- `pnpm verify --only e2e`: owns browser/build/runtime execution for this diagnostic;
- temporary diagnostic spec: owns only S0/G1 measurement logic and is removed before handoff;
- `src/entities/databaseData`: remains the active review location until canonical current-head evidence is evaluated;
- architect: owns interpretation, next attribution/correction task, canonical docs, PR metadata, and final CI.

## Minimum sufficient design

Create one temporary **nested** application-E2E diagnostic spec, for example:

`tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts`

Do not create a new root `tests/e2e/*.spec.ts`; root specs require durable project-applicability ownership.

The temporary spec must:

- run only the current checkout/runtime;
- use existing application-E2E helpers and the established JSON-import/full-view product action;
- use viewport 640×480;
- use deterministic seed/data equivalent to `pr-217-production-v1`;
- measure S0 100×8 and G1 30,000×300;
- collect exactly three fresh samples per case;
- keep setup/import/build outside the switch timing;
- record MessageChannel yield, first rAF, switch-to-usable, Long Task count/max/total, mounted rows/headers/cells, logical metadata, and deep final row/property/value sentinels;
- skip non-Chromium project execution inside the temporary diagnostic when necessary so the performance evidence is one canonical desktop Chromium environment;
- execute only through the verifier command below.

Required diagnostic command:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts
```

No direct `playwright`, `vite`, Chromium executable launch, or custom web-server command is allowed.

## Classification

Return one evidence classification only:

- `slowdown reproduced` — current-head S0/G1 again show material usable-state delay and repeated >100 ms switch-associated Long Tasks;
- `slowdown not reproduced` — current-head verifier evidence returns near the retained fast envelope without repeated >100 ms Long Tasks;
- `ambiguous` — samples are inconsistent enough that neither conclusion is reliable.

Do not infer the production owner/root cause in this pass.

If `slowdown reproduced`, stop and report the measurements. The architect will create a separate current-head attribution task.

If `slowdown not reproduced`, stop and report the verifier-owned evidence. The architect will decide whether the prior non-verifier result is an environment/protocol mismatch and whether performance acceptance can close.

If `ambiguous`, stop and report raw samples; do not add retries, sleeps, or broader tooling.

## Acceptance

- exactly three current-head S0 and three current-head G1 samples are reported;
- all six samples come from the focused verifier-managed E2E run;
- mounted work and deep correctness are reported for every sample;
- the exact current head is recorded through ordinary repository inspection only;
- no production file changes;
- no Git worktree/checkout orchestration;
- temporary diagnostic spec is removed before handoff;
- final tracked diagnostic files: none.

## Forbidden

Historical ref execution by the coding agent; Git worktree/checkout/reset/rebase/bisect/cherry-pick/ref movement; direct Playwright/Vite/browser invocation; production changes; architecture changes; permanent benchmark infrastructure; root-level temporary E2E registration; retry-as-success; timeout inflation; sleeps; force; weakening the 100 ms research target; editing review/canonical/performance-result docs or PR metadata.

## Implementation readiness

Required decisions: **resolved**.  
Unresolved production owner/root cause: intentionally deferred until canonical current-head reproduction exists.  
Verdict: **ready for verifier-managed current-head diagnostic only**.
