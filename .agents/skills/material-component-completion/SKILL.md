---
name: material-component-completion
description: 'Use after a current complete family DESIGN.md exists to audit, normalize, and complete a partial, incidental, dependency-created, or previously migrated MD* adapter through the canonical material-component-adapter workflow.'
---

# Material component completion

Complete one existing official Material component whose implementation artifacts already exist but whose independent adapter flow, ownership, or completion status is uncertain.

## Input contract

The existing artifact name is sufficient input.

Accept official names, public `MD*` names, or family names, for example `Loading indicator`, `MDLoadingIndicator`, or `loading-indicator`.

Resolve the family, parents, consumers, design artifact, current demand, renderer artifact, tokens, defects, proof, and verification scope from the repository. Do not require the operator to provide why the component is partial, where it was created, what is wrong, or how it should be fixed.

Ask for clarification only when the artifact name genuinely maps to multiple distinct official Material components and repository evidence cannot resolve it.

Use this skill when:

- a component was introduced incidentally as a dependency of another Material family;
- code, README, tests, stories, tokens, exports, or defect records exist but may not have passed the complete family workflow;
- a family is marked `verification` or `migrated` but review or operator evidence reveals missing or incorrect contract coverage;
- artifacts drift across design, implementation, matrix, token catalogue, defect registry, consumers, and proof;
- a previously partial or blocked family must be resumed and closed.

Use `material-component-adapter` directly for a genuinely new family with no existing implementation artifacts. Normally let the `material-component` router select the mode automatically.

## Design gate

Before reading the current family README, adapter implementation, stories, tests, renderer package, or production consumers, inspect:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Validate it against `src/shared/ui/material/docs/design-document.md`.

When it is missing, stale, blocked, incomplete, demand-truncated, or renderer-shaped, invoke `material-component-design` first and stop completion work until the design status is `current`.

Do not independently reconstruct the complete official Material contract inside this skill. The accepted `DESIGN.md` is the source-backed official ledger. Completion independently reconstructs Mioframe demand and renderer behavior against that ledger.

## Canonical workflow

Read `.agents/skills/material-component-adapter/SKILL.md` and apply its complete workflow. It remains the source of truth for implementation, ownership, renderer inspection, tokens, migration, verification, and completion.

This skill adds completion preflight and closure discipline only. It must not define a second Material implementation process or preserve existing decisions merely because code already exists.

## Independent reconstruction order

Existing implementation artifacts are high-risk anchoring sources.

Use this order:

1. validate and read the complete current `DESIGN.md`;
2. draft an official-contract ledger from its exact sections and token paths;
3. inspect production consumers, parent components, legacy implementations, and actual operation-state lifecycles;
4. derive current demand independently from existing README decisions;
5. inspect the exact lockfile-resolved renderer artifact and observable browser behavior;
6. draft an independent expected-adapter ledger containing standalone defaults, selected scenarios, parent overrides, public API, token ownership, renderer coverage, and required proof;
7. only then inspect the current family README, implementation, stories, tests, catalogue entries, defects, and status claims;
8. compare every current artifact against the design and expected-adapter ledgers.

Existing README rows, stories, snapshots, tests, and current code prove only what Mioframe currently implements. They do not prove that the selected contract, demand, defaults, or visual result are correct.

## Completion preflight

Before production edits:

1. identify the selected official family, current `DESIGN.md`, all current parents, all current consumers, and every related legacy implementation;
2. confirm the design artifact covers the complete official component surface;
3. reconstruct current Mioframe demand and renderer capability independently;
4. compare every existing artifact against the canonical `material-component-adapter` workflow;
5. produce a closure inventory before changing implementation.

## Mandatory comparison gates

### Design coverage versus adapter selection

For every README row and public API/token claim:

1. cite the exact `DESIGN.md` section or token path;
2. confirm the design document contains the complete official surrounding surface;
3. justify why the capability is selected, deferred, conflicting, or not Material;
4. confirm no current implementation fact was incorrectly written into `DESIGN.md`;
5. confirm no unused official capability was removed from the design artifact.

### Standalone default versus parent composition

For every visual property, configuration, public token, accessibility behavior, and geometry value used by the adapter:

1. record the official standalone default and exact `DESIGN.md` source;
2. record the current standalone implementation result;
3. record every parent-composed value and why the parent needs it;
4. compare all three explicitly.

A parent-specific value must not become the dependency's unconditional standalone default. When standalone and composed values differ, the dependency owns the selected official component token and its default; the parent overrides only that public token or public Vue API at the composition site.

### Consumer applicability

For every production consumer, compare the actual operation lifecycle against official usage guidance in `DESIGN.md`:

- process type: indeterminate, determinate, transitional, user-blocked, or background;
- expected and worst-case duration;
- whether native browser or provider UI can suspend completion;
- whether the component remains visible and truthful during that lifecycle;
- whether Material recommends this component, another component, feature-owned status, or no indicator.

A consumer does not establish demand merely because the component is already rendered there.

### No-change result

A clean-worktree result is allowed only when the report explicitly demonstrates that:

- `DESIGN.md` is complete and current;
- every selected or deferred README decision references it accurately;
- official standalone defaults match the implementation;
- parent overrides are explicit and correctly owned;
- every production consumer satisfies official usage guidance;
- public token ownership is complete;
- no roadmap blocker, operator finding, stale matrix row, contradictory source, or design gap remains;
- current visual baselines prove the correct selected contract rather than only preserving current rendering.

Generic statements such as "sources match the matrix" or "tests are present" are insufficient.

## Closure inventory

Classify each item as `confirmed`, `missing`, `incorrect`, `stale`, or `not-applicable`:

- complete official `DESIGN.md` and source metadata;
- design coverage of variants, configurations, states, geometry, accessibility, guidance, related components, and complete official token catalogue;
- family README references to design sections;
- selected/deferred surface;
- standalone default contract;
- parent-composed contract and exact handoff;
- production-consumer applicability to official usage guidance;
- public props, defaults, slots, emits, native and accessibility semantics;
- configurations and variants;
- selected component tokens, default values, parent overrides, ownership, and catalogue entries;
- package-derived renderer typing and exact raw-tag selection;
- renderer mapping and observable viability;
- confirmed defects, workarounds, removal triggers, and version revalidation;
- colocated contract tests;
- standalone browser/accessibility proof;
- standalone visual proof;
- parent/dependency composition proof;
- exports and current production consumers;
- legacy ownership removal;
- family matrix accuracy;
- roadmap status and final verification scope.

Do not begin by patching the latest reported symptom. First consolidate the complete unresolved closure inventory.

## Completion rules

- Complete the selected component as a first-class family, even when it was originally created only to satisfy a parent.
- Keep the complete official design artifact independent from demand-scoped implementation decisions.
- Separate standalone defaults from parent-composed overrides.
- Rebuild the family README matrix when it was derived from the parent scenario or current code instead of the complete design artifact.
- Remove accidental public API, private mappings, workarounds, tests, or claims that cannot be justified by current demand and official design evidence.
- Add missing selected official component tokens when standalone defaults and parent composition require different values.
- Keep renderer defects distinct from Mioframe integration or token-representation defects.
- Verify the dependency independently before accepting parent composition proof.
- After dependency closure, reverify every current parent handoff and affected consumer scenario.
- Keep both dependency and parent `migrating` until all required design and adapter closure gates pass.

## Completion gate

The component may be reported `complete` only when:

- its `DESIGN.md` is complete, current, and source-backed;
- its family README accurately selects from and references that design artifact;
- current demand was independently reconstructed;
- standalone defaults and composed overrides are explicit and correctly owned;
- every current production consumer is valid under official usage guidance;
- all selected public API and token surface is implemented and catalogued;
- renderer support and defects are correctly classified against the installed artifact;
- standalone unit, browser/accessibility, and visual proof cover the selected contract;
- every current parent uses only the dependency’s public Vue and token APIs;
- affected consumer scenarios remain correct;
- obsolete ownership and false completion claims are removed;
- operator-reported issues are resolved or explicitly block completion;
- the exact final repository verification scope passes on the resulting head.

Green CI alone is not completion.

## Forbidden

- Beginning completion review without validating `DESIGN.md`.
- Reconstructing the complete official contract from the current README, code, m3e, stories, tests, or consumers.
- Treating a demand-scoped README as the complete Material design artifact.
- Shrinking `DESIGN.md` to current Mioframe demand.
- Returning no changes without explicit design and adapter comparison evidence.
- A second or simplified implementation workflow that diverges from `material-component-adapter`.
- Treating parent composition proof as sufficient standalone dependency proof.
- Preserving an existing API, token choice, workaround, or status because it is already implemented.
- Fixing only the reported symptom while other closure inventory items remain unresolved.
- Expanding the runtime adapter to the complete theoretical Material or renderer surface without current demand.
- Moving dependency ownership into the parent to reduce file count or task scope.
- Marking the parent complete while the dependency design or adapter remains partial or uncertain.

## Report

```text
MATERIAL COMPONENT COMPLETION RESULT
Input artifact:
Resolved Material component:
Resolved Mioframe family:
Why completion mode was selected:
DESIGN.md path and status:
Design completeness check:
Design sections used:
Parents and consumers inspected:
Independent expected-adapter ledger:
Current demand reconstructed:
Standalone default versus parent override comparison:
Production-consumer applicability comparison:
Closure inventory:
- confirmed:
- missing:
- incorrect:
- stale:
- not-applicable:
Design artifact corrections: none | <summary>
Standalone contract corrections:
Parent-composition corrections:
Public API corrections:
Token ownership corrections:
Renderer and defect corrections:
Proof added or corrected:
Consumers reverified:
Legacy or false ownership removed:
No-change justification: n/a | <explicit evidence>
Exact final verification command:
Reported operator issues: none | <issues>
Implementation ownership: legacy | migrating | migrated
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```
