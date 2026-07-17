# Material 3 Expressive component authoring checklist

Use for every new, migrated, or materially changed public Material component. Apply only items owned by the supported surface and current change.

The checklist does not add fields beyond `component-architecture.md`.

## 1. Scope and sources

- [ ] Started from named scenarios and affected consumers.
- [ ] Resolved the current official Material 3 Expressive contract for the supported surface.
- [ ] Used the official Design Kit only when published guidance could not resolve an applicable visual decision.
- [ ] Recorded exact source snapshots and any explicit deviation or unavailable surface.
- [ ] Implemented the minimum complete supported surface rather than optional speculative capability.
- [ ] Added no Mioframe extension without a requirement and owner.

## 2. Family and ownership

- [ ] Selected one cohesive family with an official or current shared-contract basis.
- [ ] Recorded the current owner, canonical owner, migration status, public export, and affected consumers.
- [ ] Kept project-specific UI and generic infrastructure outside official Material ownership.
- [ ] Avoided private cross-family imports and component-local foundation substitutes.
- [ ] Created only files and abstractions required by current work.

## 3. Adaptive family contract

- [ ] Completed the mandatory contract core before production edits.
- [ ] Added only conditional sections applicable to this family.
- [ ] Resolved every applicable decision before recording `Readiness: ready`.
- [ ] Omitted unsupported and irrelevant concerns instead of creating ceremonial fields or files.
- [ ] Kept one owner for each recorded fact.

## 4. Rule refinement

- [ ] Checked that applicable rules accurately describe the real migration.
- [ ] Corrected inaccurate, contradictory, incomplete, obsolete, or needlessly complex rules in their owning source.
- [ ] Used the smallest evidence-backed correction.
- [ ] Updated only directly affected documents, skills, checklists, registries, or scoped instructions.
- [ ] Added no family-specific exception to preserve a defective rule.

## 5. Foundation dependencies

- [ ] Listed only foundation domains actually required by the supported surface.
- [ ] Reused the accepted owner when sufficient.
- [ ] Named exact non-blocking gaps for partial or deviated dependencies.
- [ ] Treated missing or blocked required capability as a blocker.
- [ ] Used a focused foundation change when shared blast radius required separate review.
- [ ] Created no parallel foundation owner or local substitute.

## 6. API, state, and DOM ownership

- [ ] Public props, emits, slots, and native semantics match the supported contract.
- [ ] Invalid combinations are prevented, normalized by an official rule, or explicitly unsupported.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquire, release, cancellation, disabled, failure, and cleanup behavior when applicable.
- [ ] Each interactive or semantic anatomy concern has one DOM, focus, accessible-name, ARIA, target-area, interaction, and rendering owner as applicable.
- [ ] Parent and child components do not implicitly split activation, focus, accessibility, or final rendering.

## 7. Tokens and implementation

- [ ] Every public `--md-*` value maps to an exact verified official meaning.
- [ ] Every canonical token has one owner.
- [ ] Static values use the shortest direct route.
- [ ] Configuration routing and state resolution are separated conceptually without forcing empty or trivial files.
- [ ] Dedicated route, state, behavior, context, or anatomy files exist only when they reduce current complexity.
- [ ] Vue owns explicit public contract, native elements, events, anatomy, and runtime facts.
- [ ] Styles apply final values to the actual DOM owner and do not deep-style another family.

## 8. Migration

- [ ] Used `end-to-end-migration` by default for a legacy family unless a narrower safe scope was justified.
- [ ] Migrated affected consumers and public exports.
- [ ] Preserved product behavior except for named accepted deltas.
- [ ] Removed obsolete owners, files, imports, and exports.
- [ ] Added no permanent compatibility alias.
- [ ] Updated roadmap, inventory, registries, map, snapshots, and risk registration only when their owned facts changed.

## 9. Proportional proof

- [ ] Added or updated colocated component-contract tests.
- [ ] Used browser tests only for browser-owned behavior the component changes or constrains.
- [ ] Added pure tests only for extracted logic or lifecycle.
- [ ] Added focused consumer-preservation checks when consumers changed.
- [ ] Created one stable canonical visual story when the component has visible output.
- [ ] Used `StateMatrix` only when multiple distinct component-owned visual routes exist.
- [ ] Avoided a Cartesian product and duplicate equivalent visual cases.
- [ ] Added bounded visual regression when it provides material stable regression protection.
- [ ] Used real browser input to prove acquisition, cancellation, cleanup, focus, pointer, touch, overlay, or motion behavior.

## 10. Review and completion

- [ ] Agent evidence review passed for architecture, Material contract, accessibility, behavior, migration, and proof proportionality.
- [ ] No non-visual blocker is deferred to operator screenshot review.
- [ ] Prepared named official visual sources and bounded evidence when operator acceptance is required.
- [ ] Automated agent reports operator acceptance as `required` or `blocked`, never `accepted`.
- [ ] Code, family contract, exports, consumers, applicable tests, stories, map, and directly affected records agree.
- [ ] Existing applicable repository checks pass.
- [ ] Final repository verification passes.

Do not mark a family migrated or Expressive-complete while an applicable blocker, obsolete owner, unresolved rule conflict, or required visual rejection remains.
