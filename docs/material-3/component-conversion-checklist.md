# Material 3 Expressive component authoring checklist

Use for every new, migrated, or materially changed public Material component.

Implementation scope may follow current product need. Inventory classification may not hide unused official capability.

## 1. Workspace and sources

- [ ] Used the current user task, current workspace files, official Material sources, and local project verification only.
- [ ] Did not run, inspect, or cite git, GitHub, branches, commits, diffs, blame, logs, pull requests, or repository history.
- [ ] Resolved the current official family and documentation path.
- [ ] Used the official documentation slug for the canonical directory.
- [ ] Recorded canonical source status: current-complete, snapshot-complete-stale, partial, conflicting, or unavailable.
- [ ] Recorded exact pages, snapshot metadata, and Design Kit evidence only when used.
- [ ] Did not certify `complete` from a partial, truncated, suspicious, stale-only, or spot-check-only source.

## 2. Capability classification

- [ ] Classified every item as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the family boundary.
- [ ] Reserved `Not implemented` for real official capability that exists but is absent.
- [ ] Did not classify an officially invalid combination as missing capability.
- [ ] Did not inflate optional or non-normative guidance into required capability.
- [ ] Recorded current consumer need as prioritization, not as a reason to omit classification.
- [ ] Used `Official coverage: full` only when every actual official capability is implemented and verified.
- [ ] Used `Official coverage: unresolved` when the inventory is not current-complete.

## 3. Family documentation and role ownership

- [ ] Created or updated the colocated family `README.md` before production edits.
- [ ] Read existing `AUDIT.md` when present.
- [ ] Read and extracted explicit operator feedback from the current user message.
- [ ] Recorded canonical source status, inventory status, and official coverage.
- [ ] Listed only working capability under `Implemented`.
- [ ] Listed every partial, defective, provisional, ambiguous, or unverified item separately.
- [ ] Listed every actual absent capability under `Not implemented`.
- [ ] Listed officially unsupported and invalid combinations separately.
- [ ] Recorded optional guidance choices under known issues, extensions, or deviations.
- [ ] Recorded API, semantics, token/state/property ownership, dependencies, extensions, consumers, and verification.
- [ ] Persisted operator feedback in README under `Operator feedback and visual status`.
- [ ] Set `rejected` when the user reported a visual defect.
- [ ] Set `awaiting re-review` only after a production behavior change.
- [ ] Set `accepted` only from an explicit user acceptance message.
- [ ] Set `Review status: review required after changes`.
- [ ] Did not edit `AUDIT.md` during implementation.

## 4. Family and ownership

- [ ] Selected one cohesive official family.
- [ ] Named out-of-family capability with its separate owner.
- [ ] Kept project-specific UI and generic infrastructure outside official Material ownership.
- [ ] Kept one owner for each semantic, interactive, accessibility, and rendered-property concern.
- [ ] Avoided private cross-family imports.
- [ ] Created only files and abstractions required by current work.

## 5. Foundations and styles

- [ ] Reused an accepted shared owner only when a real cross-family contract exists.
- [ ] Kept family-specific behavior local.
- [ ] Verified every claimed route reaches the final property owner.
- [ ] Did not treat aliases, comments, tests, or colocation as implementation dependencies.
- [ ] Recorded numeric spring values as source evidence when CSS cannot consume them directly.
- [ ] Used one honest Web runtime adaptation without claiming it is the original spring model.
- [ ] Identified current affected families before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas.
- [ ] Preferred the narrowest valid owner.
- [ ] Added representative proof that actually exercises a shared route.
- [ ] Did not use unchanged unrelated tests as representative proof.

## 6. API, state, and DOM ownership

- [ ] Public props, emits, slots, and native semantics match the implemented contract.
- [ ] Invalid combinations are prevented, normalized, or rejected coherently.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquisition, release, cancellation, disabled, failure, and cleanup only when applicable.
- [ ] DOM, focus, accessible-name, ARIA, target-area, interaction, and final rendering ownership is explicit.

## 7. Motion proof

- [ ] Verified the shared motion foundation deeply once.
- [ ] Used real input to prove the component activates the intended rendered property.
- [ ] Checked one meaningful intermediate state only when needed to establish the route.
- [ ] Verified the correct endpoint and safe interruption/cancellation.
- [ ] Did not require frame-by-frame component analysis.
- [ ] Did not duplicate equivalent pointer, touch, and keyboard paths.
- [ ] Did not use forced state as motion proof.
- [ ] Did not close rejected perceived motion without changing production behavior and obtaining explicit user acceptance.

## 8. Migration

- [ ] Used end-to-end migration when a legacy owner existed.
- [ ] Updated the curated Material export.
- [ ] Migrated every affected consumer.
- [ ] Preserved accepted behavior except for documented changes.
- [ ] Removed obsolete owners, files, imports, and exports.
- [ ] Added no permanent compatibility alias without a documented necessity.
- [ ] Recorded the real migration state in README.

## 9. Proportional proof

- [ ] Added or updated colocated component-contract tests for implemented capability.
- [ ] Created one stable canonical visual story for visible output.
- [ ] Used browser tests only for browser-owned behavior or uncertain computed output.
- [ ] Added pure, consumer, state-matrix, and visual-regression proof only when the family owns those risks.
- [ ] Did not add tests that merely restate equal declarations or aliases.
- [ ] Tested unsupported combinations only when the component owns explicit rejection or normalization.
- [ ] Did not create tests that imply unimplemented capability exists.

## 10. Implementation completion

- [ ] Rebuilt classification from the available official sources.
- [ ] Code, README, exports, consumers, tests, and stories agree.
- [ ] Source and inventory status are honest.
- [ ] Operator feedback and current visual status remain explicit.
- [ ] Known visual rejection and shared proof gaps remain open where applicable.
- [ ] Focused checks passed.
- [ ] Final applicable local verification passed.
- [ ] Recommended `material-component-review <family>`.

## 11. Independent review

Performed separately by `material-component-review`:

- [ ] Reviewer changed only the colocated `AUDIT.md`.
- [ ] Reviewer used no source-control or remote evidence.
- [ ] Reviewer recorded canonical source status and inventory limitations.
- [ ] Reviewer independently classified implemented, partial, absent, officially unsupported, unresolved, and out-of-family items.
- [ ] Stage 1 compared current implementation with current project documentation.
- [ ] Stage 2 compared project documentation with canonical Material evidence.
- [ ] Review distinguished actual capability from invalid combinations and optional guidance.
- [ ] Review verified that README preserves explicit operator feedback.
- [ ] Review did not invent acceptance.
- [ ] Review required representative proof for shared routes.
- [ ] Audit recorded compliance, coverage, and visual status separately.

## 12. Operator visual review

Performed through normal user messages:

- [ ] Reviewed prepared canonical evidence against named official references.
- [ ] Reported visible problems directly in the implementation request, or explicitly accepted the reviewed result.
- [ ] Did not use operator review to decide API, semantics, accessibility, source interpretation, architecture, or test sufficiency.

Do not describe a family as complete while implementation and documentation disagree, canonical source status is overstated, any item is misclassified, unfinished work is hidden, shared blast radius is unproved, local verification fails, or visual status is rejected/blocked/awaiting re-review.

Do not describe a family as fully implemented unless canonical evidence is current-complete, the independent audit reports `Official coverage: full`, and required visual review is explicitly accepted.