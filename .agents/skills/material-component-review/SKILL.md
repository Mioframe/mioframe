---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration are complete to independently review one Material family, or to classify exact PR CI failure output supplied by the architect.'
---

# Material component review

Perform independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns family-compliance judgment and exact Material correction routing. It does not implement production fixes, fetch GitHub checks, own PR CI, or decide merge readiness.

## Modes

### Full independent review

Run fresh after current-invocation migration completes or after a correction route reaches review again.

Review the complete current family and all consumers, not only the latest change.

### PR CI failure routing

When the architect supplies exact failed PR CI command/check output, classify it as:

- `material-owned` — an exact Material family and earliest stage can correct it;
- `external-workspace-blocker` — no Material family stage owns it.

An external failure must not change a compliant family REVIEW.

## Input gate

Require successful current DESIGN, ARCHITECTURE, IMPLEMENTATION, and MIGRATION.

Read current artifacts, code, consumers, tests, renderer evidence, and current testing policy directly. For every selected renderer-backed element or composition, independently read the documentation shipped with the exact lockfile-resolved `@m3e/web` version, including public README/API JSDoc/examples where available, and inspect the installed public artifacts. Do not accept an architecture `direct` classification merely because implementation matches it.

Do not require timestamps, hashes, artifact revision identities, or historical freshness proofs.

If an upstream artifact is invalid, record the exact earlier-stage or other-family route and block completion.

## Worker boundary

Run in a fresh isolated context independent from workers that authored or corrected architecture, implementation, or migration.

Do not depend on Git, PR, commit, branch, diff, or external-check state during full review. In CI-routing mode, use only the exact CI evidence supplied by the architect; do not fetch GitHub state yourself.

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

`Final workflow verification readiness` means ready for architect-owned PR creation and exact-head GitHub CI. It does not mean a local broad verifier command has run.

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
3. Independently validate every selected renderer mapping and composition against exact-version renderer documentation/examples and installed public artifacts. For slots and child-content roles, verify any required or assumed child element, inherited/custom-property handoff, geometry, accessibility, and interaction semantics. A slot name, exported type, successful render, or stable screenshot is not sufficient evidence of a `direct` mapping.
4. For controlled renderer state, independently trace installed lifecycle and prove one source of truth, accepted intent, rejected intent, and no surviving optimistic drift.
5. Compare implementation with every architecture decision and forbidden approach.
6. Review consumers, no-consumer case, legacy removal, and every legacy-to-canonical semantic translation. Similar names/types are not evidence of equivalence.
7. Verify translated-state proof covers boundary combinations and defaults/fallbacks where applicable.
8. Inspect public API, state precedence, tokens, renderer boundaries, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
9. When official Material defines fixed geometry for the selected scenario or rendered part, verify browser proof asserts the numeric public observable geometry. Do not accept a visual baseline as the sole oracle for dimensions.
10. Verify canonical Storybook/browser/visual fixtures use production-valid content for each selected semantic role. Placeholder text is not valid visual proof for an icon role when renderer composition controls icon sizing or other selected behavior.
11. For presentation composition, verify child suppression and positive input handoff to the actual action owner.
12. Verify proof ownership/placement against current testing migration state.
13. Inspect test-environment changes for blast radius.
14. Verify impact metadata and stage-scoped focused checks.
15. Check actual operator-reported visual/motion defects.
16. Consolidate each underlying problem once and assign exact ownership.

Automated checks prove only covered contracts. Absence of operator visual feedback is not a blocker. PR CI does not replace missing contract proof or architecture review.

## Finding ownership

Route:

- missing/incorrect official fact → design;
- incorrect demand, API, state ownership, dependency, renderer/token strategy, proof ownership, renderer composition classification, or migration plan → architecture;
- component code, token, mapping, export, local test setup, fixture, or component-owned proof defect → implementation;
- consumer, scenario, legacy-removal, or migration-proof defect → migration.

A wrong architecture semantic mapping routes to architecture; violation of a correct mapping routes to migration. A dependency defect routes to the dependency family.

Do not fix production findings during review.

## Verdict semantics

`compliant` requires complete mandatory work/proof, no findings or risks, route `none/none`, completion `complete`, readiness `ready`, and no unresolved reported defect.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing checks/proof, unresolved findings, incomplete migration, unknown consumers, or deferred required work. Blockers/major/minor issues must be `none`.

`blocked` with route assigns the exact earlier stage or other family. Review cannot route to review.

A genuine unresolvable family blocker uses route `none/none` and readiness/completion `blocked`.

Review-owned formatting, synthesis, classification, or routing defects are fixed in the current worker.

## PR CI failure routing

Given exact CI evidence supplied by the architect:

1. identify the failed contract;
2. determine whether an exact Material family and earliest stage own it;
3. do not infer ownership from the family that happened to trigger the PR;
4. route Material-owned failures to that exact stage;
5. leave unrelated compliant family reviews unchanged.

A Material-owned CI failure may update only the owning family REVIEW to `blocked` with the exact correction route and concise CI evidence when that review must represent the now-known family defect.

For an external workspace blocker, do not edit any family REVIEW and return:

```text
MATERIAL PR CI ROUTING RESULT
Classification: external-workspace-blocker
Failed CI check/command: <exact check or command>
Failed contract: <exact external contract>
Evidence: <concise exact output>
Required return family: none
Required return stage: none
Family reviews changed: none
Status: blocked
```

After a Material-owned correction, run the smallest relevant focused local verification, hand back to the architect, and let GitHub CI rerun the authoritative exact-head gate. Do not require a broad local CI duplicate.

## Completion

Full review succeeds only when the current family is complete, required headings exist, the verdict represents current repository behavior, and no unresolved family route/finding remains.

A successful review means ready for PR/CI handoff. It does not claim that CI passed and does not claim merge readiness.

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
PR/CI readiness: ready | blocked
Status: complete | blocked
```

## Forbidden

- Writing unrelated CI/verifier failure into a family REVIEW.
- Routing to review or leaving a review-owned defect unresolved.
- Fixing production code or rewriting earlier artifacts.
- Reviewing only the latest change.
- Depending on Git or PR state during full review.
- Fetching GitHub CI directly from the coding-agent review worker.
- Accepting a renderer composition as `direct` without independently checking exact-version renderer documentation/examples and installed public artifact behavior.
- Accepting controlled state without independently checking rejected intent.
- Accepting legacy-to-canonical mapping because names/types match.
- Accepting obsolete proof ownership relative to current testing architecture.
- Accepting a visual baseline as the sole proof of selected fixed Material geometry.
- Using listed risks for incomplete work.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Running or claiming the authoritative PR CI gate.
- Adding timestamp/hash/revision bookkeeping as workflow correctness state.
