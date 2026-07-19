# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive shared-library boundary.

The Material library is an implementation tool consumed by Mioframe. It is not a product layer and must remain isolated from product architecture and domain behavior.

## Routing

- Use `material-library-status` for a read-only reconciliation of roadmap, inventory, registries, audits, visual acceptance, and verification state.
- Use `material-library-next` when the user wants the program to continue without naming a family; it resolves and runs exactly one next family.
- Use `material-component` when the user supplies a Material component or family name and expects autonomous creation, migration, or alignment from that name alone.
- Use `material-component-review` when the user supplies a Material component or family name and expects a source-backed compliance review without production changes.
- Use `material-component-authoring` as the canonical end-to-end execution workflow after the target family is resolved, or directly when the task already provides explicit family scope.
- Use `material-foundation` when a cross-family foundation contract changes.
- Use `material3-guidelines` for current official Material 3 Expressive sources, component choice, usage, composition, and supported surface.
- Use Vue and testing skills only for applicable implementation and proof layers.
- Use `docs/material-3/autonomous-review.md` for agent evidence review and operator visual handoff.
- Use `library-roadmap.md` and `ui-library-inventory.md` through `material-library-next` to select sequential migration work when the user did not explicitly select a component.

A component name is sufficient input for `material-component` and `material-component-review`. Do not require the user to predefine variants, API, foundations, files, tests, consumers, or expected defects. Resolve them from official sources and the repository. An explicit user-selected component overrides automatic queue selection for that run; real roadmap prerequisites still apply.

`material-library-next` requires no component name. It follows the active roadmap milestone first and, after the pilots, selects one unblocked `queued` official-component family with satisfied dependencies. It must not start a second family in the same task or PR. `material-library-status` never modifies repository files.

A completed `material-component-review` run creates or replaces `docs/material-3/audits/<family-slug>.md`. This is the only required repository change in review-only mode; implementation, tests, stories, snapshots, registries, family contracts, and policies remain unchanged.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

## Canonical target

- Official components implement the current applicable Material 3 Expressive contract.
- Baseline Material 3 is not a silent fallback.
- Legacy output, existing snapshots, other implementations, and memory are not Material authority.
- Missing or conflicting source evidence is resolved by narrowing scope, correcting rules, or reporting a genuine blocker.

## Contains

Only:

- `foundation` — cross-family Material contracts required by current work;
- `components` — official public Material component families;
- `patterns` — accepted reusable official Material compositions;
- local family/domain contracts, owner-local fixtures, tests, stories, and curated public entry points.

Policy documents remain under `docs/material-3`. Product-specific UI, product adapters, domain fixtures, and generic platform infrastructure remain outside.

## Isolation and dependency direction

The import direction is one-way:

```text
product and project-specific shared UI
  └─ imports → @shared/ui/material

@shared/ui/material
  ├─ may import → Material-owned local code
  ├─ may import → Vue and browser platform contracts
  └─ may import → correctly owned generic shared/lib infrastructure
```

- Library production code must not import entities, features, widgets, pages, panes, app shells, routes, services, workers, stores, or domain models.
- Library production code must not import project-specific or generic presentation components from sibling `shared/ui` modules outside the Material root.
- Library stories, tests, and fixtures must remain owner-local and generic; they must not import product layers, domain fixtures, feature components, widgets, pages, or app shells.
- Product-specific wrappers, adapters, compositions, usage policy, and layout belong outside the Material root.
- Product needs may select scope and migration priority, but must not create domain-shaped props, product state ownership, hidden consumer behavior, or feature-specific branches inside the library.
- Any Material layer may use a correctly owned generic low-level utility directly.
- Do not create foundation wrappers merely to route generic behavior.
- Foundation must not import components or patterns.
- Families must not deep-import another family's private files.
- Patterns use public component/foundation contracts only.
- Generic infrastructure must not depend on Material family knowledge.

## New artifacts

- New official components belong under `components/<family>`.
- New foundation artifacts belong under `foundation/<domain>` only when current work proves a cross-family need.
- New patterns require official composition evidence and a current shared Material scenario.
- Multi-component families require an official relationship and a real current shared contract.
- Do not add placeholder files, empty structural layers, speculative extension points, universal bases, product adapters, or project-specific UI under official families.

## Public API

- External consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code does not import the root barrel.
- External deep imports into private implementation, fixture, story, or testing files are forbidden.
- Every public export has one clear Material owner.
- A public Material API must remain generic and source-backed; do not mirror a single Mioframe feature, domain record, route, or workflow.

## Migration boundary

- Existing Material code outside this directory is legacy, not a template for new work.
- Strict local repairs may remain at legacy paths only under a valid `Architecture impact: none` decision.
- Use one cohesive end-to-end family migration by default.
- Complete the isolated library contract and library-owned proof before treating product integration as evidence.
- Split foundation, relocation, or alignment work only when blast radius, reviewability, compatibility, or a safer independent state justifies it.
- Migrate affected consumers through the public API and remove obsolete ownership.
- Consumer tests prove only external integration risks; they do not prove internal Material semantics, routing, lifecycle, or fidelity.
- Update only contracts, maps, registries, inventory, roadmap, stories, tests, snapshots, and risk records whose owned facts changed.
- Temporary compatibility requires exact consumers, no new usage, and a removal target.

## Adaptive contract and proof

- Resolve the mandatory family-contract core before production edits.
- Add anatomy, state, token-routing, browser, visual, consumer, and foundation sections only when applicable.
- Keep responsibilities clear without requiring a fixed number of CSS or helper files.
- Every new or migrated component has component-contract tests.
- Use browser, pure, consumer, visual-regression, and operator-review layers only when the component owns those contracts.
- Use owner-local Storybook fixtures to develop and prove the component independently from product composition.
- Use `StateMatrix` only when multiple distinct component-owned visual routes exist; a simple visible component may use one bounded canonical story.

## Rule refinement

When a real migration exposes an inaccurate, contradictory, incomplete, obsolete, or needlessly complex rule:

- identify the concrete evidence and owning source;
- make the smallest evidence-backed correction;
- update only directly affected rule owners;
- do not preserve the rule through a family-specific exception;
- continue after the applicable rules are coherent.

Escalate only for a genuine product-scope decision, materially unresolved official source, cross-project public-contract change, unsafe shared blast radius, unresolved verification failure, or rejected visual evidence. Product composition details are not reasons to weaken the library boundary.

## Verification and review

- Use existing repository checks and focused tests.
- Add automation only after real migrations prove a stable repeated and precisely detectable need.
- `material-library-status` reports conflicts between owning records instead of silently reconciling them.
- `material-component-review` treats code, family docs, tests, stories, snapshots, prior audits, and registry status as claims to verify against official sources, not as proof by themselves.
- A review-only run writes the durable family audit and reports confirmed defects and evidence gaps without modifying production implementation or policies.
- `material-component` and `material-component-authoring` inspect the current family audit when one exists and resolve or invalidate its findings using current evidence.
- The coding agent owns source-backed architecture, Material, accessibility, behavior, migration, rule, and proof review.
- The operator owns final comparison of prepared visible evidence when required.
- The agent never reports operator acceptance as accepted.
- Automation must not claim to prove free-form architecture or visual correctness.

After a family reaches its accepted terminal state, update the queue and record the next candidate. Start that next family only through a new `material-library-next` or explicit `material-component` run.