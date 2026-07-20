# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-20

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `blocked`

Blocker: PR #157 exposed a workflow defect: legacy Button behavior, proof, and stylesheet were treated as the canonical target before independent alignment assessment. PR #155 must establish the convergence workflow and pass final verification before Button work continues.

## Next action

After the updated PR #155 workflow is available to the Button branch, start a fresh agent session and return PR #157 to `material-component-contract` with mode `align-existing`.

The fresh session must:

1. resolve the canonical Button target independently from the legacy implementation;
2. assess the current PR #157 repository state rather than resetting it;
3. classify every relevant owner and proof as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, or `obsolete`;
4. preserve only independently confirmed changes;
5. define the smallest complete next correction units;
6. continue correction without full-family deletion unless one local owner demonstrably requires replacement.

Run:

```text
material-component Button
```

Before the run, confirm that the fresh session loaded the updated root and nested `AGENTS.md` files and current Material skills. Do not continue a session that loaded the earlier contract-first workflow.

Persistent agent memory is not Material authority. Ignore any entry that conflicts with the current repository, including claims based on PR #150, removed audits or registries, removed `docs/material-3` files, or the pre-convergence PR #157 review. Do not delete unrelated memory automatically.

Treat Button as the first convergence calibration. Stop and correct the workflow before continuing if the agent:

- derives the canonical target from the current Button implementation;
- uses blanket `preserve behavior`, `relocation only`, `verbatim copy`, or `no redesign` decisions before alignment assessment;
- accepts old tests, stories, snapshots, token names, or consumer dependence as proof of Material correctness without classification;
- hides contradictory official evidence as resolved;
- skips the alignment map or correction-unit plan;
- rewrites or deletes the whole family when smaller owner corrections are sufficient;
- preserves a wrong owner merely to minimize diff size;
- migrates consumers before their required canonical contract is ready;
- reports the family aligned while required gaps remain;
- performs final review in the implementation context;
- starts another family or continues through an exact blocker.

A fresh session resets reasoning, not repository progress. Confirmed owners and completed valid correction units remain; rejected assumptions and legacy-defect proof do not.

Do not select or pre-plan a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when the active family, family alignment status, blocker, or one next correction action changes.
