---
name: material-component
description: 'Use with only a Material component name to autonomously orchestrate design → architecture → implementation → migration → review through fresh isolated workers, then run one final workflow verification until completion or a genuine blocker.'
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
- running one final read-only workflow verification after all affected family artifacts are current;
- routing a final-verification failure to its owning stage and repeating correction, independent review, and final verification;
- continuing until the family is complete or a genuine blocker remains.

Do not stop merely because one stage completed. Do not require the operator to launch the same component command repeatedly.

## Thin orchestrator boundary

The orchestrator owns only state-machine control and final workflow closure:

- inspect canonical artifact statuses and readable workspace files;
- select the earliest invalid stage;
- construct the minimal worker handoff;
- launch the stage worker;
- validate its artifact and report;
- route success, dependency work, correction, or a genuine blocker;
- run and interpret the single final workflow verification after the current independent review.

The orchestrator must not perform official-source research, architecture decisions, code edits, consumer migration, stage-owned proof, or final review itself. Running the final workflow verification is orchestration closure, not a sixth reasoning stage.

Every stage must run in a fresh worker context. Continuing the next stage in the same reasoning context is forbidden. If the required worker cannot be created, report the workflow as blocked rather than simulating separation inside one agent.

A worker handoff contains only:

- the resolved official component and canonical family;
- the selected stage skill;
- applicable workspace rules;
- current task-relevant workspace files;
- paths to required canonical upstream artifacts;
- exact blocker or return-stage information already recorded in artifacts or final-verification output.

Workspace files and stage artifacts are the handoff. Do not pass hidden reasoning, conversational conclusions, or an ad hoc implementation brief from another worker.

The review worker must be independent from workers that authored or corrected architecture, implementation, or migration.

## Worker scope

The orchestrator and stage workers use only task-relevant readable files, file-oriented tools, and documented project commands.

When a project command fails before reaching its relevant check, complete otherwise safe stage work, record the exact visible command failure in the owning artifact, and report verification as blocked only when it remains required for that stage or for final workflow closure.

## Stage isolation inside one operator run

The workflow remains strictly multi-stage:

```text
design
  → architecture
  → implementation
  → migration
  → review
  → final workflow verification
```

Design, architecture, implementation, migration, and review each run in a fresh worker and own one durable handoff artifact. Final workflow verification is executed by the orchestrator only after those five artifacts are current; it does not create another stage artifact or worker role.

The `stop` and `do not continue` rules inside stage skills apply to the stage worker: that worker returns control to this orchestrator after its artifact and report. They do not terminate the outer operator invocation.

Never mix research, architecture invention, coding, migration, and review inside one worker context.

## Read first

- applicable `AGENTS.md` files;
- `src/shared/ui/material/docs/component-workflow.md`;
- the `verification` skill;
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
   - `MIGRATION.md` missing, partial, blocked, stale, consumers remain, legacy ownership remains, or migration-scoped proof is unresolved → migration;
   - `REVIEW.md` missing, stale, blocked, predates later workspace changes, or actionable findings remain → review.
2. Launch a fresh worker with only the selected stage handoff and execute only that stage skill.
3. Validate the artifact, declared status, upstream references, and report from workspace files rather than trusting prose alone.
4. On success, return to step 1 immediately and launch a new worker for the next invalid stage.
5. When a stage identifies an earlier-stage defect, route backward to a fresh worker for the owning stage and resume the loop.
6. When review returns actionable findings, launch the owning correction worker and later a new independent review worker.
7. When all affected family artifacts and gates are current, run the one final workflow verification required by root policy. For an ordinary Material component workflow this is `pnpm verify`.
8. If final workflow verification passes, complete the operator invocation.
9. If it fails, use the visible verifier output to identify the earliest owning stage, launch a fresh correction worker, require a new independent review after any workspace change, and rerun the same final workflow verification. Do not record the failure as a deferred family risk or ask the operator to restart the command.

After two correction rounds that still reveal ownership errors, unresolved scenarios, architectural drift, or growing workaround logic, return to architecture rather than continuing local patches.

## Dependency queue

When the current family depends on another official Material component:

- read the parent `ARCHITECTURE.md` dependency queue;
- pause the parent at the required gate;
- process the dependency through its own earliest invalid stage;
- continue the dependency stage by stage through separate fresh workers;
- resume the parent when the required dependency artifact gates are current.

Dependencies remain first-class families with their own artifacts. Do not combine parent and dependency reasoning in one worker context, and do not require a separate operator command.

Do not run a separate top-level final workflow verification merely because a dependency's review becomes current. Run one final workflow verification after the parent and every affected dependency have current artifacts, so the command verifies the complete resulting workspace once.

## Final workflow verification

Final workflow verification belongs to this orchestrator, not to implementation, migration, or review.

- Stage workers run only the focused and stage-scoped proof needed for their owned changes.
- Review evaluates the complete resulting family and the recorded stage proof; it does not block on a final workflow command that has not run yet.
- After the current independent review, run exactly one read-only final gate selected by root policy and the `verification` skill.
- Ordinary Material component work uses `pnpm verify`.
- Use `pnpm verify:release` only when the task itself changes release-sensitive infrastructure and the verification skill classifies it accordingly; component code does not become release-sensitive merely because it will eventually be merged or released.
- A passing final gate proves verification closure only. It does not replace architecture or independent review.
- Any workspace edit after the final gate invalidates that result and requires the owning stage, a fresh independent review, and the final gate again.

## Stop conditions

Stop the outer operator invocation only when one of these remains after available project mechanisms and source fallbacks are exhausted:

- required official source content is genuinely unavailable or incomplete;
- required source tools or fresh-worker orchestration are unavailable;
- official evidence and workspace constraints leave a material architecture choice unresolved;
- a concrete operator-reported visual/motion defect remains unresolved;
- a required stage-scoped or final workflow verification command cannot execute or complete;
- safety policy requires operator input.

A cache threshold, failed refresh helper, completed stage, ordinary code/test finding, missing repeated command, absence of an operator-reported defect, or a routable final-verification failure is not by itself a blocker. Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate: do not stop merely because the operator has not explicitly confirmed acceptance.

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
Stage verification:
Final workflow verification command:
Final workflow verification result:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blocker: none | <genuine blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

Include the full report from every stage worker executed during the run. Do not compress stage results into a generic summary.

## Forbidden

- Requiring one operator invocation per stage.
- Stopping after a successful stage when the next stage is internally actionable.
- Performing stage-owned work inside the orchestrator.
- Delegating the final workflow verification to implementation, migration, or review.
- Running the final workflow verification before the current independent review.
- Reusing a final verification result after any workspace edit.
- Treating a routable final-verification failure as a deferred risk instead of correcting its owning stage.
- Reusing the same agent context for consecutive stages.
- Letting the architecture, implementation, or migration worker perform the independent review.
- Passing hidden reasoning or non-canonical prose as an inter-stage handoff.
- Combining multiple reasoning stages into one undifferentiated task.
- Treating README, code, renderer artifacts, tests, or snapshots as substitutes for stage artifacts.
- Skipping an earlier invalid stage because later code already exists.
- Asking the coding stage to invent architecture.
- Asking the operator to rerun the same component command merely to advance the state machine.
- Marking the component complete from stage checks alone or before the final workflow verification passes.
