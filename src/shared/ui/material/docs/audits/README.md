# Material component audits

This directory stores the latest completed independent technical review for each Material component family.

## Ownership

- `src/shared/ui/material/docs/audits/<family-slug>.md` owns the latest independent review of one resolved family.
- The family `README.md` owns the approved implementation contract.
- `src/shared/ui/material/docs/ui-library-inventory.md` owns classification, priority, dependencies, queue state, and terminal outcome.
- `src/shared/ui/material/docs/library-roadmap.md` owns the current milestone, blocker, and next action.
- An audit records evidence, findings, and merge recommendation; it does not silently change the approved contract, roadmap, inventory, or production implementation.

## Naming

Use one stable kebab-case filename per resolved owning family:

```text
button.md
switch.md
navigation-rail.md
```

Do not create dated copies or one file per run. A later review replaces the same family audit; Git history preserves prior results.

When a requested child component belongs to a larger official family, use the resolved owning family slug rather than the user-entered spelling.

## Required metadata

Every audit records:

- requested and resolved family;
- review date;
- implementation ref and commit;
- approved family contract path and readiness;
- current and canonical owners;
- official source pages and snapshots;
- supported surface and required consumer scenarios;
- technical review result;
- operator visual status;
- merge recommendation.

## Required sections

Each audit contains:

1. approved contract and implementation scope;
2. official evidence;
3. supported surface and required scenarios;
4. blockers;
5. major issues;
6. minor issues;
7. evidence gaps;
8. verified compliant areas;
9. operator visual status;
10. merge recommendation and next action.

Use explicit `none` values instead of omitting empty sections.

Every finding contains:

```text
Severity: blocker | major | minor
Area:
Approved contract or official requirement:
Implementation evidence:
Observed mismatch:
Required correction:
Verification required:
```

Do not record speculative risks as findings.

## Lifecycle

- `material-component-review` creates or replaces the family audit in its review branch.
- The reviewer must not be the context that implemented the change.
- The review checks the complete resulting PR, not only the latest correction patch.
- The review is incomplete until the audit file is written and its path is reported.
- The family audit is the only repository file changed by a review-only run.
- Production fixes begin through a separate architect-approved implementation task.
- After fixes, rerun `material-component-review` to replace the audit with a current result.

An audit becomes stale when the implementation commit or approved contract it reviewed changes. Stale audits remain historical evidence and must not be reported as the current merge result.

## Merge recommendation

Use exactly one:

- `can merge`;
- `can merge with listed risks`;
- `should not merge until blockers are fixed`;
- `not enough information to decide`.

Required operator visual acceptance must be recorded before `can merge` when the change has a new visible contract.
