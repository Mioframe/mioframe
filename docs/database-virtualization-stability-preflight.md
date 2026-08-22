# Database virtualization capability stability correction preflight

Status: **completed**.

Authoring source: `docs/database-virtualization-stability-handoff.md`.

## Scope

This correction was limited to:

- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`;
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`.

No production virtualization/runtime code, fixture protocol, public API, tolerance, timeout, or browser matrix change was required.

## Implemented proof shape

### Shared `surfaceOffset`

- deep geometry is read in one synchronous browser-side snapshot;
- the trailing-extent and physical `scrollHeight` invariants are evaluated from that same snapshot;
- a valid state must remain stable across consecutive observations before it is accepted.

### Database anchor

- the post-scroll baseline is read as one browser-side snapshot;
- selected above-row identity, anchor identity, actual `scrollTop`, and anchor position must be stable across consecutive observations;
- actual settled `scrollTop` is used rather than requiring equality to the original pixel request, because measurement correction may legitimately adjust it;
- after growth, the original row must show public `data-row-size` growth and the original anchor must remain mounted with stable geometry before the final movement assertion runs.

## Acceptance result

All constraints were preserved:

- no architecture/API changes;
- no `useVirtualCollection`/`vItem` changes;
- no private TanStack assertions;
- no sleeps or fixed-frame waits;
- no tolerance widening;
- no timeout inflation;
- no retries used as acceptance.

Risk-specific verification reported **300/300 executions passed** under `--repeat 10`, with no retries or flaky classification.

Implementation preflight outcome: **passed and closed**. Exact-head GitHub CI is the remaining automatic gate.
