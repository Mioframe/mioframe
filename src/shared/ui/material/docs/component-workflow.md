# Material component workflow

## Decision

One operator command handles one official Material family:

```text
material-component <name>
```

The workflow is split by responsibility:

```text
API CONTRACT       ┐
TOKEN CONTRACT     │
BEHAVIOR CONTRACT  ├─→ MATERIAL DEFINITION READY
USAGE GUIDANCE     ┘
                         ↓
                  IMPLEMENTATION
                         ↓
                     MIGRATION
                         ↓
               INDEPENDENT REVIEW
                         ↓
               architect / PR / CI
```

The goal is not to minimize worker count. The goal is to keep every worker focused on one unambiguous responsibility and prevent m3e, legacy code, or application demand from diluting Material documentation during family definition and component implementation.

## Material definition phase

Before any component implementation, four fresh isolated workers create four canonical artifacts:

```text
material-component-api-contract
  → components/<family>/contract.ts

material-component-token-contract
  → components/<family>/tokens.css

material-component-behavior-contract
  → components/<family>/BEHAVIOR.md

material-component-guidance
  → components/<family>/README.md
```

The sole official documentation source for Material facts in these workers is the repository-configured `material3` MCP server from `.mcp.json`.

The four workers have no dependency on each other and may run in parallel when isolated worker execution supports it. Do not pass one worker's narrative reasoning to another.

They must not inspect m3e, legacy component implementation, product consumers, or current call-site demand.

### Ownership

- API worker owns only parameters/props, slots, events, public value types and defaults.
- Token worker owns only official public component tokens.
- Behavior worker owns only normative observable behavior, accessibility, geometry and motion.
- Guidance worker owns only component description and correct-use guidance for developers.

`README.md` is mandatory developer guidance, but it is not a fourth runtime contract. It must not duplicate API tables, token catalogues, or normative interaction/geometry/motion rules owned by the three technical contracts.

### Definition-ready gate

The orchestrator performs only a mechanical gate. Implementation may start when:

- API contract result is `complete`;
- token contract result is `complete`;
- behavior contract result is `complete`;
- guidance result is `complete`;
- none reports unresolved Material ambiguity or a blocker;
- `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and `README.md` exist at the canonical family owner.

There is no additional design, architecture, synthesis, source-ledger, or definition-review stage by default.

If a definition worker is blocked by contradictory or unavailable Material 3 MCP content, stop the family rather than guessing. Use `architect-handoff` only when the unresolved issue is an actual Mioframe ownership/public-contract decision rather than missing Material documentation.

## Implementation

`material-component-implementation` runs in a fresh isolated context after the definition-ready gate.

Its responsibility is only:

```text
three technical contracts
        +
exact lockfile-resolved @m3e/web docs/public artifacts
        ↓
canonical standalone Vue Material component
        +
component-owned proof
```

`README.md` is a prerequisite for a complete family definition but does not redefine runtime API/behavior/tokens.

Implementation must remain focused on Material and renderer integration. It must not inspect application consumers or legacy call sites to shape the component API or implementation contract.

The worker:

1. runs an implementation preflight for standalone component work and proof;
2. reads `contract.ts`, `tokens.css`, and `BEHAVIOR.md` as fixed runtime inputs;
3. inspects exact-version m3e documentation/examples/public artifacts for affected renderer mappings;
4. implements the Vue `MD*` component and private renderer glue;
5. consumes `contract.ts` types directly through typed Vue APIs instead of re-declaring the public API;
6. maps public tokens privately to renderer inputs without leaking m3e vocabulary into `tokens.css`;
7. proves the standalone API, behavior, accessibility, geometry, motion and token results at the lowest faithful levels;
8. stops when the standalone component is complete.

If implementation proves that a technical contract is wrong or incomplete, it returns the exact artifact owner:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

It must not edit that contract opportunistically while coding.

If m3e cannot faithfully implement a correct contract through documented direct support or a small family-local correction, use a documented exact-version workaround only when repository rules allow it; otherwise return `needs-architect` rather than weaken the public Material contract or recreate renderer internals.

## Migration

`material-component-migration` runs in a new isolated context only after standalone implementation is complete.

Its responsibility is only:

```text
finished canonical component
        +
family README usage guidance
        +
current product/legacy consumers
        ↓
application adoption of canonical Material usage
        +
legacy owner removal
```

Migration may inspect consumers and legacy implementation. It does not inspect m3e internals and does not redesign canonical Material artifacts or component API.

The worker:

1. runs a focused migration preflight;
2. reads `README.md` to establish how the official Material component should be used and which related component/variant/configuration fits each product scenario;
3. inventories every applicable current/legacy consumer and replaced owner;
4. maps each existing product scenario to the finished canonical component without changing Material guidance for convenience;
5. preserves product-owned state, routing, persistence, errors, lifecycle and business behavior outside Material;
6. moves non-Material legacy responsibility to its truthful product/shared composition owner rather than expanding Material;
7. removes replaced legacy implementation, exports and obsolete proof after every consumer has a correct destination;
8. removes old family DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW artifacts when this family has fully converted to the new definition model;
9. runs focused consumer/migration proof.

A migration problem caused by a correct canonical component is owned by migration. If migration exposes an actual implementation defect, return to implementation. If Material usage guidance itself is wrong or incomplete, return to guidance. Do not create compatibility aliases merely to preserve old call-site syntax.

## Independent review

`material-component-review` always runs in a fresh context independent from every definition, implementation and migration worker.

Review checks the complete resulting family, not only the latest patch:

1. independently query Material 3 MCP for public API facts and compare with `contract.ts`;
2. independently query Material 3 MCP for component tokens and compare with `tokens.css`;
3. independently query Material 3 MCP for behavior/accessibility/geometry/motion and compare with `BEHAVIOR.md`;
4. independently query Material 3 MCP for component description, usage guidance, variant-selection guidance, content guidance and related-component distinctions and compare with `README.md`;
5. verify runtime consumes the canonical API contract directly;
6. inspect exact-version m3e documentation/public artifacts for renderer mappings and mutable state;
7. verify public token mappings reach actual rendered parts/states;
8. verify behavior/accessibility/geometry/motion proof is faithful;
9. verify migrated consumers use the canonical component according to `README.md` while product behavior remains with product owners;
10. verify replaced legacy ownership and old staged family artifacts are removed;
11. review shared-UI/test blast radius and repository rules.

Review does not fix files and does not create a persistent `REVIEW.md`.

Findings route to one exact owner:

```text
api-contract
token-contract
behavior-contract
guidance
implementation
migration
architect
```

A successful review means ready for architect-owned PR/CI, not merge approval.

## Renderer boundary

`@m3e/web` is a private implementation dependency and is consulted only in implementation/review, never to define Material contracts or usage guidance.

Preferred implementation order:

1. documented direct renderer support;
2. small family-local adapter mapping/correction preserving the canonical contracts;
3. documented removable exact-version workaround for a confirmed renderer defect;
4. architecture/upstream escalation when faithful support requires private DOM coupling, duplicated renderer systems, new shared infrastructure, or public-contract compromise.

Never shrink or rename a canonical Material contract merely because m3e exposes a smaller or differently named API.

## Proof model

Use the lowest faithful proof for each changed contract:

- component/type proof for Vue public API and adapter boundaries;
- real browser proof for keyboard, pointer, focus, accessibility and fixed geometry;
- browser rendered-result proof for public CSS token mappings;
- visual proof for stable renderer-owned appearance/motion where appropriate;
- product E2E only for scenarios that cross Material ownership.

Usage guidance is independently reviewed against Material 3 MCP and applied during migration; do not invent tests merely to prove prose when no observable product contract changes.

A declaration, source mapping, host attribute, story, or screenshot alone does not prove a different observable contract.

## Correction routing

Keep corrections at the owner that introduced the defect.

```text
API contract defect
  → fresh API contract worker
  → implementation
  → migration when consumer-facing shape changed
  → review

Token contract defect
  → fresh token contract worker
  → implementation
  → review

Behavior contract defect
  → fresh behavior contract worker
  → implementation
  → review

Guidance defect
  → fresh guidance worker
  → migration when current consumer application may change
  → review

Implementation defect
  → fresh implementation worker
  → review

Migration defect
  → fresh migration worker
  → review

non-deterministic ownership/architecture defect
  → architect-handoff
  → resume at earliest invalidated worker
  → review
```

Do not rerun unaffected definition workers. After two unsuccessful correction rounds for the same underlying problem, stop patching and escalate to architecture.

## Existing-family transition

Untouched families may temporarily retain old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files as historical evidence.

When a family next completes this workflow:

- establish `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and `README.md`;
- make runtime and proof satisfy the three technical contracts;
- migrate consumers separately using canonical usage guidance;
- remove that family's obsolete staged artifacts;
- do not bulk-convert unrelated families.

## Orchestrator boundary

The `material-component` orchestrator is mechanical. It may:

- resolve the canonical family;
- launch the four definition workers, implementation, migration and review;
- preserve exact operator observations and correction findings;
- validate structured terminal results and the definition-ready gate;
- route an exact finding to its owner;
- stop on a genuine blocker;
- hand a successfully reviewed family to the architect.

It must not design Material API/tokens/behavior/guidance, inspect m3e semantics, implement code, migrate consumers, perform semantic review, or invent causes from operator observations.

## Completion

The coding-agent workflow is complete when:

- all three technical Material contracts are complete;
- family `README.md` contains complete current Material usage guidance;
- standalone implementation faithfully satisfies the technical contracts;
- required standalone proof passes;
- all applicable consumers are migrated using canonical Material guidance;
- replaced legacy ownership is removed;
- independent review has no unresolved finding;
- focused verification required by implementation/migration is complete or an exact external blocker is reported.

Then hand the result to the architect for PR update, exact-head CI, full PR review and merge readiness.
