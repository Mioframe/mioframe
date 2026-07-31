# Mioframe Material documentation

This directory owns the canonical documentation for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable library ownership, public Vue boundary, renderer isolation, tokens, dependencies, and completion principles.
- [Staged workflow](./component-workflow.md) — the single complete owner of stage artifacts, control fields, worker isolation, routing, correction cycles, and final workflow verification.
- [Design document contract](./design-document.md) — complete official Material snapshot required in each family `DESIGN.md`.
- [Component adapter contract](./component-adapter.md) — Vue adapter, renderer mapping, workaround, accessibility, and proof rules.
- [Component token contract](./component-tokens.md) — official token capture, demand-scoped selection, runtime ownership, and verification.
- [Public token API](./token-api.md) — supported consumer-facing Material tokens.
- [Confirmed m3e defects](./m3e-defects.md) — stable defect identities, evidence, mitigation, revalidation, and removal.
- [Roadmap](./roadmap.md) — the only owner of current milestone status, blockers, and next operator action.
- [Library README](../README.md) — public entrypoint, family layout, and renderer boundary.

## Operating model

The operator invokes:

```text
material-component <name>
```

once. The orchestrator follows `component-workflow.md`, uses a fresh isolated worker for every reasoning stage, processes dependencies and correction routes, and stops only at completion or a genuine blocker.

README files are navigation only. They must not duplicate the full state machine, mutable family status, or next action.

Official Material defines the public component model. `@m3e/web`, raw `m3e-*` elements, renderer types/events, `--m3e-*`, and `--md-private-*` remain private implementation details. `--app-*` remains outside Material ownership.
