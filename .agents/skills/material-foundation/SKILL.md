---
name: material-foundation
description: 'Use for implementing, migrating, aligning, or correcting an official Material foundation or style contract, including state layer, ripple, focus indication, accessibility, adaptive/layout, color, elevation, icons, motion, shape, typography, theme, tokens, or units. An explicit user request is sufficient to start this workflow.'
paths:
  - 'src/shared/ui/material/foundations/**'
  - 'src/shared/ui/material/styles/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'docs/material-3/foundation-*.md'
  - 'docs/material-3/library-architecture.md'
  - 'docs/material-3/source-of-truth.md'
---

# Material foundations and styles

Use this workflow for:

- an explicit request to implement a named official foundation or style artifact;
- migration of an existing legacy Material foundation/style owner;
- correction or replacement of a shared cross-family contract;
- a source refresh that changes or verifies a shared contract.

Examples:

```text
material State layer
material Ripple
material Focus indicator
material Interaction states
material Color roles
material Elevation
material Motion
material Shape
material Typography
```

## Explicit-request rule

A valid user request for an official Material foundation or style is a current requirement and is sufficient to start implementation.

Do not refuse or defer solely because:

- no component migration is active;
- no current production consumer exists;
- only one current component consumes the behavior;
- the roadmap currently names another family;
- the canonical directory has not been created;
- the current implementation lives in `src/shared/ui/State`, `src/shared/lib/md`, `src/shared/ui/Icon`, or another legacy owner;
- the request entered through `material-component`.

When there is no current production consumer, implement the smallest coherent official contract requested by the user and prove it with foundation/style-owned tests plus a bounded testing or Storybook fixture. Do not invent a fake product consumer.

Existing consumers remain important for migration and blast-radius proof, but they are not a prerequisite for an explicit standalone library request.

## Evidence boundary

Use only:

- the current user task;
- current workspace files;
- official Material sources;
- local project verification commands.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history as foundation evidence.

## Resolve official ownership

Classify the artifact by official Material navigation.

```text
src/shared/ui/material/foundations/<official-slug>
src/shared/ui/material/styles/<official-slug>
```

Use `foundations` for official cross-component behavior and platform contracts, including accessibility, adaptive/layout, and interaction foundations.

Use `styles` for official visual systems, including color, elevation, icons, motion, shape, and typography.

State layer, ripple, and focus indication are interaction-foundation work. Their current legacy owner may be `src/shared/ui/State`; the canonical target is resolved from official navigation, normally under `material/foundations/interaction` or a narrower official slug when one exists.

Do not create a generic catch-all foundation owner or a top-level patterns tree without an official equivalent.

## Distinguish Material from generic infrastructure

Material foundations own Material semantics and public/private Material routes.

Generic browser, DOM, event, geometry, lifecycle, timing, and teleport utilities remain in their generic owners when they do not encode Material meaning.

Do not create a Material wrapper merely to move a generic utility into the library. Conversely, do not leave Material-specific state, token, clipping, motion, focus, or rendering ownership in generic infrastructure merely because the current legacy implementation is there.

## Source status and inventory

Record canonical source status:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Record inventory status separately:

```text
Official capability inventory:
  complete
  snapshot-complete (<snapshot>; currentness unverified)
  incomplete (<exact gap>)
  blocked (<exact reason>)
```

A current-complete claim requires all applicable current domain pages and structured sources to be inspected without partial, truncated, suspicious, stale, or unresolved coverage.

A stale snapshot may be snapshot-complete, not current-complete. Spot checks prove particular facts, not complete domain coverage.

Classify each official item as:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved domain boundary.

Do not classify an invalid route as missing capability. Do not inflate optional or non-normative guidance into required capability.

## Preflight

Before production changes, resolve only applicable:

- requested artifact and official domain;
- exact official sources and source status;
- current owner and canonical owner;
- current consumers and legacy import paths;
- required public, private, or testing-only contract;
- change mode: new implementation, relocation, additive, correction, replacement, or source refresh;
- expected behavior or rendering delta;
- semantics, lifecycle, state, clipping, focus, motion, token, and accessibility ownership;
- proof and migration needs;
- known omissions and genuine blockers.

An unresolved source, ownership, compatibility, safety, or verification decision may block the task only when it materially prevents correct implementation. Name one exact blocker and the evidence already gathered.

## Local documentation

Create or update before production changes:

```text
src/shared/ui/material/foundations/<official-slug>/README.md
```

or:

```text
src/shared/ui/material/styles/<official-slug>/README.md
```

README records:

- official mapping and canonical source status;
- implementation scope and capability inventory;
- implemented contract;
- partial, defective, provisional, or unverified contract;
- actual official capability not implemented;
- officially unsupported or invalid routes;
- public and private API;
- semantics, state, lifecycle, clipping, rendering, and token ownership;
- current and migrated consumers;
- known issues and required follow-up;
- representative verification;
- review status.

Set `Review status: review required after changes` before production edits.

Authoring never edits an existing `AUDIT.md`.

## Ownership rule

An official foundation/style owner is justified by either:

1. an explicit user request to implement that official library artifact; or
2. a real current cross-family requirement.

Family-specific behavior remains local only when it has no official foundation/style ownership and no explicit standalone library requirement.

Foundations and styles:

- remain free of component-family and product knowledge;
- expose the smallest coherent contract required by the explicit request and affected consumers;
- do not import component families or the root Material barrel;
- do not become universal registries, state machines, theme managers, or CSS DSLs.

## State layer and interaction primitives

For state layer, ripple, focus indication, or related interaction work, resolve and implement applicable:

- semantic purpose and official state model;
- input state ownership;
- color and opacity routes;
- rendered layer owner and bounds;
- clipping and shape inheritance;
- pointer/focus/keyboard acquisition where owned;
- disabled and simultaneous-state behavior;
- lifecycle, release, cancellation, and cleanup;
- reduced-motion behavior when applicable;
- generic component-consumption bridge;
- testing-only forced-state support, kept outside public product API;
- representative real consumers when they exist.

A generic primitive must not contain Button, Switch, Card, or other family-specific token routing or state precedence.

Do not claim State Layer implemented merely because an opacity token exists. The source must reach the correct rendered layer, bounds, clipping, state winner, and consumer route.

## Actual dependency rule

A shared contract is consumed only when changing its source input can affect the final output through a real implementation dependency.

These are not implementation routes:

- adjacent declarations;
- aliases to unchanged constants;
- equality assertions;
- comments claiming derivation;
- stories or tests that restate definitions.

When official numeric spring parameters cannot drive CSS directly, record them as canonical evidence and expose one honestly documented Web runtime adaptation. Do not describe the adaptation as literal spring consumption.

## CSS custom-property namespaces

Use only:

- exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens;
- justified semantic `--md-private-<owner>-<role>` routes;
- genuine `--app-*` application contracts.

Do not create ad-hoc public-looking `--md-<artifact>-*` namespaces. Do not create a custom property for a one-use constant unless runtime indirection is genuinely required.

Every touched variable must affect the correct final owner through a real route.

## Blast radius

For current consumers:

1. identify every affected contract class from current code;
2. migrate imports and routes to the canonical owner;
3. prefer the narrowest valid shared owner;
4. document cascade, inheritance, clipping, runtime, and visual impact;
5. add representative proof that actually exercises the changed route;
6. record remaining uncertainty in the shared-domain README and affected family READMEs.

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs require representative proof across affected contract classes.

Unchanged tests that never exercise the route are not proof.

When no production consumer exists, use a foundation-owned fixture to prove the complete requested contract without fabricating product usage.

## Proportional proof

Use only proof owned by the changed artifact:

- focused shared-owner contract and pure tests;
- computed CSS or browser checks for real cascade, clipping, focus, input, or lifecycle behavior;
- bounded canonical stories or fixtures for visible output;
- representative component consumers for existing cross-family impact;
- reduced-motion and interruption proof when owned;
- final rendered-owner assertions;
- public/private namespace and export checks;
- local project verification.

A screenshot baseline proves regression stability, not Material correctness.

Do not build a universal validation framework, motion catalog, generic test DSL, placeholder directory tree, or fake demonstration component.

## Migration and cleanup

When a legacy owner exists:

1. create the canonical official domain owner;
2. migrate current consumers and exports;
3. preserve accepted behavior except for documented corrections;
4. remove obsolete Material ownership and duplicate routes;
5. leave generic utilities in their correct generic owner;
6. document incomplete migration explicitly when atomic removal is genuinely unsafe.

Do not report migration complete while an obsolete Material owner or undocumented parallel path remains.

## Completion

Foundation/style implementation is finished when:

- the explicit requested contract is implemented coherently;
- code, README, exports, fixtures, tests, and current consumers agree;
- source and inventory status are honest;
- final rendered owners and real dependency routes are proved;
- representative blast-radius proof exists when consumers are affected;
- every remaining gap and visual rejection is explicit;
- applicable local verification passes;
- review status is `review required after changes`.

Finish with:

```text
MATERIAL FOUNDATION RESULT
Requested artifact:
Resolved kind: foundation | style
Official documentation path:
Current owner:
Canonical owner:
Change mode:
Canonical source status:
Official capability inventory:
Implemented:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid:
Consumers affected:
Legacy ownership:
Representative proof:
Local verification:
Documentation:
Status: implementation finished | blocked (<exact reason>)
Recommended review:
```

Do not report a blocker whose only reason is absence of a current component consumer, active component migration, roadmap priority, or pre-existing canonical directory.