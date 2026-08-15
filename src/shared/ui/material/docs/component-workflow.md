# Material component workflow

## Decision

One operator command handles one official Material family:

```text
material-component <name>
```

The normal workflow uses three fresh worker contexts:

```text
CONTRACT
  → IMPLEMENT + MIGRATE
  → INDEPENDENT REVIEW
  → architect / PR / exact-head CI
```

The workflow intentionally prefers the minimum reliable orchestration. Add another stage only when a demonstrated ownership boundary cannot be handled safely inside these three roles.

The durable family source of truth is the narrow contract defined by [`component-contract.md`](./component-contract.md), plus runtime code and executable proof. Worker reports are handoff data, not persistent parallel documentation.

## Why this shape

- Contract extraction is separated from renderer and legacy influence.
- Implementation and consumer migration stay in one coding context because they are one repository transformation and share the same canonical API.
- Independent review remains a fresh context so the author does not approve its own work.
- Non-deterministic architecture is exceptional and escalates to `architect-handoff`; it is not a mandatory stage for every wrapper.
- GitHub CI and merge readiness remain architect-owned outside the coding-agent workflow.

## Canonical family contract

Before implementation, the family owns:

```text
contract.ts   — props, slots, emits, public types/defaults/combinations

tokens.css    — executable public official Material component-token contract

BEHAVIOR.md   — anatomy, states, interaction, accessibility, geometry, motion

GUIDANCE.md   — correct consumer usage and composition guidance

SOURCES.md    — official-source provenance and conflicts
```

See [`component-contract.md`](./component-contract.md) for exact ownership.

The public contract is derived from official Material, not from current Mioframe demand, legacy API, or m3e capability. The application adapts to the canonical component after the standalone component is proven.

## Worker boundaries

### Contract worker

Runs in a fresh isolated context.

Owns only official Material → canonical family contract.

It may read applicable rules, Material foundation/token conventions, current family contract files when refreshing, and official Material sources. It must not use m3e, legacy component implementation, or product consumers to choose the public API, behavior, or token surface.

It returns one of:

```text
complete
blocked — exact official-source/contract ambiguity
needs-architect — exact non-deterministic public-contract decision
```

### Implementation worker

Runs in a fresh isolated context after the contract is complete.

Owns the complete repository transformation:

1. read the canonical contract;
2. run one implementation preflight covering component implementation, proof, consumer migration, and legacy removal;
3. inspect documentation and public artifacts shipped with the exact lockfile-resolved `@m3e/web` version;
4. implement the canonical Vue component and private renderer mapping;
5. prove the standalone component before adapting application consumers;
6. inventory every legacy/current consumer;
7. migrate consumers to the canonical API without changing the contract for convenience;
8. remove replaced legacy ownership and obsolete staged family artifacts;
9. run the smallest faithful verifier-managed checks for the changed contracts.

Implementation may not redesign the Material contract to match m3e or legacy code.

It returns one of:

```text
complete
blocked — exact implementation/migration blocker
return-to-contract — exact contract defect proved during implementation
needs-architect — exact renderer/ownership/composition decision that is not deterministic from repository rules
```

### Independent review worker

Always runs in a fresh context independent from the contract/implementation authors.

It reviews the complete resulting family and consumers, not only the latest patch. It independently checks:

- official Material sources ↔ `contract.ts`, `tokens.css`, `BEHAVIOR.md`, `GUIDANCE.md`;
- source provenance/conflicts in `SOURCES.md`;
- canonical contract ↔ Vue implementation;
- exact-version m3e documentation/public artifacts ↔ private renderer mapping;
- CSS tokens ↔ actual rendered results;
- behavior, accessibility, geometry and motion ↔ faithful proof;
- canonical standalone component ↔ migrated consumers;
- removal of replaced legacy ownership and stale staged artifacts;
- repository rules, testing ownership, and blast radius.

Review does not fix production code and does not write a persistent `REVIEW.md`.

It returns:

```text
compliant
compliant-with-listed-risks
blocked → contract
blocked → implementation
blocked → architect
```

A successful review is readiness for architect-owned PR/CI, not merge approval.

## Renderer boundary during implementation

`@m3e/web` is a private implementation dependency. The implementation worker uses it only after the Material contract is fixed.

For every selected mapping, inspect exact-version renderer documentation/examples and public artifacts. Classify gaps by observable contract, not by naming similarity.

Preferred order:

1. direct documented renderer support;
2. small family-local adapter mapping/correction that preserves the canonical contract;
3. documented, removable exact-version workaround for a confirmed renderer defect;
4. `architect-handoff` or upstream m3e fix when faithful implementation would require new shared infrastructure, private DOM coupling, duplicated renderer behavior, or a public-contract compromise.

Never shrink or rename the canonical Material API merely because m3e exposes a smaller or differently named API.

## Standalone-first migration rule

Consumer migration begins only after the canonical standalone component and its required proof are complete enough to establish the component contract independently of the application.

Migration then asks:

```text
How should this product scenario use the canonical Material component?
```

It must not ask:

```text
How should the canonical component change to make this legacy call site easy to preserve?
```

If a legacy scenario is not actually Material component behavior, keep that responsibility in the correct product/shared composition owner rather than expanding the Material API.

## Proof model

Use the lowest faithful proof for each contract:

- TypeScript/component contract tests for props, slots, emits, defaults and boundary filtering;
- real browser proof for keyboard, pointer, focus, accessibility and rendered geometry;
- visual regression for stable renderer-owned appearance and motion states where appropriate;
- computed/rendered browser results for public CSS token mappings;
- product/E2E proof only for product scenarios that cross Material ownership.

A declaration, source mapping, host attribute, story, or screenshot alone does not prove a rendered Material token or fixed geometry contract.

Focused checks are implementation feedback. GitHub CI on the exact PR head is the final repository gate.

## Correction routing

Keep correction routing small and explicit.

```text
contract defect
  → fresh contract worker
  → fresh implementation worker when runtime/consumers can be affected
  → fresh independent review

implementation or migration defect
  → fresh implementation worker with the exact finding
  → fresh independent review

non-deterministic architecture/ownership decision
  → architect-handoff
  → resume at the earliest invalidated worker
  → fresh independent review
```

Do not rerun contract extraction for a purely local implementation correction. Do not split migration into another worker merely because the correction touches consumers.

If two correction rounds for the same underlying problem still show ownership drift, mixed responsibilities, contract instability, or growing workaround logic, stop patching and escalate to architecture.

## Existing-family transition

Untouched families may temporarily retain old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files. They are legacy evidence only.

When a family next completes this workflow:

- establish the five canonical contract files;
- make runtime code/tests/consumer migration match them;
- remove the old staged artifacts for that family;
- do not bulk-convert unrelated families in the same PR.

## Orchestrator boundary

The `material-component` orchestrator is intentionally thin. It may:

- resolve the canonical family;
- launch the three worker roles;
- carry exact operator observations and exact correction findings;
- validate structured terminal results;
- route contract/implementation corrections or architecture escalation;
- stop on a genuine blocker;
- hand a successfully reviewed family to the architect.

It must not design APIs, inspect m3e semantics, implement code, migrate consumers, perform review, invent causes from operator observations, or run broad verification to duplicate PR CI.

## Completion

The coding-agent Material workflow is complete when:

- the canonical family contract is complete and internally consistent;
- the component faithfully implements that contract through private renderer integration;
- required standalone proof passes;
- all applicable consumers use the canonical API correctly;
- replaced legacy ownership and obsolete staged artifacts are removed;
- independent review reports no unresolved finding;
- focused implementation verification is complete or an exact external blocker is reported.

Then hand the result to the architect for PR creation/update, exact-head CI, full PR review, and merge readiness.
