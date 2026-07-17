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
    color/
    elevation/
    icons/
    motion/
    shape/
    typography/

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

Do not pre-create empty implementation directories. The three navigation `README.md` files may exist before their sections contain production code because they define the library map.

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

Use the official documentation slug, not a legacy Mioframe directory name or an invented singular/plural form. When several official pages form one implementation family, its `README.md` records the page mapping explicitly.

## Section ownership

### `foundations`

Owns cross-component foundations represented under the official Foundations navigation, such as accessibility, adaptive/layout rules, and interaction foundations.

### `styles`

Owns cross-component visual systems represented under the official Styles navigation, including color, elevation, icons, motion, shape, and typography.

### `components`

Owns official public component families. Each family directory contains both the implementation and its current documentation state.

Project-specific patterns, screens, workflows, and generic browser infrastructure remain outside this library. Do not create a separate `patterns` hierarchy that has no equivalent in the official documentation navigation.

## Family documentation

Every implemented or actively migrated component family contains:

- `README.md` — current implementation contract and status;
- `AUDIT.md` — latest independent source-backed review;
- production code and exports;
- proportional tests and stories.

`README.md` must state honestly:

- official documentation pages used;
- implemented components, variants, states, behavior, and tokens;
- unsupported or intentionally omitted official capability;
- project extensions and deviations;
- known defects;
- items requiring verification or further work;
- applicable tests and visual evidence.

Do not describe an item as implemented when only a token, alias, placeholder, story, or test exists without a working final route.

`AUDIT.md` checks the implementation and `README.md` claims. It does not replace the implementation documentation and is not edited by the authoring workflow.

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
- generic infrastructure does not contain Material family knowledge.

## Migration

A component migration:

1. resolves the official documentation path and family;
2. creates or updates the family `README.md`;
3. implements the documented supported surface;
4. updates required foundations or styles only when their shared ownership is real;
5. migrates consumers and exports;
6. removes obsolete ownership;
7. adds proportional proof;
8. records every omitted, unresolved, or unverified item in the family documentation;
9. runs an independent local audit that replaces the family `AUDIT.md`.

A migration is not complete while a legacy owner remains, a required consumer is not migrated, or the family documentation hides unfinished work.

## Public API

Product consumers use:

```ts
import { MDButton } from '@shared/ui/material';
```

The root barrel is curated. Internal family, test, story, and audit files are not public API.

## Anti-overengineering

Do not create:

- empty structural layers;
- a parallel metadata database for facts already owned by family documentation;
- generic component or token registries at runtime;
- wrappers around generic utilities merely to satisfy the hierarchy;
- a fixed file profile for every family;
- automated checks that infer semantic completeness from Markdown.

The library map should make implementation easier to find, not add ceremony.
