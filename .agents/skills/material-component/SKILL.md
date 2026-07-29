---
name: material-component
description: 'Use with only a Material artifact name to implement, resume, normalize, or verify the corresponding Mioframe MD* component through the canonical Material adapter workflow.'
---

# Material component

Accept exactly one required input: the Material artifact name.

Valid examples:

```text
MDLoadingIndicator
Loading indicator
loading-indicator
MDButton
Button
```

Do not require an implementation brief, mode, parent component, dependency context, file path, renderer mapping, known defect list, or verification instructions from the operator. Resolve those from the repository and official sources.

## Resolve the artifact

Normalize the supplied name against:

- public `MD*` exports;
- `src/shared/ui/material/components/*` families;
- family READMEs and canonical implementations;
- current and legacy consumers;
- official Material component names and routes.

Prefer an exact existing `MD*` artifact or family match. Strip only conventional `MD` prefix, case, spaces, and hyphen differences when resolving aliases.

Ask for clarification only when the name genuinely maps to multiple distinct official Material components and repository evidence cannot resolve the intended artifact.

## Select the mode automatically

Read `material-component-adapter` and `material-component-completion`.

Use `material-component-adapter` when no existing family implementation artifacts exist and the component is genuinely new.

Use `material-component-completion` when any implementation, README, tests, stories, tokens, exports, defect records, consumers, migration status, or previous completion claim already exists. Existing `migrated` or `verification` status does not bypass completion preflight.

If the component is already complete, still audit the completion gate and report `complete` without creating speculative changes.

## Resolve all context internally

Derive from repository evidence:

- current production scenarios and demand;
- official selected and deferred surface;
- parent and dependency ownership;
- standalone defaults and composed overrides;
- public API and token ownership;
- exact lockfile-resolved renderer capability;
- existing defects and workarounds;
- required tests, browser behavior, visual proof, and final verification scope.

Do not ask the operator to restate facts available in code, tests, documentation, lockfile artifacts, or official Material sources.

## Dependency recursion

When the selected component requires another official Material component:

1. add the dependency to the ordered closure queue;
2. invoke this same name-only routing process for the dependency;
3. complete or verify it as a first-class family;
4. resume the parent only after the dependency closure gate passes.

Do not request a separate operator prompt for discovered dependencies.

## Architecture escalation

Use `architect-handoff` only when repository and official evidence leave a real unresolved architecture choice that changes cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior.

Do not escalate merely because artifacts are incomplete, inconsistent, or incorrect; completion mode owns those cases.

## Reporting discipline

The router report is only a routing summary. It must not replace or shorten the report required by the selected workflow.

After the routing summary:

- for `new`, include the complete `MATERIAL ADAPTER RESULT` required by `material-component-adapter`;
- for `completion`, include the complete `MATERIAL COMPONENT COMPLETION RESULT` required by `material-component-completion`;
- for every recursively processed dependency, include its selected workflow result before the parent result resumes.

When completion mode returns a clean worktree, the final response must still include the independent expected-contract ledger, standalone-default versus parent-override comparison, production-consumer applicability comparison, complete closure inventory, and explicit no-change justification required by `material-component-completion`.

A generic summary such as "official sources match the matrix", "tests are present", or "no correction required" is invalid without the required comparison evidence. Verification counts and green CI do not replace contract evidence.

## Report

First report the routing summary:

```text
MATERIAL COMPONENT RESULT
Input artifact:
Resolved official component:
Resolved Mioframe family:
Selected mode: new | completion
Dependencies processed:
Current demand:
Corrections or implementation completed:
Remaining blockers:
Exact final verification command:
Implementation ownership: migrating | migrated
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

Then include the complete report required by the selected adapter or completion workflow. Do not omit it.
