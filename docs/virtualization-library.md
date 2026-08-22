# Virtualization dependency

Status: **architecture revised; `@tanstack/vue-virtual` selected; no shared Mioframe virtualization wrapper**.

This document records only the dependency decision. Database rendering architecture is owned by `docs/database-virtualization.md`; browser proof by `docs/database-virtualization-browser-proof.md`.

## Decision

Use `@tanstack/vue-virtual` directly inside the truthful rendering owner that currently needs virtualization: `src/entities/databaseData`.

Do not keep or introduce `src/shared/ui/virtualization`, `useVirtualAxis`, `VirtualList`, `VirtualTable`, `VirtualGrid`, or another Mioframe virtualization API while database is the only confirmed production consumer.

The minimum dependency shape is:

```text
@tanstack/vue-virtual
        ↓
entities/databaseData
        ↓
DatabaseDataTable
```

A database-local helper/composable may be extracted only when the production implementation becomes materially easier to read with it. Such a helper remains database-owned and exposes only current database needs.

## Why the previous wrapper is rejected

The earlier shared adapter mostly mirrored TanStack while adding:

- Mioframe-specific option/result types;
- input validation;
- a private replacement for TanStack's element index marker;
- generic lifecycle and browser fixtures;
- an additional public contract to maintain.

Those costs are not justified by a second current consumer. Repository architecture prefers the simpler local solution until reuse is proven.

Vendor implementation details such as TanStack's `data-index`, `measureElement`, virtual item shape, and instance methods are allowed inside the private database implementation. They are not Mioframe public APIs merely because they appear in one entity component.

## Ownership

TanStack owns:

- virtual range calculation;
- estimated and measured item geometry;
- ResizeObserver-backed dynamic measurement;
- stable-key measurement cache;
- scroll correction;
- deep index navigation.

Database owns:

- logical rows/properties and their stable IDs;
- row/column virtualizer configuration;
- native table DOM and spacer DOM;
- sizing policy specific to database columns;
- scroll-root wiring supplied by composition;
- sticky/action/edit/accessibility behavior.

Do not create a second offset tree, range algorithm, ResizeObserver scheduler, measurement cache, or scroll-anchor implementation.

## Extraction threshold

Reconsider a shared virtualization abstraction only after a second real production consumer exists and both implementations expose a stable, meaningful common contract.

Before extracting, prove that:

1. duplicated behavior is not merely coincidental TanStack setup;
2. the shared owner has no database-specific knowledge;
3. the abstraction removes more concepts than it adds;
4. both current consumers become easier to understand and test;
5. the public API is smaller than using TanStack directly.

Hypothetical future lists/grids do not satisfy this threshold.

## Engine reconsideration

Keep TanStack Virtual unless required Mioframe behavior would otherwise force substantial custom general-purpose virtualization machinery.

A native-table CSS quirk, spacer technique, or database-specific sizing policy is not enough to reopen the dependency decision.

## Forbidden

- shared wrapper created only to hide vendor syntax;
- custom generic virtualizer;
- TanStack Table as a second table/domain state owner;
- hidden full-dataset measurement;
- persisted virtual measurements;
- generic pinning/range APIs without a current product requirement;
- abstraction justified only by possible future reuse.

## Readiness

Dependency decision: **ready**.

Next step: direct database-oriented native-table capability proof from `docs/database-virtualization-direct-integration-handoff.md` and `docs/database-virtualization-direct-integration-preflight.md`.
