# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Routing

- Use `material-component-authoring` for creating, migrating, aligning, or materially changing an official public component family.
- Use `material-foundation` when a cross-family foundation contract changes.
- Use `material3-guidelines` for current official Material 3 Expressive sources, component choice, usage, composition, and supported surface.
- Use Vue and testing skills only for applicable implementation and proof layers.
- Use `docs/material-3/autonomous-review.md` for agent evidence review and operator visual handoff.
- Use `library-roadmap.md` and `ui-library-inventory.md` to select and advance sequential migration work.

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
- local family/domain contracts and curated public entry points.

Policy documents remain under `docs/material-3`. Product-specific UI and generic platform infrastructure remain outside.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

- Any Material layer may use a correctly owned generic utility directly.
- Do not create foundation wrappers merely to route generic behavior.
- Foundation must not import components or patterns.
- Families must not deep-import another family's private files.
- Patterns use public component/foundation contracts only.
- Library code must not import product layers.
- Generic infrastructure must not depend on Material family knowledge.

## New artifacts

- New official components belong under `components/<family>`.
- New foundation artifacts belong under `foundation/<domain>` only when current work proves a cross-family need.
- New patterns require official composition evidence and a current scenario.
- Multi-component families require an official relationship and a real current shared contract.
- Do not add placeholder files, empty structural layers, speculative extension points, universal bases, or project-specific UI under official families.

## Public API

- Product consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code does not import the root barrel.
- External deep imports into private implementation or testing files are forbidden.
- Every public export has one clear owner.

## Migration boundary

- Existing Material code outside this directory is legacy, not a template for new work.
- Strict local repairs may remain at legacy paths only under a valid `Architecture impact: none` decision.
- Use one cohesive end-to-end family migration by default.
- Split foundation, relocation, or alignment work only when blast radius, reviewability, compatibility, or a safer independent state justifies it.
- Migrate affected consumers and remove obsolete ownership.
- Update only contracts, maps, registries, inventory, roadmap, stories, tests, snapshots, and risk records whose owned facts changed.
- Temporary compatibility requires exact consumers, no new usage, and a removal target.

## Adaptive contract and proof

- Resolve the mandatory family-contract core before production edits.
- Add anatomy, state, token-routing, browser, visual, consumer, and foundation sections only when applicable.
- Keep responsibilities clear without requiring a fixed number of CSS or helper files.
- Every new or migrated component has component-contract tests.
- Use browser, pure, consumer, visual-regression, and operator-review layers only when the component owns those contracts.
- Use `StateMatrix` only when multiple distinct component-owned visual routes exist; a simple visible component may use one bounded canonical story.

## Rule refinement

When a real migration exposes an inaccurate, contradictory, incomplete, obsolete, or needlessly complex rule:

- identify the concrete evidence and owning source;
- make the smallest evidence-backed correction;
- update only directly affected rule owners;
- do not preserve the rule through a family-specific exception;
- continue after the applicable rules are coherent.

Escalate only for a genuine product decision, materially unresolved official source, cross-project public-contract change, unsafe shared blast radius, unresolved verification failure, or rejected visual evidence.

## Verification and review

- Use existing repository checks and focused tests.
- Add automation only after real migrations prove a stable repeated and precisely detectable need.
- The coding agent owns source-backed architecture, Material, accessibility, behavior, migration, rule, and proof review.
- The operator owns final comparison of prepared visible evidence when required.
- The agent never reports operator acceptance as accepted.
- Automation must not claim to prove free-form architecture or visual correctness.

After a family reaches its accepted terminal state, update the queue and proceed to the next highest-priority ready family.
