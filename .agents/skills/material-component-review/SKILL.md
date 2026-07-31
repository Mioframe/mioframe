---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family against official design, accepted architecture, resulting code, consumers, proof, and verification, and write REVIEW.md without fixing code.'
---

# Material component review

Perform the final independent review of one Material family.

This stage reviews the complete resulting family and all migrated consumers. It does not implement fixes. Findings route back to the earliest stage that owns the defect.

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

Review the current readable family files, consumers, tests, records, and verification evidence.

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
6. Check faithful proof ownership and required verification evidence.
7. Check for a concrete operator-reported visual/motion defect. Absence of a report is not a blocker and requires no positive acknowledgement; a concrete report is a real finding.

Automated checks prove only their covered contracts; they are not architecture or Material approval. They also cannot establish subjective visual/motion correctness — do not claim they did.

## Finding ownership

Route each finding to one stage:

- omitted, stale, or incorrect official fact/token/spec → `material-component-design`;
- unresolved or incorrect demand, API, ownership, dependency, renderer, token, proof, or migration plan → `material-component-architecture`;
- code, component-owned proof, mapping, token declaration, defect, or export mismatch → `material-component-implementation`;
- consumer, legacy-removal, product-scenario, or final-verification gap → `material-component-migration`;
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
## Proof and verification
## Blockers
## Major issues
## Minor issues
## Accepted risks
## Items not required
## Required return stage
## Completion status
```

Use exact evidence and consolidate related findings.

## Completion gate

A family is review-complete only when:

- every previous stage artifact is current and internally consistent;
- selected scenarios and failure paths are complete;
- ownership and dependency direction are correct;
- public contracts are stable and official;
- shared UI blast radius is closed;
- required automated proof is complete;
- no replaced logic or false claim remains;
- required verification passes;
- no concrete operator-reported visual/motion defect remains unresolved. Absence of an operator report satisfies this condition.

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
Completion status: complete | blocked
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

## Forbidden

- Fixing code or rewriting earlier artifacts during review.
- Treating screenshots or automated checks as Material correctness by themselves, or as proof of subjective visual/motion quality.
- Reviewing only the latest changed files instead of the full resulting family.
- Marking the family compliant while ownership, API, dependencies, shared UI impact, required proof, or a concrete operator-reported visual/motion defect is unresolved.
- Blocking or withholding a compliant verdict merely because the operator has not explicitly confirmed acceptance.
- Fabricating a blocker, or marking operator status `defect-reported`, without an actual reported defect.
- Creating a new implementation path inside the review stage.
