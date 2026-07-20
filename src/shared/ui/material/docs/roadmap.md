# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-20

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `blocked`

Blocker: PR #157 demonstrated that a single implementation context can still confirm legacy assumptions, hide source conflicts, choose a lower-priority correction, and review its own result. PR #155 must land the evidence-gated workflow with responsibility isolation, canonical-target lock, complete current-state coverage, independent contract review before production, and independent final review.

## Next action

After the updated PR #155 workflow is available to the Button branch, start a fresh orchestrator session and run:

```text
material-component Button
```

The orchestrator must:

1. delegate canonical target research to a read-only isolated context that does not inspect the current Button implementation or proof;
2. lock the target and source-decision matrix;
3. delegate a complete current-state audit to a different read-only context;
4. synthesize the alignment and dependency maps without production edits;
5. run an independent `contract-gate` review;
6. proceed with only the highest-priority approved correction unit;
7. run a different independent `final-gate` review after implementation;
8. preserve valid repository progress and correct only owners proven wrong.

Claude Code may use the project agents under `.claude/agents/`. Codex may use separate agent threads or isolated worktrees. If delegation is unavailable, use fresh isolated sessions and keep every gate.

The calibration fails as a workflow defect if the agent:

- reads the current component implementation before the target is locked;
- hides a conflict between prose, diagrams, specs, accessibility guidance, or tokens;
- applies Android, iOS, or Web guidance to another platform without an explicit decision;
- omits API, propagation, accessibility, DOM, state, token, motion, extension, dependency, consumer, or proof concerns;
- treats passing tests, snapshots, consumers, or token names as authority;
- misclassifies a legacy Material component as generic foundation;
- selects an easier lower-priority improvement around a blocking source, ownership, semantics, or dependency gap;
- places browser behavior assertions in visual proof;
- edits production before the contract gate passes;
- lets the implementation context approve its own contract or patch;
- leaves workflow state or roadmap inconsistent with the actual stage;
- rewrites the whole family when smaller owner corrections are sufficient;
- reports the family aligned while required gaps remain.

A fresh session resets reasoning, not repository progress. Do not reset PR #157 by default. Preserve only independently confirmed owners and completed valid correction units.

Do not select a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when active family, family alignment status, blocker, or one next action changes.
