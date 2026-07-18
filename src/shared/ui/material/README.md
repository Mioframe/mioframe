# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material 3 Expressive implementation.

```text
material/
  foundations/
  styles/
  components/
```

This is a navigation and ownership map, not a reason to create empty production layers.

## Generalization boundary

Shared library navigation and skills define only artifact-independent rules.

Do not place concrete family selectors, DOM nodes, custom-property names, token values, endpoints, defects, or proposed family structures here.

Concrete implementation facts belong in the selected owner README, AUDIT, code, tests, fixtures/stories, roadmap when it records active work, and task-specific PR description.

## Universal request

Use:

```text
material <artifact-or-request>
```

Syntax examples:

```text
material <component-family>
material <foundation-artifact>
material <style-domain>
material <bounded Material correction>
```

The router resolves official ownership and executes the applicable workflow.

A valid explicit request is sufficient. It is not blocked merely because the artifact is not a component, no migration is active, no consumer exists, the roadmap names another target, or the canonical directory is absent.

When no production consumer exists, implement the smallest coherent official contract with owner-local tests and a bounded fixture. Do not invent a fake consumer.

## Navigation

### [Foundations](./foundations/README.md)

Official cross-component behavior and platform contracts.

### [Styles](./styles/README.md)

Official cross-component visual systems and token domains.

### [Components](./components/README.md)

Official public component families.

Canonical mapping uses placeholders:

```text
m3.material.io/components/<official-family-slug>
→ src/shared/ui/material/components/<official-family-slug>

<official-foundation-domain>
→ src/shared/ui/material/foundations/<official-foundation-slug>

<official-style-domain>
→ src/shared/ui/material/styles/<official-style-slug>
```

Use the narrowest official owner available.

Project-specific compositions, screens, workflows, and generic platform infrastructure remain outside this library.

## Owner layout

```text
components/<official-docs-slug>/
  README.md
  AUDIT.md
  index.ts
  <Component>.vue
  <Component>.test.ts
  <Component>.stories.ts
  ... only justified files

foundations/<official-slug>/
  README.md
  AUDIT.md
  index.ts
  ... only justified implementation, tests, and fixtures

styles/<official-slug>/
  README.md
  AUDIT.md
  index.ts
  ... only justified implementation, tests, and fixtures
```

- README documents current implementation and review state.
- AUDIT contains the latest independent review.
- Authoring never edits AUDIT.
- An implementation change sets review required after changes.
- No separate operator report file is required.

## Routing compatibility

Specialized entrypoints remain valid:

```text
material-component <component-family>
material-component-review <component-family>
material-foundation <foundation-or-style-artifact>
```

A request sent through the wrong specialized entrypoint is rerouted by official ownership rather than rejected for classification alone.

## Operator feedback

For visible behavior, README may record:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

- A reported visible defect means `rejected`.
- Authoring may use `awaiting re-review` only after production behavior changes and objective surfaces are rechecked.
- Only explicit user acceptance sets `accepted`.

## Public API

Product code uses the curated Material entry point when an artifact is public:

```ts
import { MaterialArtifact } from '@shared/ui/material';
```

The identifier is illustrative only. Private routes, fixtures, stories, documentation, and audits are not public API.

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

Generic platform utilities remain generic when they contain no Material semantics. Material-specific state, token, clipping, focus, motion, or rendering ownership belongs in this library even when its current implementation is legacy.

## New Material work

1. Resolve the requested artifact against official navigation.
2. Route it to component, foundation, style, or cross-layer ownership.
3. Record source and inventory status.
4. Create or update the canonical owner README.
5. Implement the smallest coherent surface required by the explicit request and affected consumers.
6. Record absent, invalid, unresolved, and out-of-boundary capability honestly.
7. Prove final owners and behavior with proportional tests and bounded fixtures/stories.
8. Migrate existing consumers and remove obsolete Material ownership when applicable.
9. Run local verification.
10. Run independent review separately.
11. Obtain explicit operator acceptance when visible review is required.

Do not stop after classification, research, or a plan.

## Rendered foundations and interaction primitives

A rendered foundation or interaction primitive is a valid direct implementation target.

Resolve applicable:

- semantic and input-state ownership;
- token/color/opacity routes;
- rendered owner and bounds;
- clipping and shape inheritance;
- state precedence;
- lifecycle, cancellation, cleanup, and reduced motion;
- generic consumer bridge;
- testing-only forced-state support.

A token declaration alone is not implementation. Final rendered behavior must work.

## Current physical state

The inventory and roadmap describe current concrete owners and active migrations. Those records are descriptive project state, not reusable implementation rules or templates for unrelated artifacts.

## Anti-overengineering

Do not create placeholder implementation folders, fixed file profiles, runtime registries, broad wrappers, fake consumers, separate visual report files, or a second metadata system.
