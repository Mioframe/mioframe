# Mioframe Material library

`src/shared/ui/material` is the canonical boundary for Mioframe's Material 3 Expressive implementation.

The library is isolated from product architecture. Product code consumes its public API; Material code does not import product layers or project-specific presentation owners.

## Structure

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
  foundation/
    tokens/
  components/
  patterns/
  index.ts        # only after a ready public owner exists
```

- `docs` contains durable policy and the current roadmap;
- `foundation` contains proven family-agnostic cross-family contracts;
- `components` contains official public families and family-local component tokens;
- `patterns` contains accepted reusable official compositions;
- contracts, implementation, tokens, styles, stories, fixtures, and focused tests stay beside their owner.

Generic platform utilities, project-specific shared UI, features, widgets, pages, app behavior, and product adapters remain outside.

## Documentation

Start with [`docs/README.md`](./docs/README.md). The canonical set is limited to architecture, tokens, sources, component development, foundation development, and roadmap documents.

Do not create parallel registries, inventories, audits, review histories, checklists, scorecards, progress ledgers, or duplicated workflow documents. The owning README stores compact current truth only.

## Dependency direction

```text
Vue / browser platform
        ↓
generic shared/lib infrastructure
        ↓
material/foundation
        ↓
material/components
        ↓
material/patterns
        ↓
project-specific shared UI and product layers
```

Token direction:

```text
reference → system → component → private route → rendered property
```

Official tokens keep exact `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names. Public Mioframe extensions use `--mio-*`. Owner-local routes use `--md-private-*` and remain private.

Code under this root must not import another `@shared/ui/*` owner, legacy `@shared/lib/md`, or escape by relative path into legacy shared UI. `scripts/materialBoundaryArchitecture.test.mjs` enforces the boundary. `scripts/materialTokenArchitecture.test.mjs` enforces token ownership and graph direction.

## Public API

External consumers use the curated root entry point only after the owner and all dependencies required by its supported surface are ready. Internal Material code uses local owner entry points.

Creating/preserving a root export, migrating consumers, or removing/forwarding a legacy owner automatically requires complete actual dependency closure. A directory or barrel alone is not a canonical contract.

## Development

`material-component` is the only component-family writer/orchestrator.

A family-only invocation is `full-family`:

```text
resolve invocation scope
→ reconstruct canonical ownership and actual dependencies from code
→ normalize stale persisted state
→ build one bounded orientation
→ select required concern lanes
→ obtain only missing/invalidated evidence
→ close exact foundation and official-family prerequisites inside the same orchestration
→ implement and independently review successive bounded corrections
→ migrate consumers and remove obsolete ownership only after closure
→ repeat without restarting accepted research
→ independent family review
→ final verification
```

A correction unit is not a run boundary. `converging` is internal progress; `full-family` ends only `aligned` or exactly `blocked`.

`focused-correction` exists only when the operator explicitly names a bounded objective. README or roadmap text cannot narrow a family-only invocation.

A dependency remains inside the calling orchestration even when foundation or another Material family implements it. Internal prerequisites execute depth-first and return automatically to the caller.

Portable read-only skills own source, semantics, token, Web, correction-review, and family-review concerns. Contract synthesis, implementation, adoption, prerequisites, state updates, and continuation remain in the orchestrator context.

Current implementation is editable evidence, not Material authority. Preserve confirmed behavior while revalidating architecture, ownership, exports, imports, and dependency closure.

## Completion

A family is complete only when:

- supported surface and ownership are valid;
- actual dependencies and prerequisites are closed;
- one canonical owner/public API remain;
- adoption and obsolete-owner cleanup are complete;
- semantic, token, DOM, style, motion, browser, consumer, boundary, and architecture proof is sufficient;
- operator comparison is accepted when required;
- `material-family-review` returns complete;
- final `pnpm verify` passes.

Each correction and final review permits one initial review and at most one substantive re-review. Mechanical documentation fixes do not restart accepted research.

The active family, blocker, and one next action are recorded in [`docs/roadmap.md`](./docs/roadmap.md).
