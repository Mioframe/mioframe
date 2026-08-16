# Mioframe Material documentation

This directory owns the canonical documentation for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable library ownership, public Vue boundary, renderer isolation, tokens, and completion principles.
- [Component workflow](./component-workflow.md) — resume-first contract/implementation/migration orchestration and correction routing.
- [Family definition](./component-contract.md) — ownership and isolation of `contract.ts`, `tokens.css`, and `BEHAVIOR.md`.
- [Component adapter contract](./component-adapter.md) — Vue-to-m3e mapping, controlled state, composition, renderer gaps, accessibility, and proof rules.
- [Component token contract](./component-tokens.md) — public official token ownership, private renderer mapping, and observable verification. Family/foundation CSS files are the executable token catalogues.
- [Confirmed m3e defects](./m3e-defects.md) — stable defect identities, evidence, mitigation, revalidation, and removal.
- [Roadmap](./roadmap.md) — architect-maintained current milestone status, blockers, and next action.
- [Library README](../README.md) — public entrypoint, family layout, and renderer boundary.

## Operating model

The normal operator entrypoint is:

```text
material-component <name>
```

For a new family, the orchestrator runs three narrow isolated contract workers (API, tokens, behavior), then standalone implementation and consumer migration if required.

For an existing/incomplete family, the same command resumes current repository state instead of rebuilding completed stages. A completed stage is reopened only by an exact architect correction handoff.

The coding workflow stops after implementation/proof and required migration. Final semantic review, PR/CI handling, roadmap completion, and merge readiness are architect-owned.

The sole official Material documentation source for contract extraction is the repository-configured `material3` MCP server in `.mcp.json`.

Family `README.md` files may exist as ordinary developer documentation but are not mandatory workflow artifacts or gates.

Repository documentation is intentionally layered: `AGENTS.md` files route agents to these focused sources instead of duplicating the full workflow.

`@m3e/web`, raw `m3e-*` elements, renderer types/events, `--m3e-*`, and `--md-private-*` remain private implementation details. `--app-*` remains outside Material ownership.
