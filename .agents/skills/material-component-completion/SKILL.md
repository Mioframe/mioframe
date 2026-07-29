---
name: material-component-completion
description: 'Use with only an existing Material artifact name to audit, normalize, and complete a partial, incidental, dependency-created, or previously migrated MD* adapter through the canonical material-component-adapter workflow.'
---

# Material component completion

Complete one existing official Material component whose implementation artifacts already exist but whose independent adapter flow, ownership, or completion status is uncertain.

## Input contract

The existing artifact name is sufficient input.

Accept official names, public `MD*` names, or family names, for example `Loading indicator`, `MDLoadingIndicator`, or `loading-indicator`.

Resolve the family, parents, consumers, official sources, current demand, renderer artifact, tokens, defects, proof, and verification scope from the repository. Do not require the operator to provide why the component is partial, where it was created, what is wrong, or how it should be fixed.

Treat direct invocation with only `MDLoadingIndicator` as a complete instruction to reconstruct and close that family. Ask for clarification only when the artifact name genuinely maps to multiple distinct official Material components and repository evidence cannot resolve it.

Use this skill when:

- a component was introduced incidentally as a dependency of another Material family;
- code, README, tests, stories, tokens, exports, or defect records exist but may not have passed the complete family workflow;
- a family is marked `verification` or `migrated` but review or operator evidence reveals missing or incorrect contract coverage;
- artifacts drift across implementation, matrix, token catalogue, defect registry, consumers, and proof;
- a previously partial or blocked family must be resumed and closed.

Use `material-component-adapter` directly for a genuinely new family with no existing implementation artifacts. Normally let the `material-component` router select the mode automatically.

## Canonical workflow

Read `.agents/skills/material-component-adapter/SKILL.md` and apply its complete workflow. It remains the only source of truth for implementation, ownership, renderer inspection, tokens, migration, verification, and completion.

This skill adds a completion preflight and closure discipline only. It must not define a second Material implementation process or preserve existing decisions merely because code already exists.

## Completion preflight

Treat current code, documentation, tests, stories, visual baselines, exports, and status claims as evidence to audit, not as accepted authority.

Before production edits:

1. identify the selected official Material family, all current parents, all current consumers, and every related legacy implementation;
2. reconstruct the official contract from overview, specs, guidelines, accessibility, token sources, configurations, and related-component references;
3. reconstruct current Mioframe demand independently from production scenarios rather than from the existing public API;
4. inspect the exact lockfile-resolved renderer artifact and observable browser behavior independently from existing wrapper assumptions;
5. compare every existing artifact against the canonical `material-component-adapter` workflow;
6. produce a closure inventory before changing implementation.

## Closure inventory

Classify each item as `confirmed`, `missing`, `incorrect`, `stale`, or `not-applicable`:

- official sources and selected/deferred surface;
- standalone default contract;
- parent-composed contract and exact handoff;
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
- Separate standalone defaults from parent-composed overrides. A parent-specific need must not silently redefine the dependency’s standalone Material contract.
- Rebuild the family matrix when it was derived from the parent scenario instead of the dependency’s full selected contract.
- Remove accidental public API, private mappings, workarounds, tests, or claims that cannot be justified by current demand and official evidence.
- Add missing selected official component tokens when the standalone default and parent composition require different values.
- Keep renderer defects distinct from Mioframe integration or token-representation defects.
- Verify the dependency independently before accepting parent composition proof.
- After dependency closure, reverify every current parent handoff and affected consumer scenario.
- Keep both dependency and parent `migrating` until all required dependency closure gates pass.

## Completion gate

The component may be reported `complete` only when:

- its official contract and current demand were independently reconstructed;
- its family matrix matches implementation and proof;
- standalone defaults and composed overrides are explicit and correctly owned;
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

- Requiring any input beyond the artifact name when repository and official evidence can resolve the work.
- A second or simplified implementation workflow that diverges from `material-component-adapter`.
- Treating parent composition proof as sufficient standalone dependency proof.
- Preserving an existing API, token choice, workaround, or status because it is already implemented.
- Fixing only the reported symptom while other closure inventory items remain unresolved.
- Expanding the component to the complete theoretical Material or renderer surface without current demand.
- Moving dependency ownership into the parent to reduce file count or task scope.
- Marking the parent complete while the dependency remains partial or uncertain.

## Report

```text
MATERIAL COMPONENT COMPLETION RESULT
Input artifact:
Resolved Material component:
Resolved Mioframe family:
Why completion mode was selected:
Parents and consumers inspected:
Official contract reconstructed:
Current demand reconstructed:
Closure inventory:
- confirmed:
- missing:
- incorrect:
- stale:
- not-applicable:
Standalone contract corrections:
Parent-composition corrections:
Public API corrections:
Token ownership corrections:
Renderer and defect corrections:
Proof added or corrected:
Consumers reverified:
Legacy or false ownership removed:
Exact final verification command:
Reported operator issues: none | <issues>
Implementation ownership: migrating | migrated
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```
