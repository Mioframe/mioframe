---
name: material-component
description: 'Use with one Material component name to mechanically orchestrate the isolated design, architecture, implementation, migration, and review stages, then run one final workflow verification until completion or a recorded genuine blocker.'
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

Do not require an implementation brief, mode, file path, dependency list, verification command, or repeated operator invocation.

## Authority

Read and execute:

- applicable `AGENTS.md` files;
- `src/shared/ui/material/docs/component-workflow.md`;
- the `verification` skill;
- the selected stage skill.

`component-workflow.md` is the single complete state-machine contract. Do not reconstruct or expand it from README files, roadmap prose, code, tests, or conversation context.

## Orchestrator boundary

This skill is a thin mechanical orchestrator. It may only:

- resolve the canonical family;
- read fixed artifact control fields;
- select a stage through the fixed order and exact `Required return stage` value;
- launch a fresh isolated worker;
- process the explicit dependency queue written by architecture;
- retain which stages changed during the current invocation;
- run the final read-only verification;
- send exact verifier output to a fresh review worker for routing;
- report completion or a recorded blocker.

It must not:

- decide whether official design facts are complete;
- evaluate architecture correctness;
- inspect code for implementation drift;
- discover remaining consumers or legacy ownership;
- review tests, visual output, or migration semantics;
- choose an owning correction stage from free-form prose or verifier output;
- edit stage artifacts or production files itself.

Those decisions belong to stage workers.

## Worker boundary

Each design, architecture, implementation, migration, and review stage runs in a fresh isolated worker context using the current runtime’s supported mechanism.

A handoff contains only:

- resolved official component and canonical family;
- selected stage skill;
- applicable workspace rules;
- task-relevant readable workspace files;
- canonical upstream artifact paths;
- explicit dependency, blocker, verifier-output, or return-stage facts.

Do not pass hidden reasoning or conversational conclusions between workers.

The review worker must be independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, record an orchestration blocker. Do not simulate isolation in one context.

Workers and orchestrator must not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or GitHub checks.

## Family resolution

Normalize the supplied name against official Material names, existing `MD*` exports, and family paths.

Ask for clarification only when readable workspace and official evidence leave multiple distinct official components unresolved.

## Mechanical orchestration

Inspect, in order:

```text
DESIGN.md
ARCHITECTURE.md
IMPLEMENTATION.md
MIGRATION.md
REVIEW.md
```

For each artifact, use only the fixed control fields defined by `component-workflow.md`:

1. If the file is missing, lacks a required field, or contains an invalid enum value, launch its owning stage.
2. If `Required return stage` is not `none`, launch exactly that named stage.
3. If the artifact does not satisfy its fixed success gate, launch its owning stage.
4. After a stage changes or refreshes an artifact, run every later stage in order during the same invocation, regardless of its prior label.
5. After architecture succeeds, process every explicit `Dependency queue` entry to its required gate before resuming the parent.
6. Continue until parent and affected dependencies have successful current reviews.
7. Run the one final workflow verification.
8. Complete only when it passes on the unchanged workspace.

Do not inspect artifact prose for hidden status or semantic contradictions. A stage worker owns semantic validation and must express routing through fixed fields.

Artifacts created under an older schema and missing required control fields are mechanically invalid and return to their owning stages.

## Stage execution

Launch only the selected stage skill:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

Validate only that the worker:

- produced its owned artifact;
- used all required control fields with valid enum values;
- did not modify files outside its stage boundary;
- returned a complete stage report.

Do not independently re-evaluate the worker’s semantic conclusion.

When a worker records an earlier `Required return stage`, route there and then rerun all downstream stages in order.

## Dependencies

Read dependencies only from the architecture artifact’s explicit `Dependency queue`.

Process each dependency as a first-class family through separate fresh workers. Do not infer dependencies from imports, code, or component names inside the orchestrator.

Run no separate final workflow verification for a dependency. Verify the complete parent/dependency workspace once after all reviews are current.

## Final workflow verification

After current successful reviews, use the verification skill to run one read-only final command.

Ordinary Material component work uses:

```text
pnpm verify
```

Use `pnpm verify:release` only when the task itself changes release-sensitive infrastructure and the verification skill explicitly selects it.

Do not delegate the final command to implementation, migration, or review.

## Verification failure routing

Do not classify verifier output in the orchestrator.

On failure:

1. retain the exact command and visible output;
2. launch a fresh independent `material-component-review` worker with that output;
3. require the worker to update `REVIEW.md` fixed control fields;
4. follow its exact `Required return stage`;
5. after any workspace change, rerun all downstream stages and a fresh independent review;
6. rerun the same final command.

If review records a genuine project-command blocker with `Required return stage: none`, stop and report that blocker exactly.

## Stop conditions

Stop only for a blocker explicitly recorded by a stage artifact or review routing pass:

- unavailable required official content or tools;
- unavailable fresh-worker isolation;
- unresolved architecture decision;
- required project command that cannot execute or complete after applicable mechanisms are exhausted;
- unresolved concrete operator-reported defect;
- safety-required operator input.

A completed stage, ordinary finding, pending later stage, routable verifier failure, absence of positive visual acknowledgement, or missing repeated operator command is not a blocker.

## Final report

```text
MATERIAL COMPONENT RESULT
Input component:
Resolved official component:
Canonical family:
Stage workers launched:
Stages executed:
Dependencies processed:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
REVIEW.md verdict:
Code changes:
Consumer changes:
Stage verification:
Final workflow verification command:
Final workflow verification result:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blocker: none | <exact blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

Include the full report from every worker executed during the invocation.

## Forbidden

- Requiring one operator command per stage.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting stages from prose instead of fixed control fields.
- Inferring dependencies from code.
- Interpreting final verifier output without a fresh review-routing worker.
- Reusing one worker context for multiple reasoning stages.
- Letting an implementation or migration worker conduct independent review.
- Depending on Git, PR, or external check state.
- Treating README, code, tests, snapshots, or renderer artifacts as stage-artifact substitutes.
- Marking completion before final workflow verification passes.
