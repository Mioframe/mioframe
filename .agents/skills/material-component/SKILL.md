---
name: material-component
description: 'Use with only a Material component name to autonomously orchestrate design → architecture → implementation → migration → review through fresh isolated workers until completion or a genuine blocker.'
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

One operator invocation must autonomously advance the component as far as workspace files and available project tools allow.

The operator supplies the component name once. The orchestrator is responsible for:

- resolving the canonical family;
- selecting every required stage in order;
- launching a fresh worker for each selected stage;
- validating each stage artifact before continuing;
- processing official Material dependencies automatically;
- routing findings backward to the earliest owning stage;
- continuing until the family is complete or a genuine blocker remains.

Do not stop merely because one stage completed. Do not require the operator to launch the same component command repeatedly.

## Thin orchestrator boundary

The orchestrator owns only state-machine control:

- inspect canonical artifact statuses and readable workspace files;
- select the earliest invalid stage;
- construct the minimal worker handoff;
- launch the stage worker;
- validate its artifact and report;
- route success, dependency work, correction, or a genuine blocker.

The orchestrator must not perform official-source research, architecture decisions, code edits, consumer migration, stage-owned verification interpretation, or final review itself.

Every stage must run in a fresh worker context. Continuing the next stage in the same reasoning context is forbidden. If the required worker cannot be created, report the workflow as blocked rather than simulating separation inside one agent.

A worker handoff contains only:

- the resolved official component and canonical family;
- the selected stage skill;
- applicable workspace rules;
- current task-relevant workspace files;
- paths to required canonical upstream artifacts;
- exact blocker or return-stage information already recorded in artifacts.

Workspace files and stage artifacts are the handoff. Do not pass hidden reasoning, conversational conclusions, or an ad hoc implementation brief from another worker.

The review worker must be independent from workers that authored or corrected architecture, implementation, or migration.

## Worker scope

The orchestrator and stage workers use only task-relevant readable files, file-oriented tools, and documented project commands.

When a project command fails before reaching its relevant check, complete otherwise safe stage work, record the exact visible command failure in the owning artifact, and report verification as blocked only when it remains the final gate.

## Stage isolation inside one operator run

The workflow remains strictly multi-stage:

```text
design
  → architecture
  → implementation
  → migration
  → review
```

Each stage worker has one reasoning focus and one durable handoff artifact. Complete and validate that worker result before launching the next worker.

The `stop` and `do not continue` rules inside stage skills apply to the stage worker: that worker returns control to this orchestrator after its artifact and report. They do not terminate the outer operator invocation.

Never mix research, architecture invention, coding, migration, and review inside one worker context.

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

Normalize the supplied name against official Material names, existing `MD*` exports, family paths, stage artifacts, implementations, and consumers.

Ask for clarification only when workspace and official evidence leave multiple distinct official components unresolved.

## Autonomous orchestration loop

Inspect:

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
   - `ARCHITECTURE.md` missing, stale, blocked, not ready, or inconsistent with current design → architecture;
   - `IMPLEMENTATION.md` missing, partial, blocked, stale, architecture-deviating, or implementation drift exists → implementation;
   - `MIGRATION.md` missing, partial, blocked, stale, consumers remain, legacy ownership remains, or final verification is unresolved → migration;
   - `REVIEW.md` missing, stale, blocked, predates later workspace changes, or actionable findings remain → review;
   - all artifacts and gates current → complete.
2. Launch a fresh worker with only the selected stage handoff and execute only that stage skill.
3. Validate the artifact, declared status, upstream references, and report from workspace files rather than trusting prose alone.
4. On success, return to step 1 immediately and launch a new worker for the next stage.
5. When a stage identifies an earlier-stage defect, route backward to a fresh worker for the owning stage and resume the loop.
6. When review returns actionable findings, launch the owning correction worker and later a new independent review worker.

After two correction rounds that still reveal ownership errors, unresolved scenarios, architectural drift, or growing workaround logic, return to architecture rather than continuing local patches.

## Dependency queue

When the current family depends on another official Material component:

- read the parent `ARCHITECTURE.md` dependency queue;
- pause the parent at the required gate;
- process the dependency through its own earliest invalid stage;
- continue the dependency stage by stage through separate fresh workers;
- resume the parent when the required dependency gate is complete.

Dependencies remain first-class families with their own artifacts. Do not combine parent and dependency reasoning in one worker context, and do not require a separate operator command.

## Stop conditions

Stop the outer operator invocation only when one of these remains after available project mechanisms and source fallbacks are exhausted:

- required official source content is genuinely unavailable or incomplete;
- required source tools or fresh-worker orchestration are unavailable;
- official evidence and workspace constraints leave a material architecture choice unresolved;
- required operator visual/motion acceptance is the only remaining gate;
- a required project verification command cannot execute or complete;
- safety policy requires operator input.

A cache threshold, failed refresh helper, completed stage, ordinary code/test finding, or missing repeated command is not by itself a blocker.

Use `architect-handoff` only for a real unresolved decision outside the deterministic Material workflow, such as cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior that official design and workspace evidence cannot resolve.

## Final report

Report the complete orchestration result:

```text
MATERIAL COMPONENT RESULT
Input artifact:
Resolved official component:
Canonical family:
Stage workers launched:
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
Remaining blocker: none | <genuine blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

Include the full report from every stage worker executed during the run. Do not compress stage results into a generic summary.

## Forbidden

- Requiring one operator invocation per stage.
- Stopping after a successful stage when the next stage is internally actionable.
- Performing stage-owned work inside the orchestrator.
- Reusing the same agent context for consecutive stages.
- Letting the architecture, implementation, or migration worker perform the independent review.
- Passing hidden reasoning or non-canonical prose as an inter-stage handoff.
- Combining multiple reasoning stages into one undifferentiated task.
- Treating README, code, renderer artifacts, tests, or snapshots as substitutes for stage artifacts.
- Skipping an earlier invalid stage because later code already exists.
- Asking the coding stage to invent architecture.
- Asking the operator to rerun the same component command merely to advance the state machine.
- Marking the component complete from automated checks alone.
