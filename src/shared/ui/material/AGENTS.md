# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Routing

- Use `material-library-status` for a read-only report based on roadmap, inventory, registries, and colocated family documentation/audits.
- Use `material-library-next` to select and execute exactly one next family.
- Use `material-component` when the user supplies a component or family name for creation, migration, or alignment.
- Use `material-component-review` for an independent source-backed review without production changes.
- Use `material-component-authoring` after the target family is resolved.
- Use `material-foundation` when a real cross-family foundation or style contract changes.
- Use `material3-guidelines` for official sources and supported surface.

A component name is sufficient. Resolve variants, API, consumers, foundations/styles, tests, and omissions from official sources and repository evidence.

## Canonical navigation

The library follows the official Material documentation navigation:

```text
foundations/
styles/
components/
```

- `foundations/<official-slug>` — official Foundation domains.
- `styles/<official-slug>` — color, elevation, icons, motion, shape, typography, and other official Style domains.
- `components/<official-docs-slug>` — official component families.

Use the official documentation slug. Example: Button belongs in `components/buttons`, matching `m3.material.io/components/buttons`.

Do not create a top-level `patterns` tree without an equivalent official documentation owner. Product compositions remain outside the official library.

## Family documentation

Every implemented or actively migrated family owns:

```text
components/<official-docs-slug>/README.md
components/<official-docs-slug>/AUDIT.md
```

- `README.md` is the current implementation documentation and is updated by authoring work.
- `AUDIT.md` is the latest independent review and is updated only by `material-component-review`.

`README.md` must state:

- official documentation mapping;
- implemented surface;
- not implemented official capability;
- known defects and required follow-up;
- public API and semantics;
- token/state/property ownership;
- foundation/style dependencies;
- extensions and deviations;
- consumers and migration state;
- verification and review status.

Any incomplete, deferred, provisional, unverified, or visibly questionable item must be recorded. Do not claim completion by omission.

A production change sets `Review status: review required after changes`. The implementing agent does not edit `AUDIT.md`.

A review-only run creates or replaces only the colocated `AUDIT.md`; it does not modify implementation, tests, stories, family `README.md`, registries, roadmap, or policy.

## Canonical target

- Implement current applicable Material 3 Expressive guidance.
- Baseline Material 3 is not a silent fallback.
- Existing output, snapshots, other implementations, and memory are not Material authority.
- Unsupported optional capability is acceptable only when documented honestly.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → product layers
```

- foundations and styles do not import components;
- a family does not deep-import another family's private files;
- Material code does not import product layers;
- product consumers use `@shared/ui/material`;
- private implementation, tests, stories, docs, and audits are not public API.

## Implementation rules

- Implement the minimum complete surface required by current consumers.
- Use exact official token meanings and shortest final property routes.
- A route exists only when its source can affect the final output through a real dependency.
- Colocation, aliases to unchanged constants, equality assertions, and comments do not create a route.
- Keep a behavior family-local unless a real cross-family contract exists.
- Assess cross-family impact before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas.
- Create only files and abstractions required by current work.

## Proof

- Every new or migrated component has colocated component-contract tests.
- Every visible component has one stable canonical story.
- Add `StateMatrix`, browser, pure, consumer, and visual-regression layers only when the family owns those risks.
- Do not test browser interpolation internals for ordinary CSS transitions.
- Operator visual comparison does not replace technical review.

## Completion behavior

The implementing agent finishes by:

- updating `README.md` truthfully;
- listing implemented, omitted, known-broken, and unverified items;
- running applicable local verification;
- reporting `implementation finished` or one exact blocker;
- recommending `material-component-review <family>`.

The reviewing agent records the independent result in `AUDIT.md`.

Do not include or require branch, commit, pull request, CI, merge, or repository-hosting metadata in component authoring or audit documentation. Those concerns are outside this agent workflow.