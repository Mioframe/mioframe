---
name: material-component-migration
description: 'Use after standalone Material implementation is complete to adapt all current Mioframe consumers to the finished canonical component, preserve product behavior, remove replaced legacy ownership, and run focused migration proof without redesigning Material.'
---

# Material component migration

Migrate one completed canonical Material component into Mioframe.

## Input gate

Require:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
standalone canonical component implementation and proof: complete
```

Do not begin migration while standalone implementation is blocked or a contract correction remains unresolved.

## Authority

Read applicable `AGENTS.md`, the three canonical family contracts, the finished canonical component/public exports, current consumers, legacy implementation being replaced, and current testing ownership.

The canonical component is fixed input. Migration asks how product scenarios should use it; migration does not redesign it.

## Isolation

Run in a fresh isolated context separate from the implementation worker.

You may inspect application consumers and legacy implementation now because they are the subject of migration.

Do not inspect m3e internals or renderer-private API. Consumers must use only canonical Mioframe Material APIs.

## Preflight

Before consumer edits, run `implementation-preflight` scoped only to:

- consumer inventory;
- legacy owner and exports to remove;
- product behavior/failure paths that must remain unchanged;
- exact call-site translations to the canonical API;
- migration-owned proof and focused verifier commands.

Do not reopen Material contract or standalone renderer architecture.

## Migration rules

1. Inventory every applicable current/legacy consumer before editing.
2. Identify the product scenario and observable behavior owned by each consumer.
3. Replace legacy Material usage with the canonical root-exported `MD*` API.
4. Keep product state, routing, persistence, errors, operation lifecycle, permissions and business behavior with their existing truthful owners.
5. If a legacy responsibility is not Material component behavior, keep or move it to the correct product/shared composition owner rather than adding it to the canonical Material component.
6. Do not preserve old Material props/events/tokens as compatibility aliases merely to reduce migration work.
7. Remove replaced legacy implementation, exports and obsolete proof only after every consumer has a correct destination.
8. Remove this family's old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` artifacts after the family is fully represented by the three current contracts and migrated runtime.
9. Leave unrelated Material families untouched.
10. Run focused migration/consumer verification.

## Upstream findings

If migration reveals that the finished component violates one of its fixed contracts, return `return-to-implementation` with the exact observable defect.

If migration reveals that the contract itself is wrong, identify the exact contract owner instead of changing it:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

Use `needs-architect` only for a real ownership/composition decision that cannot be resolved from current repository boundaries.

## Proof

Prove materially distinct consumer paths at the lowest faithful owner.

As applicable verify:

- consumers compile against the canonical root API;
- legacy-to-canonical event/state translation preserves product behavior;
- disabled/loading/error/permission/routing behavior remains with the product owner;
- accessibility composition remains correct at the product boundary;
- contextual public-token use still produces the required rendered result;
- obsolete imports, exports, legacy implementation and replaced proof are gone;
- no `@m3e/web`, `m3e-*`, renderer types/events or `--m3e-*` leak into consumers.

Do not duplicate standalone Material behavior tests at the product layer.

## Report

```text
MATERIAL MIGRATION RESULT
family: <canonical-family>
consumers inventoried: <summary>
consumers migrated: <summary>
product behavior preserved: yes | blocked
legacy ownership removed: yes | no | not-applicable
focused verification: <commands/results>
required return owner: none | api-contract | token-contract | behavior-contract | implementation | architect
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-api-contract | return-to-token-contract | return-to-behavior-contract | return-to-implementation | needs-architect
```

## Forbidden

- Redesigning `contract.ts`, `tokens.css`, `BEHAVIOR.md`, or canonical component API during migration.
- Inspecting or consuming renderer-private API.
- Adding consumer-specific hacks to the canonical component.
- Preserving legacy aliases by default.
- Moving product/business behavior into Material.
- Migrating unrelated families for cleanup.
- Keeping replaced legacy implementation after all consumers have moved.
- Creating MIGRATION.md workflow logs.
- Depending on Git/PR/check state for migration correctness.
