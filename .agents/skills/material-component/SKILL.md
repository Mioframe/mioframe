---
name: material-component
description: 'Use when the user provides only a Material component or family name and wants it created, implemented, migrated, or aligned. Resolve the official family, repository ownership, change mode, consumers, current audit, and minimum supported surface, then run material-component-authoring end to end.'
---

# Material component

Use this as the one-name entrypoint for Material 3 Expressive component work.

This skill owns only target resolution and workflow startup. It must not duplicate component architecture, implementation, testing, review, or completion rules owned by `material-component-authoring` and `docs/material-3`.

## Required input

The only required input is a component or family name.

Examples:

```text
Button
MDButton
Switch
Navigation rail
```

The user may explicitly select the skill and enter only the name, or request:

```text
material-component Button
```

Do not ask the user to predefine variants, API, scenarios, foundations, files, tests, or consumers.

## Resolve the target

Before implementation:

1. normalize the supplied name against current official Material 3 Expressive terminology;
2. inspect existing `MD*` implementations, public exports, direct consumers, the latest `docs/material-3/audits/<family-slug>.md` when present, the component registry, UI inventory, physical migration map, and roadmap;
3. resolve the official component surface and smallest cohesive owning family;
4. identify current and canonical owners from the repository architecture and physical migration map;
5. identify current consumers and required compatibility;
6. select the change mode automatically.

Canonical ownership is not inferred from whichever file currently exists.

- `src/shared/ui/material/components/<family>` is the canonical owner for an official component family.
- An implementation under an existing `src/shared/ui/<LegacyFamily>` directory remains a legacy owner even when its API, tests, tokens, or visual output are otherwise mature.
- Do not report current and canonical owner as the same path unless the implementation is physically under the canonical Material root.
- A registry, prior audit, PR description, or existing export cannot override the physical migration map.

Choose:

- `end-to-end-migration` when a legacy production owner exists, including an otherwise aligned implementation outside the canonical Material root;
- `alignment-only` when a canonical owner exists but has incomplete or outdated Material alignment;
- `new-component` when no production implementation exists;
- no production rewrite when the canonical component is already complete and current.

An explicit component name selects the target for this run instead of automatic queue selection. Read the roadmap for real prerequisite blockers, but do not treat queue priority alone as a blocker.

The scope of an existing branch or pull request is context, not authority. Invoking `material-component <family>` requests the complete applicable workflow. Do not silently preserve an older prerequisite-only, audit-only, token-only, or test-only scope. Either expand the current branch into the cohesive end-to-end family migration or report one exact technical reason why that branch cannot safely own it.

Accept common names, plural names, official names, and repository `MD*` names. Ask one precise question only when source and repository inspection still leave two materially different official targets unresolved.

## Use the latest family audit

When a family audit exists:

- compare its recorded implementation ref and commit with the implementation under work;
- treat confirmed findings as required investigation inputs, not unquestioned truth;
- resolve each still-current finding through implementation, contract, proof, migration, or rule correction;
- record why a finding is stale when newer official or implementation evidence invalidates it;
- do not copy the audit into the family contract;
- do not mark the audit current after code changes; a fresh `material-component-review` run owns the replacement audit.

An absent audit is not a blocker for implementation.

## Resolve the supported surface

Use `material3-guidelines` and current official sources.

- Existing consumers and user flows define required scenarios.
- When no consumer exists, the explicit request is sufficient to implement the current canonical Expressive default.
- Implement the minimum complete surface required by those scenarios.
- Record optional official capabilities as unsupported unless a current requirement needs them.
- Do not preserve baseline Material 3 merely because it matches legacy code.
- Narrow unsupported scope when official guidance is incomplete and required scenarios remain valid.

Do not ask the user to choose variants or scope that official sources and repository evidence can determine.

## Start the canonical workflow

After resolving the target, load and execute `material-component-authoring` for the resolved family and mode.

Do not stop after research, an audit, a plan, or the family contract. Continue through the complete applicable workflow defined by that skill, including implementation, physical ownership migration, consumer migration, proportional proof, obsolete-owner removal, rule refinement, agent review, fresh final compliance review, visual handoff, and progress updates.

Use `material-foundation` only when a cross-family foundation contract changes. Use specialized Vue and testing skills only for applicable implementation and proof layers.

## Autonomy and blockers

Resolve routine technical decisions without requesting approval.

Escalate only for a genuine blocker already defined by `material-component-authoring`, such as:

- an unresolved product choice;
- materially conflicting or unavailable official evidence for a required scenario;
- an intentional Mioframe deviation;
- an incompatible public contract requiring product approval;
- an unsafe cross-family foundation change;
- an unresolved verification failure;
- rejected operator visual evidence.

A blocker must name one exact decision, summarize the evidence already gathered, and recommend the safest default.

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

`complete` requires every non-visual completion gate from `material-component-authoring` to pass, the implementation and public export to be owned by the canonical Material path, obsolete ownership to be removed, and a fresh family audit to review the final implementation commit. A stale audit, legacy physical owner, or endpoint-only motion proof cannot satisfy completion.