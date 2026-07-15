---
name: material-foundation
description: 'Use when changing Material reference/system tokens, theme, units, typography, shape, elevation, motion, state/ripple/focus, verification adapters, icons, overlays, accessibility, density, or adaptive foundation contracts. Enforces canonical library ownership, registry-backed changes, bounded expansion, consumer impact, and representative verification.'
paths:
  - 'src/shared/ui/material/foundation/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'docs/material-3/foundation-*.md'
  - 'docs/material-3/library-architecture.md'
  - 'docs/material-3/component-testing.md'
  - 'docs/material-3/source-of-truth.md'
  - 'docs/material-3/units.md'
  - 'docs/material-3/tokens.md'
  - 'docs/material-3/baseline-theme.md'
  - 'docs/material-3/interaction-states.md'
  - 'docs/material-3/accessibility.md'
  - 'docs/material-3/layout-adaptive.md'
  - 'docs/material-3/density-spacing.md'
  - 'docs/material-3/icons.md'
  - 'docs/material-3/overlays.md'
---

# Material foundation

Use with `material3-guidelines`, `library-architecture.md`, `foundation-architecture.md`, and `component-testing.md` for cross-family Material contracts.

The canonical runtime location is `src/shared/ui/material/foundation/<domain>`. Existing owners in `src/shared/lib/md`, `src/shared/ui/State`, `src/shared/ui/Icon`, and `src/shared/ui/Overlay` are legacy until focused migration.

Do not broaden foundation work into unrelated components, a mass source-tree move, speculative package infrastructure, or a generic component-test framework.

## Preflight

Record:

- affected registry domain and exact official source snapshot;
- current production owner and canonical library owner;
- physical migration status: `legacy`, `migrating`, or `migrated`;
- public/private/verification-only contract;
- mode: `foundation-additive`, `foundation-correction`, `foundation-replacement`, `foundation-refresh`, or behavior-preserving `library-relocation-only`;
- direct consumers and expected delta;
- compatibility/migration decision;
- owner checks and representative consumer verification.

Use `foundation-impact: none` when a component only consumes an accepted contract. Use `blocked` when source meaning, current/canonical ownership, compatibility, migration, testing contract, or verification is unresolved.

## Ownership

```text
shared/lib generic infrastructure
  → material/foundation
  → material/components
  → material/patterns
  → product composition
```

Foundation code must not import or name consuming families. Generic private bridges and verification adapters expose only minimum component-agnostic inputs.

Generic DOM, browser, teleport, event, or geometry utilities remain outside the Material library unless their contract itself is Material-specific. Foundation may compose those utilities through narrow adapters.

Do not create a universal Material base, runtime token registry, generic resolver, cross-family state machine, second theme/overlay system, production state-matrix component, or generic test DSL.

## Registry and migration map

`foundation-registry.md` is the current correctness/status source. `src/shared/ui/material/README.md` is the physical migration map.

Every foundation change updates applicable status, snapshot, owners, public/private/testing contracts, consumers, gaps, verification, last-reviewed date, and physical migration state. Historical audits are evidence only.

New foundation artifacts must be created directly under the canonical library owner. Legacy paths may receive strict local repairs or relocation work but must not gain new Material ownership.

## Change modes

- **Library relocation only:** moves one cohesive accepted foundation owner without changing public meaning, values, behavior, rendering, or verification semantics. Update every import/export/consumer and remove the old path.
- **Additive:** may share a component PR only when source-backed, backward-compatible, owned by one existing domain, adding no lifecycle/context/dependency, and fitting focused verification. New runtime/testing artifacts use the canonical library path.
- **Correction:** may affect current consumers; document old/new meaning, inventory consumers, verify distinct paths, and normally use a focused PR.
- **Replacement:** requires a ready handoff, complete migration, removal of the old path, and blocking verification.
- **Refresh:** classify newer source evidence as clarification, addition, changed meaning/value, deprecation, removal, or deviation before changing behavior.

Physical relocation must not hide a correction or replacement. If meaning, behavior, public contract, or verification semantics change, use the stricter mode.

## Bounded expansion

Add official reference/system tokens only for current component or theme needs with exact verified paths.

Add or expand a runtime or verification primitive only when:

- Material or a platform/testing boundary defines a cross-family concern;
- the current owner is insufficient;
- the contract stays family-agnostic;
- total complexity is lower than local implementations.

For project-derived generic behavior without an official owner, require at least two unrelated current families or one unavoidable platform-wide owner such as overlay containment.

A verification adapter may be added for the first component only when the transient state is already a generic foundation concern, the adapter is private to testing, and family-local duplication would otherwise be unavoidable. It must not become a production/component API.

Do not complete palettes, motion catalogs, adaptive managers, state systems, or testing DSLs for hypothetical future use. Do not split a valid monolithic owner merely to mirror the target directory diagram.

## Domain constraints

- Reference/system owners contain no component tokens.
- Theme contexts override system roles, not component CSS.
- Units remain centralized in PostCSS/base variables; the Material-facing contract may move while generic build infrastructure remains outside the library.
- Typography uses system roles and shared Material utilities.
- Shape, elevation, and motion use verified roles or documented private platform adaptations.
- State/ripple/focus own generic capability, not host semantics or component precedence.
- Verification-only interaction adapters may force generic transient visual inputs for isolated Storybook matrices; they do not own component semantic state or prove real browser behavior.
- Icons own Material Symbol rendering, not product icon choice or component anatomy.
- Overlay foundation owns Material-facing containment/lifecycle capability, not component-specific anatomy or policy; generic teleport/outside-interaction helpers may remain in `shared/lib`.
- Accessibility, density, target area, and adaptivity remain policies unless a concrete runtime owner is required.

Deprecated contracts must be unused by new code, name their replacement, and have migration/removal targets. Remove obsolete paths with their replacement unless compatibility is explicit.

## Verification-only contracts

Verification adapters:

- live under the owning foundation domain's testing surface;
- are not re-exported from the project-facing Material root API;
- expose only generic state inputs such as hovered/focused/pressed when the foundation owns those concepts;
- may be used by canonical component state matrices;
- must not be imported by product code;
- must not create component-specific names, tokens, precedence, or anatomy knowledge;
- do not replace Storybook Playwright behavior tests using real input.

A missing generic verification capability is a foundation gap. Do not solve it with one family-local provider or a public component prop.

## Public API and imports

- Components consume accepted foundation entry points, not implementation files.
- Foundation modules must not import the root `@shared/ui/material` barrel.
- Product layers do not deep-import foundation internals or testing adapters.
- A public production foundation export requires registry ownership and accurate TSDoc.
- Verification adapters use a clearly testing-only entry point.
- Temporary legacy re-exports require a removal target and must not receive new usage.

## Verification

Use applicable:

- canonical location, dependency direction, public export, and no-deep-import checks;
- static vocabulary, ownership, bridge, testing-adapter, and registry checks;
- focused owner contract tests;
- browser checks for real focus, pointer/touch, ripple, overlays, viewport behavior, computed tokens, or platform adaptations;
- deterministic component state-matrix checks for verification adapter output;
- representative consumers for each distinct affected path;
- consumer import preservation during relocation;
- obsolete legacy path removal;
- final repository verification.

Forced visual states prove appearance only. Do not test component behavior the foundation does not own or use screenshots as the only proof.

## Completion

Registry, library migration map, owner docs, production/testing code, public exports, tests, source meaning, and consumer impact must agree. No family-specific knowledge, parallel replacement, permanent legacy export, family-local forced-state system, or hidden gap may remain. Component blueprints must reference the accepted resulting contract.
