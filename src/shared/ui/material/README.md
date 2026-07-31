# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, private renderer integration, and Material-specific documentation.

Official Material 3 Expressive defines the public model. `@m3e/web` is the preferred private renderer, not an API authority.

## Public entrypoint

Consumers use the curated root API:

```ts
import { MDButton, MDLoadingIndicator } from '@shared/ui/material';
```

A public `MD*` component:

- uses official Material terminology selected by its ready family architecture;
- exposes only confirmed current demand plus the minimum coherent Material surface;
- keeps renderer tags, attributes, events, types, and private CSS inputs out of consumers;
- contains no product behavior or undocumented Material extension without an explicit architecture decision.

## Family layout

```text
components/<family>/
  DESIGN.md
  ARCHITECTURE.md
  IMPLEMENTATION.md
  MIGRATION.md
  REVIEW.md
  README.md
  <runtime, tests, stories, tokens>
```

The five stage artifacts are durable handoffs. A family `README.md` is only a short navigation index and must not own mutable status or next action.

The complete staged execution contract belongs only to [`docs/component-workflow.md`](./docs/component-workflow.md). The normal operator entrypoint is one `material-component <name>` invocation; the operator does not repeat it after every stage.

## Ownership

Material owns:

- canonical Vue adapters and exports;
- selected official component tokens;
- renderer-independent Material foundation and theme declarations;
- private family-local renderer mappings;
- approved wrapper corrections and controlled renderer workarounds;
- component tests, stories, visual/browser proof, and stable defect records.

Material does not own:

- product/domain behavior, operation state, persistence, routing, or errors;
- application-owned `--app-*` tokens;
- generic shared UI that is not an official Material component;
- renderer internals, private shadow DOM, or copied renderer interaction systems.

## Renderer boundary

Outside this directory, code must not:

- import `@m3e/web`;
- render `m3e-*` elements;
- consume renderer element types or events;
- depend on `--m3e-*` variables;
- inspect renderer DOM.

Inside an owning family, prefer documented renderer inputs, derive private glue from package-exported types, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

## Token boundary

- `DESIGN.md` captures the complete official component-token catalogue.
- `ARCHITECTURE.md` selects the minimum complete runtime token set required by confirmed scenarios.
- foundation owns supported `--md-ref-*` and `--md-sys-*` tokens;
- each family owns only its selected `--md-comp-<family>-*` tokens;
- `docs/token-api.md` is the supported public catalogue;
- `--m3e-*` and `--md-private-*` stay private;
- `--app-*` stays outside Material.

Do not create a token registry, token DSL, compatibility alias layer, duplicate owner, or exhaustive renderer/Material token copy without a demonstrated current requirement and separate architecture decision.

## Proof and visual feedback

Architecture selects proof owners before implementation. Component tests own Vue contracts, browser tests own native and accessibility behavior, visual regression owns stable presentation, migration proof owns product scenarios, and independent review checks the complete result.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect does not block completion. A concrete reported defect routes to the owning stage.

See [`docs/roadmap.md`](./docs/roadmap.md) for current program status and next action.
