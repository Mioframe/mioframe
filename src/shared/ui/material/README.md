# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material 3 Expressive implementation.

Its navigation mirrors official Material documentation:

```text
material/
  foundations/
  styles/
  components/
```

This is a navigation and ownership map, not a reason to create empty production layers.

## Universal request

Use one entrypoint for any explicit Material artifact:

```text
material <artifact-or-request>
```

Examples:

```text
material Button
material State layer
material Ripple
material Focus indicator
material Elevation
material Motion
material Fix the Button target geometry
```

The router resolves the official owner and executes the applicable component or foundation/style workflow.

A valid explicit request is sufficient. The agent must not refuse because the artifact is not a component, no component migration is active, no production consumer exists, the roadmap names another family, or the canonical directory has not yet been created.

When there is no production consumer, implement the smallest coherent official contract with owner-local tests and a bounded fixture. Do not invent a fake product consumer.

## Navigation

### [Foundations](./foundations/README.md)

Official cross-component behavior and platform contracts, including accessibility, adaptive/layout, interaction foundations, State Layer, ripple, and focus indication.

### [Styles](./styles/README.md)

Official cross-component visual systems: color, elevation, icons, motion, shape, and typography.

### [Components](./components/README.md)

Official public component families. Family directories use the official documentation slug.

Examples:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons

state layer / ripple / focus indication
→ src/shared/ui/material/foundations/interaction
```

Use a narrower official slug when official navigation defines one.

Project-specific compositions, screens, workflows, and generic platform infrastructure remain outside this library.

## Owner layout

Component example:

```text
components/<official-docs-slug>/
  README.md
  AUDIT.md
  index.ts
  <Component>.vue
  <Component>.test.ts
  <Component>.stories.ts
  ... only justified files
```

Foundation/style example:

```text
foundations/<official-slug>/
  README.md
  AUDIT.md
  index.ts
  ... implementation, tests, and fixtures only when justified

styles/<official-slug>/
  README.md
  AUDIT.md
  index.ts
  ... implementation, tests, and fixtures only when justified
```

- `README.md` documents current implementation, omissions, incomplete/unverified capability, ownership, consumers, deviations, and review state.
- `AUDIT.md` contains the latest independent review.
- Authoring updates README but never edits AUDIT.
- Any implementation change sets `Review status: review required after changes`.

No separate operator report file is required. Visible problems or acceptance are reported directly in the user message and persisted in the applicable README.

## Routing compatibility

`material-component` remains valid for component work.

A non-component request sent through it must be rerouted rather than rejected:

```text
material-component State layer
→ material-foundation State layer
```

`material-foundation` implements both official foundations and styles.

## Operator feedback

For visible component or rendered foundation/style behavior, README may record:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

- A reported visible defect means `rejected`.
- After production behavior changes, authoring may set `awaiting re-review`.
- Only explicit user acceptance may set `accepted`.

## Public API

Product code uses the curated root entry point where a public Material artifact is intended for consumers:

```ts
import { MDButton } from '@shared/ui/material';
```

Private implementation routes, testing fixtures, stories, documentation, and audits are not public API.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → project-specific shared UI and product layers
```

- foundations and styles do not import component families;
- families do not deep-import another family's private files;
- Material code does not import product layers;
- generic infrastructure does not contain Material family knowledge.

Generic browser/platform utilities remain generic when they contain no Material semantics. Material-specific state, token, clipping, focus, motion, or rendering ownership belongs in this library even when its current implementation is legacy.

## New Material work

1. Resolve the requested artifact against official Material navigation.
2. Route it to component, foundation, style, or cross-layer ownership.
3. Record official source and inventory status.
4. Create or update the canonical owner README.
5. Implement the smallest coherent surface required by the explicit request and affected consumers.
6. Record actual official capability left unimplemented and every invalid/unsupported route.
7. Prove final rendered owners and behavior with proportional tests and bounded fixtures/stories.
8. Migrate existing consumers and remove obsolete Material ownership when applicable.
9. Run applicable local verification.
10. Run independent review separately.
11. Obtain explicit operator acceptance when visible review is required.

Do not stop after target classification, research, or a plan.

Do not hide unfinished work to obtain a successful status.

## State Layer and interaction foundations

State Layer is a valid direct implementation target, not a component request that should be rejected.

Its implementation must resolve applicable:

- state-input ownership;
- color and opacity routes;
- rendered layer and bounds;
- clipping and shape inheritance;
- disabled and simultaneous-state behavior;
- lifecycle, release, cancellation, cleanup, and reduced motion;
- generic component-consumption bridge;
- testing-only forced-state support.

An opacity token declaration alone is not an implementation. The final rendered layer, bounds, clipping, state winner, and consumer route must work.

## Current physical state

| Area                                   | Current owner                                                    | Canonical owner                                  | State                                                   |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Button family                          | `material/components/buttons` after this PR's path normalization | `material/components/buttons`                    | active migration; see family `README.md` and `AUDIT.md` |
| Other existing official `MD*` families | existing `src/shared/ui/<LegacyFamily>` directories              | `material/components/<official-docs-slug>`       | legacy until migrated                                   |
| Color/theme tokens                     | `src/shared/lib/md/tokens.css`                                   | `material/styles/color` when migrated            | legacy                                                  |
| Elevation                              | `src/shared/lib/md/tokens.css`                                   | `material/styles/elevation` when migrated        | legacy                                                  |
| Motion                                 | `src/shared/lib/md/tokens.css`                                   | `material/styles/motion` when migrated           | legacy                                                  |
| Shape                                  | current token/style owners                                       | `material/styles/shape` when migrated            | legacy                                                  |
| Typography                             | `src/shared/lib/md`                                              | `material/styles/typography` when migrated       | legacy                                                  |
| Material Symbols                       | `src/shared/ui/Icon`                                             | `material/styles/icons` when migrated            | legacy                                                  |
| State layer, ripple, focus             | `src/shared/ui/State`                                            | `material/foundations/interaction` when migrated | legacy; valid direct migration target                   |

Local owner documentation is the detailed state owner. This table is only navigation.

## Anti-overengineering

Do not create placeholder implementation folders, fixed file profiles, runtime registries, broad wrappers, fake consumers, separate visual report files, or a second metadata system. The official-documentation hierarchy exists to make the library easy to navigate and review.
