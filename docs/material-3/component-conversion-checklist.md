# Material 3 Expressive component authoring checklist

Use for every new, migrated, or materially changed public Material component. Apply only items owned by the supported surface and current change.

The checklist summarizes existing architecture; it adds no fields or proof layers.

## 1. Scope and sources

- [ ] Started from named scenarios and affected consumers.
- [ ] Resolved the current official Material 3 Expressive contract for the supported surface.
- [ ] Used the Design Kit only when published guidance could not resolve an applicable visual decision.
- [ ] Recorded exact sources, snapshots, and any deviation or unavailable surface.
- [ ] Implemented the minimum complete surface rather than speculative capability.
- [ ] Added no Mioframe extension without a requirement and owner.

## 2. Family and ownership

- [ ] Selected one cohesive family.
- [ ] Recorded current owner, canonical owner, migration status, public export, and affected consumers.
- [ ] Kept project-specific UI and generic infrastructure outside official Material ownership.
- [ ] Avoided private cross-family imports and component-local foundation substitutes.
- [ ] Created only files and abstractions required by current work.

## 3. Adaptive family contract

- [ ] Completed the mandatory core before production edits.
- [ ] Added only applicable conditional sections.
- [ ] Resolved every applicable decision before `Readiness: ready`.
- [ ] Omitted irrelevant concerns instead of creating ceremonial fields or files.
- [ ] Kept one owner for each fact.

## 4. Rule refinement

- [ ] Checked that applicable rules describe the real migration correctly.
- [ ] Corrected inaccurate, contradictory, incomplete, obsolete, or needlessly complex rules in their owner.
- [ ] Used the smallest evidence-backed correction.
- [ ] Updated only directly affected rule owners.
- [ ] Added no family-specific exception.

## 5. Foundation dependencies

- [ ] Listed only required foundation domains.
- [ ] Reused the accepted owner when sufficient.
- [ ] Named exact non-blocking gaps.
- [ ] Treated missing or blocked required capability as a blocker.
- [ ] Used a focused foundation change when shared blast radius required it.
- [ ] Created no parallel owner or local substitute.

## 6. API, state, and DOM ownership

- [ ] Public props, emits, slots, and native semantics match the supported contract.
- [ ] Invalid combinations are prevented, normalized by an official rule, or explicitly unsupported.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquisition, release, cancellation, disabled, failure, and cleanup only when applicable.
- [ ] Each semantic or interactive concern has one DOM, focus, accessible-name, ARIA, target-area, interaction, and rendering owner.
- [ ] Parent and child components do not implicitly split ownership.

## 7. Tokens and implementation

- [ ] Every public `--md-*` value maps to an exact official meaning.
- [ ] Every canonical token has one owner.
- [ ] Static values use the shortest route.
- [ ] Configuration and state routing remain conceptually clear without empty files.
- [ ] Additional behavior, context, route, or anatomy files reduce current complexity.
- [ ] Styles apply final values to the actual DOM owner.
- [ ] Motion uses the accepted component/foundation contract; declared but unused tokens or conflicting local timing do not remain.

## 8. Migration

- [ ] Used `end-to-end-migration` for a legacy family unless a narrower safe scope was justified.
- [ ] Migrated affected consumers and public exports.
- [ ] Preserved product behavior except for named accepted deltas.
- [ ] Removed obsolete owners, files, imports, and exports.
- [ ] Added no permanent compatibility alias.
- [ ] Updated only records whose facts changed.

## 9. Proportional proof

- [ ] Added or updated colocated component-contract tests.
- [ ] Used browser tests only for browser-owned behavior the component changes or constrains, or final computed behavior not reliably provable from source.
- [ ] Did not test browser interpolation or duplicate equivalent input paths.
- [ ] Added pure tests only for extracted logic or lifecycle.
- [ ] Added focused consumer-preservation checks when consumers changed.
- [ ] Created one stable canonical visual story for visible output.
- [ ] Used `StateMatrix` only for multiple distinct visual routes.
- [ ] Avoided Cartesian products and equivalent visual cases.
- [ ] Added bounded visual regression only when it provides material value.

## 10. Review and completion

- [ ] Agent evidence review passed for architecture, Material contract, accessibility, implementation, migration, and proof proportionality.
- [ ] No technical blocker is deferred to operator visual review.
- [ ] Prepared named official visual sources and bounded evidence when operator acceptance is required.
- [ ] Automated agent reports visual acceptance as `required` or `blocked`, never `accepted`.
- [ ] A fresh family audit references the final implementation commit.
- [ ] Code, contract, exports, consumers, applicable tests, stories, map, and affected records agree.
- [ ] Focused and final repository verification pass.

Do not mark a family migrated or Expressive-complete while a blocker, obsolete owner, unresolved rule conflict, stale audit, broken public route, or visual rejection remains.
