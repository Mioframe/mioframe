---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or completing one official Material component family. A family-only invocation is full-family work: autonomously validates current ownership, closes required prerequisites, implements successive bounded corrections, and stops only when aligned or exactly blocked.'
---

# Material component orchestrator

This is the sole implementation entry point for one official Material component family. The operator supplies the family name or an explicit bounded objective. The agent owns technical discovery, architecture, decomposition, prerequisites, implementation, proof, documentation, and continuation inside that Material scope.

Follow `src/shared/ui/material/docs/component-development.md`, `src/shared/ui/material/docs/architecture.md`, `src/shared/ui/material/docs/tokens.md`, and applicable nested `AGENTS.md` files.

Git operations, branch management, commits, pushes, pull requests, and merge decisions are outside this workflow.

## Invocation scope

Resolve scope from the current invocation, not from persisted README or roadmap text:

- a family name only, such as `material-component Button`, means `full-family`;
- `focused-correction` is allowed only when the operator explicitly names a bounded objective;
- a prerequisite call from another family is `prerequisite-contract` and ends only when that exact public contract is ready or externally blocked.

For `full-family`, `converging` is an internal state, never a terminal result. The only terminal results are:

- `aligned` after complete dependency closure, family review, operator evidence when required, and final verification;
- `blocked` by an exact external condition allowed under Stop conditions.

A correction unit is a bounded implementation/review unit, not an invocation boundary. Do not stop merely because one unit passed or a later unit belongs to foundation or another Material family.

## Resume and canonicalization preflight

Persisted family state is reusable evidence, not authority. Before selecting a correction, reconstruct current truth from code:

```text
CANONICALIZATION PREFLIGHT
Family:
Invocation scope: full-family | focused-correction | prerequisite-contract
Candidate canonical owner:
Public export present: yes | no
Migrated consumers: none | <bounded summary>
Legacy owner state: active | forwarding-only | removed | absent
Direct imports and injected dependencies:
Required CSS/token dependencies:
Legacy Material dependencies:
Dependency closure: closed | blocked
Persisted workflow state: valid | stale | conflicting
```

Always revalidate canonical ownership from current imports, public exports, dependencies, and consumers. Previously accepted behavior or proof does not validate a previously accepted architecture decision.

When persisted state conflicts with code or current workflow rules:

- preserve independently confirmed target and behavior facts;
- discard stale objective, next action, scope, alignment, review-history, or dependency conclusions;
- replace the README workflow block with current truth before continuing.

README or roadmap text cannot narrow a `full-family` invocation, classify a used dependency as outside orchestration, or turn an internal prerequisite into a future operator task.

## One bounded orientation

After preflight, build one concise orientation map:

```text
FAMILY ORIENTATION
Family:
Invocation scope:
Mode: new-component | align-existing | focused-correction
Candidate canonical owner:
Legacy or missing owners:
Public entry points:
Family files:
Direct dependencies:
Representative consumers:
Proof owners:
Locked target claims:
Known unresolved concerns:
```

Read applicable instructions and Material documents, the owning README, current implementation, public exports, direct dependencies, representative consumers, and applicable proof. Expand repository search only for a named dependency, compatibility path, or ownership question.

Do not rebuild full orientation after each correction. Refresh only invalidated facts.

## Concern plan

Classify each concern as required or not required with a reason:

- canonical target claims requiring research;
- semantics/API/native/accessibility/state/consumer lane;
- token graph and ownership lane;
- Web DOM/CSS/layout/motion/browser lane;
- complete dependency closure for the supported surface;
- exact foundation prerequisite;
- exact official component-family prerequisite;
- adoption and obsolete-owner cleanup.

`full-family` and `new-component` require every applicable lane. `focused-correction` runs only affected lanes and direct dependencies, except canonicalization triggers below always widen dependency scope.

## Isolated specialist work

Use isolated read-only contexts when supported and the work would otherwise flood the orchestrator with source pages, repository searches, browser evidence, or review details. Otherwise execute the same portable skill sequentially with the same bounded contract.

Read-only skills:

- `material-canonical-target`;
- `material-semantics-audit`;
- `material-token-audit`;
- `material-web-audit`;
- `material-component-review`;
- `material-family-review`.

Specialists receive exact concerns, scenarios, paths, locked claims, and structured result. They do not edit, delegate, select the next correction, update workflow state, or absorb another concern lane.

Contract synthesis, correction selection, implementation, adoption, state updates, prerequisite advancement, and continuation stay in this orchestrator context.

## Dependency closure

Inventory every dependency required by the supported surface and classify it as:

- `canonical-foundation`;
- `canonical-family`;
- `temporary-legacy-material`;
- `project-extension`;
- `generic-foundation`.

A dependency used by this family remains inside this orchestration even when another owner must implement it. Owner scope and orchestration scope are different.

Closure is blocked by required temporary legacy Material ownership, missing or unresolved reference/system tokens, unowned shared Material behavior, known-defective contracts, private cross-family imports, hidden required fallbacks, dependency cycles, or parallel active owners.

When closure is blocked:

- do not select a lower-priority local correction for the same supported surface;
- invoke the smallest complete `material-foundation` prerequisite for a family-agnostic contract;
- invoke or resume the owning `material-component` for another official Material family until the exact public contract is ready;
- return to the calling family automatically after the prerequisite;
- stop only for an exact external blocker or dependency cycle.

An internal prerequisite is work to execute, not a terminal blocker and not a future independent track for the operator.

Track the active prerequisite stack and stop on a cycle with the exact chain.

## Canonicalization triggers

The following automatically widen the current correction and its independent review to complete dependency closure for the supported surface:

- creating or preserving a candidate canonical owner;
- creating or changing the Material root export;
- migrating any consumer to the candidate owner;
- deleting or forwarding the legacy owner;
- claiming canonical, aligned, migrated, or adoption-complete status.

While dependency closure is blocked, it is forbidden to:

- introduce or retain the candidate in the Material root public API as ready;
- migrate additional consumers;
- remove the only complete legacy owner;
- declare adoption complete;
- treat legacy dependencies as out of scope.

If these actions already exist when resuming, the highest-priority work is to close dependencies or safely roll back premature canonicalization, not to continue a lower-priority local backlog.

## Convergence loop

```text
resolve invocation scope
→ canonicalization preflight
→ bounded orientation
→ select affected concern lanes
→ obtain only missing or invalidated evidence
→ synthesize highest-priority complete correction contract
→ independent contract review
→ complete exact prerequisite when required
→ implement one bounded correction unit
→ conditional adoption and obsolete-owner cleanup
→ focused proof
→ independent correction-final review
→ update current family state
→ select next required correction without restarting orientation
→ repeat while any required gap or internal prerequisite remains
→ independent material-family-review
→ final verification
```

After an accepted correction:

1. update only affected facts;
2. re-run the canonicalization/dependency preflight when ownership, exports, imports, consumers, or prerequisites changed;
3. classify remaining required concerns;
4. choose the highest-priority complete next unit;
5. continue in the same invocation.

Do not end while a required gap, internal prerequisite, failed boundary guard, or repairable verification failure remains.

## Evidence reuse and review budget

Reuse locked claims until source, implementation, proof, reviewer, platform, supported-surface, or operator evidence contradicts them. A new session or correction unit does not invalidate accepted evidence.

Implementation does not rerun specialist audits without concrete contradictory evidence.

Each correction contract and correction-final gate allows one initial review and at most one substantive re-review. A second failure stops that correction path with consolidated blockers. If the same ownership or architecture defect survives two correction rounds, reopen architecture instead of adding another workaround.

## Workflow state

Keep one compact current-state block in the owning README:

```text
MATERIAL WORKFLOW STATE
Family:
Invocation scope:
Mode:
Current objective:
Current stage:
Canonical target status:
Candidate canonical owner:
Dependency closure: closed | blocked
Prerequisite stack: none | <ordered stack>
Current correction unit: none | <exact unit>
Implementation status:
Correction review status:
Family review status:
Operator visual status:
Family alignment status: aligned | converging | blocked
Remaining required gaps: none | <exact gaps>
Next action:
Blocker: none | <external blocker only>
```

Store current truth only. Remove review history, shell transcripts, search output, route inventories, stage diaries, scorecards, superseded objectives, and future-pass narratives.

## Completion and stop conditions

`full-family` completes only when:

- all required concerns are compliant or validly unsupported;
- complete dependency closure is closed;
- required foundation and official-family prerequisites are ready;
- one canonical owner and intended public contract remain;
- consumers use ready contracts;
- obsolete ownership is removed or forwarding-only;
- required unit, browser, consumer, visual, boundary, and architecture proof passes;
- operator comparison is accepted when required;
- `material-family-review` returns `complete`;
- final `pnpm verify` passes.

Stop only for an exact unresolved official-source conflict, product decision, platform applicability question, unsafe dependency cycle, unavailable required browser/visual evidence, repeated independent review failure, operator rejection, or verification failure that cannot be corrected within the family or its exact prerequisites.

Do not stop for a known next correction, an internal prerequisite, ownership outside the family, stale persisted state, or a repairable red check.

## Result

```text
MATERIAL COMPONENT RESULT
Family:
Invocation scope:
Mode:
Status: aligned | blocked
Canonical owner:
Supported surface:
Completed correction units:
Dependency closure:
Completed prerequisites:
Family review:
Operator visual status:
Verification:
Remaining required gaps: none | <exact gaps>
Blocker: none | <exact external blocker>
Next action: none | <exact action required to unblock>
```
