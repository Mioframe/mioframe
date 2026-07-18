---
name: material-foundation
description: 'Use for implementing, migrating, aligning, or correcting an official Material foundation or style contract. An explicit user request is sufficient to start this workflow.'
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

Use for an explicit request, migration, correction, replacement, or source refresh of an official Material foundation or style.

Syntax:

```text
material-foundation <official-foundation-or-style-artifact>
```

## Generalization boundary

This skill contains only rules common to official foundation and style work.

Do not add concrete component-family names, selectors, DOM nodes, custom-property names, token values, bug symptoms, or proposed consumer structures.

Concrete findings belong in the selected owner README, AUDIT, implementation, tests, fixtures, and task-specific PR description.

A finding may refine this skill only through an artifact-independent rule applicable to every foundation/style owner with the same risk.

## Explicit-request rule

A valid user request for an official Material foundation or style is a current requirement and is sufficient to start implementation.

Do not refuse or defer solely because:

- no component migration is active;
- no production consumer exists;
- only one consumer exists;
- the roadmap names another target;
- the canonical directory is absent;
- the current implementation is in a legacy owner;
- the request entered through another Material entrypoint.

When no production consumer exists, implement the smallest coherent official contract and prove it with owner-local tests plus a bounded fixture. Do not invent a fake product consumer.

Existing consumers determine migration and blast-radius proof, not whether the explicit request is allowed.

## Evidence boundary

Use only:

- the current user task;
- current workspace files;
- official Material sources;
- local project verification commands.

Do not use source-control history or remote workflow state as implementation evidence.

## Resolve official ownership

Classify the artifact by official Material navigation:

```text
src/shared/ui/material/foundations/<official-slug>
src/shared/ui/material/styles/<official-slug>
```

Use foundations for official cross-component behavior and platform contracts. Use styles for official visual systems and token domains.

A legacy owner is an implementation to inspect or migrate, not canonical evidence and not a reason to reject the task.

Do not create a generic catch-all owner without an official equivalent.

## Distinguish Material from generic infrastructure

Material owners contain Material semantics, routes, rendering contracts, and public/private Material APIs.

Generic browser, DOM, event, geometry, lifecycle, timing, and teleport utilities remain generic when they contain no Material meaning.

Do not create a Material wrapper only to move a generic utility. Do not leave Material-specific state, token, clipping, focus, motion, or rendering ownership in generic infrastructure merely because the legacy implementation is there.

## Source status and inventory

Record canonical source status:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Record inventory status separately:

- `complete`;
- `snapshot-complete (<snapshot>; currentness unverified)`;
- `incomplete (<exact gap>)`;
- `blocked (<exact reason>)`.

A stale, partial, truncated, suspicious, missing, or spot-check-only source cannot certify current completeness.

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved domain boundary.

Invalid routes are constraints, not absent capability. Optional guidance is not automatically required capability.

## Preflight

Before production changes resolve applicable:

- requested artifact and official domain;
- exact sources and source status;
- current and canonical owners;
- consumers and legacy import paths;
- public, private, and testing-only contracts;
- change mode;
- expected behavior or rendering delta;
- semantics, state, lifecycle, clipping, focus, motion, token, and accessibility ownership;
- proof and migration needs;
- genuine blockers.

A blocker is valid only when one exact unresolved source, ownership, compatibility, safety, or verification decision materially prevents correct implementation.

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

- official mapping, source status, inventory, and coverage;
- implemented, partial, absent, invalid, unresolved, and out-of-domain capability;
- public and private API;
- semantic, state, lifecycle, clipping, rendering, and token ownership;
- current and migrated consumers;
- known issues and follow-up;
- representative proof;
- review status.

Set review required before production edits. Authoring never edits AUDIT.

## Ownership rule

An official foundation/style owner is justified by either:

1. an explicit user request for that official library artifact; or
2. a real current shared requirement.

Family-specific behavior remains family-local when it has no official shared ownership and no explicit standalone requirement.

Foundations and styles:

- remain free of component-family and product knowledge;
- expose the smallest coherent contract required by the request and affected consumers;
- do not import component families or the root Material barrel;
- do not become universal registries, state machines, theme managers, or CSS DSLs.

## Interaction foundations

For a state, ripple, focus, or other interaction primitive, resolve applicable:

- semantic purpose and official state model;
- input-state ownership;
- color and opacity routes;
- rendered owner and bounds;
- clipping and shape inheritance;
- acquisition paths owned by the primitive;
- disabled and simultaneous-state behavior;
- release, cancellation, cleanup, and reduced motion;
- generic consumer bridge;
- testing-only forced-state support;
- representative consumers when they exist.

A generic primitive must not contain any component-family-specific token selection, semantics, or precedence.

A token declaration alone does not implement a rendered primitive. The route must reach the correct owner with correct bounds, clipping, state winner, lifecycle, and consumer behavior.

## Actual dependency rule

A shared contract is consumed only when changing its source can affect final output through a real dependency.

These are not routes:

- adjacent declarations;
- aliases to unchanged constants;
- equality assertions;
- comments claiming derivation;
- stories or tests that restate definitions.

When canonical runtime parameters cannot be consumed literally by the Web platform, record them as source evidence and document one honest adaptation. Do not claim literal consumption.

## CSS custom-property namespaces

Use only:

- exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens;
- justified semantic `--md-private-<owner>-<role>` routes;
- genuine `--app-*` application contracts.

Do not create an ad-hoc public-looking name shaped like:

```text
--md-<artifact>-<raw-css-property>
```

Do not create a custom property for a one-use constant unless runtime indirection is required.

Every touched variable must affect the correct final owner through a real route.

## Blast radius

For current consumers:

1. identify affected contract classes;
2. migrate imports and routes to the canonical owner;
3. prefer the narrowest valid shared owner;
4. document cascade, inheritance, clipping, runtime, accessibility, and visual impact;
5. add representative proof through final output;
6. record remaining uncertainty locally.

Global selectors, root/system tokens, pseudo-elements, shared formulas, theme roles, and public shared APIs require representative proof across affected contract classes.

When no production consumer exists, use an owner-local fixture without fabricating product usage.

## Proportional proof

Use only proof owned by the changed artifact:

- focused owner contract and pure tests;
- computed CSS or browser checks for real cascade, clipping, focus, input, or lifecycle behavior;
- bounded canonical fixtures/stories for visible output;
- representative consumers for existing blast radius;
- reduced-motion and interruption proof when owned;
- final rendered-owner assertions;
- namespace and export checks;
- local project verification.

A screenshot baseline proves regression stability, not Material correctness.

Do not build a universal validation framework, catalog, test DSL, placeholder tree, or fake demonstration consumer.

## Migration and cleanup

When a legacy Material owner exists:

1. create the canonical owner;
2. migrate current consumers and exports;
3. preserve accepted behavior except documented corrections;
4. remove obsolete Material ownership and duplicate routes;
5. leave generic utilities in their correct generic owner;
6. document incomplete migration when atomic removal is genuinely unsafe.

Do not report migration complete while an obsolete Material owner or undocumented parallel path remains.

## Completion

Implementation is finished when:

- the explicit requested contract is coherent;
- code, README, exports, fixtures, tests, and current consumers agree;
- source and inventory status are honest;
- final owners and real dependency routes are proved;
- representative blast-radius proof exists when consumers are affected;
- remaining gaps and visual rejection are explicit;
- applicable local verification passes;
- review status is review required after changes.

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

Do not report a blocker whose only reason is missing consumers, inactive roadmap position, legacy location, or an absent pre-created canonical directory.
