# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-20

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `blocked`

Blocker: PR #157 demonstrated that a single implementation context can confirm legacy assumptions, hide source conflicts, accept an invalid token graph, choose a lower-priority correction, and review its own result. PR #155 must land responsibility isolation, canonical-target lock, complete token/current-state audits, independent contract review before production, and independent final review.

## Next action

After the updated PR #155 workflow is available to the Button branch, start a fresh orchestrator session and run:

```text
material-component Button
```

The orchestrator must delegate an implementation-independent target, lock source and token decisions, obtain a separate complete current-state/token/motion audit, synthesize the alignment map without production edits, pass an independent contract gate, execute only the highest-priority correction unit, and use a different independent final reviewer.

For Button, token ownership and routing are blocking concerns before shape motion or other styling corrections. The contract must classify exact official component tokens, invalid aliases, private routes, the temporary legacy system-token owner, dead spring-token surface, and the shortest route to each rendered property. Static token validation and computed browser proof are both required.

Claude Code may use the project adapters under `.claude/agents/`. Codex may use the same portable role skills in separate agent threads or isolated worktrees. If delegation is unavailable, use fresh isolated sessions and keep every gate.

The calibration fails as a workflow defect if the agent:

- reads the current component implementation before the target is locked;
- hides a conflict between prose, diagrams, specs, accessibility guidance, or tokens;
- applies Android, iOS, or Web guidance to another platform without an explicit decision;
- omits API, propagation, accessibility, DOM, state, token, motion, extension, dependency, consumer, or proof concerns;
- treats passing tests, snapshots, consumers, declarations, or token-looking names as authority;
- accepts invented `--md-*` aliases, wrong token placement, invalid dependency direction, dead component tokens, or private routes as public API;
- builds styling or motion on a token graph that has not passed source, static, and rendered proof;
- misclassifies a legacy Material component as generic foundation;
- selects an easier lower-priority improvement around a blocking source, ownership, semantics, token, or dependency gap;
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
