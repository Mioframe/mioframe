---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or completing one official Material component family. Given only the family name, autonomously researches the canonical target, audits current ownership and implementation, closes prerequisites, implements successive bounded corrections, verifies the family, and stops only when the requested family scope is complete or exactly blocked.'
---

# Material component orchestrator

This is the sole implementation entry point for one official Material component family. The operator supplies only the family name or an explicit bounded objective. The agent owns all technical discovery, architecture, decomposition, implementation, proof, documentation, and continuation decisions inside that Material scope.

Follow `src/shared/ui/material/docs/component-development.md`, `src/shared/ui/material/docs/architecture.md`, `src/shared/ui/material/docs/tokens.md`, and the applicable nested `AGENTS.md` files.

Git operations, branch management, commits, pushes, pull requests, and merge decisions are outside this workflow.

## Start or resume

Determine from the repository:

- canonical family name and current owner or absence;
- mode: `new-component`, `align-existing`, or `focused-correction`;
- required user and consumer scenarios;
- supported and explicitly unsupported surface;
- current family workflow state and reusable locked evidence;
- current and intended public entry points;
- direct foundation, component-family, generic, and project-extension dependencies;
- applicable proof and operator-visible comparison requirements.

A family name is sufficient input. Do not ask the operator to define variants, API, files, dependencies, tests, or expected defects when official sources and repository evidence can resolve them.

## One bounded orientation

Before detailed research, build one concise orientation map:

```text
FAMILY ORIENTATION
Family:
Mode:
Canonical owner:
Legacy or missing owners:
Public entry points:
Family files:
Direct dependencies:
Representative consumers:
Proof owners:
Locked target claims:
Known unresolved concerns:
```

Read in this order:

1. applicable `AGENTS.md` files;
2. task-relevant Material architecture, source, token, workflow, and roadmap documents;
3. the owning family README when present;
4. current implementation, public exports, and direct dependencies;
5. representative consumers and applicable proof;
6. broader repository search only for a named dependency, compatibility path, or ownership question.

Do not repeat full orientation after each correction. Refresh only facts invalidated by changed code or new evidence.

## Concern plan

Classify each concern as required or not required with a reason:

- canonical target claims requiring research;
- semantics/API/native/accessibility/state/consumer lane;
- token graph and ownership lane;
- Web DOM/CSS/layout/motion/browser lane;
- direct dependency closure;
- exact foundation prerequisite;
- exact official component-family prerequisite;
- adoption and obsolete-owner cleanup.

New families and complete family alignment normally require all applicable lanes. A focused correction invokes only affected lanes and direct dependencies.

## Isolated specialist work

Use isolated read-only agent contexts when the runtime supports them and the work would otherwise flood the orchestrator context with source pages, repository search results, browser evidence, or review details. Otherwise execute the same portable skill sequentially with the same bounded input and output contract.

Available read-only skills:

- `material-canonical-target` — delegated official target claims only;
- `material-semantics-audit` — API, semantics, accessibility, state, extensions, consumers, and dependencies;
- `material-token-audit` — token taxonomy, ownership, graph, and rendered token proof;
- `material-web-audit` — DOM, CSS, layout, motion, lifecycle, and browser proof;
- `material-component-review` — independent review of one proposed or implemented correction;
- `material-family-review` — independent final review of the complete resulting family state.

Each specialist receives only the exact concern set, required scenarios, bounded paths, applicable locked claims, and required structured result. Specialists do not edit, delegate, choose the next correction, update roadmap state, or absorb another concern lane.

Contract synthesis, correction selection, implementation, adoption, state updates, and workflow advancement stay in this orchestrator context because those phases share substantial state.

## Dependency closure

Inventory every dependency required by the supported surface. Classify it as:

- `canonical-foundation`;
- `canonical-family`;
- `temporary-legacy-material`;
- `project-extension`;
- `generic-foundation`.

Dependency closure is blocked by a required temporary legacy Material owner, missing or unresolved reference/system token group, unowned shared Material behavior, known-defective dependency, family-private deep import, hidden required fallback, dependency cycle, or parallel active owner.

For a family-agnostic cross-family contract, run the smallest complete `material-foundation` prerequisite. For another official Material component, run or resume that family's `material-component` workflow only until the exact required public contract is ready, then return to the calling family. Another component family is never foundation.

Track the active prerequisite stack. Stop on a dependency cycle and report the exact cycle instead of recursively expanding work.

## Convergence loop

```text
resume or initialize family state
→ bounded orientation
→ select affected concern lanes
→ obtain only missing or invalidated target/audit evidence
→ synthesize the highest-priority complete correction contract
→ independent contract review
→ complete exact prerequisite when required
→ implement one bounded correction unit
→ conditional adoption and obsolete-owner cleanup
→ focused proof
→ independent correction-final review
→ update current family state
→ select next required correction without restarting orientation
→ when no required gaps remain, independent material-family-review
→ final verification
```

After an accepted correction:

1. update only affected orientation and durable contract facts;
2. classify remaining required concerns;
3. choose the highest-priority complete next correction;
4. continue in the same workflow until complete or exactly blocked.

Do not end after one correction while known required gaps remain.

## Evidence reuse and invalidation

Reuse a locked claim until one of these occurs:

- the supported surface changes;
- newer or more applicable official evidence contradicts it;
- implementation or proof contradicts the recorded claim;
- a new platform scenario changes applicability;
- an independent reviewer reports a concrete contradiction;
- operator visual comparison rejects the result.

A new session, a new correction unit, mechanical documentation edits, or an unrelated concern change do not invalidate accepted evidence.

Implementation must execute locked concern contracts and proof lanes. It must not rerun specialist audits unless new contradictory evidence explicitly reopens that lane.

## Review budget

Each correction contract and correction-final gate allows one initial independent review and at most one substantive re-review. A second failure returns consolidated blockers and stops that correction path.

Mechanical wording, count, or cross-reference fixes do not trigger another full review. If the same ownership or architecture defect survives two correction rounds, reopen the architecture decision instead of adding another workaround.

The final family review runs only when the orchestrator has no known required gap. It may run once and once again after substantive final corrections.

## Workflow state

Keep one compact `MATERIAL WORKFLOW STATE` block in the owning family README. Store current truth only:

- family, mode, objective, and current stage;
- canonical target and selected concern status;
- dependency closure and prerequisite stack;
- current correction unit;
- implementation, correction-review, proof, and operator status;
- family alignment;
- remaining required gaps;
- exact next action or blocker.

Do not store review history, shell transcripts, complete search output, exact route inventories, stage diaries, scorecards, or repeated source narratives.

## Completion

The family is complete only when:

- supported scenarios and non-goals are explicit;
- all required concerns are compliant or explicitly unsupported by a valid decision;
- dependency closure is complete;
- required foundation and official-family prerequisites are ready;
- one canonical owner and intended public contract remain;
- consumers in the requested family scope use ready contracts;
- obsolete replaced ownership is removed or forwarding-only;
- required unit, browser, consumer, visual, and architecture proof passes;
- operator-visible comparison is accepted when required;
- independent `material-family-review` returns `complete`;
- final repository verification passes.

## Stop conditions

Stop only for an exact unresolved official-source conflict, product decision, platform applicability question, unsafe ownership or dependency cycle, unavailable required browser/visual evidence, repeated independent review failure, operator rejection, or required verification failure.

## Result

Report:

```text
MATERIAL COMPONENT RESULT
Family:
Mode:
Status: complete | blocked
Canonical owner:
Supported surface:
Completed correction units:
Dependency closure:
Completed prerequisites:
Family review:
Operator visual status:
Verification:
Remaining required gaps: none | <exact gaps>
Blocker: none | <exact blocker>
Next action: none | <exact action>
```
