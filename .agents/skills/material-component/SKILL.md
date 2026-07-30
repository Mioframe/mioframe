---
name: material-component
description: 'Use with only a Material artifact name to create or refresh its complete DESIGN.md, then implement, resume, normalize, or verify the corresponding Mioframe MD* adapter through the canonical Material workflow.'
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
- family `DESIGN.md` and README files;
- canonical implementations;
- current and legacy consumers;
- official Material component names and routes.

Prefer an exact existing `MD*` artifact or family match. Strip only conventional `MD` prefix, case, spaces, and hyphen differences when resolving aliases.

Ask for clarification only when the name genuinely maps to multiple distinct official Material components and repository evidence cannot resolve the intended artifact.

## Required design stage

Read `material-component-design`, `material-component-adapter`, and `material-component-completion`.

Before selecting implementation mode, inspect:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Use `material-component-design` when the document is missing, stale, blocked, demand-truncated, renderer-shaped, or otherwise incomplete.

The design stage must produce a complete official Material snapshot. It must not select current demand, inspect m3e, or implement code.

Do not continue into adapter or completion workflow unless `DESIGN.md` status is `current` and the complete-source gate passes. Report a blocked design result when official sources are unavailable or incomplete.

## Select the adapter mode automatically

After the design gate passes:

- use `material-component-adapter` when no existing family implementation artifacts exist and the component is genuinely new;
- use `material-component-completion` when any implementation, README, tests, stories, tokens, exports, defect records, consumers, migration status, or previous completion claim already exists.

Existing `migrated` or `verification` status does not bypass completion preflight.

If the component is already complete, still audit the design and completion gates and report `complete` without speculative changes.

## Resolve all adapter context internally

After `DESIGN.md` is accepted, derive from repository evidence:

- current production scenarios and demand;
- selected and deferred official surface by exact design references;
- parent and dependency ownership;
- standalone defaults and composed overrides;
- public API and token ownership;
- exact lockfile-resolved renderer capability;
- existing defects and workarounds;
- required tests, browser behavior, visual proof, and final verification scope.

Do not ask the operator to restate facts available in the design document, code, tests, documentation, lockfile artifacts, or official sources.

## Dependency recursion

When the selected component requires another official Material component:

1. add the dependency to the ordered closure queue;
2. invoke this same name-only routing process for the dependency;
3. complete its design stage first;
4. complete or verify it as a first-class adapter family;
5. resume the parent only after both dependency design and adapter closure gates pass.

Do not request a separate operator prompt for discovered dependencies.

## Architecture escalation

Use `architect-handoff` only when repository, accepted design artifacts, and renderer evidence leave a real unresolved architecture choice that changes cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior.

Do not escalate merely because design or implementation artifacts are incomplete, inconsistent, or incorrect; the design and completion workflows own those cases.

## Reporting discipline

The router report is only a routing summary. It must not replace or shorten the reports required by the selected workflows.

After the routing summary:

- include the complete `MATERIAL DESIGN RESULT` when the design stage ran;
- for `new`, include the complete `MATERIAL ADAPTER RESULT` required by `material-component-adapter`;
- for `completion`, include the complete `MATERIAL COMPONENT COMPLETION RESULT` required by `material-component-completion`;
- for every recursively processed dependency, include its design and adapter/completion results before the parent resumes.

When completion mode returns a clean worktree, the final response must still include the design-status check, independent expected-contract ledger, standalone-default versus parent-override comparison, production-consumer applicability comparison, complete closure inventory, and explicit no-change justification required by `material-component-completion`.

A generic summary such as "official sources match the matrix", "tests are present", or "no correction required" is invalid without the required comparison evidence. Verification counts and green CI do not replace design or contract evidence.

## Report

First report the routing summary:

```text
MATERIAL COMPONENT RESULT
Input artifact:
Resolved official component:
Resolved Mioframe family:
Design artifact path:
Design status: current | stale | blocked | missing
Design stage run: yes | no
Selected adapter mode: new | completion | none (design blocked)
Dependencies processed:
Current demand:
Corrections or implementation completed:
Remaining blockers:
Exact final verification command:
Implementation ownership: legacy | migrating | migrated
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

Then include the complete reports required by every workflow that ran. Do not omit them.
