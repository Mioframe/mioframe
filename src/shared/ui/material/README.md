# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, private renderer integration, and Material-specific documentation.

Official Material 3 Expressive defines the public model and correct component usage. Definition workers read it through the repository-configured `material3` MCP. `@m3e/web` is the preferred private renderer, not an API or guidance authority.

## Public entrypoint

Consumers use the curated root API:

```ts
import { MDButton, MDLoadingIndicator } from '@shared/ui/material';
```

A public `MD*` family:

- uses official Material terminology and semantics;
- is defined independently from current Mioframe consumers;
- documents when and how the component should be used according to Material guidance;
- keeps renderer tags, attributes, events, types, and private CSS inputs out of consumers;
- contains no product behavior or undocumented Material extension.

## Family layout

A family processed by the current workflow has three mandatory technical contracts plus one mandatory developer-guidance artifact:

```text
components/<family>/
  contract.ts
  tokens.css
  BEHAVIOR.md
  README.md
  <Vue runtime, tests, stories, private renderer glue>
```

- `contract.ts` owns public parameters/props, slots, events, public types and defaults.
- `tokens.css` owns the public official component-token contract/catalogue.
- `BEHAVIOR.md` owns normative observable behavior, accessibility, geometry and motion.
- `README.md` owns the official component description, when/how to use it, variant/content guidance, consumer accessibility responsibilities, and related-component distinctions. It is not a runtime contract.

Old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files may remain temporarily in untouched families as legacy evidence. They are removed when that family is converted through the current workflow.

The complete operator flow belongs only to [`docs/component-workflow.md`](./docs/component-workflow.md). The normal entrypoint remains one `material-component <name>` invocation.

## Ownership

Material owns:

- canonical Vue contracts, adapters and exports;
- official public component tokens;
- official family usage guidance;
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

Inside an owning family implementation, prefer documented exact-version renderer inputs, derive private glue from package-exported types, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

Migration consumes the finished canonical Mioframe Material API plus family `README.md` guidance and does not inspect renderer internals.

## Workflow

```text
API contract       ┐
Token contract     │
Behavior contract  ├─→ definition ready
Usage guidance     ┘
                        ↓
                 implementation
                        ↓
                    migration
                        ↓
               independent review
                        ↓
             architect / PR / CI
```

Definition workers are deliberately narrow and isolated. Standalone implementation remains focused on the three technical contracts plus exact m3e mapping; only the later migration worker reads application consumers and applies the README guidance.

A non-deterministic architecture/ownership problem is escalated through `architect-handoff` only when it actually appears rather than being a mandatory stage for every component.

See [`docs/roadmap.md`](./docs/roadmap.md) for current program status and next action.
