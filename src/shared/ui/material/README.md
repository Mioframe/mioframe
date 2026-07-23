# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material implementation and Material-library documentation.

The library contains:

- `docs` — focused Material source and technical domain documentation;
- `foundation` — cross-family Material contracts required by confirmed current work;
- `components` — official public Material component families;
- `patterns` — reusable official Material compositions independent of product domains.

Generic platform utilities, project-specific shared UI, features, widgets, pages, product documentation, and application behavior remain outside.

## Documentation

All Material-library documentation belongs under:

```text
src/shared/ui/material/docs
```

Root `docs` remains reserved for product and project documentation.

Current documents contain only durable technical policy: official sources, theme and units, tokens, accessibility, interaction states, density, icons, overlays, adaptive layout, public UI API, Storybook, and deviations. Component workflow artifacts will be added beside their owning family only after their contracts are defined.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

Higher Material layers may use correctly owned generic utilities directly. Do not create foundation wrappers merely to route generic behavior.

Product imports inside the Material library, dependency inversion, and private cross-family imports are forbidden.

## Public API

The intended project-facing entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Do not create the root production `index.ts` until at least one real family or foundation artifact can be exported honestly.

After it exists:

- product consumers use the root entry point by default;
- internal library modules use owning family, foundation, or generic entry points;
- private implementation and testing files remain private.

## New ownership

- Create new official Material components under `components/<family>`.
- Create foundation artifacts under `foundation/<domain>` only when a confirmed cross-family requirement needs them.
- Create patterns under `patterns/<pattern>` only when official composition guidance and a current product-independent scenario justify them.
- Treat legacy directories as existing owners, not templates for new ownership.
- Create no placeholder files, empty structural layers, speculative abstractions, manager agents, or execution state machines.
