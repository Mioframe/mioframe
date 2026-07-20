---
name: material-canonical-target
description: 'Internal read-only role for resolving the canonical Material target for one component family or foundation domain before current implementation, tests, stories, snapshots, or prior conclusions are inspected. Use only when material-component or material-foundation delegates isolated target research.'
---

# Material canonical target

Produce an implementation-independent target for exactly one Material component family or foundation domain.

## Inputs

Receive only:

- the family or foundation domain;
- confirmed required user scenarios;
- applicable platforms;
- repository instruction paths;
- official Material source access.

Do not inspect current or proposed implementation, component-specific tests, stories, snapshots, prior family conclusions, or patch reasoning before returning the target.

## Responsibility

Use `src/shared/ui/material/docs/sources.md`, `src/shared/ui/material/docs/tokens.md`, and current official Material evidence to resolve:

- applicable platforms;
- supported and unsupported surface;
- public semantics and invalid combinations;
- anatomy and accessibility;
- state and interaction behavior;
- exact official reference/system/component token paths required by the supported scenarios;
- semantic meaning and value kind of each required token group;
- intentionally unsupported official token surface;
- required rendered properties, motion, and adaptive behavior;
- required Material or generic dependencies;
- exact unresolved decisions.

For every contradiction, absence, inference, or platform-specific rule, return a source decision with both claims, applicability, narrower authority, decision, rationale, and `resolved` or `unresolved` status.

Token presence does not prove supported behavior. Token absence does not cancel explicit guidance. Do not invent or shorten an official-looking token name. Android, iOS, and Web guidance are not interchangeable without an explicit decision.

Do not decide private CSS routing or file decomposition. Return canonical token semantics and required public surface only; current-state and contract stages own implementation mapping.

## Result

```text
MATERIAL ROLE RESULT
Role: canonical-target
Scope: component | foundation
Target:
Status: complete | blocked
Applicable platforms:
Supported surface:
Unsupported surface:
Canonical contracts:
Official token groups and exact paths:
Token value kinds and rendered meanings:
Intentionally unsupported token surface:
Source decisions:
Required dependencies:
Unresolved decisions:
Sources and verification dates:
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits;
- current implementation or proof inspection;
- legacy behavior used to fill missing official evidence;
- invented, shortened, or project-specific values in the official `--md-*` namespace;
- private routing or file-layout decisions;
- architecture or implementation planning beyond required dependency facts;
- delegation;
- declaring unresolved evidence resolved from memory or convenience.
