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

- `docs` contains the minimal durable library policy and current roadmap;
- `foundation` contains proven cross-family contracts, including canonical reference/system token owners;
- `components` contains official public Material families and their family-local component tokens;
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

Do not create parallel registries, inventories, audits, review histories, separate checklists, alignment scorecards, progress ledgers, or duplicated workflow documents. Concern-scoped target decisions, current classifications, durable public/token/style/motion contracts, proof obligations, correction units, and remaining gaps belong inside the owning family or foundation README.

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

Official tokens keep exact `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names. Public Mioframe extensions use `--mio-*`. Owner-local implementation routes use `--md-private-*` and are not public API. Ambiguous aliases such as `--md-button-*` are not allowed in canonical Material code.

## Public API

The intended external entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Create or migrate consumers to it only when the relevant canonical owner is ready for their required contract. External consumers use the curated root API; internal Material code uses owning local entry points; private files and `--md-private-*` routes remain private.

## Development

`material-component` is the only component implementation entry point. It selects only the concern lanes required by the objective:

```text
concern-scoped canonical target when required
→ selected semantics, token, and Web audits
→ bounded correction contract
→ independent correction contract gate
→ one approved correction unit
→ conditional adoption
→ independent correction-final review
→ complete base-to-head PR review
→ verification
```

A focused correction does not trigger a complete family audit unless contradictory evidence widens the scope. New families and full owner migrations normally require all applicable concern lanes.

Current implementation is editable evidence, not Material authority and not disposable by default. Preserve confirmed owners, correct explicit gaps, and replace only the smallest owner when incremental repair would add more workaround logic.

One PR may finish a family or one complete correction objective. A correction may be complete while the PR remains unmergeable. Merge readiness belongs only to `material-pr-review`, which evaluates the actual PR base-to-head result and every owner/consumer changed by it.

Public Vue artifacts remain thin composition roots. Non-trivial token, visual, and motion contracts have explicit owners. Official component tokens live in one family token file by default; state selection and final rendered properties remain in implementation styles. Deterministic logic and lifecycle are separated only when ownership and proof become clearer; file count is not a goal.

`material-component-contract`, `material-component-implementation`, and `material-component-adoption` are internal stages, not alternative entry points. `material-semantics-audit`, `material-token-audit`, and `material-web-audit` are separate read-only concern owners. `material-component-review` reviews one correction gate; `material-pr-review` reviews complete merge readiness.

Each review gate permits one initial review and at most one substantive re-review. A second failure stops the workflow. Mechanical wording, count, or cross-reference fixes do not restart complete target or audit work. The active family and one next action are recorded in [`docs/roadmap.md`](./docs/roadmap.md).