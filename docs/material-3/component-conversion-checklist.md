# Material 3 Expressive component authoring checklist

Use for every new, migrated, or materially changed public Material component.

Implementation scope may follow current product need. Inventory classification may not hide unused official capability.

## 1. Workspace and sources

- [ ] Used the current user task, current workspace files, official Material sources, and local project verification only.
- [ ] Did not run, inspect, or cite git, GitHub, branches, commits, diffs, blame, logs, pull requests, or repository history.
- [ ] Read applicable scoped `AGENTS.md`, including `src/shared/ui/material/components/AGENTS.md`.
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
- [ ] Recorded API, semantics, geometry, token/state/property ownership, dependencies, extensions, consumers, and verification.
- [ ] Persisted operator feedback in README under `Operator feedback and visual status`.
- [ ] Set `rejected` when the user reported a visual defect.
- [ ] Preserved the complete affected visible surface as unresolved when the feedback was broad.
- [ ] Set `awaiting re-review` only after a production behavior change and complete recheck of the affected surface.
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

## 5. Geometry and structural conformance

For every visible interactive component, identify the concrete DOM owner for each applicable role:

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

- [ ] Shared roles on one element form a coherent official geometry.
- [ ] Numeric token values are applied to the correct DOM owner, not merely computed somewhere.
- [ ] A minimum target larger than the visible container reserves coherent layout space.
- [ ] The full interaction region is rectangular, non-overlapping, and testable at representative edges and corners.
- [ ] No absolutely positioned descendant creates a cross-shaped, partial, overlapping, or non-layout target outside its semantic host.
- [ ] The visual container owns its background, outline, elevation, shape, state layer, and clipped ripple.
- [ ] Focus indication follows the intended visible target.
- [ ] Content is aligned and not clipped or optically displaced.
- [ ] Resting, hovered, focused, pressed, selected, disabled, and simultaneous-state visible endpoints are structurally correct.
- [ ] Objective anatomy or geometry defects were rejected by the agent before operator handoff.

## 6. Foundations and styles

- [ ] Reused an accepted shared owner only when a real cross-family contract exists.
- [ ] Kept family-specific behavior local.
- [ ] Verified every claimed route reaches the correct final property owner.
- [ ] Did not treat aliases, comments, tests, screenshots, or colocation as implementation dependencies.
- [ ] Recorded numeric spring values as source evidence when CSS cannot consume them directly.
- [ ] Used one honest Web runtime adaptation without claiming it is the original spring model.
- [ ] Identified current affected families before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas.
- [ ] Preferred the narrowest valid owner.
- [ ] Added representative proof that actually exercises a shared route.
- [ ] Did not use unchanged unrelated tests as representative proof.

## 7. CSS custom-property naming and routing

- [ ] Inventoried every custom-property declaration added or materially touched.
- [ ] Classified each as exact official token, private implementation route, application token, or invalid/unnecessary alias.
- [ ] Used exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names without shortening or paraphrasing.
- [ ] Used `--md-private-<owner>-<semantic-role>` for justified private routes.
- [ ] Used `--app-*` only for genuine Mioframe application contracts outside Material vocabulary.
- [ ] Added no ad-hoc public-looking `--md-<component>-*` namespace.
- [ ] Rejected names such as `--md-button-border-radius`, `--md-button-height`, `--md-button-padding-left`, and `--md-button-icon-gap`.
- [ ] Private names describe semantic ownership rather than only raw CSS properties.
- [ ] Removed variables used only as unnecessary aliases for one-use constants.
- [ ] Confirmed every declared route can affect the correct final rendered owner.
- [ ] Did not expose or test private variables as public Material tokens.

## 8. API, state, and normalization

- [ ] Public props, emits, slots, and native semantics match the implemented contract.
- [ ] Invalid combinations are prevented, normalized, or rejected coherently.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquisition, release, cancellation, disabled, failure, and cleanup only when applicable.
- [ ] Classified materially different normalization/fallback input classes separately.
- [ ] Verified actual output, semantics/accessibility, warning/error text, README/API documentation, and test assertion agree for each material branch.
- [ ] Did not describe an ignored input, rejected combination, clamped result, and fallback mode with one misleading generic message.

## 9. Motion and lifecycle proof

- [ ] Identified the actual visual property and its correct geometry owner before testing motion.
- [ ] Verified the shared motion foundation deeply once.
- [ ] Used real input to prove the component activates the intended rendered property.
- [ ] Checked one meaningful intermediate state only when needed to establish the route.
- [ ] Verified correct visible endpoints, not only scalar values.
- [ ] Verified safe interruption/cancellation.
- [ ] Triggered competing events before the first lifecycle or transition settled for named interruption tests.
- [ ] Proved the competing branch began and the final public outcome contained no stale state.
- [ ] Did not treat a test name, comment, timeout, delayed action after settlement, or endpoint-only assertion as proof.
- [ ] Did not use forced state as motion proof.
- [ ] Did not claim motion fixed when timing changed but the endpoint, geometry owner, or visible shape remained wrong.
- [ ] Did not close rejected perceived motion without corrected production behavior and explicit user acceptance.

## 10. Migration

- [ ] Used end-to-end migration when a legacy owner existed.
- [ ] Updated the curated Material export.
- [ ] Migrated every affected consumer.
- [ ] Preserved accepted behavior except for documented changes.
- [ ] Removed obsolete owners, files, imports, and exports.
- [ ] Added no permanent compatibility alias without documented necessity.
- [ ] Recorded the real migration state in README.

## 11. Proportional proof

- [ ] Added or updated colocated component-contract tests for implemented capability.
- [ ] Created one stable canonical visual story using real production anatomy and representative real child components.
- [ ] Used browser tests for browser-owned behavior and geometry that requires a real layout engine.
- [ ] Tested complete intended target geometry at representative center, edges, corners, and adjacent-control boundaries when relevant.
- [ ] Asserted final properties on actual DOM owners.
- [ ] Did not treat a screenshot baseline as proof of Material correctness.
- [ ] Did not add tests that merely restate declarations, aliases, or values on the wrong element.
- [ ] Tested unsupported combinations only when the component owns explicit rejection or normalization.
- [ ] Confirmed every named test claim is established by its setup and assertions.

## 12. Implementation completion

- [ ] Rebuilt classification from available official sources.
- [ ] Code, README, exports, consumers, tests, and stories agree.
- [ ] Source and inventory status are honest.
- [ ] Geometry ownership map is complete and coherent.
- [ ] CSS custom-property namespace inventory has no invalid names.
- [ ] Operator feedback and current visual status remain explicit.
- [ ] Known visual rejection and shared proof gaps remain open where applicable.
- [ ] Objective structural defects were not delegated to operator review.
- [ ] Focused checks passed.
- [ ] Final applicable local verification passed.
- [ ] Recommended `material-component-review <family>`.

## 13. Independent review

Performed separately by `material-component-review`:

- [ ] Reviewer changed only the colocated `AUDIT.md`.
- [ ] Reviewer used no source-control or remote evidence.
- [ ] Reviewer read `src/shared/ui/material/components/AGENTS.md`.
- [ ] Reviewer independently reconstructed the geometry ownership map.
- [ ] Reviewer verified target, visual-container, state-layer, ripple, focus, outline, elevation, shape, and content bounds.
- [ ] Reviewer inventoried touched CSS custom properties and rejected invalid namespaces or unnecessary aliases.
- [ ] Reviewer did not accept numeric token equality on the wrong DOM owner as proof.
- [ ] Reviewer verified that README preserves explicit operator feedback.
- [ ] Reviewer did not invent acceptance.
- [ ] Reviewer rejected named-risk proof whose setup never entered the named condition.
- [ ] Reviewer classified high-severity anatomy, geometry, target, shape, ownership, or unchanged visual rejection as `non-compliant`.
- [ ] Audit recorded compliance, coverage, and visual status separately.

## 14. Operator visual review

Performed through normal user messages:

- [ ] Reviewed prepared canonical evidence against named official references.
- [ ] Reported visible problems directly in the implementation request, or explicitly accepted the reviewed result.
- [ ] Did not use operator review to decide API, semantics, accessibility, source interpretation, architecture, geometry ownership, CSS naming, or test sufficiency.

Do not describe a family as complete while structural geometry is unresolved, a visible endpoint is wrong, CSS custom-property namespaces are invalid, implementation and documentation disagree, canonical source status is overstated, unfinished work is hidden, named-risk proof is not causal, shared blast radius is unproved, local verification fails, or visual status is rejected/blocked/awaiting re-review.

Do not describe a family as fully implemented unless canonical evidence is current-complete, the independent audit reports `Official coverage: full`, and required visual review is explicitly accepted.