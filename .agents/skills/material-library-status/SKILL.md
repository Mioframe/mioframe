---
name: material-library-status
description: 'Use for a concise read-only Material library status report reconstructed from roadmap, current code, guards, proof, and verification.'
---

# Material library status

Read only:

1. `src/shared/ui/material/docs/roadmap.md`;
2. the active owner README for durable contract facts only;
3. current canonical owner, exports, actual imports, representative consumers, legacy-owner state, guards, proof, operator evidence, and verification.

Report:

- active family/domain and invocation scope;
- candidate canonical owner, public export, consumers, and legacy-owner state;
- actual dependency closure and required prerequisites;
- current highest-priority correction inferred from code;
- adoption/cleanup, review, guard, browser, operator, and verification status;
- alignment: `aligned`, `converging`, or `blocked`;
- remaining required gaps, exact external blocker, and one next action.

A family-only invocation is `full-family`; `converging` is internal and not successful completion.

Do not expect or trust persisted execution state in owner README files. If one contains workflow state, backlog, review history, shell output, or future passes, report the documentation contract as invalid and derive status from code instead.

Do not classify a used dependency outside orchestration because another owner implements it. Do not equate one correction, focused green tests, relocation, barrel creation, consumer migration, snapshots, or declarations with readiness.

Do not inspect/report Git, branch, commit, PR, or merge state. Do not modify files, execute stages, create audits/histories/checklists/scorecards/trackers, or persist a parallel status record.