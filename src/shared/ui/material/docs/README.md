# Mioframe Material documentation

This directory owns the canonical documentation for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable library ownership, public Vue boundary, renderer isolation, tokens, and completion principles.
- [Component workflow](./component-workflow.md) — the complete three-contract/implementation/migration/review orchestration and correction routing.
- [Family contract](./component-contract.md) — ownership and isolation of `contract.ts`, `tokens.css`, and `BEHAVIOR.md`.
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

once. The orchestrator launches three narrow Material contract workers, then a standalone implementation worker, a separate migration worker, and a fresh independent reviewer. Non-deterministic architecture is escalated only when required.

The sole official Material documentation source for contract extraction and independent contract verification is the repository-configured `material3` MCP server in `.mcp.json`.

Repository documentation is intentionally layered: `AGENTS.md` files route agents to these focused sources instead of duplicating the full workflow.

`@m3e/web`, raw `m3e-*` elements, renderer types/events, `--m3e-*`, and `--md-private-*` remain private implementation details. `--app-*` remains outside Material ownership.
