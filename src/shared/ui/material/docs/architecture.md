# Material library architecture

## Purpose

`src/shared/ui/material` is Mioframe's isolated Material 3 Expressive implementation library. It is a shared implementation tool, not a product layer, application shell, or independent product goal.

Product code determines required scenarios, compatibility obligations, and priority. It does not determine internal Material ownership, dependency direction, or public APIs around one domain workflow.

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
- `components`: official public Material families;
- `patterns`: accepted reusable official Material compositions;
- `docs`: minimal durable architecture, sources, workflows, and roadmap;
- `index.ts`: curated public entry point after a real export exists.

Existing Material code outside this root is legacy ownership, not authority and not disposable by default. Correct it in place while exactly one active owner remains. Relocate only when the canonical owner can replace the legacy path in one complete valid change.

A temporary legacy family contract may live under `docs/legacy/<family>.md` and moves beside the canonical owner during relocation. Alignment history is preserved.

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

- Material production does not import product layers, domains, routes, services, workers, stores, app shells, or project-specific presentation components.
- Foundation does not import components or patterns.
- A family does not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- External consumers use the curated Material public API when the owner is ready.
- Internal Material modules use local owning entry points, not the root barrel.

Every shared dependency used by a family is classified as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation. Repeated use does not make a Material component generic foundation.

## Ownership

A component family owns:

- public API, defaults, invalid combinations, and attributes;
- native, form, keyboard, event, and accessibility semantics;
- anatomy and DOM;
- semantic and transient state owned by the family;
- token, state, and rendered-property routing;
- family-specific geometry, responsive behavior, typography, RTL, text scaling, and motion;
- owner-local stories, fixtures, and proof;
- compatibility and consumer migration obligations;
- project extensions explicitly attached to the family.

A foundation domain owns only a genuinely cross-family, family-agnostic contract. It must not exist merely to remove duplication or predict reuse.

## Evidence-gated convergence

Existing implementation is editable current state. It is neither the source of truth nor something that must be removed before correction.

Work is separated into independent responsibilities:

1. canonical target research without current component implementation or component proof;
2. target lock;
3. current-state audit against the locked target;
4. contract synthesis;
5. independent contract review before production;
6. bounded implementation;
7. independent final review.

`material-component` is the only orchestrator. It owns synthesis, stage transitions, family README and roadmap writes, and final decisions. Researchers and reviewers are read-only.

Claude Code may use project subagents under `.claude/agents/`. Codex may use separate agent threads or isolated worktrees. Tool-specific delegation is optional; fresh independent contexts and gates are mandatory.

Do not use concurrent writers on the same owner or worktree. Do not pass preferred conclusions or implementation reasoning to reviewers.

## Canonical target and source decisions

Before target lock, use repository rules, required scenarios, applicable consumer scenarios, and official Material sources. Existing component API, DOM, CSS, tests, stories, snapshots, and prior conclusions must not determine the target.

Record every contradiction, absence, inference, and platform-specific statement. Reconcile diagrams, prose, specs, accessibility guidance, and token tables.

Token absence does not automatically cancel explicit guidance. Token presence does not prove support. Android, iOS, and Web guidance are not interchangeable without an explicit decision.

Required unresolved decisions block dependent work. New evidence reopens the target instead of silently changing implementation assumptions.

## Current-state alignment

After target lock, classify every applicable concern as:

- `confirmed-compliant`;
- `project-extension`;
- `misaligned`;
- `unresolved`;
- `obsolete`;
- `not-applicable` with a reason.

The assessment must cover API; native, form, keyboard, and event propagation; accessibility; anatomy and DOM; state; tokens and rendered properties; geometry, typography, RTL, responsive behavior, and text scaling; motion; extensions; dependencies; owners; consumers; proof; and cleanup.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful observable proof in the correct lane, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect prevents completion.

Passing tests, stable snapshots, current consumers, official-looking names, or green CI do not establish Material correctness.

The owning README is the only durable workflow state, target, source-decision, assessment, alignment, dependency, decomposition, proof, and correction record. Do not create separate audits, registries, scorecards, or ledgers.

## Correction units

Convergence proceeds through bounded complete units rather than mandatory full rewrites.

Correction priority is:

1. unresolved required source or platform decisions;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token and rendered-property routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

Do not bypass a higher-priority blocker with an easier local improvement.

Each unit records expected behavior, current defect, owner, dependencies, blast radius, proof lane, prepared failing observation, compatibility impact, visible impact, operator requirement, and completion condition.

Correct one owner at a time. Rewrite only the smallest owner when incremental repair would preserve wrong ownership or add more workaround logic. A local rewrite does not imply deleting the family, consumers, or confirmed work.

## Decomposition

Map each concern to one owner with inputs, outputs, allowed dependencies, observable contract, primary proof, and co-location rationale.

- Public Vue components are thin composition roots.
- Deterministic normalization and state precedence use owner-local TypeScript when independently testable.
- Reactive browser lifecycle uses focused composables.
- Non-trivial visual contracts have explicit style and motion ownership.
- One stylesheet is valid only when token selection, state routing, rendered properties, geometry, and motion genuinely change and are proved together.
- Do not split by line count, preserve monoliths by habit, or add wrappers and DOM merely for separation.

## Proof ownership

- unit/component proof: deterministic API, normalization, native attributes, state precedence, and non-browser wiring;
- browser proof: layout, focus, keyboard, form behavior, propagation, pointer/touch, target area, responsive behavior, platform behavior, and motion lifecycle;
- visual proof: screenshots only;
- consumer proof: integration and compatibility.

Visual specs do not contain browser-behavior success criteria or large computed-style assertion matrices. Visual baselines protect accepted output; they do not define correctness. Visible changes require official comparison and honest operator-acceptance status.

## Workflow ownership

- `docs/component-development.md` defines the canonical component convergence sequence.
- `material-component` is the sole orchestrator.
- `material-component-contract` synthesizes the isolated target and audit into alignment, dependency, decomposition, correction, and proof decisions.
- `material-component-review` owns both `contract-gate` and `final-gate` read-only review.
- `material-component-implementation` executes only a contract-approved correction unit.
- `material-component-adoption` conditionally owns consumer migration and obsolete-owner removal.
- `material-foundation` owns evidence-gated convergence of an exact cross-family prerequisite.
- Supporting source, Vue, testing, and verification skills operate only inside the owning stage.

Internal stages do not invoke each other, select another family, update the roadmap, or create separate plans.

## Public API

Public APIs are narrow, explicit, and based on official semantics rather than one consumer or legacy shape.

Prefer native HTML semantics, explicit props/emits/slots/attributes/events, consumer-controlled semantic state, family-agnostic foundation inputs, exact token meanings, and one final rendered-property owner.

Avoid broad option bags, product adapters, universal bases, managers, registries, generic resolvers, speculative extension points, hidden controlled-state copies, unnecessary DOM, and permanent compatibility aliases.

Compatibility is evidence to plan migration, not authority to preserve a wrong contract.

## Completion and simplicity

A correction objective may complete while the family remains `converging` only when the repository is valid and remaining gaps are explicit, non-blocking, and outside the objective.

Family completion requires no required `misaligned`, `unresolved`, or `obsolete` concern, one canonical owner, required consumers on that owner, required operator acceptance, independent final review, and final verification.

Before adding an abstraction, layer, file, state owner, foundation, pattern, compatibility mechanism, or workflow role, prove that an existing mechanism is insufficient, a current requirement needs it, ownership remains explicit, total complexity decreases, and the result is easier to understand, test, and change.
