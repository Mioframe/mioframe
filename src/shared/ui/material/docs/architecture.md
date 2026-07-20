# Material library architecture

## Purpose

`src/shared/ui/material` is Mioframe's isolated Material 3 Expressive implementation library. It is a shared implementation tool, not a product layer, product domain, application shell, or independent product goal.

Product code may determine priority, compatibility obligations, and required scenarios. It must not determine internal Material ownership, dependency direction, or public APIs around one Mioframe workflow.

## Canonical boundary

```text
src/shared/ui/material/
  foundation/
  components/
  patterns/
  docs/
  index.ts
```

- `foundation`: proven cross-family Material contracts;
- `components`: official public Material component families;
- `patterns`: accepted reusable official Material compositions;
- `docs`: minimal durable architecture, sources, workflows, and roadmap;
- `index.ts`: curated public entry point after a real export exists.

Existing official Material code outside this root is legacy ownership, not disposable code and not Material authority. It may be corrected in place through the canonical workflow while exactly one active owner remains. Relocate it only when the canonical owner can replace the legacy path in a complete independently valid change. Do not force relocation before correctness and do not create parallel active implementations.

A temporary legacy family contract may live under `docs/legacy/<family>.md` while the active implementation remains outside the canonical boundary. It moves beside the canonical owner when relocation occurs. The contract and its alignment history move with the family; they are not restarted from assumptions.

## Dependency direction

```text
Vue and browser platform
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

- Material production code does not import product layers, domains, routes, services, workers, stores, app shells, or project-specific presentation components.
- Foundation does not import components or patterns.
- A family does not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- External consumers use the curated Material public API when it exists.
- Internal Material modules use owning local entry points instead of the root barrel.

## Ownership

A component family owns its official Material surface:

- public API and invalid combinations;
- native semantics and accessibility;
- anatomy and DOM ownership;
- component-controlled state and lifecycle;
- token routing and final rendered-property ownership;
- family-specific browser behavior;
- owner-local stories, fixtures, and focused tests;
- compatibility and consumer migration obligations.

A foundation domain owns only a real cross-family contract. It must remain family-agnostic and must not exist merely to remove duplication or predict reuse.

Product and generic shared UI remain outside the Material boundary.

## Convergence model

Existing implementation is a current state to assess and improve. It is neither the source of truth nor something that must be deleted before correction.

Every existing family or foundation follows two independent passes:

1. **Canonical target** — resolve the current applicable official Material contract before using legacy behavior to make Material decisions.
2. **Current implementation assessment** — inspect code, DOM, styles, state, foundations, tests, stories, snapshots, consumers, known defects, and compatibility obligations after the target is recorded.

Compare them in the owning README. Classify each applicable concern as:

- `confirmed-compliant` — matches the canonical target, has the correct owner, and has faithful proof;
- `project-extension` — required by a current Mioframe scenario, explicitly owned, compatible with Material, and separately proved;
- `misaligned` — differs from the target or has wrong ownership or proof;
- `unresolved` — official evidence or required product decision is insufficient or contradictory;
- `obsolete` — replaced or unnecessary logic, contract, proof, or ownership that must be removed.

Do not classify a concern as compliant only because existing tests pass, snapshots are stable, consumers depend on it, or the code already uses official-looking token names.

The README alignment map is the single durable current-state record. Do not create a separate audit, registry, scorecard, or migration ledger.

## Correction units

Convergence proceeds through explicit correction units rather than mandatory full rewrites. Each unit records:

- gap and affected scenario;
- canonical expected behavior;
- current defect;
- implementation owner;
- dependencies and blast radius;
- primary failing or prepared proof;
- compatibility impact;
- completion condition.

A correction unit must leave the repository in a complete independently valid state. It may preserve remaining documented gaps when they are outside the current objective, do not make the supported surface dishonest, and have one recorded next action.

Prefer correcting one owner at a time. Rewrite only the smallest owner whose contract is predominantly wrong or whose incremental repair would add more workaround logic than a replacement. A local owner rewrite does not imply deleting the entire family, its consumers, or already confirmed units.

A fresh agent session resets reasoning, not repository progress. Resume from the current code, canonical target, alignment map, confirmed owners, unresolved findings, and next correction unit. Discard rejected assumptions, not valid implementation.

## Implementation decomposition

Every non-trivial Material component, foundation domain, or pattern is implemented as documented responsibility owners, not as one file that accumulates every contract.

Before changing a production owner, the owning README maps each applicable concern to one implementation owner, its inputs and outputs, dependencies, observable contract, and primary proof. Concerns include public composition, API normalization, native semantics, anatomy, semantic state, interaction lifecycle, token selection, rendered-property routing, styles, motion, foundation integration, stories, fixtures, and proof.

Use these rules:

- one responsibility with an independent reason to change or primary proof owner has one explicit implementation owner;
- co-locate responsibilities only when they change together, have the same dependencies and proof, and remain easier to understand together;
- do not create a file merely to reduce line count, remove superficial duplication, or predict reuse;
- do not retain a monolithic `.vue`, `.ts`, or stylesheet when independent responsibilities, proofs, or sources of truth are already present;
- do not add wrapper components or DOM nodes merely to obtain file-level separation.

Public Vue components are thin composition roots. They own the public Vue API, native semantic host, minimum required anatomy, and composition of internal owners. Deterministic normalization, invalid-combination handling, configuration selection, and semantic-state precedence belong in owner-local TypeScript modules when independently testable. Reactive browser or Vue lifecycle belongs in focused composables. Cross-family behavior belongs in foundation only when inherently family-agnostic.

A non-trivial visual contract uses owner-local style ownership separate from the Vue composition root. One stylesheet may remain cohesive, but independently changing token declarations, state resolution, rendered-property application, or motion owners must not be hidden merely because they are CSS. Inline scoped styles remain acceptable only when the visual contract is short, linear, and clearer when colocated.

Do not prescribe one universal file tree or artifact count. The README records actual decomposition and explains material co-location decisions so review can distinguish cohesion from accidental monoliths.

## Public API

Public APIs must be narrow, explicit, and based on official component semantics rather than one consumer or legacy implementation.

Prefer:

- native HTML semantics;
- explicit props, emits, slots, attributes, and events;
- consumer-controlled semantic state;
- component-agnostic foundation inputs;
- exact official token meanings;
- one declaration owner and one final rendered-property owner.

Avoid:

- broad option bags;
- product adapters;
- universal bases;
- managers and registries;
- generic resolvers;
- speculative extension points;
- hidden copies of controlled state;
- unnecessary DOM nodes;
- permanent compatibility aliases.

Compatibility is evidence to plan migration, not authority to preserve a wrong Material contract. Preserve a legacy API only when it remains canonical or when an explicit temporary adapter has a current owner, removal condition, and bounded lifetime within a complete change.

## Workflow ownership

Component work has one external owner and internal stage owners:

- `docs/component-development.md` defines the only component convergence workflow and exit gates;
- `material-component` is the sole implementation orchestrator and the only owner allowed to select a family, choose the next stage, or update the roadmap;
- `material-component-contract` owns the canonical target, current implementation assessment, alignment map, correction-unit plan, implementation decomposition, proof map, and family README;
- `material-component-implementation` owns proof-first correction units, primary composition, representative consumer validation, and supported-surface implementation;
- `material-component-adoption` is conditional and owns remaining consumer migration and obsolete-owner removal only after the canonical owner is ready;
- `material-component-review` is review-only, may be invoked independently, and never fixes production files;
- `material-foundation` owns focused convergence of a proven cross-family prerequisite or standalone foundation concern;
- supporting Material, Vue, testing, and verification skills operate only inside the owning stage.

Internal stage skills do not invoke each other, select another family, update the roadmap, or create independent plans.

Do not create another authoring flow, audit workflow, durable checklist, stage tracker, or family-state owner. Structured contract, assessment, alignment, decomposition, proof, and correction-unit sections inside the canonical family or foundation README are required records, not prohibited parallel checklists.

## Canonical records

The factual records are:

- current code and curated exports;
- family README files beside canonical implementation;
- temporary legacy contracts under `docs/legacy` until relocation;
- foundation-domain README files only after a real owner exists;
- owner-local tests, stories, fixtures, and accepted snapshots;
- Git history and merged PRs;
- `docs/roadmap.md` for the active family, blocker, and one next action only.

Do not create separate registries, inventories, durable audits, progress ledgers, or duplicate status systems.

## Alignment and migration

For an existing family, use `align-existing` by default:

1. lock one family, one correction objective, required scenarios, and non-goals;
2. resolve the canonical target independently from legacy implementation assumptions;
3. assess the current implementation and classify every relevant concern in the alignment map;
4. select the smallest complete correction units required by the current objective;
5. resolve decomposition, style ownership, proof, compatibility, and foundation dependencies for those units;
6. implement and verify units in order, preserving already confirmed owners;
7. validate affected real consumers when public composition or behavior changes;
8. independently review the complete family state and the current correction objective;
9. migrate remaining consumers and remove obsolete ownership only when the canonical owner is ready and the objective includes adoption;
10. run final repository verification and record the next correction unit when the family remains converging.

Use `new-component` only when no implementation owner exists. Use `focused-correction` when the exact gap is already established and the canonical target around it is stable.

Relocation is an implementation or adoption action, not proof of correctness and not a substitute for alignment. A physical move must not preserve unverified behavior by default.

Split work when each PR leaves one valid owner, honest supported surface, no required workaround, and a complete verified correction objective. Never merge a knowingly broken intermediate mechanism merely because a later PR is planned.

## Simplicity gate

Before adding an abstraction, layer, file, state owner, foundation, pattern, compatibility mechanism, or workflow skill, prove that:

- an existing mechanism is insufficient;
- a current requirement needs it;
- ownership remains explicit;
- total complexity decreases;
- the result is easier to understand, test, and change.

The simplest viable alternative is not necessarily the fewest files. A cohesive extraction is simpler when it gives an independently changing contract one clear owner, keeps the public composition root readable, and makes proof local. Conversely, separation is not justified when it only moves lines without clarifying ownership or proof.

A workflow skill is justified only when it owns a distinct responsibility and exit gate. Do not create separate skills for source lookup, Storybook, accessibility, tokens, visual acceptance, alignment assessment, or testing when those concerns belong inside an existing stage.

If the simpler alternative cannot be shown to be insufficient, use it.
