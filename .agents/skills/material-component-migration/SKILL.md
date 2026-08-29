---
name: material-component-migration
description: 'Use only when a finished canonical Material component still requires consumer migration or legacy-owner removal.'
---

# Material component migration

Migrate current Mioframe consumers to one finished canonical Material component. Do not run this worker for an already-migrated family correction that does not change consumer usage.

## Input gate

Require:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
standalone canonical component implementation and proof: complete
```

Do not invoke the generic `implementation-preflight` workflow for this deterministic Material stage.

## Authority

Read applicable `AGENTS.md`, the three technical contracts, finished canonical component/public exports, current consumers, replaced legacy implementation, and only the testing ownership needed for affected consumer proof.

The canonical component is fixed input. Migration does not redesign Material contracts or renderer architecture.

## Isolation

Run in a fresh context separate from implementation.

You may inspect consumers and legacy implementation because they are the migration subject. Do not inspect m3e internals or renderer-private API.

## Proof planning gate

Before consumer production edits, record a scoped `TEST IMPACT` item for each materially affected consumer/product contract using the canonical fields from `docs/testing/architecture.md`: independent `Oracle source`, `Must reject`, primary/additional proof, existing/new proof, `Test author`, `Red phase`, risk/platform matrix, and durable ownership updates. This is the migration owner's narrow equivalent proof-planning record; it does not invoke generic `implementation-preflight`, create persisted workflow state, or move proof ownership into Material.

Use the current product/public contract and required preserved behavior as the oracle; the finished canonical Material component or the migration's eventual output is not an independent oracle for product behavior.

Before editing a consumer:

- if existing owning proof remains valid with unchanged oracle/assertions, preserve and use it normally;
- if a new assertion-bearing test/spec is required or an existing proof materially changes its oracle/expectations/assertions/failure semantics, delegate that exact `TEST IMPACT` item to a fresh `test-authoring` context using the truthful proof-type skill, and consume accepted non-visual proof/RED evidence before the corresponding consumer production edit;
- if an intentional consumer visual baseline must change and target pixels cannot exist yet, establish its independent visible contract/spec intent in a pre-implementation test-author pass, perform the consumer migration without creating/approving the baseline, then use a fresh post-implementation test-author/`visual-regression-testing` pass for baseline acceptance and GREEN visual proof;
- do not duplicate standalone Material proof at the product layer merely because the consumer changes.

## Migration

1. Inventory every applicable current/legacy consumer before editing.
2. Identify the product behavior owned by each consumer and preserve it.
3. Replace valid legacy Material usage with the canonical root-exported `MD*` API.
4. Keep product state, routing, persistence, errors, operation lifecycle, permissions and business behavior with their truthful owners.
5. Do not add legacy compatibility aliases merely to reduce migration work.
6. Remove replaced legacy implementation/exports/proof only after every consumer has a valid destination.
7. Remove old family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` artifacts when that family has fully moved to the current contract/runtime shape.
8. Leave unrelated families untouched.
9. Use focused verifier feedback only when useful while migrating or when a concrete migration risk requires narrow proof. Do not run broad automatic repository verification solely for handoff.

If the family was already migrated and an architect correction changes only standalone implementation/tokens while preserving the public consumer usage/defaults, the orchestrator should skip this worker entirely.

## Upstream findings

If migration reveals that the finished component violates a fixed technical contract, return `return-to-implementation`.

If a technical contract itself is wrong, return the exact owner:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

Use `needs-architect` only for a real product/composition ownership decision that current contracts cannot resolve.

## Proof

As applicable prove in the repository:

- consumers compile against the canonical root API;
- legacy-to-canonical event/state translation preserves product behavior;
- accessibility composition remains correct at the product boundary;
- obsolete imports, exports, legacy implementation and replaced proof are gone;
- no `@m3e/web`, `m3e-*`, renderer types/events or `--m3e-*` leak into consumers.

Do not duplicate standalone Material behavior/token tests at the product layer.

Any new/materially changed assertion-bearing consumer proof or intentional changed visual baseline must complete the independent `test-authoring` boundary established by the proof-planning gate. The migration context must not weaken accepted non-visual proof before first GREEN or create/approve an intentional changed baseline it is expected to satisfy.

Follow the root rules and `.agents/skills/verification/SKILL.md`; verifier invocation/environment handling is owned only by that skill, and exact-head GitHub CI is the architect-owned final automatic repository gate. Do not add Material-specific verifier environment handling or ask the operator to run verifier commands.

## Report

```text
MATERIAL MIGRATION RESULT
family: <canonical family>
consumers inventoried: <summary>
consumers migrated: <summary>
product behavior preserved: yes | blocked
legacy ownership removed: yes | no | not-applicable
local feedback: none | <focused verifier-managed proof/diagnostics actually used>
required return owner: none | api-contract | token-contract | behavior-contract | implementation | architect
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-api-contract | return-to-token-contract | return-to-behavior-contract | return-to-implementation | needs-architect
```

## Forbidden

- Redesigning technical contracts or canonical component API during migration.
- Inspecting renderer-private API.
- Adding consumer-specific hacks to the canonical component.
- Preserving legacy aliases by default.
- Moving product/business behavior into Material.
- Migrating unrelated families for cleanup.
- Authoring or weakening a required consumer acceptance oracle in the migration context when `test-authoring` is required.
- Creating/regenerating/approving an intentional changed consumer visual baseline in the migration context.
- Asking the operator to run verifier commands.
- Updating roadmap, PR, CI, review, or merge status.
- Running a final broad local verification gate solely to duplicate CI.
