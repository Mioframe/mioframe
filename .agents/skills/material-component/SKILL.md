---
name: material-component
description: 'Use with only a Material component name to autonomously orchestrate the complete design → architecture → implementation → migration → review workflow until completion or a genuine external blocker.'
---

# Material component

Accept exactly one required operator input: the Material component name.

Examples:

```text
Button
MDButton
Loading indicator
MDLoadingIndicator
```

Do not require an implementation brief, mode, file path, renderer mapping, dependency list, verification command, or repeated operator invocation.

## Operator contract

One operator invocation must autonomously advance the component as far as the repository and available tools allow.

The operator supplies the component name once. The orchestrator is responsible for:

- resolving the canonical family;
- executing every required stage in order;
- validating each stage artifact before continuing;
- processing official Material dependencies automatically;
- routing findings backward to the earliest owning stage;
- running implementation and migration work when their gates become ready;
- continuing until the family is complete or a genuine external blocker remains.

Do not stop merely because one stage completed. Do not require the operator to launch the same component command repeatedly.

## Stage isolation inside one operator run

The workflow remains strictly multi-stage:

```text
design
  → architecture
  → implementation
  → migration
  → review
```

Each stage is a separate internal execution scope with one reasoning focus and one durable handoff artifact. Complete and validate that scope before opening the next one.

The `stop` and `do not continue` rules inside stage skills apply to the stage worker: that worker must return control to this orchestrator after its artifact and report. They do not terminate the outer operator invocation.

Never mix research, architecture invention, coding, migration, and review inside one stage scope.

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

## Autonomous orchestration loop

Inspect the canonical family artifacts:

```text
DESIGN.md
ARCHITECTURE.md
IMPLEMENTATION.md
MIGRATION.md
REVIEW.md
```

Repeat:

1. Select the earliest invalid stage:
   - `DESIGN.md` missing, stale, blocked, incomplete, demand-scoped, or renderer-shaped → design;
   - `ARCHITECTURE.md` missing, stale, blocked, not ready, or not based on the current design → architecture;
   - `IMPLEMENTATION.md` missing, partial, blocked, stale, architecture-deviating, or implementation drift exists → implementation;
   - `MIGRATION.md` missing, partial, blocked, stale, consumers remain, legacy ownership remains, or final verification is unresolved → migration;
   - `REVIEW.md` missing, stale, blocked, behind the current resulting head, or actionable findings remain → review;
   - all artifacts and gates current → complete.
2. Open a fresh internal stage scope and execute only the selected stage skill.
3. Validate its artifact, declared status, source/ref metadata, and report.
4. When the stage succeeds, return to step 1 immediately in the same operator invocation.
5. When the stage identifies an earlier-stage defect, route backward, correct the owning artifact in a fresh stage scope, and then resume the loop.
6. When review returns actionable findings, execute the owning correction stage and repeat review.

After two correction rounds that still reveal ownership errors, unresolved scenarios, architectural drift, or growing workaround logic, return to architecture rather than continuing local patches.

## Dependency queue

When the current family depends on another official Material component:

- read the parent `ARCHITECTURE.md` dependency queue;
- pause the parent at the required gate;
- process the dependency through its own earliest invalid stage;
- continue the dependency stage by stage automatically;
- resume the parent as soon as the required dependency gate is complete.

Dependencies remain first-class families with their own artifacts. Do not combine parent and dependency reasoning in one stage scope, but do not ask the operator to launch a separate command.

## Genuine stop conditions

Stop the outer operator invocation only when one of these remains after exhausting available repository mechanisms and tool fallbacks:

- required official source content is genuinely unavailable or incomplete;
- permissions or a required external tool are unavailable;
- official evidence and repository constraints leave a material architecture choice that cannot be resolved deterministically;
- required operator visual/motion acceptance is the only remaining gate;
- a failing external/infrastructure gate cannot be retried or diagnosed within the available tools;
- safety policy requires operator input.

A cache freshness threshold, failed refresh helper, completed stage, missing repeated command, or ordinary code/test finding is not by itself an external blocker.

Use `architect-handoff` only for a real unresolved decision outside the deterministic Material workflow, such as cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior that official design and repository evidence cannot resolve.

## Final report

Report the complete orchestration result, not only the last stage:

```text
MATERIAL COMPONENT RESULT
Input artifact:
Resolved official component:
Canonical family:
Stages executed:
Dependencies processed:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
REVIEW.md status:
Code changes:
Consumer changes:
Verification:
Operator acceptance: accepted | required | not-applicable
Remaining blocker: none | <genuine external blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

Include the full report from every stage executed during the run. Do not compress stage results into a generic summary.

## Forbidden

- Requiring one operator invocation per stage.
- Stopping after a successful stage when the next stage is internally actionable.
- Combining multiple reasoning stages into one undifferentiated task.
- Treating README, code, m3e, tests, or snapshots as substitutes for stage artifacts.
- Skipping an earlier invalid stage because later code already exists.
- Asking the coding stage to invent architecture.
- Asking the operator to rerun the same component command merely to advance the state machine.
- Marking the component complete from green CI alone.
- Editing PR metadata or merging.