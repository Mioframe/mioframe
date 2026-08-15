---
name: material-component-migration
description: 'Use after standalone Material implementation is complete to adapt all current Mioframe consumers to the finished canonical component according to family Material usage guidance, preserve product behavior, remove replaced legacy ownership, and run focused migration proof without redesigning Material.'
---

# Material component migration

Migrate one completed canonical Material component into Mioframe according to its Material usage guidance.

## Input gate

Require:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
components/<family>/README.md
standalone canonical component implementation and proof: complete
```

Do not begin migration while standalone implementation is blocked or a definition correction remains unresolved.

## Authority

Read applicable `AGENTS.md`, the three canonical technical contracts, family `README.md`, the finished canonical component/public exports, current consumers, legacy implementation being replaced, and current testing ownership.

The canonical component and its Material usage guidance are fixed inputs. Migration asks how each product scenario should correctly use the official Material family; migration does not redesign the component or rewrite guidance around existing call sites.

## Isolation

Run in a fresh isolated context separate from the implementation worker.

You may inspect application consumers and legacy implementation now because they are the subject of migration.

Do not inspect m3e internals or renderer-private API. Consumers must use only canonical Mioframe Material APIs.

## Preflight

Before consumer edits, run `implementation-preflight` scoped only to:

- consumer inventory;
- canonical Material usage/variant/component choice from `README.md` for each product scenario;
- legacy owner and exports to remove;
- product behavior/failure paths that must remain unchanged;
- exact call-site translations to the canonical API;
- migration-owned proof and focused verifier commands.

Do not reopen Material contracts or standalone renderer architecture.

## Migration rules

1. Read `README.md` before consumer inventory so component purpose, correct use, variant/configuration guidance and related-component distinctions are explicit.
2. Inventory every applicable current/legacy consumer before editing.
3. Identify the product scenario and observable behavior owned by each consumer.
4. Determine whether this Material family is the correct component for that scenario. If Material guidance points to another official family, do not force the current family into the scenario for migration convenience.
5. Replace valid legacy Material usage with the canonical root-exported `MD*` API and correct official variant/configuration.
6. Keep product state, routing, persistence, errors, operation lifecycle, permissions and business behavior with their existing truthful owners.
7. If a legacy responsibility is not Material component behavior, keep or move it to the correct product/shared composition owner rather than adding it to the canonical Material component.
8. Do not preserve old Material props/events/tokens as compatibility aliases merely to reduce migration work.
9. Remove replaced legacy implementation, exports and obsolete proof only after every consumer has a correct destination.
10. Remove this family's old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` artifacts after the family is fully represented by `contract.ts`, `tokens.css`, `BEHAVIOR.md`, `README.md`, canonical runtime and migrated consumers.
11. Leave unrelated Material families untouched except when current guidance proves a consumer belongs to a different family; route that dependency rather than broad-migrating it implicitly.
12. Run focused migration/consumer verification.

## Upstream findings

If migration reveals that the finished component violates one of its fixed technical contracts, return `return-to-implementation` with the exact observable defect.

If migration reveals that a technical contract itself is wrong, identify the exact owner instead of changing it:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

If Material description/correct-use/variant-selection/related-component guidance is wrong or incomplete, return:

```text
return-to-guidance
```

Use `needs-architect` only for a real ownership/composition decision that cannot be resolved from current repository boundaries and Material guidance.

## Proof

Prove materially distinct consumer paths at the lowest faithful owner.

As applicable verify:

- consumers compile against the canonical root API;
- component/variant/configuration choice follows family README guidance;
- legacy-to-canonical event/state translation preserves product behavior;
- disabled/loading/error/permission/routing behavior remains with the product owner;
- accessibility composition remains correct at the product boundary;
- contextual public-token use still produces the required rendered result;
- obsolete imports, exports, legacy implementation and replaced proof are gone;
- no `@m3e/web`, `m3e-*`, renderer types/events or `--m3e-*` leak into consumers.

Do not duplicate standalone Material behavior tests at the product layer. Do not create artificial tests for prose-only guidance unless applying that guidance changes an observable product contract.

## Report

```text
MATERIAL MIGRATION RESULT
family: <canonical-family>
consumers inventoried: <summary>
consumers migrated: <summary>
Material guidance applied: yes | blocked
product behavior preserved: yes | blocked
legacy ownership removed: yes | no | not-applicable
focused verification: <commands/results>
required return owner: none | api-contract | token-contract | behavior-contract | guidance | implementation | architect
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-api-contract | return-to-token-contract | return-to-behavior-contract | return-to-guidance | return-to-implementation | needs-architect
```

## Forbidden

- Redesigning `contract.ts`, `tokens.css`, `BEHAVIOR.md`, `README.md`, or canonical component API during migration.
- Ignoring README guidance to preserve an easier legacy component/variant choice.
- Inspecting or consuming renderer-private API.
- Adding consumer-specific hacks to the canonical component.
- Preserving legacy aliases by default.
- Moving product/business behavior into Material.
- Migrating unrelated families for cleanup.
- Keeping replaced legacy implementation after all consumers have moved.
- Creating MIGRATION.md workflow logs.
- Depending on Git/PR/check state for migration correctness.
