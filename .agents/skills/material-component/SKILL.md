---
name: material-component
description: 'Use when the user provides only a Material component or family name and wants it created, implemented, migrated, or aligned. Resolve the official family, repository ownership, change mode, consumers, current audit, and minimum supported surface, then run material-component-authoring.'
---

# Material component

Use this as the one-name entrypoint for Material 3 Expressive component work.

This skill owns target resolution and workflow startup only. Architecture, implementation, testing, review, and completion remain owned by `material-component-authoring` and `docs/material-3`.

## Required input

The only required input is a component or family name.

```text
Button
MDButton
Switch
Navigation rail
```

The user may explicitly select the skill or request:

```text
material-component Button
```

Do not ask the user to predefine variants, API, scenarios, foundations, files, tests, or consumers.

## Execution capability boundary

The coding agent may have repository-file and command access without `git`, GitHub, PR metadata, or CI access.

- Do not invoke unavailable tools.
- Do not invent a branch, commit, PR state, CI result, review state, or merge readiness.
- A local `pnpm verify` result is local verification, not CI.
- Missing `git` or GitHub access does not block implementation work.
- It does prevent the coding agent from certifying commit-bound audit freshness, green CI, operator acceptance, terminal program status, or merge readiness.

When external repository state is unavailable, the workflow ends as `implementation-ready-for-external-gates`, not `complete`.

## Resolve the target

Before implementation:

1. normalize the name against current official Material 3 Expressive terminology;
2. inspect existing `MD*` implementations, public exports, direct consumers, current family audit, component registry, inventory, physical migration map, and roadmap;
3. resolve the official surface and smallest cohesive family;
4. identify current and canonical owners from architecture and the physical map;
5. identify consumers and required compatibility;
6. select the change mode automatically.

Canonical ownership is not inferred from the file that currently exists.

- `src/shared/ui/material/components/<family>` is canonical for an official family.
- An implementation under `src/shared/ui/<LegacyFamily>` remains legacy even when mature.
- Current and canonical owner are the same only when the implementation is physically under the canonical root.
- A registry, audit, PR description, or existing export cannot override the physical migration map.

Choose:

- `end-to-end-migration` when a legacy production owner exists;
- `alignment-only` when a canonical owner exists but needs Material correction;
- `new-component` when no production implementation exists;
- no production rewrite when the canonical family is already complete and current.

An explicit component name selects the target instead of automatic queue selection. Roadmap prerequisites may block; queue priority alone does not.

Existing branch or PR scope is context, not authority. `material-component <family>` requests the complete applicable implementation workflow. Expand the current workspace or report one exact technical reason a separate change is required.

Ask one precise question only when official and repository evidence still leave two materially different targets unresolved.

## Use the latest family audit

When an audit exists:

- inspect whether it is commit-bound or provisional workspace evidence;
- investigate findings rather than accepting them blindly;
- resolve each current finding through implementation, contract, proof, migration, or rule correction;
- record why a finding is stale when newer evidence invalidates it;
- do not copy the audit into the family contract;
- require a new `material-component-review` after implementation changes.

An absent or provisional audit is not an implementation blocker.

## Resolve the supported surface

Use `material3-guidelines` and current official sources.

- Existing consumers define required scenarios.
- With no consumer, implement the current canonical Expressive default.
- Implement the minimum complete surface required by current scenarios.
- Record optional official capability as unsupported unless required.
- Do not preserve baseline Material 3 merely because it matches legacy code.
- Narrow unsupported scope when official guidance is incomplete and required scenarios remain valid.

Do not ask the user to decide scope that official sources and repository evidence resolve.

## Start the canonical workflow

Load and execute `material-component-authoring` for the resolved family and mode.

Do not stop after research, audit, plan, or family contract. Continue through implementation, physical migration, consumer migration, proportional proof, obsolete-owner removal, rule refinement, workspace review, visual handoff preparation, and progress updates.

Use `material-foundation` only when a cross-family foundation contract changes. Use specialized Vue and testing skills only for applicable layers.

## Autonomy and blockers

Resolve routine technical decisions without approval.

Escalate only for a genuine blocker defined by the authoring workflow, such as:

- unresolved product choice;
- conflicting or unavailable official evidence for a required scenario;
- intentional Mioframe deviation;
- incompatible public contract;
- unsafe cross-family foundation change;
- unresolved local verification failure;
- rejected operator visual evidence reported back to the implementation workflow.

A blocker names one exact decision, evidence already gathered, and the safest recommended default.

## Result

Finish with:

```text
MATERIAL COMPONENT RESULT
Requested name:
Resolved family:
Change mode:
Current owner before work:
Canonical owner:
Supported surface:
Unsupported surface:
Audit consumed: none | docs/material-3/audits/<family-slug>.md
Workspace audit: none | provisional | commit-bound
Audit findings resolved or invalidated: none | <summary>
Consumers migrated:
Foundation changes:
Rule refinements: none | <summary>
Local verification:
Legacy owner removal: not applicable | complete | blocked
Operator visual review: not applicable | prepared | blocked
External gates still required: none | commit binding, CI, operator acceptance, terminal records, merge review
Status: implementation-ready-for-external-gates | blocked (<exact reason>)
```

The coding agent must not report `complete`, `aligned`, `migrated`, milestone `done`, green CI, or merge readiness without direct access to the evidence required for that statement. External GitHub-enabled review owns those gates.