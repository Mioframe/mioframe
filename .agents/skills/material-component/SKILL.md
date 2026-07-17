---
name: material-component
description: 'Use when the user provides only a Material component or family name and wants it created, implemented, migrated, or aligned. Resolve the official family, repository ownership, change mode, consumers, current audit, and minimum supported surface, then run material-component-authoring end to end.'
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

Existing branch or PR scope is context, not authority. `material-component <family>` requests the complete applicable workflow. Expand the current branch or report one exact technical reason a separate branch is required.

Ask one precise question only when official and repository evidence still leave two materially different targets unresolved.

## Use the latest family audit

When an audit exists:

- compare its implementation ref and commit with the implementation under work;
- investigate findings rather than accepting them blindly;
- resolve each current finding through implementation, contract, proof, migration, or rule correction;
- record why a finding is stale when newer evidence invalidates it;
- do not copy the audit into the family contract;
- require a fresh `material-component-review` after implementation changes.

An absent audit is not a blocker.

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

Do not stop after research, audit, plan, or family contract. Continue through implementation, physical migration, consumer migration, proportional proof, obsolete-owner removal, rule refinement, agent review, fresh final audit, visual handoff, and progress updates.

Use `material-foundation` only when a cross-family foundation contract changes. Use specialized Vue and testing skills only for applicable layers.

## Autonomy and blockers

Resolve routine technical decisions without approval.

Escalate only for a genuine blocker defined by the authoring workflow, such as:

- unresolved product choice;
- conflicting or unavailable official evidence for a required scenario;
- intentional Mioframe deviation;
- incompatible public contract;
- unsafe cross-family foundation change;
- unresolved verification failure;
- rejected operator visual evidence.

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
Fresh final audit: docs/material-3/audits/<family-slug>.md @ <implementation commit>
Audit findings resolved or invalidated: none | <summary>
Consumers migrated:
Foundation changes:
Rule refinements: none | <summary>
Verification:
Legacy owner removal: not applicable | complete | blocked
Operator visual acceptance: not applicable | required | blocked
Status: complete | blocked (<exact reason>)
```

`complete` requires all authoring gates, canonical physical ownership and public export, obsolete-owner removal, proportional proof at the owning layers, and a fresh audit of the final implementation commit. A stale audit, legacy owner, broken final public route, or unverified motion contract/wiring blocks completion; frame-level browser analysis is not required for ordinary CSS motion.