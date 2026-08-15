# Mioframe Material documentation

This directory owns the canonical documentation for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable library ownership, public Vue boundary, renderer isolation, tokens, guidance, and completion principles.
- [Component workflow](./component-workflow.md) — the complete definition/implementation/migration/review orchestration and correction routing.
- [Family definition](./component-contract.md) — ownership and isolation of `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and family `README.md` guidance.
- [Component adapter contract](./component-adapter.md) — Vue-to-m3e mapping, controlled state, composition, renderer gaps, accessibility, and proof rules.
- [Component token contract](./component-tokens.md) — public official token ownership, private renderer mapping, and observable verification. Family/foundation CSS files are the executable token catalogues.
- [Confirmed m3e defects](./m3e-defects.md) — stable defect identities, evidence, mitigation, revalidation, and removal.
- [Roadmap](./roadmap.md) — the only owner of current milestone status, blockers, and next operator action.
- [Library README](../README.md) — public entrypoint, family layout, guidance ownership, and renderer boundary.

## Operating model

The operator invokes:

```text
material-component <name>
```

once. The orchestrator launches narrow workers for API contract, token contract, behavior contract, and developer usage guidance. The three technical contracts gate standalone implementation; guidance is independent and must be complete before the later migration worker. Migration and fresh independent review remain separate contexts. Non-deterministic architecture is escalated only when required.

The sole official Material documentation source for definition extraction and independent definition verification is the repository-configured `material3` MCP server in `.mcp.json`.

Family `README.md` is generated from Material guidance in its own fresh context and explains what the component is and how it should be used. It is not a substitute for `contract.ts`, `tokens.css`, or `BEHAVIOR.md`.

Repository documentation is intentionally layered: `AGENTS.md` files route agents to these focused sources instead of duplicating the full workflow.

`@m3e/web`, raw `m3e-*` elements, renderer types/events, `--m3e-*`, and `--md-private-*` remain private implementation details. `--app-*` remains outside Material ownership.
