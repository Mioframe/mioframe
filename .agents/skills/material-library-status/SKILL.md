---
name: material-library-status
description: 'Use for a concise read-only Material library status report reconstructed from roadmap, current code, guards, proof, verification, and an optional validated continuation checkpoint.'
---

# Material library status

Read only:

1. `src/shared/ui/material/docs/roadmap.md`;
2. the active owner README for durable contract facts only;
3. current canonical owner, exports, actual implementations/imports, all direct consumers of changed public contracts or extensions, broader adoption scope, legacy-owner state, guards, proof, operator evidence, and verification.

Report:

- active root family/domain and invocation scope;
- candidate canonical owner, public export, consumers, and legacy-owner state;
- actual recursive dependency closure and required prerequisites;
- prerequisite owner readiness, including token ownership and semantics/lifecycle;
- roadmap continuation stack and whether current code confirms, shortens, replaces, or invalidates it;
- current highest-priority correction inferred from code;
- direct-consumer compatibility, adoption/cleanup, review, guard, browser, operator, and verification status;
- alignment: `aligned`, `converging`, or `blocked`;
- exact external blocker and one root-family next action.

A family-only invocation is one logical `full-family` operation. `converging` and a continuation checkpoint are nonterminal and not successful completion.

Owner README files must not contain persisted execution state. The roadmap may contain only one compact root-to-deepest unfinished continuation stack. Treat it as a hint: validate it against code and derive completed work from implementation, imports, guards, and proof.

Do not classify a used dependency outside orchestration because another owner implements it. Do not equate one correction, focused green tests, relocation, barrel creation, forwarding, consumer migration, snapshots, declarations, or green path guards with readiness.

The next action for a converging family must resume the same root `material-component <family>` command. Never tell the operator to invoke a nested component family or `material-foundation` separately.

Do not inspect/report Git, branch, commit, PR, or merge state. Do not modify files, execute stages, create audits/histories/checklists/scorecards/trackers, or persist a parallel status record.
