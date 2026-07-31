---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family against official design, accepted architecture, resulting code, consumers, proof, and stage verification, and write REVIEW.md without fixing code.'
---

# Material component review

Perform the final independent reasoning review of one Material family.

This stage reviews the complete resulting family and all migrated consumers. It does not implement fixes and does not run or own the top-level final workflow verification. Findings route back to the earliest stage that owns the defect.

## Input gate

Require:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
components/<family>/MIGRATION.md
```

Expected statuses:

- design `current`;
- architecture `ready`;
- implementation `complete`;
- migration `complete`.

If an earlier artifact is missing or stale, review may record the blocker but must not reconstruct or replace that stage.

Review the current readable family files, consumers, tests, records, and stage-verification evidence.

## Output

Write exactly one primary artifact:

```text
src/shared/ui/material/components/<family>/REVIEW.md
```

Do not modify production code, tests, stories, snapshots, tokens, architecture, migration records, or official design in this stage.

## Review order

1. Validate complete official source coverage in `DESIGN.md`.
2. Compare `ARCHITECTURE.md` with design, current scenarios, workspace ownership, and the simplest viable alternative.
3. Compare the full implementation with every architecture decision and forbidden approach.
4. Review all current consumers and legacy-removal claims from `MIGRATION.md`.
5. Inspect public API, token names/defaults, state precedence, renderer boundaries, dependencies, accessibility, browser/mobile behavior, motion, visual presentation, defects, and error paths.
6. Check faithful proof ownership and required focused/stage verification evidence.
7. Check for a concrete operator-reported visual/motion defect. Absence of a report is not a blocker and requires no positive acknowledgement; a concrete report is a real finding.

Automated checks prove only their covered contracts; they are not architecture or Material approval. They also cannot establish subjective visual/motion correctness — do not claim they did.

The top-level final workflow verification intentionally runs after this review so that it verifies the exact workspace plus the current `REVIEW.md`. Its not-yet-run state is therefore expected input, not a review finding, blocker, accepted risk, or required return stage.

## Finding ownership

Route each finding to one stage:

- omitted, stale, or incorrect official fact/token/spec → `material-component-design`;
- unresolved or incorrect demand, API, ownership, dependency, renderer, token, proof, or migration plan → `material-component-architecture`;
- code, component-owned proof, mapping, token declaration, defect, or export mismatch → `material-component-implementation`;
- consumer, legacy-removal, product-scenario, impact-metadata, or migration-scoped proof gap → `material-component-migration`;
- a concrete operator-reported visual/motion defect → its owning stage (design, architecture, implementation, or migration, by the same criteria above), not back to the operator.

A subjective visual/motion judgment that no operator has reported a defect against is not a finding and does not route anywhere; automated proof cannot substitute for it, but its absence is not a blocker either.

Do not patch findings during review and do not scatter one underlying issue across multiple stages.

## Review artifact

```text
# <Component> review

Reviewed workspace state: <canonical artifact/code/consumer state inspected>
Review date:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Verdict: compliant | compliant-with-listed-risks | blocked

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
## Required return stage
## Completion status
```

Use exact evidence and consolidate related findings.

Do not list the pending top-level final workflow verification under blockers, issues, accepted risks, items not required, or required return stage. The orchestrator owns and reports it after review.

## Completion gate

A family is review-complete only when:

- every previous stage artifact is current and internally consistent;
- selected scenarios and failure paths are complete;
- ownership and dependency direction are correct;
- public contracts are stable and official;
- shared UI blast radius is closed;
- required automated proof and stage-scoped verification are complete;
- no replaced logic or false claim remains;
- no concrete operator-reported visual/motion defect remains unresolved. Absence of an operator report satisfies this condition.

Review completion means the family is ready for the orchestrator's final workflow verification. It does not claim that command has already passed.

## Report

```text
MATERIAL REVIEW RESULT
Input artifact:
Resolved component/family:
REVIEW.md path:
Artifact statuses:
Operator visual status:
Blockers:
Major issues:
Minor issues:
Required return stage: none | design | architecture | implementation | migration
Review verdict:
Final workflow verification readiness: ready | blocked
Completion status: complete | blocked
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

## Forbidden

- Fixing code or rewriting earlier artifacts during review.
- Treating screenshots or automated checks as Material correctness by themselves, or as proof of subjective visual/motion quality.
- Reviewing only the latest changed files instead of the full resulting family.
- Marking the family compliant while ownership, API, dependencies, shared UI impact, required proof, stage-scoped verification, or a concrete operator-reported visual/motion defect is unresolved.
- Blocking or withholding a compliant verdict merely because the operator has not explicitly confirmed acceptance.
- Fabricating a blocker, or marking operator status `defect-reported`, without an actual reported defect.
- Creating a new implementation path inside the review stage.
- Running or claiming ownership of the top-level final workflow verification.
- Treating the expected not-yet-run top-level final gate as a finding, risk, blocker, or return-stage reason.
