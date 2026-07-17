---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns the implementation workflow from source lookup and family contract through migration, proportional proof, workspace review, and external-gate handoff.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use this as the primary implementation workflow for official public Material component work.

It applies to a new public `MD*` component, migration of a legacy family, Expressive alignment of a canonical family, or a material change to its public or visible contract. It does not apply to project-specific shared UI or a strict legacy repair that truthfully records `Architecture impact: none`.

## Companion instructions

Use:

- `material3-guidelines` for official sources, component choice, usage, and minimum supported surface;
- `material-foundation` only when a cross-family foundation contract changes;
- `vue-component-implementation` for Vue mechanics;
- `component-contract-testing`, `ui-browser-behavior`, and `visual-regression-testing` only for applicable proof layers;
- `verification` for focused and final local repository checks;
- `docs/material-3/autonomous-review.md` for agent/operator review ownership;
- the current family audit when one exists;
- roadmap and inventory for active program state.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

## Execution capability boundary

The coding agent may not have `git`, GitHub, PR metadata, or CI access.

- Inspect and modify the current workspace directly.
- Never invent or infer a commit SHA, branch state, PR state, CI result, review state, or merge readiness.
- Never describe local `pnpm verify` as CI.
- Do not fail implementation merely because `git` or GitHub is unavailable.
- Do not certify terminal program state without direct evidence.

When commit/GitHub evidence is unavailable, the highest valid coding-agent outcome is:

```text
implementation-ready-for-external-gates
```

External GitHub-enabled review owns commit binding, current-head CI, operator acceptance, terminal registry/roadmap state, and merge readiness.

## 1. Select the family and change mode

Select one cohesive family and record:

- `new-component`;
- `end-to-end-migration`;
- `library-relocation-only`;
- `alignment-only`.

Resolve physical ownership first:

- `src/shared/ui/material/components/<family>` is canonical;
- an implementation under `src/shared/ui/<LegacyFamily>` remains legacy even when mature;
- a legacy owner defaults to `end-to-end-migration`;
- prior PR scope, branch name, or audit claims do not downgrade a complete `material-component <family>` invocation.

Split work only for a genuinely wider foundation blast radius, a public compatibility decision, reviewability, or a safer independently valid intermediate state. Do not mix unrelated families or broad cleanup.

## 2. Resolve sources, audit, and supported scope

1. Inspect the current family, exports, consumers, stories, tests, known defects, and current audit.
2. Treat audit commit metadata as unavailable when the agent cannot verify it directly.
3. Start from named scenarios and affected consumers.
4. Resolve the current official Material 3 Expressive contract.
5. Use the Design Kit only for visual decisions unresolved by published guidance.
6. Define the minimum complete supported surface.
7. Record unused official capability as unsupported.
8. Add no Mioframe extension without an explicit requirement and owner.

Investigate every audit finding. Resolve it, prove it stale, or report an exact blocker. Do not treat the audit as Material authority or rewrite it during implementation. A later review publishes the current workspace evaluation.

## 3. Refine applicable rules

Before relying on project rules:

1. identify only the rules applicable to this family;
2. verify that they describe the real migration coherently;
3. correct inaccurate, contradictory, incomplete, obsolete, or needlessly complex rules in their owning source;
4. make the smallest evidence-backed correction;
5. update only directly affected owners.

Do not create a family-specific exception or delegate a resolvable technical issue to operator visual review.

## 4. Complete the adaptive family contract

Before production edits, create or update:

```text
src/shared/ui/material/components/<family>/README.md
```

using `component-architecture.md`.

A legacy README does not satisfy this gate. Resolve the mandatory core:

- family and ownership;
- scenarios and non-goals;
- official sources and snapshot;
- supported and unsupported surface;
- public API, native semantics, accessibility, and invalid combinations;
- applicable foundation dependencies;
- production/public files, consumers, and applicable proof;
- extensions or deviations;
- readiness and unresolved decisions.

Add only applicable conditional sections: anatomy, state/lifecycle, token/property routing, configuration, browser behavior, visual evidence, consumer migration, or foundation change.

## 5. Resolve foundation dependencies

For each applicable domain:

1. identify the accepted owner and required capability;
2. reuse it when sufficient;
3. name exact non-blocking gaps;
4. treat a missing or blocked required capability as a blocker;
5. use `material-foundation` when the shared contract changes.

A component invocation must not hide a required foundation defect. Fix it, split it with an exact dependency, or report the family blocked. A public token or contract that changes only an intermediate variable but not its final owned result is defective unless the public contract is explicitly narrowed.

### Actual dependency rule

A contract is consumed only when changing its source input can change the final owned output through a real implementation dependency.

The following do **not** establish consumption:

- placing declarations next to each other;
- adding an alias that resolves to the same old constant;
- asserting that two unrelated values are equal;
- naming an existing duration/easing as the adaptation of a newly declared spring;
- adding a test that restates the implementation without proving the route.

When CSS cannot consume official numeric spring parameters directly, keep stiffness/damping as source evidence unless the project has a real conversion owner. Do not expose dead runtime tokens or fabricate a data flow. The accepted Web adaptation is the runtime contract; the component wires the animated property to that contract.

### Foundation blast-radius rule

Changes to `:root`, universal selectors, pseudo-elements, system tokens, or shared foundation formulas affect multiple families.

Before making such a change:

- identify every affected contract class, not only the triggering component;
- prefer a scoped owner or local composition when sufficient;
- do not move large token sets onto `*`, `::before`, or `::after` solely to make one component test pass;
- add representative cross-family proof when the shared change is retained;
- split the foundation change or report a blocker when the blast radius cannot be reviewed safely in the current task.

## 6. Execute the end-to-end passes

Use this compact order:

1. source-backed family contract and factual non-terminal records;
2. required foundation work or accepted dependency wiring;
3. canonical production family and root public export;
4. consumer migration;
5. proportional contract, browser, pure, consumer, and visual proof;
6. obsolete-path removal;
7. agent evidence review and workspace audit;
8. operator visual package preparation when required;
9. external-gate handoff.

Run focused verification after risky passes.

## 7. Implement the family

- Keep props, emits, slots, native elements, DOM-critical attributes, and events explicit.
- Prefer native HTML activation, form, navigation, and accessibility semantics.
- Keep controlled semantic state consumer-owned.
- Limit transient state to owned gesture, overlay, animation, or native coordination.
- Define acquisition, release, cancellation, disabled, failure, and cleanup only when the component owns them.
- Use exact official tokens and the shortest route to the actual owner.
- Separate token declaration, configuration routing, state resolution, and final rendering conceptually.
- Use separate files only when they reduce current complexity or selector ambiguity.
- Create no empty layers, universal bases, runtime registries, generic resolvers, CSS DSLs, cross-family state machines, broad option bags, or speculative extension points.

For motion, verify:

- the exact official requirement;
- the accepted foundation or family-local runtime contract;
- the actual animated property owner;
- state selectors and acquisition/release wiring;
- absence of conflicting arbitrary timing;
- reduced-motion route when applicable.

Do not claim that numeric source tokens drive runtime motion unless there is a real derivation or lookup from those inputs. Do not re-test browser interpolation for ordinary CSS motion.

## 8. Migrate consumers and ownership

For `end-to-end-migration`:

1. create the canonical family owner;
2. create or update the Material root export;
3. migrate every affected consumer and public export;
4. preserve accepted product behavior except for named deltas;
5. remove obsolete files and legacy exports;
6. use a temporary compatibility path only when atomic migration is unsafe, with exact consumers and a removal target;
7. update only records whose current facts changed.

Do not report migration execution complete while a legacy owner, legacy public export, undocumented parallel path, or direct legacy consumer remains.

During a coding-agent run, use non-terminal program states:

- physical migration map: `migrating` until external gates pass;
- component registry: `partial` or equivalent non-terminal state;
- roadmap milestone: `active`;
- audit operator status: `required` or `blocked`.

Do not write `migrated`, `aligned`, milestone `done`, or operator `accepted` without direct external evidence.

## 9. Build proportional proof

Every new or migrated component requires colocated component-contract tests.

Add other layers only when owned:

- one stable canonical visual story for visible output;
- `StateMatrix` only for multiple distinct visual routes;
- bounded visual regression when it provides material value;
- Storybook Playwright tests for browser-owned behavior the component changes or constrains;
- focused pure tests for extracted logic or lifecycle;
- consumer-preservation checks when consumers change.

For ordinary CSS motion, prove the component/foundation wiring and state route. Do not test browser interpolation internals, animation frames, or equivalent input paths.

Use focused browser verification when correctness depends on native interaction, computed CSS propagation, layout, overlay, capture/cancellation, JavaScript/WAAPI lifecycle, or another behavior that source and contract tests cannot establish reliably.

A test cannot repair or legitimize a missing implementation dependency. Reject tests whose only purpose is to compare aliases that are already defined as equal.

## 10. Review and visual handoff

Perform the source-backed review from `autonomous-review.md`.

Confirm:

- architecture and physical ownership;
- Material contract;
- native semantics and accessibility;
- state, lifecycle, and applicable browser behavior;
- motion implementation and real foundation wiring;
- final rendered property routes;
- proportional proof;
- consumer migration and obsolete-path removal;
- rule coherence;
- every audit finding resolved or evidence-backed as stale.

Existing tests are evidence, not proof that they cover the correct contract. Inspect the implementation and add focused browser reproduction only where the owning test layer requires it.

After implementation and local repository verification, run `material-component-review <family>` against the current workspace. When the agent cannot verify a commit, the audit is provisional workspace evidence and must say so explicitly.

After agent-owned gates pass, prepare operator visual evidence. The coding agent reports visual review as `prepared`, `required`, or `blocked`, never `accepted`.

## 11. Completion and external handoff

Before coding-agent completion:

- use `component-conversion-checklist.md`;
- run applicable focused checks and final local repository verification;
- ensure code, canonical contract, root export, consumers, tests, stories, map, and directly affected records agree;
- ensure the workspace audit is honest about its binding;
- summarize findings resolved or invalidated;
- list external gates not available to the agent.

The coding-agent result is exactly one of:

- `implementation-ready-for-external-gates`;
- `blocked (<exact reason>)`.

External gates are:

1. bind the review to the actual PR head commit;
2. verify current-head CI;
3. perform operator visual acceptance when required;
4. update `migrated` / `aligned` / milestone `done` terminal records;
5. perform merge review.

The absence of `git` or GitHub access is not an implementation blocker and must not be disguised by invented metadata. It is an explicit external-gate boundary.