# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, private renderer integration, and Material-specific documentation.

Official Material 3 Expressive defines the public model. `@m3e/web` is the preferred private renderer, not an API authority.

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

A family processed by the current workflow uses narrow durable contracts:

```text
components/<family>/
  contract.ts
  tokens.css
  BEHAVIOR.md
  GUIDANCE.md
  SOURCES.md
  <Vue runtime, tests, stories, private renderer glue>
```

- `contract.ts` owns props, slots, emits, public types/defaults/combinations.
- `tokens.css` owns the public official component-token contract.
- `BEHAVIOR.md` owns normative observable behavior, accessibility, geometry and motion.
- `GUIDANCE.md` owns correct consumer usage and composition guidance.
- `SOURCES.md` owns official-source provenance/conflicts.

Old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files may remain temporarily in untouched families as legacy evidence. They are removed when that family is converted through the current workflow.

The complete operator flow belongs only to [`docs/component-workflow.md`](./docs/component-workflow.md). The normal entrypoint remains one `material-component <name>` invocation.

## Ownership

Material owns:

- canonical Vue contracts, adapters and exports;
- official public component tokens;
- renderer-independent Material foundation and theme declarations;
- private family-local renderer mappings;
- approved family-local renderer corrections/workarounds;
- component tests, stories, visual/browser proof, and stable renderer defect records.

Material does not own:

- product/domain behavior, operation state, persistence, routing, or errors;
- application-owned `--app-*` tokens;
- generic shared UI that is not an official Material component;
- renderer internals, private shadow DOM, or copied renderer interaction systems.

## Renderer boundary

Outside this directory, code must not import `@m3e/web`, render `m3e-*`, consume renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside an owning family, prefer documented exact-version renderer inputs, derive private glue from package-exported types, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

## Workflow

The normal workflow is deliberately small:

```text
contract
  → implement + standalone proof + migrate consumers
  → fresh independent review
  → architect / PR / exact-head CI
```

The canonical component is established before migration. Legacy call sites adapt to the canonical Material API; they do not define it.

A non-deterministic architecture/ownership problem is escalated through `architect-handoff` only when it actually appears rather than being a mandatory stage for every component.

See [`docs/roadmap.md`](./docs/roadmap.md) for current program status and next action.
