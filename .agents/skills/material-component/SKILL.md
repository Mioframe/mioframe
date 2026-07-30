---
name: material-component
description: 'Use with only a Material component name to resolve and run exactly one next stage in the canonical design → architecture → implementation → migration → review workflow.'
---

# Material component

Accept exactly one required input: the Material component name.

Examples:

```text
Button
MDButton
Loading indicator
MDLoadingIndicator
```

Do not require an implementation brief, mode, file path, renderer mapping, dependency list, or verification command from the operator.

## Read first

- applicable `AGENTS.md` files;
- `src/shared/ui/material/docs/component-workflow.md`;
- stage skills:
  - `material-component-design`;
  - `material-component-architecture`;
  - `material-component-implementation`;
  - `material-component-migration`;
  - `material-component-review`.

## Resolve the family

Normalize the supplied name against official Material names, existing `MD*` exports, family paths, stage artifacts, current implementations, and legacy consumers.

Ask for clarification only when repository and official evidence leave multiple distinct official components unresolved.

## One invocation, one stage

Inspect the canonical family artifacts:

```text
DESIGN.md
ARCHITECTURE.md
IMPLEMENTATION.md
MIGRATION.md
REVIEW.md
```

Select the earliest invalid stage:

1. `DESIGN.md` missing, stale, blocked, incomplete, demand-scoped, or renderer-shaped → `material-component-design`;
2. `ARCHITECTURE.md` missing, stale, blocked, not ready, or not based on the current design → `material-component-architecture`;
3. `IMPLEMENTATION.md` missing, partial, blocked, stale, architecture-deviating, or implementation drift exists → `material-component-implementation`;
4. `MIGRATION.md` missing, partial, blocked, stale, consumers remain, legacy ownership remains, or final verification is unresolved → `material-component-migration`;
5. `REVIEW.md` missing, stale, blocked, behind the current resulting head, or operator review remains unresolved → `material-component-review`;
6. all artifacts and gates current → report complete without speculative changes.

Run exactly the selected stage and stop after its required artifact/report. Do not continue into the next stage in the same invocation, even when the selected stage succeeds.

## Backward routing

Later-stage evidence may invalidate an earlier artifact:

- missing or incorrect official fact → design;
- unresolved API, ownership, dependency, renderer, token, proof, or migration decision → architecture;
- component code, mapping, token, test, story, defect, or export mismatch → implementation;
- consumer, legacy-removal, product-scenario, or final-verification gap → migration;
- manual visual/motion gate only → review/operator.

Route to the earliest owner. Do not patch around an invalid earlier artifact.

## Dependency queue

When the current family depends on another official Material component:

- read the parent `ARCHITECTURE.md` dependency queue;
- pause the parent at the appropriate gate;
- select the dependency’s earliest missing stage on a later invocation;
- run only that one dependency stage;
- resume the parent only after the required dependency stages are complete.

Do not recursively execute multiple dependency and parent stages in one invocation. Do not ask the operator for a second implementation brief.

## Architecture escalation

Use `architect-handoff` only for a real unresolved decision outside the deterministic Material workflow, such as cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior that official design and repository evidence cannot resolve.

Incomplete stage artifacts are handled by their owning stage, not by a generic handoff.

## Report

First report the routing result:

```text
MATERIAL COMPONENT ROUTING RESULT
Input artifact:
Resolved official component:
Canonical family:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
REVIEW.md status:
Selected stage: design | architecture | implementation | migration | review | complete
Dependency selected instead of parent: none | <family and stage>
Reason:
Next stage after this run: <stage or none>
Overall family status: legacy | designing | architecting | implementing | migrating | reviewing | complete | blocked
```

Then include the complete report required by the selected stage.

Do not compress a stage report into a generic summary.

## Forbidden

- Running more than one stage in the same invocation.
- Combining official research, architecture decisions, code, consumer migration, and review in one task.
- Treating README, code, m3e, tests, or snapshots as substitutes for stage artifacts.
- Skipping an earlier invalid stage because later code already exists.
- Marking the component complete from green CI alone.
- Editing PR metadata or merging.