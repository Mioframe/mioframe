---
name: material-pr-review
description: 'Use for an independent read-only merge-readiness review of a complete PR that creates, migrates, or changes a Material family. Reviews base-to-head ownership, dependency closure, all PR-owned unresolved concerns, adoption, proof, verification, and architectural consistency without repeating the full canonical research process.'
---

# Material PR review

Review the complete PR against its base after correction-level final review. This role answers merge readiness; it does not approve only the latest correction unit.

## Inputs

Receive:

- PR base and head refs;
- complete base-to-head changed-file list and diff/patch evidence;
- family, PR objective, required scenarios, and non-goals;
- locked family contract and accepted source decisions;
- complete required-dependency inventory and closure result;
- prerequisite results;
- correction-review result;
- current resulting files for every changed owner and representative affected consumer;
- operator evidence and verification result;
- applicable repository instructions.

Return `not enough information to decide` when the changed-file list, diff/patch evidence, or dependency inventory is incomplete. Do not obtain broader shell access merely to reconstruct missing handoff data.

## Responsibility

Inspect the complete base-to-head change and resulting repository state:

- all owners added, moved, replaced, or deleted by the PR;
- public API, semantics, DOM, token, style, motion, extension, and dependency concerns owned by changed or newly adopted surface;
- every direct dependency required by the resulting supported surface and its final owner/readiness;
- completed foundation or canonical-family prerequisites;
- all consumers migrated by the PR and any parallel owner or compatibility residue;
- every unresolved or misaligned concern inside PR-owned files or public contract;
- proof-lane correctness and required browser/visual/operator evidence;
- focused verification coverage, including architecture guards triggered by the changed paths;
- README, roadmap, PR title/body, and actual implementation consistency.

A defect is PR-owned when it exists in the base-to-head resulting change, even if it predates the latest correction round or was already present earlier on the feature branch. Do not label such a defect `pre-existing` or `out of scope` for merge readiness.

Do not re-derive accepted official target claims unless the PR, code, or new evidence contradicts them. Spot-check changed, high-risk, disputed, or generalized claims only.

## Dependency closure

A PR that creates, exports, adopts, or migrates a canonical Material component owner must finish with no required dependency on:

- temporary legacy Material owners;
- missing/unowned reference or system token groups;
- known-defective dependency contracts;
- family-private deep imports;
- hidden required fallbacks;
- parallel active implementations.

Required cross-family family-agnostic contracts must have ready canonical foundation owners. Dependencies on other official component families must use ready public family contracts; they are not foundation. A legacy compatibility entry point may remain only as a forwarding path to the canonical owner.

## Merge rules

Do not approve when:

- a migrated public owner remains `misaligned` or `unresolved` for a required scenario;
- dependency closure is open for any supported or adopted scenario;
- a required foundation or canonical-family prerequisite is missing, incomplete, or defective;
- a canonical component still uses a required temporary legacy Material owner;
- a known defect is deferred inside PR-owned surface;
- token or other architecture guards applicable to changed paths are not run or do not pass;
- browser evidence is missing for changed observable behavior;
- the correction reviewer assessed only a bounded unit and full PR risks remain;
- ownership, dependency direction, public contract, cleanup, or verification is incomplete;
- documentation records process history instead of current truth.

## Result

Return one verdict:

- `can merge`;
- `can merge with listed risks`;
- `should not merge until blockers are fixed`;
- `not enough information to decide`.

```text
MATERIAL PR REVIEW
PR:
Family:
Verdict:
Diff evidence: complete | incomplete
Dependency closure: closed | blocked | incomplete
Prerequisite result:
Blockers: <consolidated, maximum 10>
Major issues: <consolidated, maximum 10>
Minor issues:
PR-owned unresolved concerns:
Adoption/cleanup result:
Verification result:
Documentation/metadata result:
Required next action:
```

## Forbidden

- repository edits, delegation, or correction-stage invocation;
- approving only the latest correction unit;
- treating feature-branch history as the PR base;
- broad re-research of accepted target claims without contradictory evidence;
- requesting shell/write tools instead of blocking on incomplete handoff evidence;
- approving canonical ownership/adoption with required temporary legacy Material dependencies;
- durable review-history documents, route ledgers, or scorecards;
- merge approval based only on green CI.
