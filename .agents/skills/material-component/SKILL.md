---
name: material-component
description: 'Use with only a Material component name to autonomously orchestrate the complete design → architecture → implementation → migration → review workflow through fresh isolated stage workers until completion or a genuine external blocker.'
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

Do not require an implementation brief, mode, file path, renderer mapping, dependency list, verification command, Git ref, or repeated operator invocation.

## Operator contract

One operator invocation must autonomously advance the component as far as the repository files and available tools allow.

The operator supplies the component name once. The orchestrator is responsible for:

- resolving the canonical family;
- selecting every required stage in order;
- launching a fresh agent/subagent worker for each selected stage;
- validating each stage artifact before continuing;
- processing official Material dependencies automatically;
- routing findings backward to the earliest owning stage;
- continuing until the family is complete or a genuine external blocker remains.

Do not stop merely because one stage completed. Do not require the operator to launch the same component command repeatedly.

## Thin orchestrator boundary

The orchestrator owns only state-machine control:

- inspect canonical artifact statuses and current readable working-tree files;
- select the earliest invalid stage;
- construct the minimal worker handoff;
- launch the stage worker;
- validate its artifact and report;
- route success, dependency work, correction, or a genuine blocker.

The orchestrator must not perform official-source research, architecture decisions, code edits, consumer migration, verification interpretation owned by a stage, or final review itself.

Every stage must run in a fresh agent/subagent context. Continuing the next stage in the same reasoning context is not an isolated stage and is forbidden. If the environment cannot create the required worker, stop with an infrastructure blocker instead of simulating separation inside one agent.

A worker handoff contains only:

- the resolved official component and canonical family;
- the selected stage skill;
- applicable repository rules;
- current readable working-tree file state;
- paths to required canonical upstream artifacts;
- exact genuine blocker or return-stage information when applicable.

Do not require `HEAD`, a branch ref, a commit object, or a healthy local Git object database to select or execute a Material stage. Do not pass hidden chain of thought, conversational reasoning, conclusions that are not present in canonical artifacts, or an ad hoc implementation brief from a previous worker. Repository files and stage artifacts are the handoff.

The review worker must be fresh and independent from workers that authored or corrected the architecture, implementation, or migration under review.

## Git boundary

The coding orchestrator and stage workers must not run raw `git` commands, inspect or repair `.git`, fetch remotes, move refs, stage, commit, reset, rebase, or create worktrees. Git and GitHub are operator/architect responsibilities.

Project verification commands may use Git internally for impact planning. If a required `pnpm verify*` command fails because local Git metadata is unavailable or corrupt:

1. do not attempt Git repair;
2. do not stop before completing otherwise safe file inspection and stage-owned edits;
3. record the exact verification failure in the owning stage artifact;
4. return a verification infrastructure blocker only when that command is the remaining gate.

A broken `HEAD` or object database is not by itself a design, architecture, implementation, migration, or review-input blocker.

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

The `stop` and `do not continue` rules inside stage skills apply to the stage worker: that worker must return control to this orchestrator after its artifact and report. They do not terminate the outer operator invocation.

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
   - `REVIEW.md` missing, stale, blocked, inconsistent with current readable artifacts/code, or actionable findings remain → review;
   - all artifacts and gates current → complete.
2. Launch a fresh agent/subagent worker with only the selected stage handoff and execute only that stage skill.
3. Validate its artifact, declared status, upstream references, and report from readable repository files rather than trusting prose alone.
4. When the stage succeeds, return to step 1 immediately in the same operator invocation and launch a new worker for the next stage.
5. When the stage identifies an earlier-stage defect, route backward, launch a fresh worker for the owning stage, and then resume the loop.
6. When review returns actionable findings, launch the owning correction worker and later launch a new independent review worker.

After two correction rounds that still reveal ownership errors, unresolved scenarios, architectural drift, or growing workaround logic, return to architecture rather than continuing local patches.

## Dependency queue

When the current family depends on another official Material component:

- read the parent `ARCHITECTURE.md` dependency queue;
- pause the parent at the required gate;
- process the dependency through its own earliest invalid stage;
- continue the dependency stage by stage through separate fresh workers;
- resume the parent as soon as the required dependency gate is complete.

Dependencies remain first-class families with their own artifacts. Do not combine parent and dependency reasoning in one worker context, but do not ask the operator to launch a separate command.

## Genuine stop conditions

Stop the outer operator invocation only when one of these remains after exhausting available repository mechanisms and tool fallbacks:

- required official source content is genuinely unavailable or incomplete;
- permissions, a required external tool, or the required fresh-worker mechanism is unavailable;
- official evidence and repository constraints leave a material architecture choice that cannot be resolved deterministically;
- required operator visual/motion acceptance is the only remaining gate;
- a required project verification command is blocked by irreducible external/infrastructure failure after stage-owned edits are complete;
- safety policy requires operator input.

A cache freshness threshold, failed refresh helper, completed stage, missing repeated command, unavailable Git ref, or ordinary code/test finding is not by itself an external blocker.

Use `architect-handoff` only for a real unresolved decision outside the deterministic Material workflow, such as cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior that official design and repository evidence cannot resolve.

## Final report

Report the complete orchestration result, not only the last stage:

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
Remaining blocker: none | <genuine external blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

Include the full report from every stage worker executed during the run. Do not compress stage results into a generic summary.

## Forbidden

- Requiring one operator invocation per stage.
- Stopping after a successful stage when the next stage is internally actionable.
- Performing stage-owned work inside the orchestrator.
- Reusing the same agent context for consecutive stages.
- Letting the architecture/implementation/migration worker perform the independent review.
- Passing hidden reasoning or non-canonical prose as an inter-stage handoff.
- Combining multiple reasoning stages into one undifferentiated task.
- Treating README, code, m3e, tests, or snapshots as substitutes for stage artifacts.
- Skipping an earlier invalid stage because later code already exists.
- Asking the coding stage to invent architecture.
- Asking the operator to rerun the same component command merely to advance the state machine.
- Marking the component complete from green CI alone.
- Using raw Git, Git object health, `HEAD`, or commit refs as a prerequisite for stage work.
- Editing PR metadata or merging.
