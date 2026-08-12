---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family, or to classify final-verifier output without assigning unrelated workspace failures to a family.'
---

# Material component review

Perform independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns family-compliance judgment and exact Material correction routing. It does not implement production fixes or own the outer final workflow verification result.

## Modes

### Full independent review

Use after an invalidating upstream revision changed, when review is missing or invalid, or when review is the stored origin stage after cross-family correction.

A metadata-only design refresh with unchanged design contract revision does not require review.

Review the complete current family and all consumers, not only the latest change.

### Final-verifier routing

Use when the orchestrator provides the exact failed final command and visible output.

Classify the failed contract before editing any artifact:

- `material-owned` — an exact Material family and earliest stage can correct the failure;
- `external-workspace-blocker` — no Material family stage owns the failure.

A final-verifier failure outside Material must not change any family `REVIEW.md` verdict, readiness, completion status, route, or artifact revision.

## Input gate for full review

Require successful current design, architecture, implementation, and migration artifacts.

Architecture must reference current design contract and dependency review revisions. Implementation and migration must reference current upstream artifact revisions.

If an upstream artifact is invalid, do not reconstruct it. Record the exact earlier-stage or other-family route and block completion.

## Worker boundary

Run in a fresh isolated context independent from workers that authored or corrected architecture, implementation, or migration.

Use task-relevant workspace files, canonical artifacts, official design evidence, code, consumers, tests, and documented commands. Do not depend on Git, PR, commit, or external-check state.

Always read the current `src/shared/ui/material/docs/component-adapter.md` and `docs/testing/migration-plan.md` during full review. Do not accept a family merely because its own artifacts consistently repeat an older controlled-state model, test-placement convention, or migration-era registry pattern.

## Full-review output

Write exactly:

```text
src/shared/ui/material/components/<family>/REVIEW.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
DESIGN.md contract revision: <exact Design contract revision>
ARCHITECTURE.md revision: <exact Artifact revision>
IMPLEMENTATION.md revision: <exact Artifact revision>
MIGRATION.md revision: <exact Artifact revision>
Verdict: compliant | compliant-with-listed-risks | blocked
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Completion status: complete | blocked
Final workflow verification readiness: ready | blocked
Operator visual status: no-reported-defect | defect-reported | not-applicable
Blockers: none | <exact blockers>
Major issues: none | <exact issues>
Minor issues: none | <exact issues>
Accepted risks: none | <exact accepted risks>
```

`Final workflow verification readiness` means the family is ready for the outer command. It is not the result of that command.

Use a new artifact revision whenever family review content or Material routing changes. Record exact invalidating upstream revisions.

Required headings:

```text
## Goal and scenarios reviewed
## Official design compliance
## Architecture compliance
## Implementation compliance
## Migration and legacy removal
## Proof and stage verification
## Blockers
## Major issues
## Minor issues
## Accepted risks
## Items not required
## Routing evidence
```

## Full review order

1. Validate the complete official design contract and source lifecycle.
2. Compare architecture with design, scenarios, ownership, dependencies, renderer revision, the current adapter contract, and the simplest viable alternative.
3. For every controlled renderer-backed state, independently trace the exact installed renderer event lifecycle and prove the architecture has one source of truth, explicit accepted intent, explicit rejected intent, and no optimistic renderer mutation that can survive a rejected update.
4. Compare implementation with every architecture decision and forbidden approach.
5. Review consumers, the no-consumer case, legacy-removal claims, and every legacy-to-canonical state/value/configuration translation. Independently inspect the current domain/consumer semantics and surrounding owners; identical or similar prop names are not evidence of semantic equivalence. Explicitly distinguish capability/configuration flags from current rendered state, and verify default/fallback resolution before the value reaches the canonical component.
6. For every translated state/value contract, verify proof exercises the combinations that could expose a semantic mismatch: capability-enabled true/false/empty states and default/fallback cases when applicable. A single representative happy path is insufficient when multiple meanings can map to the same canonical prop type.
7. Inspect public API, state precedence, tokens, renderer boundaries, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
8. For decorative/presentation composition, verify both sides of ownership: the child is not independently interactive/accessibility-owned, and real input on its visible region reaches the actual enclosing action owner with resulting owner state reflected back.
9. Verify proof ownership and placement against the current `docs/testing/migration-plan.md`; ordinary owner-local browser proof must not be accepted in a stale central registry shape when the current runner supports local ownership.
10. Inspect test-environment changes for blast radius. A renderer-specific prototype/API polyfill in shared test bootstrap is a finding unless multiple independent owners justify that shared seam.
11. Verify impact metadata and stage-scoped checks.
12. Check for an actual operator-reported visual or motion defect.
13. Consolidate each underlying problem once and assign exact ownership.

Automated checks prove only covered contracts. Absence of operator visual feedback is not a blocker and requires no positive acknowledgement.

## Finding ownership

Route:

- missing or incorrect official fact → owning family/design;
- incorrect demand, API, state ownership, dependency, renderer/token strategy, proof ownership, or migration plan → owning family/architecture;
- component code, token, mapping, export, local test setup, or component-owned proof defect → owning family/implementation;
- consumer, scenario, legacy-removal, or migration-proof defect → owning family/migration.

A consumer translation that is wrong because architecture defined the wrong legacy-to-canonical semantic mapping routes to architecture; a consumer that violates a correct architecture mapping routes to migration.

A dependency defect routes to the dependency family, not automatically to the parent.

Do not fix production findings during review.

## Origin execution

When review is the stored origin stage after another family was corrected, the orchestrator first resumes the origin through durable validation from design forward.

Review then executes fresh against all current artifacts, re-evaluates the original finding, and clears or replaces its route. Never preserve a route merely because it existed before correction.

## Verdict semantics

### `compliant`

Use only when all revisions match, mandatory work and proof are complete, no findings or accepted risks remain, route is `none/none`, completion is `complete`, final-verification readiness is `ready`, and no reported defect remains unresolved.

### `compliant-with-listed-risks`

Use only for complete work with explicit bounded non-blocking limitations. It must not represent an unrun or failed required stage check, revision mismatch, stale artifact, warning, unresolved finding, incomplete migration, unknown consumer state, missing proof, deferred required work, or pending outer verification.

Blockers, major issues, and minor issues must be `none`.

### `blocked` with correction route

Use when a family finding belongs to an earlier stage of the same family or to another family.

Same-family review routes may target design, architecture, implementation, or migration. Review cannot route to review.

### Genuine family blocker

When required family evidence or safety input cannot be resolved by any Material stage, use:

```text
Verdict: blocked
Required return family: none
Required return stage: none
Completion status: blocked
Final workflow verification readiness: blocked
Blockers: <exact family blocker>
```

A review-owned formatting, synthesis, classification, or routing-output defect must be fixed in the current worker. Do not return a route to review.

## Final-verifier routing

Given exact final verifier output:

1. identify the failed contract and evidence;
2. decide whether an exact Material family and earliest stage own it;
3. do not infer ownership from the component that triggered the outer command;
4. do not assign unrelated workspace failures to the requested parent family;
5. separate classification from root-cause diagnosis: an external-workspace blocker may be clear even when the exact tooling cause is not yet proven;
6. before claiming a repository runner/mount/worktree defect, verify the command’s invocation cwd/repository identity or other direct evidence that the runner selected the wrong workspace. Do not infer a shared tooling bug merely from `process.cwd()`-based code plus a failed path.

### Material-owned failure

When an exact Material owner exists:

1. open that family’s current `REVIEW.md`;
2. record current invalidating revisions;
3. write verdict and completion as `blocked`;
4. set the exact Material correction route;
5. record the command and relevant output in routing evidence;
6. leave every unrelated family review unchanged;
7. return to the orchestrator.

### External workspace blocker

When no Material family stage owns the failure:

- do not write or rewrite any family `REVIEW.md`;
- preserve all compliant family review revisions and dependency gates;
- report only evidence-supported external facts; keep an unverified root cause explicitly unverified;
- return only this compact result:

```text
MATERIAL FINAL VERIFICATION ROUTING RESULT
Classification: external-workspace-blocker
Final command: <exact command>
Failed contract: <exact external contract>
Evidence: <concise exact output>
Required return family: none
Required return stage: none
Family reviews changed: none
Status: blocked
```

The outer orchestrator records this blocker in its final report and mutable roadmap/status owner. After the external owner corrects it, the orchestrator reruns the prescribed focused command and the original final command without rebuilding current Material family artifacts.

A non-failing external warning must not change a family review. Whether it blocks completion follows the root verification contract.

## Completion

Full review succeeds only when recorded revisions equal current artifacts, all headings exist, the verdict represents the complete family, and no unresolved family route or finding remains.

A design artifact revision mismatch alone is irrelevant when design contract revision is unchanged.

A successful review means ready for outer final verification. It does not claim that command passed.

## Full-review report

```text
MATERIAL REVIEW RESULT
Input component:
Canonical family:
Review mode: full
REVIEW.md path:
Artifact revision:
DESIGN.md contract revision:
ARCHITECTURE.md revision:
IMPLEMENTATION.md revision:
MIGRATION.md revision:
Operator visual status:
Blockers:
Major issues:
Minor issues:
Accepted risks:
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review verdict: compliant | compliant-with-listed-risks | blocked
Final workflow verification readiness: ready | blocked
Completion status: complete | blocked
Status: complete | blocked
```

## Forbidden

- Writing an unrelated final-verifier failure into a family `REVIEW.md`.
- Changing a compliant family review merely because the outer command failed elsewhere.
- Routing to review or leaving a review-owned defect unresolved.
- Fixing production code or rewriting earlier artifacts.
- Reviewing only the latest change.
- Depending on Git or PR state.
- Marking compliant without independently checking controlled-state rejected intent when mutable renderer state is involved.
- Accepting a legacy-to-canonical state mapping because names or boolean types match without independently checking semantic meaning and boundary combinations.
- Treating a capability/configuration flag as current rendered state without explicit architecture evidence and scenario proof.
- Marking compliant with obsolete browser-proof placement/registry ownership relative to the current testing migration state.
- Accepting a one-family global test bootstrap polyfill without explicit shared ownership.
- Marking compliant with invalidating revision mismatches or unresolved family work.
- Treating metadata-only design refresh as invalidation.
- Using listed risks for incomplete work.
- Preserving a stale cross-family route after durable origin resume.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Claiming a shared runner/worktree root cause without direct evidence.
- Running or claiming final workflow verification.
