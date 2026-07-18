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

```text
material-foundation <official-foundation-or-style-artifact>
```

## Boundary

- An explicit official Material request is sufficient to start.
- Missing consumers, inactive roadmap position, legacy ownership, or an absent canonical directory are not blockers by themselves.
- Use the current task, current workspace, official sources, and local verification.
- Do not use source-control history or remote workflow state as evidence.
- Authoring updates README and implementation artifacts as required; it never edits AUDIT.
- Keep concrete artifact and consumer facts in the owning README, implementation, tests, fixtures, and task-specific PR description.

## Policy loading

Always read:

- applicable repository and scoped `AGENTS.md` files;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- current owner README and AUDIT when present;
- current implementation, exports, consumers, tests, fixtures, and directly affected shared owners.

Read only the domain documents applicable to the selected artifact. Read `component-tokens.md` or `component-testing.md` only when token routes, rendered consumer behavior, browser behavior, motion, geometry, or visual evidence are affected.

Do not load unrelated foundation/style domains or duplicate their detailed rules in this skill.

## Workflow

### 1. Resolve official ownership

Classify the request as:

```text
src/shared/ui/material/foundations/<official-slug>
src/shared/ui/material/styles/<official-slug>
```

Use foundations for official shared behavior/platform contracts and styles for official visual systems/token domains.

Distinguish Material semantics from generic browser, DOM, event, geometry, lifecycle, timing, and teleport utilities. Do not create a Material wrapper merely to relocate a generic utility.

### 2. Resolve the contract

- Record official source and inventory status honestly.
- Identify current and canonical owners, affected consumers, legacy paths, public/private/testing contracts, expected behavior delta, migration needs, and genuine blockers.
- Select the smallest coherent contract required by the explicit request and affected consumers.
- When no production consumer exists, use owner-local proof and a bounded fixture; do not invent a product consumer.

### 3. Update README before production

Record official mapping, source status, capability classification, public/private contract, ownership, consumers, known gaps, representative proof, and review state.

Set review status to `review required after changes`.

### 4. Implement the narrowest correct owner

- Keep foundations/styles free of component-family and product knowledge.
- Keep family-specific behavior family-local unless an official shared owner exists.
- Use exact official token meanings and real dependency routes to final owners.
- Follow the repository-wide prohibition on unnecessary DOM nodes. A rendered primitive may add a node only when rendering, semantics, accessibility, clipping/stacking, interaction geometry, or a platform API requires it.
- Do not create generic registries, state machines, theme managers, CSS DSLs, broad wrappers, speculative APIs, or variables for one-use constants.
- When the Web platform cannot consume canonical runtime parameters literally, document one honest adaptation rather than claiming literal consumption.

For interaction primitives, resolve only applicable state ownership, rendered bounds, clipping, lifecycle, cancellation, reduced motion, generic bridges, and testing hooks. A token declaration alone is not a rendered implementation.

### 5. Migrate consumers and legacy ownership

- Move Material semantics to the canonical owner.
- Keep genuinely generic utilities in their generic owner.
- Update affected exports and consumers.
- Remove obsolete Material routes and duplicate ownership.
- Preserve accepted behavior except documented corrections.
- Record incomplete migration when atomic removal is genuinely unsafe.

### 6. Prove blast radius proportionally

Use only proof owned by the changed contract:

- owner-local contract/pure tests;
- computed CSS or browser proof for real cascade, clipping, focus, input, layout, or lifecycle behavior;
- bounded fixtures/stories for rendered output;
- representative consumers when existing consumers are affected;
- final rendered-owner, namespace, export, interruption, and reduced-motion checks when applicable.

A screenshot baseline proves regression stability, not Material correctness.

### 7. Finish

- Confirm code, README, exports, fixtures, tests, and consumers agree.
- Preserve source limits, remaining gaps, visual rejection, and blast-radius uncertainty.
- Run focused verification as needed and final applicable local verification.
- Leave AUDIT unchanged.

## Result

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

Do not report implementation finished while ownership, real dependency routes, unnecessary DOM structure, affected-consumer proof, documentation, or verification remains unresolved.