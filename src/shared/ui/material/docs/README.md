# Mioframe Material documentation

This directory owns the canonical documentation for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable library ownership, public Vue boundary, renderer isolation, tokens, and completion principles.
- [Component workflow](./component-workflow.md) — the complete contract/implementation/review orchestration and correction routing.
- [Family contract](./component-contract.md) — ownership of `contract.ts`, `tokens.css`, `BEHAVIOR.md`, `GUIDANCE.md`, and `SOURCES.md`.
- [Component adapter contract](./component-adapter.md) — Vue-to-m3e mapping, controlled state, composition, renderer gaps, accessibility, and proof rules.
- [Component token contract](./component-tokens.md) — public official token ownership, private renderer mapping, and observable verification. Family/foundation CSS files are the executable token catalogues.
- [Confirmed m3e defects](./m3e-defects.md) — stable defect identities, evidence, mitigation, revalidation, and removal.
- [Roadmap](./roadmap.md) — the only owner of current milestone status, blockers, and next operator action.
- [Library README](../README.md) — public entrypoint, family layout, and renderer boundary.

## Operating model

The operator invokes:

```text
material-component <name>
```

once. The orchestrator uses three fresh roles: canonical contract, implementation plus migration, and independent review. Non-deterministic architecture is escalated only when required.

Repository documentation is intentionally layered: `AGENTS.md` files route agents to these focused sources instead of duplicating the full workflow.

Official Material defines the public component model. `@m3e/web`, raw `m3e-*` elements, renderer types/events, `--m3e-*`, and `--md-private-*` remain private implementation details. `--app-*` remains outside Material ownership.
