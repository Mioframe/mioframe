---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration are complete to independently review one Material family, or to classify final-verifier output.'
---

# Material component review

Perform independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns family-compliance judgment and exact Material correction routing. It does not implement production fixes or own the outer final verification result.

## Modes

### Full independent review

Run fresh after current-invocation migration completes or after a correction route reaches review again.

Review the complete current family and all consumers, not only the latest change.

### Final-verifier routing

Given exact failed final command/output, classify it as:

- `material-owned` — an exact Material family and earliest stage can correct it;
- `external-workspace-blocker` — no Material family stage owns it.

An external failure must not change a compliant family REVIEW.

## Input gate

Require successful current DESIGN, ARCHITECTURE, IMPLEMENTATION, and MIGRATION.

Read current artifacts, code, consumers, tests, renderer evidence, and current testing policy directly. Do not require timestamps, hashes, artifact revision identities, or historical freshness proofs.

If an upstream artifact is invalid, record the exact earlier-stage or other-family route and block completion.

## Worker boundary

Run in a fresh isolated context independent from workers that authored or corrected architecture, implementation, or migration.

Do not depend on Git, PR, commit, branch, diff, or external-check state.

Always read current `src/shared/ui/material/docs/component-adapter.md` and `docs/testing/migration-plan.md`.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/REVIEW.md
```

Control fields:

```text
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

Legacy revision/timestamp fields in an existing REVIEW are ignored and removed when this stage rewrites it.

Do not create new artifact timestamps, hashes, counters, or upstream revision-reference fields.

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

## Review order

1. Validate complete official design and source lifecycle.
2. Compare architecture with design, scenarios, ownership, dependencies, renderer revision, current adapter contract, and simplest viable alternative.
3. For controlled renderer state, independently trace installed lifecycle and prove one source of truth, accepted intent, rejected intent, and no surviving optimistic drift.
4. Compare implementation with every architecture decision and forbidden approach.
5. Review consumers, no-consumer case, legacy removal, and every legacy-to-canonical semantic translation. Similar names/types are not evidence of equivalence.
6. Verify translated-state proof covers boundary combinations and defaults/fallbacks where applicable.
7. Inspect public API, state precedence, tokens, renderer boundaries, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
8. For presentation composition, verify child suppression and positive input handoff to the actual action owner.
9. Verify proof ownership/placement against current testing migration state.
10. Inspect test-environment changes for blast radius.
11. Verify impact metadata and stage-scoped checks.
12. Check actual operator-reported visual/motion defects.
13. Consolidate each underlying problem once and assign exact ownership.

Automated checks prove only covered contracts. Absence of operator visual feedback is not a blocker.

## Finding ownership

Route:

- missing/incorrect official fact → design;
- incorrect demand, API, state ownership, dependency, renderer/token strategy, proof ownership, or migration plan → architecture;
- component code, token, mapping, export, local test setup, or component-owned proof defect → implementation;
- consumer, scenario, legacy-removal, or migration-proof defect → migration.

A wrong architecture semantic mapping routes to architecture; violation of a correct mapping routes to migration. A dependency defect routes to the dependency family.

Do not fix production findings during review.

## Verdict semantics

`compliant` requires complete mandatory work/proof, no findings or risks, route `none/none`, completion `complete`, readiness `ready`, and no unresolved reported defect.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing checks/proof, unresolved findings, incomplete migration, unknown consumers, or deferred required work. Blockers/major/minor issues must be `none`.

`blocked` with route assigns the exact earlier stage or other family. Review cannot route to review.

A genuine unresolvable family blocker uses route `none/none` and readiness/completion `blocked`.

Review-owned formatting, synthesis, classification, or routing defects are fixed in the current worker.

## Final-verifier routing

A Material-owned failure updates only the owning family REVIEW to blocked with the exact correction route and concise evidence.

For an external workspace blocker, do not edit any family REVIEW and return:

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

## Completion

Full review succeeds only when the current family is complete, required headings exist, the verdict represents current repository behavior, and no unresolved family route/finding remains.

A successful review means ready for outer final verification. It does not claim that command passed.

## Report

```text
MATERIAL REVIEW RESULT
Input component:
Canonical family:
Review mode: full
REVIEW.md path:
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

- Writing unrelated verifier failure into a family REVIEW.
- Routing to review or leaving a review-owned defect unresolved.
- Fixing production code or rewriting earlier artifacts.
- Reviewing only the latest change.
- Depending on Git or PR state.
- Accepting controlled state without independently checking rejected intent.
- Accepting legacy-to-canonical mapping because names/types match.
- Accepting obsolete proof ownership relative to current testing architecture.
- Using listed risks for incomplete work.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Running or claiming final workflow verification.
- Adding timestamp/hash/revision bookkeeping as workflow correctness state.
