# Database virtualization heterogeneous attribution preflight

Status: **ready**.

Source: `docs/database-virtualization-heterogeneous-attribution-handoff.md`.

## Expected tracked changes

None at handoff.

Temporary file during diagnosis only:

`tests/e2e/diagnostics/databaseVirtualizationHeterogeneousPerformance.spec.ts`

Delete it before completion.

## Pass 1 — scalar mix

Create a sparse large Database fixture with:

- the existing Short (~20 rows) and Full views;
- deterministic IDs/data;
- valid current-schema String, Number, Date, and Boolean properties;
- representative persisted values for visible rows and deep correctness sentinels without materializing the logical cross product.

Measure three controlled samples in desktop Chromium for:

- real Short -> Full selection;
- fixed vertical wheel scrolling after Full settles;
- fixed horizontal wheel scrolling after Full settles.

Record switch timing/Long Tasks, scroll Long Tasks, bounded mounted work, and deep correctness.

## Pass 2 — isolate only when needed

If the scalar mix clearly reproduces repeated >100 ms Long Tasks or equivalent material blocking, test focused scalar variants and stop when the smallest reproducing property type is identified.

Use at most two samples per isolation probe; use a third only when the probe is ambiguous.

If scalar mix is fast, do not run scalar isolation.

## Pass 3 — relation only when needed

If scalar mix is fast, create one separate relation case:

- one representative relation property;
- non-empty relation values on a bounded set of rows;
- bounded target/nested Database content;
- otherwise preserve the same outer Short -> Full and scrolling scenario.

Collect three samples.

Do not create hundreds of relation properties or intentionally recursive stress merely to force a failure.

## Execution

Only:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationHeterogeneousPerformance.spec.ts
```

The temporary spec must skip `Mobile Chrome`; desktop project name is `chromium`.

The current app-E2E verifier has no Firefox project. Do not modify `playwright.config.ts`, verifier code, or project-applicability metadata to add one. Firefox remains operator comparison evidence unless a later architecture task explicitly adds verifier-owned cross-engine product proof.

## Stop conditions

Stop and report when:

- one smallest property/render path is identified;
- heterogeneous mix reproduces but focused probes cannot isolate it safely;
- neither scalar mix nor representative relation case reproduces;
- results are ambiguous;
- the verifier cannot faithfully run the diagnostic without durable tooling changes.

Do not change production code in any outcome.

## Report

Return:

- exact classification;
- variants executed and exact property mixes;
- raw switch metrics;
- vertical/horizontal scroll Long Task metrics;
- mounted-work/correctness result;
- narrowest render-path owner supported by evidence, or `unresolved`;
- confirmation that the temporary spec was removed.
