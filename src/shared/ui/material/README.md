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

Concrete implementation facts belong in the selected owner README, AUDIT, code, tests, fixtures/stories, roadmap when it records active work, and task context.

A pilot may refine shared policy only through a cross-artifact invariant. Do not add a new rule when an existing rule already prohibited the defect.

## Universal request

Use:

```text
material <artifact-or-request>
```

The router resolves official ownership and executes:

- component family → `material-component-authoring`;
- independent component review → `material-component-review`;
- foundation, interaction primitive, style, or token domain → `material-foundation`;
- cross-layer request → one canonical shared owner plus affected consumers.

`material-component` remains a compatibility alias only.

A valid explicit request is sufficient. It is not blocked merely because the artifact is not a component, no migration is active, no consumer exists, the roadmap names another target, or the canonical directory is absent.

When no production consumer exists, implement the smallest coherent official contract with owner-local tests and a bounded fixture. Do not invent a fake consumer.

## Evidence boundary

Use current successful complete Material MCP reads as working official evidence. Capture age alone is not a defect.

Source-control history is not Material authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.

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

- README documents the reconstructed contract, diagnosis, strategy, current implementation, evidence, and review state.
- AUDIT contains the latest independent contradiction-seeking review.
- Authoring never edits AUDIT.
- An implementation change sets review required after changes.
- No separate operator report file is required.

## Calibrated authoring path

For every component, foundation, or style target:

1. Resolve the official owner and current-run sources.
2. Reconstruct the contract independently of legacy implementation.
3. Diagnose each material problem and actual owner.
4. Select `repair`, `restructure`, or `replace`.
5. Implement through ordered semantics, ownership, geometry/routing, lifecycle, and migration gates.
6. Remove superseded ownership and contradictory documentation.
7. Add proportional proof, using real input for lifecycle claims.
8. Pass an evidence-backed objective gate and local verification.
9. Run independent contradiction-seeking review separately.
10. Obtain explicit operator acceptance only for remaining perceived visual fidelity.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconsider the implementation strategy.

## Diagnosis and strategy

Use one primary diagnosis per material problem:

- canonical behavior;
- implementation defect;
- architecture defect;
- foundation/style or generic-infrastructure defect;
- evidence gap;
- product deviation.

Use:

- `repair` when contract, anatomy, and ownership are sound;
- `restructure` when supported capability remains valid but ownership, routes, lifecycle, or anatomy are wrong;
- `replace` when the implementation is based on a wrong contract or preserves conflicting models.

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
- generic infrastructure does not contain Material family knowledge;
- components do not locally patch shared-foundation defects.

Generic platform utilities remain generic when they contain no Material semantics. Material-specific state, token, clipping, focus, motion, or rendering ownership belongs in this library even when its current implementation is legacy.

## Proof boundary

- Forced states prove stable appearance only.
- Screenshot baselines prove regression stability only.
- Real browser input proves acquisition, release, trajectory, interruption, cancellation, and cleanup.
- Intermediate transition evidence is required only when endpoints cannot prove the changed or reported composition risk.
- Operator review proves perceived fidelity only after objective gates close.

Do not substitute one proof layer for another.

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

The inventory and roadmap describe current concrete owners and active migrations. Those records are descriptive project state, not reusable implementation templates.

## Anti-overengineering

Do not create placeholder implementation folders, fixed file profiles, runtime registries, broad wrappers, fake consumers, separate visual report files, semantic Markdown validators, or a second metadata system.
