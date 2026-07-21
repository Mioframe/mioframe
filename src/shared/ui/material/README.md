# Mioframe Material library

`src/shared/ui/material` is Mioframe's canonical Material 3 Expressive implementation boundary. Product code consumes its public API; the library does not import product architecture or legacy Material owners.

## Structure

```text
material/
  foundation/   proven cross-family contracts and reference/system tokens
  components/   official component families and family-local tokens
  patterns/     accepted reusable Material compositions
  docs/         architecture, tokens, sources, workflow, roadmap
  index.ts      curated public API when owners are ready
```

Generic utilities and project-specific shared UI remain outside.

## Dependency direction

```text
Vue / browser
→ generic shared/lib
→ material/foundation
→ material/components
→ material/patterns
→ product UI
```

Token flow is `reference → system → component → private route → rendered property`.

Canonical Material code must not import legacy `@shared/ui/*` Material owners or `@shared/lib/md`. Components use ready foundation or public family contracts; another component family is not foundation.

## Public API

External consumers use the curated root API only after the owner and all dependencies required by those consumers are ready:

```ts
import { MDButton } from '@shared/ui/material';
```

Internal Material code uses local owning entry points. Private files and `--md-private-*` routes are not public API.

## Development

- `material-component` owns complete convergence of one component family.
- `material-foundation` owns one real cross-family foundation contract.
- Read-only specialist skills own bounded research, audits, and reviews.
- The owning README stores compact current state; detailed execution stays in the skills.

Canonical guidance:

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/tokens.md`](./docs/tokens.md)
- [`docs/sources.md`](./docs/sources.md)
- [`docs/component-development.md`](./docs/component-development.md)
- [`docs/foundation-development.md`](./docs/foundation-development.md)
- [`docs/roadmap.md`](./docs/roadmap.md)

Do not create parallel registries, audits, review histories, checklists, scorecards, or duplicated workflow documents.

## Verification

- `scripts/materialBoundaryArchitecture.test.mjs` enforces the Material ownership boundary.
- `scripts/materialTokenArchitecture.test.mjs` enforces token namespaces, ownership, graph direction, and token-file responsibility.

A family is complete only after dependency closure, prerequisites, canonical ownership, adoption and cleanup, required proof and operator comparison, independent family review, and final repository verification.
