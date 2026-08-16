# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, private renderer integration, and Material-specific documentation.

Official Material 3 Expressive defines the public model. Contract workers read it through the repository-configured `material3` MCP. `@m3e/web` is the preferred private renderer, not a public API authority.

## Public entrypoint

Consumers use the curated root API:

```ts
import { MDButton, MDLoadingIndicator } from '@shared/ui/material';
```

A public `MD*` family:

- uses official Material terminology and semantics;
- is defined independently from current Mioframe consumers;
- keeps renderer tags, attributes, events, types, and private CSS inputs out of consumers;
- contains no product behavior or undocumented Material extension.

## Family layout

A family processed by the current workflow has exactly three mandatory definition artifacts:

```text
components/<family>/
  contract.ts
  tokens.css
  BEHAVIOR.md
  <Vue runtime, tests, stories, private renderer glue>
```

- `contract.ts` owns public parameters/props, slots, events, public types/configurations and defaults.
- `tokens.css` owns the current official public component-token contract/catalogue.
- `BEHAVIOR.md` owns normative observable behavior, accessibility, geometry and motion.

A family `README.md` may exist as ordinary developer documentation. It is not a workflow stage, runtime contract, migration gate, or completion record.

Old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files may remain temporarily in untouched families as legacy evidence. They are removed when that family is converted through the current workflow.

## Ownership

Material owns canonical Vue contracts/adapters/exports, official public component tokens, renderer-independent foundation/theme declarations, private family-local renderer mappings/workarounds, and component-owned proof.

Material does not own product/domain behavior, operation state, persistence, routing/errors, application `--app-*` tokens, generic non-Material shared UI, renderer internals, private shadow DOM, or copied renderer interaction systems.

## Renderer boundary

Outside this directory, code must not import `@m3e/web`, render `m3e-*`, consume renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside an owning family implementation, prefer documented exact-version renderer inputs and keep private glue local. Do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion when the renderer already satisfies the contract.

## Workflow

```text
API contract
     ↓
Token contract ───┐
                  ├─→ contract ready → implementation → migration if required → architect review / CI
Behavior contract ┘
```

API establishes the current structural surface first. Token and behavior workers then stay independently focused on their own Material facts while using `contract.ts` only as structural scope/terminology.

The workflow is resume-first. Reinvoking `material-component <name>` continues current repository state and does not regenerate completed contracts. A completed stage is reopened only by an exact architect correction handoff.

Coding-agent work ends at architect handoff. Semantic review, PR/CI handling, roadmap completion, and merge readiness are architect-owned.

See [`docs/component-workflow.md`](./docs/component-workflow.md) for sequencing and [`docs/roadmap.md`](./docs/roadmap.md) for architect-maintained program status.
