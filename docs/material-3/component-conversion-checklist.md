# Material 3 Expressive component authoring checklist

Use once as the final evidence-backed gate for every new, migrated, repaired, restructured, replaced, or materially changed public Material component.

Implementation scope may follow the explicit request and current product need. Inventory classification may not hide unused official capability.

For every applicable item establish:

```text
applicable: yes | no
evidence: <source/file/test/rendered result>
result: pass | fail
```

The evidence ledger is working output; do not create a permanent report file unless an existing owner requires it.

## 1. Workspace, scope, and sources

- [ ] Used the current task, current workspace, current successful Material MCP reads, official sources, and local verification.
- [ ] Did not use source-control history as Material authority.
- [ ] Inspected the current diff when available for unrelated changes, missing cleanup, compatibility paths, and scope growth.
- [ ] Read applicable scoped instructions.
- [ ] Resolved the official family and documentation path.
- [ ] Used the official documentation slug for the canonical directory.
- [ ] Read every required current-run MCP page and structured route.
- [ ] Recorded source provenance and status.
- [ ] Did not treat capture age alone as a defect or blocker.
- [ ] Did not certify complete inventory from partial, truncated, failed, suspicious, conflicting, or spot-check-only evidence.

## 2. Generalization boundary

- [ ] Kept shared skills and architecture free of family selectors, custom-property names, token values, DOM node names, bug symptoms, and proposed family structures.
- [ ] Persisted concrete findings only in the owning family README and AUDIT.
- [ ] Converted shared refinements into artifact-independent invariants applicable to every owner of the risk.
- [ ] Did not add a new universal rule when an existing rule already prohibited the defect; strengthened execution or reported non-compliance instead.
- [ ] Did not turn a pilot example into a required structure for unrelated components.

## 3. Contract reconstruction

- [ ] Reconstructed the official family boundary before production changes.
- [ ] Recorded supported, unsupported, absent, unresolved, and out-of-family capability.
- [ ] Recorded public API and native semantics.
- [ ] Recorded official anatomy.
- [ ] Recorded applicable DOM and rendered-property ownership.
- [ ] Recorded token sources and final owners.
- [ ] Recorded states and precedence.
- [ ] Recorded motion properties, endpoints, and accepted Web adaptation.
- [ ] Recorded shared foundation dependencies.
- [ ] Recorded current defects, operator feedback, and required proof.
- [ ] Did not derive the contract from the existing implementation alone.
- [ ] Did not design tests around an unverified current structure.

## 4. Diagnosis

For every reported or discovered material problem:

- [ ] Classified one primary category: canonical behavior, implementation defect, architecture defect, foundation defect, evidence gap, or product deviation.
- [ ] Identified the actual owner rather than assuming the component owns the symptom.
- [ ] Recorded evidence supporting the classification.
- [ ] Did not change production code before the classification was sufficiently resolved.
- [ ] Did not treat canonical Material behavior as a defect without an explicit product deviation.
- [ ] Did not patch a shared-foundation defect locally to avoid correcting the real owner.

## 5. Implementation strategy

- [ ] Selected `repair`, `restructure`, or `replace` before production changes.
- [ ] Used repair only when public contract, anatomy, and ownership were sound.
- [ ] Used restructure when capability remained valid but anatomy, ownership, or dependencies were wrong.
- [ ] Used replace when the implementation was based on a materially wrong contract or contained several conflicting models.
- [ ] Removed superseded anatomy, routes, tests, and compatibility paths after restructure or replacement.
- [ ] If two correction rounds retained the same objective defect, added workarounds, or created new ownership ambiguity, stopped patching and reconsidered the strategy.

## 6. Family documentation and classification

- [ ] Created or updated README before production edits.
- [ ] Read existing AUDIT when present.
- [ ] Read explicit operator feedback from the current task.
- [ ] Classified every item as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the family boundary.
- [ ] Reserved `Not implemented` for real official capability that exists but is absent.
- [ ] Did not classify an invalid combination as missing capability.
- [ ] Did not inflate optional guidance into required capability.
- [ ] Listed only working final-owned capability under Implemented.
- [ ] Recorded every defect, proof gap, source limitation, shared blast-radius gap, and follow-up.
- [ ] Persisted operator feedback and visual status without weakening it.
- [ ] Used `awaiting re-review` only after production behavior changed and affected objective surfaces were rechecked.
- [ ] Used `accepted` only from explicit user acceptance.
- [ ] Set review status to `review required after changes`.
- [ ] Did not edit AUDIT during implementation.

## 7. Family and dependency ownership

- [ ] Selected one cohesive official family.
- [ ] Named out-of-family capability with its separate owner.
- [ ] Kept project-specific UI and generic infrastructure outside official Material ownership.
- [ ] Kept one owner for each semantic, interaction, accessibility, and rendered-property concern.
- [ ] Avoided private cross-family imports.
- [ ] Created only files and abstractions required by current work.

## 8. Applicable structural ownership

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

- [ ] Combined roles form coherent official anatomy.
- [ ] Ownership analysis did not create one element per checklist role.
- [ ] Every DOM node owns a necessary semantic, accessibility, layout, interaction, rendering, clipping/stacking, transition, or platform responsibility.
- [ ] Numeric source values reach the correct final owner.
- [ ] Differing interaction and visible bounds form one coherent contiguous region and reserve layout space where required.
- [ ] Adjacent interactive regions do not conflict.
- [ ] No helper creates partial, disconnected, overlapping, or unreserved interaction geometry.
- [ ] Visual, state, ripple, focus, outline, elevation, content, shape, and motion properties use their intended owners.
- [ ] Applicable state endpoints and simultaneous-state precedence are correct.
- [ ] Objective structural defects were rejected before operator handoff.

## 9. Foundations and styles

- [ ] Reused a shared owner only for an official shared contract or explicit foundation/style requirement.
- [ ] Kept family-specific behavior local.
- [ ] Verified every claimed route reaches the correct final owner.
- [ ] Did not treat aliases, comments, tests, screenshots, or colocation as dependencies.
- [ ] Used one honest Web adaptation without claiming CSS consumes unavailable spring physics directly.
- [ ] Identified affected consumers before changing root/system tokens, universal selectors, pseudo-elements, formulas, or lifecycle.
- [ ] Preferred the narrowest valid owner.
- [ ] Added representative final-output proof for changed shared routes.
- [ ] Included more than the motivating family when multiple family classes consume the route.
- [ ] Did not use unrelated unchanged tests as representative proof.

## 10. CSS custom-property naming and routing

- [ ] Inventoried every custom property added or materially touched.
- [ ] Classified each as exact official token, justified private semantic route, application token, or invalid/unnecessary alias.
- [ ] Used exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names without shortening or paraphrasing.
- [ ] Used `--md-private-<owner>-<semantic-role>` only for real variable routes.
- [ ] Used `--app-*` only for genuine application contracts outside Material vocabulary.
- [ ] Added no ad-hoc public-looking name shaped like `--md-<artifact>-<raw-css-property>`.
- [ ] Private names describe semantic ownership rather than raw rendering mechanics.
- [ ] Removed unnecessary aliases for one-use or invariant constants.
- [ ] Confirmed every declared route can affect the correct final owner.
- [ ] Did not expose or test private variables as public Material tokens.

## 11. API, state, and normalization

- [ ] Public props, emits, slots, and native semantics match the implemented contract.
- [ ] Invalid combinations are prevented, normalized, or rejected coherently.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Component-owned transient state defines acquisition, release, cancellation, disabled, failure, and cleanup only when applicable.
- [ ] Classified materially different normalization/fallback classes separately.
- [ ] Verified actual output, semantics/accessibility, exact warning/error meaning, documentation, and tests agree for each branch.
- [ ] Did not describe clamping, ignoring, rejection, and fallback with one misleading generic message.
- [ ] Did not use generic substring warning assertions where distinct branches have different meanings.

## 12. Ordered implementation gates

- [ ] Native semantics, API, and anatomy were resolved before styling around legacy structure.
- [ ] Layout, interaction geometry, and ownership were resolved before token or motion proof.
- [ ] Static geometry and visible endpoints were correct before baselines were accepted.
- [ ] Token and state routes were verified on final owners.
- [ ] Shared foundation work was performed through the narrowest real owner.
- [ ] Real interaction lifecycle and motion were verified after ownership was stable.
- [ ] Exports, consumers, and obsolete ownership were handled last without preserving parallel models.

## 13. Motion and lifecycle proof

- [ ] Identified the actual visible property and correct owner before testing motion.
- [ ] Distinguished forced-state endpoint evidence from real-input lifecycle evidence.
- [ ] Used real input to prove acquisition and release.
- [ ] Sampled a meaningful intermediate state when endpoint-only proof could miss geometry, clipping, or layer-composition defects.
- [ ] Verified bounds do not jump unexpectedly unless the official contract requires it.
- [ ] Verified shape, clipping, state layer, outline, elevation, and content remain composed on intended owners during the transition when at risk.
- [ ] Verified correct visible endpoints, not only scalar source values.
- [ ] Verified safe interruption or cancellation when owned.
- [ ] Triggered competing events before settlement for named interruption tests.
- [ ] Proved the competing branch began and final outcome contained no stale state.
- [ ] Did not use forced state, screenshot, test title, comment, or timeout as lifecycle proof.
- [ ] Did not add frame-level infrastructure without a demonstrated transition-composition risk.
- [ ] Did not claim motion fixed when timing changed but owner, endpoint, trajectory composition, or rendered property remained wrong.
- [ ] Did not close rejected perceived motion without corrected production behavior and explicit user acceptance.

## 14. Migration and cleanup

- [ ] Updated the curated Material export.
- [ ] Migrated every affected consumer.
- [ ] Preserved accepted behavior except documented corrections.
- [ ] Removed obsolete owners, files, imports, exports, tests, comments, and compatibility paths.
- [ ] Added no permanent compatibility alias without documented necessity.
- [ ] Recorded real migration state in README.
- [ ] Current diff contains no unrelated process or production change not justified by the calibration/task.

## 15. Proportional proof

- [ ] Added or updated colocated component-contract tests for implemented capability.
- [ ] Created one stable canonical visual story using real production anatomy.
- [ ] Added a real-interaction fixture when perceived transition quality is under review.
- [ ] Used browser tests for browser-owned behavior and real geometry.
- [ ] Tested representative interior, boundary, exterior, and adjacent-control behavior for custom interaction geometry.
- [ ] Asserted final properties on actual owners.
- [ ] Did not treat a screenshot baseline as Material proof.
- [ ] Did not add tests that restate declarations, aliases, or values on the wrong owner.
- [ ] Confirmed every named test claim is established by setup and assertions.

## 16. Cross-artifact consistency

- [ ] Production, README, Storybook descriptions, tests, shared-owner documentation, and verification reports name the same contract and owners.
- [ ] No story or comment describes superseded anatomy or behavior.
- [ ] No forced-state fixture is described as real interaction proof.
- [ ] No warning text contradicts the actual fallback result.
- [ ] No test title overstates what its setup and assertions establish.
- [ ] Operator rejection remains open unless explicitly accepted.

## 17. Objective authoring gate

- [ ] Every applicable checklist item has direct evidence.
- [ ] No incorrect or ambiguous anatomy/ownership remains.
- [ ] No unnecessary DOM structure remains.
- [ ] No invalid, mechanism-named, or unnecessary token route remains.
- [ ] No misleading normalization or warning branch remains.
- [ ] No forced-state proof substitutes for real behavior.
- [ ] No implementation/documentation/test contradiction remains.
- [ ] No shared blast-radius gap is hidden.
- [ ] No known objective defect is delegated to operator review.
- [ ] Focused checks passed.
- [ ] Final applicable local verification passed.

Any failed applicable item means the authoring gate fails. Report exact failed gates and do not recommend operator acceptance.

## 18. Independent review

- [ ] Reviewer changed only the colocated AUDIT.
- [ ] Reviewer used current-run official evidence rather than trusting README conclusions.
- [ ] Reviewer inspected the current diff only for scope and regression evidence, not as Material authority.
- [ ] Reviewer independently reconstructed applicable ownership.
- [ ] Reviewer actively searched for contradictions across production, README, stories, tests, verification, and operator feedback.
- [ ] Reviewer verified final visible owners and state endpoints.
- [ ] Reviewer inventoried custom properties and rejected invalid namespaces, mechanism names, or unnecessary aliases.
- [ ] Reviewer rejected named-risk proof whose setup never entered the named condition.
- [ ] Reviewer reviewed diagnosis and repair/restructure/replace strategy.
- [ ] Reviewer did not invent acceptance.
- [ ] Audit records findings and evidence gaps concisely instead of duplicating README.

## 19. Operator visual review

- [ ] Objective authoring and independent-review gates closed before operator handoff.
- [ ] Prepared canonical evidence includes real interaction when motion is reviewed.
- [ ] Operator reported visible problems directly or explicitly accepted the result.
- [ ] Operator was not asked to decide API, semantics, accessibility, source interpretation, ownership, CSS naming, lifecycle proof, or test sufficiency.

Do not describe a family as implementation-finished while an applicable authoring gate fails, implementation and documentation disagree, named-risk proof is non-causal, shared blast radius is unproved, local verification fails, or visual status is rejected or awaiting re-review.
