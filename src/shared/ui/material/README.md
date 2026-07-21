# Mioframe Material library

`src/shared/ui/material` is the complete canonical boundary for Mioframe's Material 3 Expressive implementation.

The library is isolated from product architecture. Product code consumes its public API; the library does not import product layers, domain models, routes, services, stores, app shells, or project-specific presentation components.

## Structure

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
  foundation/
    tokens/
  components/
  patterns/
  index.ts        # after a real public export exists
```

- `docs` contains minimal durable library policy and the current roadmap;
- `foundation` contains proven cross-family contracts, including canonical reference/system token owners;
- `components` contains official public Material families and family-local component tokens;
- `patterns` contains accepted reusable official Material compositions;
- family/domain contracts, implementation owners, token files, styles, stories, fixtures, and focused tests stay beside their owner.

Generic platform utilities, project-specific shared UI, features, widgets, pages, app behavior, and product adapters remain outside.

## Documentation

Start with [`docs/README.md`](./docs/README.md). The canonical set is intentionally limited to:

- [`architecture.md`](./docs/architecture.md);
- [`tokens.md`](./docs/tokens.md);
- [`sources.md`](./docs/sources.md);
- [`component-development.md`](./docs/component-development.md);
- [`foundation-development.md`](./docs/foundation-development.md);
- [`roadmap.md`](./docs/roadmap.md).

Do not create parallel registries, inventories, audits, review histories, separate checklists, alignment scorecards, progress ledgers, or duplicated workflow documents. Current target decisions, classifications, durable contracts, proof obligations, correction units, and remaining gaps belong inside the owning family or foundation README.

## Dependency direction

```text
Vue / browser platform
        ↓
generic shared/lib infrastructure
        ↓
material/foundation
        ↓
material/components
        ↓
material/patterns
        ↓
project-specific shared UI and product layers
```

Token dependencies follow the same direction:

```text
reference → system → component → private route → rendered property
```

Official tokens keep exact `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names. Public Mioframe extensions use `--mio-*`. Owner-local implementation routes use `--md-private-*` and are not public API. Ambiguous aliases such as `--md-button-*` are forbidden in canonical Material code.

## Public API

The intended external entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Create or migrate consumers to it only when the relevant canonical owner and every dependency required by those consumers are ready. External consumers use the curated root API; internal Material code uses owning local entry points; private files and `--md-private-*` routes remain private.

## Development

`material-component` is the only component-family implementation entry point. A family name is sufficient input. The agent autonomously:

```text
resumes or initializes family state
→ builds one bounded orientation
→ selects affected concern lanes
→ obtains missing or invalidated target/audit evidence
→ closes exact foundation and official-family prerequisites
→ implements and reviews successive bounded corrections
→ migrates ready consumers and removes obsolete ownership
→ repeats without restarting accepted research
→ runs independent family review
→ runs final verification
```

`material-foundation` owns the equivalent workflow for a real cross-family contract or an exact delegated prerequisite.

Portable read-only skills own bounded source, semantics, token, Web, correction-review, and family-review responsibilities. They may run in isolated contexts when supported, but tool-specific agent configuration is not part of the Material architecture.

Contract synthesis, correction selection, implementation, adoption, family state updates, and continuation remain in the main orchestrator context because those phases share substantial state.

A focused correction does not trigger a complete family audit unless contradictory evidence widens the scope. New families and complete family alignment normally require all applicable lanes.

Current implementation is editable evidence, not Material authority and not disposable by default. Preserve confirmed owners, correct explicit gaps, and replace only the smallest owner when incremental repair would add more workaround logic.

Public Vue artifacts remain thin composition roots. Non-trivial token, visual, and motion contracts have explicit owners. Official component tokens live in one family token file by default; state selection and final rendered properties remain in implementation styles. File count is not a goal.

## Completion

A family is complete only when its supported surface, canonical ownership, dependency closure, prerequisites, consumers, cleanup, proof, documentation, operator-visible comparison, independent family review, and final verification are complete.

Each correction gate and final family review permits one initial review and at most one substantive re-review. A second failure stops the workflow. Mechanical documentation fixes do not restart complete target or audit work.

The active family, blocker, and one next action are recorded in [`docs/roadmap.md`](./docs/roadmap.md).
