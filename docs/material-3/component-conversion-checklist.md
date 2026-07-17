# Material 3 Expressive component authoring checklist

Use for every new, migrated, or materially changed public Material component.

Implementation scope may follow current product need. Documentation and audit coverage must classify the complete official family surface.

## 1. Official family and sources

- [ ] Resolved the current official Material 3 Expressive family and documentation path.
- [ ] Used the official documentation slug for the canonical family directory.
- [ ] Inspected all current official pages required to reconstruct the complete family capability inventory.
- [ ] Recorded exact official pages, source snapshot metadata, and Design Kit evidence only when used.
- [ ] Classified every official contract-level capability, including capability not needed by current consumers.
- [ ] Implemented the minimum complete current surface rather than speculative capability.

## 2. Family documentation

- [ ] Created or updated the colocated family `README.md` before production edits.
- [ ] Recorded `Official capability inventory: complete | incomplete (<gap>)`.
- [ ] Recorded `Official coverage: full | partial | unresolved`.
- [ ] Listed only working capability under `Implemented`.
- [ ] Listed every absent official capability under `Not implemented`, regardless of current consumer demand.
- [ ] Recorded every partial, defective, provisional, ambiguous, or unverified capability under `Known issues and required follow-up`.
- [ ] Did not misclassify partial capability as fully implemented or fully absent.
- [ ] Recorded public API, semantics, token/state/property ownership, foundation/style dependencies, extensions, consumers, and verification.
- [ ] Set `Review status: review required after changes`.
- [ ] Did not edit the independent `AUDIT.md` during implementation.

## 3. Family and ownership

- [ ] Selected one cohesive official family.
- [ ] Named official capability outside the family boundary with its separate owner instead of treating it as a current-family omission.
- [ ] Kept project-specific UI and generic infrastructure outside official Material ownership.
- [ ] Created only files and abstractions required by current work.
- [ ] Kept one owner for each semantic, interactive, accessibility, and rendered-property concern.
- [ ] Avoided private cross-family imports.

## 4. Foundations and styles

- [ ] Mapped shared dependencies to the official `foundations` or `styles` navigation.
- [ ] Reused an existing accepted owner when sufficient.
- [ ] Kept family-specific behavior local when no real shared contract exists.
- [ ] Named every remaining shared dependency gap in the family README.
- [ ] Assessed affected families before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas.
- [ ] Preferred the narrowest valid owner.

## 5. API, state, and DOM ownership

- [ ] Public props, emits, slots, and native semantics match the implemented contract.
- [ ] Invalid combinations are prevented, normalized by an accepted rule, or explicitly unsupported.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquisition, release, cancellation, disabled, failure, and cleanup only when applicable.
- [ ] DOM, focus, accessible-name, ARIA, target-area, interaction, and final rendering ownership is explicit.

## 6. Tokens and implementation

- [ ] Every public `--md-*` value maps to an exact official meaning.
- [ ] Every implemented route reaches the actual final property owner.
- [ ] A claimed dependency is real: changing its source can affect the final output.
- [ ] Colocation, aliases to unchanged constants, equality assertions, comments, and tests are not treated as implementation dependencies.
- [ ] Numeric spring values that cannot drive CSS directly are documented as source evidence rather than fake runtime inputs.
- [ ] Motion uses one honest runtime contract without conflicting local timing.
- [ ] Additional files or abstractions reduce current complexity.

## 7. Migration

- [ ] Used end-to-end migration when a legacy owner existed.
- [ ] Updated the curated Material export.
- [ ] Migrated every affected consumer.
- [ ] Preserved accepted product behavior except for documented changes.
- [ ] Removed obsolete owners, files, imports, and exports.
- [ ] Added no permanent compatibility alias without a documented necessity.
- [ ] Recorded the real migration state in the family README.

## 8. Proportional proof

- [ ] Added or updated colocated component-contract tests for implemented capability.
- [ ] Created one stable canonical visual story for visible output.
- [ ] Used browser tests only for browser-owned behavior or uncertain final computed behavior.
- [ ] Did not test browser interpolation or duplicate equivalent input paths.
- [ ] Added pure, consumer, `StateMatrix`, and visual-regression proof only when the family owns those risks.
- [ ] Did not add a test merely to restate equal aliases or declarations.
- [ ] Did not create tests that imply unimplemented capability exists.

## 9. Implementation completion

- [ ] Rebuilt the official capability inventory after implementation changes.
- [ ] Code, README, exports, consumers, tests, and stories agree.
- [ ] Every official capability is classified as implemented, partial/unverified, not implemented, unresolved, or outside the family boundary.
- [ ] All unfinished or unverified work is visible in the README.
- [ ] Focused checks passed.
- [ ] Final applicable local repository verification passed.
- [ ] Implementation result reports official inventory completeness and coverage separately from task completion.
- [ ] Recommended next command is `material-component-review <family>`.

## 10. Independent review

Performed separately by `material-component-review`:

- [ ] Reviewer changed only the colocated `AUDIT.md`.
- [ ] Reviewer independently reconstructed the complete official family capability inventory.
- [ ] Reviewer did not limit official capability coverage to current consumers.
- [ ] Audit independently lists implemented, partial/unverified, not implemented, unresolved, and out-of-family capability.
- [ ] Stage 1 compared implementation, exports, consumers, tests, stories, and shared dependencies with the family README and directly applicable project contracts.
- [ ] Stage 1 reported undocumented implementation, false implementation claims, hidden unfinished work, and missing unimplemented-capability records.
- [ ] Stage 2 compared the documented project contract and complete capability inventory with current canonical Material 3 Expressive evidence.
- [ ] Stage 2 reported incorrect Material interpretation, incomplete capability inventory, undocumented canonical omissions or deviations, and project extensions presented as official behavior.
- [ ] Required corrections distinguish implementation changes from project-documentation changes.
- [ ] Audit records compliance separately from `Official coverage: full | partial | unresolved`.
- [ ] Operator visual review is recorded separately when required.

Do not describe a family as complete while implementation and project documentation disagree, project documentation misrepresents Material 3 Expressive, any official capability is unclassified, unfinished work is hidden, the audit has unresolved high findings, obsolete ownership remains, required local verification fails, or required visual review is rejected.

Do not describe a family as fully implemented unless the independent audit reports `Official coverage: full`.
