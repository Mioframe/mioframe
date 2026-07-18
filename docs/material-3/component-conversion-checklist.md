# Material 3 Expressive component authoring checklist

Use for every new, migrated, or materially changed public Material component.

Implementation scope may follow the explicit request and current product need. Inventory classification may not hide unused official capability.

## 1. Workspace and sources

- [ ] Used the current user task, current workspace files, official Material sources, and local project verification only.
- [ ] Did not use source-control history as implementation or Material evidence.
- [ ] Read applicable scoped instructions.
- [ ] Resolved the official family and documentation path.
- [ ] Used the official documentation slug for the canonical directory.
- [ ] Recorded canonical source status.
- [ ] Recorded exact sources and snapshot metadata actually used.
- [ ] Did not certify complete inventory from partial, stale-only, truncated, suspicious, or spot-check-only evidence.

## 2. Generalization boundary

- [ ] Kept shared skills and architecture free of family selectors, custom-property names, token values, DOM node names, bug symptoms, and proposed family structures.
- [ ] Persisted concrete findings only in the owning family README and AUDIT.
- [ ] Converted any shared rule refinement into an artifact-independent invariant applicable to every family owning that risk.
- [ ] Did not turn a pilot implementation or example into a mandatory structure for unrelated components.

## 3. Capability classification

- [ ] Classified every item as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the family boundary.
- [ ] Reserved `Not implemented` for real official capability that exists but is absent.
- [ ] Did not classify an invalid combination as missing capability.
- [ ] Did not inflate optional or non-normative guidance into required capability.
- [ ] Recorded consumer need as prioritization, not as a reason to omit classification.
- [ ] Used full coverage only when every actual official capability in scope is implemented and verified.
- [ ] Used unresolved coverage when inventory is not current-complete.

## 4. Family documentation and role ownership

- [ ] Created or updated the family README before production edits.
- [ ] Read existing AUDIT when present.
- [ ] Read explicit operator feedback from the current user message.
- [ ] Recorded source status, inventory status, and coverage.
- [ ] Listed only working capability under Implemented.
- [ ] Listed every partial, defective, provisional, ambiguous, or unverified item separately.
- [ ] Listed every actual absent capability under Not implemented.
- [ ] Listed unsupported and invalid combinations separately.
- [ ] Recorded optional guidance under known issues, extensions, or deviations.
- [ ] Recorded API, semantics, applicable ownership, tokens/states, dependencies, consumers, and verification.
- [ ] Persisted operator feedback and visual status.
- [ ] Set rejected when the user reported a visible defect.
- [ ] Preserved the complete affected surface as unresolved when feedback was broad.
- [ ] Set awaiting re-review only after production behavior changed and the complete surface was rechecked.
- [ ] Set accepted only from explicit user acceptance.
- [ ] Set review required after changes.
- [ ] Did not edit AUDIT during implementation.

## 5. Family and dependency ownership

- [ ] Selected one cohesive official family.
- [ ] Named out-of-family capability with its separate owner.
- [ ] Kept project-specific UI and generic infrastructure outside official Material ownership.
- [ ] Kept one owner for each semantic, interactive, accessibility, and rendered-property concern.
- [ ] Avoided private cross-family imports.
- [ ] Created only files and abstractions required by current work.

## 6. Applicable structural ownership

For a visible interactive component, identify each applicable owner and mark non-applicable roles:

- [ ] semantic host;
- [ ] layout footprint;
- [ ] interaction bounds;
- [ ] visual container;
- [ ] content bounds;
- [ ] state-layer bounds;
- [ ] ripple event host;
- [ ] ripple render and clip bounds;
- [ ] focus-indicator bounds;
- [ ] outline and elevation owner;
- [ ] shape and motion owner.

Then verify:

- [ ] Combined roles on one element form coherent official anatomy.
- [ ] Numeric source values are applied to the correct owner.
- [ ] Differing interaction and visible bounds form a coherent contiguous region and reserve layout space where required.
- [ ] Adjacent interactive regions do not conflict.
- [ ] No helper creates partial, disconnected, overlapping, or unreserved interaction geometry.
- [ ] Visual, state, ripple, focus, outline, elevation, content, shape, and motion properties use their official owners.
- [ ] All applicable state endpoints and simultaneous-state precedence are structurally correct.
- [ ] Objective structural defects were rejected before operator handoff.

## 7. Foundations and styles

- [ ] Reused a shared owner only when an official shared contract or explicit foundation/style requirement exists.
- [ ] Kept family-specific behavior local.
- [ ] Verified every claimed route reaches the correct final owner.
- [ ] Did not treat aliases, comments, tests, screenshots, or colocation as dependencies.
- [ ] Recorded numeric spring values as source evidence when CSS cannot consume them directly.
- [ ] Used one honest Web adaptation without claiming it is the original spring model.
- [ ] Identified affected consumers before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas.
- [ ] Preferred the narrowest valid owner.
- [ ] Added representative proof that exercises a shared route.
- [ ] Did not use unrelated unchanged tests as representative proof.

## 8. CSS custom-property naming and routing

- [ ] Inventoried every custom property added or materially touched.
- [ ] Classified each as exact official token, private implementation route, application token, or invalid/unnecessary alias.
- [ ] Used exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names without shortening or paraphrasing.
- [ ] Used `--md-private-<owner>-<semantic-role>` for justified private routes.
- [ ] Used `--app-*` only for genuine application contracts outside Material vocabulary.
- [ ] Added no ad-hoc public-looking name shaped like `--md-<artifact>-<raw-css-property>`.
- [ ] Private names describe semantic ownership rather than only rendering mechanics.
- [ ] Removed unnecessary aliases for one-use constants.
- [ ] Confirmed every declared route can affect the correct final owner.
- [ ] Did not expose or test private variables as public Material tokens.

## 9. API, state, and normalization

- [ ] Public props, emits, slots, and native semantics match the implemented contract.
- [ ] Invalid combinations are prevented, normalized, or rejected coherently.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquisition, release, cancellation, disabled, failure, and cleanup only when applicable.
- [ ] Classified materially different normalization/fallback classes separately.
- [ ] Verified actual output, semantics/accessibility, warning/error text, documentation, and tests agree for each branch.
- [ ] Did not describe distinct outcomes with one misleading generic message.

## 10. Motion and lifecycle proof

- [ ] Identified the actual visible property and correct owner before testing motion.
- [ ] Verified the shared motion foundation deeply once.
- [ ] Used real input to prove activation of the intended rendered property.
- [ ] Checked one meaningful intermediate state only when needed.
- [ ] Verified correct visible endpoints, not only scalar values.
- [ ] Verified safe interruption or cancellation.
- [ ] Triggered competing events before the first lifecycle or transition settled for named interruption tests.
- [ ] Proved the competing branch began and the final outcome contained no stale state.
- [ ] Did not treat a test name, comment, timeout, delayed action, or endpoint-only assertion as proof.
- [ ] Did not use forced state as motion proof.
- [ ] Did not claim motion fixed when timing changed but the final owner, endpoint, composition, or rendered property remained wrong.
- [ ] Did not close rejected perceived motion without corrected production behavior and explicit user acceptance.

## 11. Migration

- [ ] Used end-to-end migration when a legacy owner existed.
- [ ] Updated the curated Material export.
- [ ] Migrated every affected consumer.
- [ ] Preserved accepted behavior except for documented changes.
- [ ] Removed obsolete owners, files, imports, and exports.
- [ ] Added no permanent compatibility alias without documented necessity.
- [ ] Recorded the real migration state in README.

## 12. Proportional proof

- [ ] Added or updated colocated component-contract tests for implemented capability.
- [ ] Created one stable canonical visual story using real production anatomy and representative real children when relevant.
- [ ] Used browser tests for browser-owned behavior and geometry requiring a real layout engine.
- [ ] Tested representative interior, boundary, exterior, and adjacent-control behavior for custom interaction geometry.
- [ ] Asserted final properties on actual owners.
- [ ] Did not treat a screenshot baseline as Material proof.
- [ ] Did not add tests that merely restate declarations, aliases, or values on the wrong owner.
- [ ] Tested unsupported combinations only when the component owns explicit rejection or normalization.
- [ ] Confirmed every named test claim is established by setup and assertions.

## 13. Implementation completion

- [ ] Rebuilt classification from available official sources.
- [ ] Code, README, exports, consumers, tests, and stories agree.
- [ ] Source and inventory status are honest.
- [ ] Applicable ownership is complete and coherent.
- [ ] Custom-property inventory has no invalid names.
- [ ] Operator feedback and visual status remain explicit.
- [ ] Known visual rejection and shared proof gaps remain open where applicable.
- [ ] Objective defects were not delegated to operator review.
- [ ] Focused checks passed.
- [ ] Final applicable local verification passed.
- [ ] Recommended independent family review.

## 14. Independent review

- [ ] Reviewer changed only the colocated AUDIT.
- [ ] Reviewer used no source-control history as evidence.
- [ ] Reviewer independently reconstructed applicable ownership.
- [ ] Reviewer verified final visible owners and state endpoints.
- [ ] Reviewer inventoried custom properties and rejected invalid namespaces or unnecessary aliases.
- [ ] Reviewer did not accept numeric equality on the wrong owner as proof.
- [ ] Reviewer verified README preserves explicit operator feedback.
- [ ] Reviewer did not invent acceptance.
- [ ] Reviewer rejected named-risk proof whose setup never entered the named condition.
- [ ] Reviewer classified any high-severity structural, ownership, namespace, or unchanged visible rejection as non-compliant.
- [ ] Audit recorded compliance, coverage, and visual status separately.

## 15. Operator visual review

- [ ] Reviewed prepared canonical evidence against named official references.
- [ ] Reported visible problems directly or explicitly accepted the result.
- [ ] Did not use operator review to decide API, semantics, accessibility, source interpretation, architecture, ownership, CSS naming, or test sufficiency.

Do not describe a family as complete while applicable ownership is unresolved, a visible endpoint is wrong, namespaces are invalid, implementation and documentation disagree, canonical source status is overstated, unfinished work is hidden, named-risk proof is not causal, shared blast radius is unproved, local verification fails, or visual status is rejected, blocked, or awaiting re-review.

Do not describe a family as fully implemented unless canonical evidence is current-complete, independent review reports full coverage, and required visual review is explicitly accepted.
