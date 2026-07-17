---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official Material component family. Owns source lookup, implementation documentation, production work, consumer migration, proportional proof, and local verification.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use this workflow after the official family is resolved.

## Inputs

Read:

- current official Material sources through `material3-guidelines`;
- `docs/material-3/component-architecture.md`;
- the family `README.md` and `AUDIT.md` when present;
- current implementation, exports, consumers, tests, and stories;
- applicable foundation and testing instructions.

The implementation workflow never edits `AUDIT.md`.

## 1. Resolve family, path, scope, and complete capability inventory

1. Resolve the official family and documentation path.
2. Use the official documentation slug as the canonical directory name.
3. Select `new-component`, `end-to-end-migration`, or `alignment-only`.
4. Inspect every current official page for the family and reconstruct its complete contract-level capability inventory.
5. Define the minimum complete implementation surface required by current consumers.
6. Inspect every current audit finding.

Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

Implementation scope may be incremental. Documentation coverage may not be incremental: every official capability in the resolved family must be classified regardless of whether a current consumer needs it.

Inventory contract-level capabilities such as public subcomponents, variants, sizes, shapes, modes, states, semantics, accessibility behavior, configuration, adaptive behavior, and documented interactions. Do not turn the README into a token-by-token dump when a coherent grouped entry preserves full coverage.

When official evidence is unavailable or ambiguous, record the capability as unresolved or unverified. Do not omit it.

## 2. Update family documentation first

Create or update:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
```

Use these sections:

- Official documentation mapping;
- Implemented;
- Not implemented;
- Known issues and required follow-up;
- Public API and semantics;
- Tokens, states, and property ownership;
- Foundations and styles used;
- Extensions and deviations;
- Consumers and migration state;
- Verification;
- Review status.

Set `Review status: review required after changes` before production edits.

Under `Official documentation mapping`, record:

```text
Official capability inventory: complete | incomplete (<exact missing evidence>)
Official coverage: full | partial | unresolved
```

Record exact official pages and source snapshot metadata. Use the Design Kit only when it resolves a visual decision not resolved by published guidance.

A capability belongs under `Implemented` only when its final owned output works. A declaration, alias, placeholder, story, or test is insufficient by itself.

`Not implemented` must enumerate every official capability absent from the implementation, independently of current consumer demand. A reason such as no current consumer may explain prioritization, but it does not permit omission from the inventory.

Record partially implemented, provisional, defective, ambiguous, or unverified capability under `Known issues and required follow-up`. Do not misclassify partial capability as fully implemented or fully absent.

The README must never imply full family implementation while `Official coverage` is `partial` or `unresolved`.

## 3. Resolve foundations and styles

Map shared dependencies to the official navigation:

```text
material/foundations/<official-slug>
material/styles/<official-slug>
```

Foundations own cross-component accessibility, adaptive/layout, and interaction contracts. Styles own color, elevation, icons, motion, shape, typography, and other official style domains.

Keep family-specific behavior in the family unless a real cross-family contract exists. Use `material-foundation` only when a shared contract changes.

A route exists only when changing its source input can affect the final output through a real implementation dependency. Colocation, aliases to unchanged constants, equality assertions, and comments do not create a route.

When numeric spring parameters cannot be consumed directly, document them as source evidence and use an honestly documented Web adaptation as the runtime contract. Do not invent fake consumption.

Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas, identify affected families and prefer the narrowest valid owner.

## 4. Implement

- Keep props, emits, slots, native semantics, and DOM ownership explicit.
- Keep controlled semantic state consumer-owned.
- Define component-owned lifecycle behavior only when applicable.
- Use exact official token meanings and the shortest route to the final property owner.
- Create additional files only when they reduce current complexity.
- Add no speculative API, runtime registry, generic resolver, CSS DSL, or universal base.

For motion, verify the official requirement, runtime contract, animated property owner, state routing, conflicting transitions, and reduced-motion handling when applicable. Do not test browser interpolation internals for ordinary CSS transitions.

## 5. Migrate consumers and ownership

For an end-to-end migration:

1. create the canonical official-docs-slug directory;
2. update the curated Material export;
3. migrate every affected consumer;
4. preserve accepted behavior except for documented changes;
5. remove obsolete files and exports;
6. record the current migration state in the family README.

Do not claim migration complete while an obsolete owner or direct legacy consumer remains.

## 6. Build proportional proof

Every new or migrated component requires:

- a colocated component-contract test;
- one stable canonical visual story when visible.

Add browser, pure, consumer, `StateMatrix`, and visual-regression proof only when the family owns the corresponding risk.

A test cannot repair a missing implementation dependency. Reject tests that only compare aliases already defined as equal.

Tests are required for implemented capability. Unimplemented capability is documented rather than tested as though it existed.

## 7. Finish documentation and verification

After implementation:

1. rebuild the official capability inventory from the current canonical sources;
2. update `Implemented` to match working code;
3. update `Not implemented` with every absent official capability;
4. update `Known issues and required follow-up` with every partial, defective, provisional, ambiguous, or unverified capability;
5. set `Official capability inventory` and `Official coverage` honestly;
6. name applicable tests and stories under `Verification`;
7. keep `Review status: review required after changes`;
8. run focused checks and final applicable local verification.

Code, README, exports, consumers, tests, and stories must agree. The previous `AUDIT.md` remains unchanged until an independent review replaces it.

## Result

Finish with:

```text
MATERIAL COMPONENT AUTHORING RESULT
Official family:
Official documentation path:
Canonical implementation path:
Change mode:
Official capability inventory: complete | incomplete (<exact gap>)
Official coverage: full | partial | unresolved
Implemented:
Not implemented:
Partial / unverified:
Known issues / follow-up:
Consumers migrated:
Foundation/style changes:
Local verification:
Family documentation:
Status: implementation finished | blocked (<exact reason>)
Recommended next command: material-component-review <family>
```

Do not report success while family documentation hides unfinished or unimplemented official capability. `Implementation finished` describes the current task, not full family coverage.
