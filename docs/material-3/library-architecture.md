# Material library architecture

The canonical library root is:

```text
src/shared/ui/material/
```

Its physical structure follows the top-level navigation of the official Material documentation so source lookup, implementation, and review use the same mental model.

## Canonical structure

```text
src/shared/ui/material/
  README.md
  AGENTS.md
  index.ts

  foundations/
    README.md
    <official-foundation-slug>/

  styles/
    README.md
    <official-style-slug>/

  components/
    README.md
    <official-component-docs-slug>/
      README.md
      AUDIT.md
      index.ts
      <Component>.vue
      <Component>.test.ts
      <Component>.stories.ts
      ... only files required by the current implementation
```

Do not pre-create empty implementation directories. The three navigation README files may exist before their sections contain production code because they define the library map.

## Mapping rule

Use the official Material documentation path as the canonical path whenever possible:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons

m3.material.io/styles/motion
→ src/shared/ui/material/styles/motion

m3.material.io/foundations/interaction
→ src/shared/ui/material/foundations/interaction
```

Use the official documentation slug, not a legacy Mioframe directory name or an invented singular/plural form.

## Section ownership

### foundations

Owns cross-component foundations represented under official Foundations navigation, such as accessibility, adaptive/layout rules, and interaction foundations.

### styles

Owns cross-component visual systems represented under official Styles navigation, including color, elevation, icons, motion, shape, and typography.

### components

Owns official public component families. Each family directory contains implementation and current documentation state.

Project-specific patterns, screens, workflows, and generic browser infrastructure remain outside this library.

## Local owner documentation

Every implemented or actively migrated owner contains:

- README.md — current reconstructed contract, diagnosis, strategy, implementation state, and verification;
- AUDIT.md — latest independent source-backed contradiction-seeking review when one exists;
- production code and exports;
- proportional tests and fixtures/stories.

README must state honestly:

- current-run official sources and source status;
- reconstructed capability inventory and owner boundary;
- diagnosis and `repair | restructure | replace` strategy;
- implemented, partial, absent, invalid, unresolved, and out-of-boundary capability;
- public/private contract, anatomy, lifecycle, and final rendered owners;
- project extensions and deviations;
- known defects and shared proof gaps;
- consumers, blast radius, and obsolete ownership;
- operator feedback and visual status;
- applicable tests and rendered evidence.

Operator feedback is supplied in normal user messages and persisted in README. No separate visual report file is required.

AUDIT checks implementation, README, stories, tests, verification, and operator feedback for contradictions before comparing the documented contract with Material. It does not replace implementation documentation and is not edited by authoring.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → project-specific shared UI and product layers
```

Rules:

- foundations and styles do not import component families;
- one component family does not deep-import another family's private files;
- Material library code does not import product layers;
- product code uses the curated `@shared/ui/material` entry point;
- generic infrastructure does not contain Material family knowledge;
- components do not locally patch defects owned by a shared Material foundation or style.

## Calibrated implementation path

Every component, foundation, or style task follows:

1. resolve official owner and current-run sources;
2. reconstruct the contract independently of the legacy implementation;
3. diagnose each material problem and actual owner;
4. select repair, restructure, or replace;
5. implement through ordered semantics, ownership, geometry/routing, lifecycle, and migration gates;
6. remove superseded ownership and contradictory documentation;
7. add proportional proof using real input for lifecycle claims;
8. pass an evidence-backed objective gate and local verification;
9. run independent contradiction-seeking review;
10. request operator acceptance only for remaining perceived fidelity.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconsider the implementation strategy.

## Migration

A migration:

1. resolves the official documentation path and owner;
2. reconstructs the official contract and inventory;
3. diagnoses legacy defects and selects restructure or replacement when required;
4. creates or updates owner README;
5. implements the coherent supported surface;
6. updates required foundations or styles only when their shared ownership is real;
7. migrates consumers and exports;
8. removes obsolete ownership, tests, stories, documentation, and compatibility paths;
9. adds proportional proof;
10. passes the objective gate and local verification;
11. runs independent review that replaces AUDIT.

A migration is not implementation-finished while a legacy owner remains without explicit necessity, a required consumer is not migrated, parallel models survive, documentation contradicts production, the objective gate fails, or required local verification is missing.

Required perceived visual acceptance remains a separate final gate.

## Public API

Product consumers use:

```ts
import { MDButton } from '@shared/ui/material';
```

The root barrel is curated. Internal owner, test, story, and audit files are not public API.

## Anti-overengineering

Do not create:

- empty structural layers;
- a parallel metadata database for facts already owned by local documentation;
- generic component or token registries at runtime;
- wrappers around generic utilities merely to satisfy hierarchy;
- a fixed file profile for every owner;
- separate operator report files;
- automated checks that infer semantic completeness from Markdown;
- compatibility paths retained only to avoid selecting restructure or replacement.

The library map should make implementation easier to find, not add ceremony.
