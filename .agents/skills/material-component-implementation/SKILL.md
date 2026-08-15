---
name: material-component-implementation
description: 'Use after a canonical Material family contract exists to implement the Vue/m3e adapter, prove it standalone, migrate all applicable consumers, remove legacy ownership, and run focused verification.'
---

# Material component implementation

Implement one canonical Material family from its fixed contract, then migrate the repository to that canonical API in the same worker context.

## Authority

Read applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, `component-adapter.md`, `component-tokens.md`, current testing ownership, and the family contract files.

The contract files define what the component is. Exact-version `@m3e/web` documentation/public artifacts define only how the private renderer can implement it.

## Input gate

Require:

```text
contract.ts
tokens.css
BEHAVIOR.md
GUIDANCE.md
SOURCES.md
```

If the contract is missing, contradictory, or proves incorrect, return `return-to-contract` with the exact defect. Do not redesign it while coding.

## Worker boundary

Run in a fresh isolated context.

This worker owns both canonical component implementation and subsequent consumer migration because they form one repository transformation. Do not split migration into a second worker.

## Preflight

Before production/component/consumer edits, run one `implementation-preflight` covering:

- canonical component implementation;
- component-owned proof;
- consumer inventory/migration;
- legacy-owner/proof removal;
- task-specific `TEST IMPACT`;
- focused verifier-managed commands.

Do not run a second migration preflight merely because standalone implementation is completed first.

## Implementation order

1. Read the canonical contract without using current consumers to reinterpret it.
2. Inspect exact lockfile-resolved `@m3e/web` docs/examples and public artifacts for every affected mapping.
3. Implement the Vue `MD*` component and private renderer glue.
4. Implement private token bridges without leaking m3e vocabulary into public `tokens.css`.
5. Add/update contract, browser, accessibility, geometry, token and visual proof as required.
6. Establish standalone component correctness.
7. Only then inventory all current/legacy consumers and obsolete owners/proof.
8. Adapt consumers to the canonical API while preserving product-owned behavior and failure paths.
9. Remove replaced legacy implementation, exports, proof and old staged family artifacts.
10. Run focused verifier-managed checks from preflight.

## Canonical contract rule

Never shrink, rename, alias, or otherwise distort the public Material contract because:

- m3e uses different names;
- a renderer feature is missing;
- a legacy consumer used a different API;
- preserving an old call site would be easier;
- current Mioframe does not yet use an official option.

When m3e cannot faithfully implement the contract, prefer documented direct support, then a small family-local correction, then a documented exact-version workaround that satisfies repository gates. If faithful support requires private DOM coupling, duplicated renderer systems, new shared infrastructure, or a public-contract compromise, return `needs-architect` instead of accumulating workaround logic.

## Consumer migration

Migration asks how each product scenario should use the canonical component.

- Use only root-exported canonical Material APIs and supported public tokens.
- Keep product state, persistence, routing, errors, operation lifecycle and business behavior with product owners.
- Do not preserve legacy Material props as compatibility aliases by default.
- If a legacy responsibility is not actually Material component behavior, keep/move it to the correct product/shared composition owner.
- Remove replaced legacy ownership only after every applicable consumer has a correct destination.
- Do not migrate unrelated Material families for cleanup.

## Proof

Use the lowest faithful proof selected by preflight and repository testing rules.

As applicable prove:

- public props/slots/emits/defaults/types and attribute boundary;
- accepted/rejected controlled intent;
- pointer/keyboard/focus/native event behavior;
- accessible role/name/state and ownership;
- fixed Material geometry with browser-level numeric assertions;
- public CSS token overrides through actual rendered results;
- stable renderer-owned appearance/motion through visual/browser evidence;
- dependency composition through canonical public APIs;
- migrated consumer scenarios and legacy removal.

Do not treat host attributes, CSS variable presence, source inspection, a story, or a screenshot alone as proof of a different observable contract.

## Existing staged artifacts

When this family completes the new workflow, remove its obsolete `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files. Do not remove staged artifacts from unrelated families.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
family: <canonical-family>
standalone component: complete | blocked
consumers inventoried: <summary>
consumers migrated: <summary>
legacy ownership removed: yes | no | not-applicable
focused verification: <commands/results>
contract defect: none | <exact defect>
architecture escalation: none | <exact decision>
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-contract | needs-architect
```

## Forbidden

- Changing the canonical contract to fit m3e or legacy consumers.
- Starting consumer migration before standalone contract/behavior is established.
- Exposing m3e tags, events, types, attributes, classes, CSS variables, or private DOM.
- Recreating renderer-owned interaction/accessibility/geometry/motion systems without an explicit architecture decision.
- Adding speculative abstractions, compatibility layers, generic adapter frameworks, or token registries.
- Leaving replaced legacy logic merely to reduce migration work.
- Creating IMPLEMENTATION.md or MIGRATION.md workflow logs.
- Running broad local verification solely to duplicate exact-head PR CI.
- Depending on Git/PR/check state for implementation correctness.
