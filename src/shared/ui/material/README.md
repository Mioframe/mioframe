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

- `material-component` is a coordination-only root for one logical family convergence operation.
- Only the deepest unfinished owner may be changed.
- Component owners are implemented in fresh isolated writable `material-component-implementation` contexts.
- Foundation owners are implemented in fresh isolated writable `material-foundation` contexts.
- Every owner correction is accepted only by a different fresh isolated read-only `material-component-review` context.
- Final family readiness is accepted only by another fresh isolated read-only `material-family-review` context.
- The root orchestrator edits no production code and cannot substitute for an unavailable owner or review context.
- If a real physical boundary prevents continuation, the root records one compact continuation stack and one exact checkpoint reason; the operator resumes the same root `material-component <family>` command.
- Owner README files store durable contracts only.
- `docs/roadmap.md` stores only the active root family, alignment status, one root-to-deepest unfinished continuation stack, one checkpoint reason, exact external blocker, and one next action.

Canonical guidance:

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/tokens.md`](./docs/tokens.md)
- [`docs/sources.md`](./docs/sources.md)
- [`docs/component-development.md`](./docs/component-development.md)
- [`docs/foundation-development.md`](./docs/foundation-development.md)
- [`docs/roadmap.md`](./docs/roadmap.md)

Do not create workflow-state blocks, completed-unit histories, backlogs, review histories, shell transcripts, registries, audits, checklists, scorecards, or duplicated workflow documents. A continuation stack is a resumption pointer, not a progress ledger.

## Verification

- `scripts/materialBoundaryArchitecture.test.mjs` enforces the Material ownership boundary.
- `scripts/materialTokenArchitecture.test.mjs` enforces token namespaces, ownership, graph direction, and token-file responsibility.
- `scripts/materialDocumentationArchitecture.test.mjs` keeps owner README files free of execution state and validates the root checkpoint contract.
- `scripts/agentDefinitions.test.mjs` enforces separation between root orchestration, writable owner implementation, and read-only review.

A family is complete only after an empty continuation stack, accepted independent owner reviews, dependency closure, canonical ownership, adoption and cleanup, required proof and operator comparison, independent family review, and final repository verification. A checkpoint is nonterminal and not merge readiness.
