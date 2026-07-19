---
name: material-component
description: 'Use when the user provides only a Material component or family name and wants it created, implemented, migrated, or aligned. Resolve the official family, repository ownership, change mode, consumers, current audit, and minimum supported surface, then run material-component-authoring end to end.'
---

# Material component

Use this as the one-name entrypoint for Material 3 Expressive component work.

This skill owns only target resolution and workflow startup. All Material-specific architecture, implementation, migration, proof, and review policy is owned under `src/shared/ui/material` and must not be duplicated here.

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

## Load the canonical Material boundary

Before resolving the target, read:

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/README.md`;
- `src/shared/ui/material/docs/library-roadmap.md`;
- `src/shared/ui/material/docs/source-of-truth.md`;
- `src/shared/ui/material/docs/component-architecture.md`;
- `src/shared/ui/material/docs/component-testing.md`;
- the selected family contract and latest audit when present.

Treat these files as the only Material-specific fact owners. This routing skill must not create an independent architecture or workflow.

## Resolve the target

Before implementation:

1. normalize the supplied name against current official Material 3 Expressive terminology;
2. inspect existing `MD*` implementations, public exports, direct consumers, the latest `src/shared/ui/material/docs/audits/<family-slug>.md` when present, the component registry, UI inventory, migration map, and roadmap;
3. resolve the official component surface and smallest cohesive owning family;
4. identify current and canonical owners;
5. identify current consumers and required external compatibility;
6. select the change mode automatically.

Choose:

- `end-to-end-migration` when a legacy production owner exists;
- `alignment-only` when a canonical owner exists but has incomplete or outdated Material alignment;
- `new-component` when no production implementation exists;
- no production rewrite when the canonical component is already complete and current.

An explicit component name selects the target for this run instead of automatic queue selection. Read the roadmap for real prerequisite blockers, but do not treat queue priority alone as a blocker.

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

- Existing consumers define required compatibility, not internal library architecture.
- When no consumer exists, the explicit request is sufficient to implement the current canonical Expressive default.
- Implement the minimum complete official surface required by the accepted library contract.
- Record optional official capabilities as unsupported unless a current requirement needs them.
- Do not preserve baseline Material 3 merely because it matches legacy code.
- Narrow unsupported scope when official guidance is incomplete and required scenarios remain valid.
- Do not introduce product-shaped props, product state, product fixtures, or product imports into `src/shared/ui/material`.

Do not ask the user to choose variants or scope that official sources and repository evidence can determine.

## Start the canonical workflow

After resolving the target, load and execute `material-component-authoring` for the resolved family and mode.

Do not stop after research, an audit, a plan, or the family contract. Continue through the complete applicable workflow owned by the shared Material documentation, including owner-local implementation and proof, external consumer migration, obsolete-owner removal, independent review, visual handoff, and progress updates.

Use `material-foundation` only when a cross-family foundation contract changes. Use specialized Vue and testing skills only for applicable implementation and proof layers.

## Autonomy and blockers

Resolve routine technical decisions without requesting approval.

Escalate only for a genuine blocker defined by the canonical Material documentation, such as:

- an unresolved product-scope choice;
- materially conflicting or unavailable official evidence for a required surface;
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
Canonical owner:
Supported surface:
Unsupported surface:
Audit consumed: none | src/shared/ui/material/docs/audits/<family-slug>.md
Audit findings resolved or invalidated: none | <summary>
Consumers migrated:
Foundation changes:
Rule refinements: none | <summary>
Verification:
Legacy owner removal: not applicable | complete | blocked
Operator visual acceptance: not applicable | required | blocked
Status: complete | blocked (<exact reason>)
```

`complete` requires every non-visual completion gate from the canonical shared Material workflow to pass and one canonical production owner to remain.
