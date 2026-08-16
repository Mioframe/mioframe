# Material component workflow

## Decision

One operator command handles one official Material family:

```text
material-component <name>
```

The workflow is split by responsibility:

```text
API CONTRACT       ┐
TOKEN CONTRACT     ├─→ TECHNICAL CONTRACT READY → IMPLEMENTATION ┐
BEHAVIOR CONTRACT  ┘                                              │
                                                                 ├─→ MIGRATION → INDEPENDENT REVIEW
USAGE GUIDANCE ──────────────────────────────────────────────────┘
```

The goal is to keep every worker focused on one unambiguous responsibility and keep irrelevant context out of later stages. Do not add a stage unless it owns a distinct required output or decision.

## Material source readiness

Before launching definition workers, the orchestrator mechanically checks the repository-configured `material3` MCP source for the selected component.

The source-ready check owns availability only; it does not interpret Material semantics or pass documentation content between workers.

1. Inspect MCP cache/coverage status and the relevant component routes exposed by the MCP.
2. If the cache is missing/stale or required component routes are marked stale because the local MCP cache needs refresh, perform one explicit full `refresh_material_docs` using normal safety defaults.
3. Do not use `force`, `promotePartial`, reduced `maxPages`, web search, or another documentation source to bypass source readiness.
4. Recheck the source after refresh.
5. Launch definition workers only when the relevant MCP source is readable and not stale.
6. If refresh fails or the required routes remain stale/unavailable/unresolved, stop with the exact source-infrastructure blocker.

A refreshable stale local MCP cache is not a semantic Material ambiguity and should not require operator intervention before the one normal recovery attempt.

## Material definition workers

Launch four fresh isolated workers:

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

Material facts for all four workers come only from the repository-configured `material3` MCP server in `.mcp.json`.

The workers own separate artifacts and may run in parallel when the runtime can safely isolate their file writes. Parallel execution is an optimization, not a correctness requirement; otherwise run the workers separately without merging responsibilities.

Definition workers must not inspect m3e, legacy component implementation, application consumers/current demand, or another definition worker's reasoning.

Each worker must distinguish source completeness from specification completeness:

- incomplete/stale/unreadable applicable source coverage is blocking;
- contradictory applicable official Material requirements are blocking;
- after complete source coverage, a detail Material does not prescribe is a non-blocking boundary of that artifact unless the missing fact is required to decide a Material-owned requirement.

`README.md` is developer-facing correct-use guidance, not a fourth runtime contract.

## Gates

The orchestrator performs mechanical gates only. It does not synthesize or reinterpret definition artifacts.

### Technical-contract-ready

Standalone implementation may start when:

- API contract result is `complete`;
- token contract result is `complete`;
- behavior contract result is `complete`;
- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist;
- none of those workers reports a blocking Material ambiguity or source-coverage blocker.

Material-unspecified details recorded after complete source coverage do not block implementation.

Guidance does not block implementation because implementation does not consume it.

### Migration-ready

Migration may start only when:

- standalone implementation is complete;
- guidance result is `complete`;
- `README.md` exists;
- guidance reports no blocking Material ambiguity or source-coverage blocker.

This allows usage guidance to run in parallel with contract extraction or standalone implementation without becoming an unnecessary serial dependency.

## Standalone implementation

Run `material-component-implementation` in a fresh context after the technical-contract-ready gate.

Its inputs are the three fixed technical contracts plus exact lockfile-resolved `@m3e/web` documentation/public artifacts. It owns only the standalone canonical Vue component, private renderer mapping, exports, and component-owned proof.

Implementation must not inspect application consumers or legacy call sites to shape the component. If the technical artifacts directly contradict one another, route the exact contradiction to its owning definition worker before coding rather than synthesizing a new contract.

For a behavior detail that Material intentionally leaves unspecified, implementation must not invent a Material requirement. Preserve normal Web/renderer behavior unless another repository-owned platform/accessibility contract requires a specific result, and prove only the observable behavior actually owned by Mioframe.

A correct Material contract is not weakened because m3e lacks direct support. Use the smallest allowed family-local mapping/workaround or escalate a genuine architecture/renderer ownership problem.

## Migration

Run `material-component-migration` in a separate fresh context after the migration-ready gate.

Its inputs are the finished canonical component, all four family definition artifacts, current consumers, and replaced legacy ownership. Migration reads `README.md` before adapting consumers so component/variant/configuration choice follows official Material guidance rather than legacy convenience.

Migration does not inspect renderer internals and does not redesign the canonical family. Product state, persistence, routing, errors, operation lifecycle, and business behavior remain with their truthful product owners.

## Independent review

Run `material-component-review` in a fresh context independent from every authoring worker after migration completes.

Review the complete resulting family, not only the latest patch. The reviewer independently uses Material 3 MCP to check API, tokens, behavior, and usage guidance; checks exact-version m3e mapping and proof; checks current consumers; and checks legacy removal/ownership.

Review does not fix files and does not create a persistent `REVIEW.md`.

A successful review means ready for architect-owned PR/exact-head CI, not merge approval.

## Correction routing

Route each underlying problem to its exact owner and rerun only stages invalidated by that correction:

```text
api-contract
  → API worker → implementation → migration if consumer-facing shape changed → review

token-contract
  → token worker → implementation → review

behavior-contract
  → behavior worker → implementation → review

guidance
  → guidance worker → migration if current application may change → review

implementation
  → implementation worker → review

migration
  → migration worker → review

non-deterministic ownership/architecture
  → architect-handoff → resume at earliest invalidated worker → review
```

Do not rerun unaffected definition workers. After two unsuccessful correction rounds for the same underlying problem, stop patching and escalate to architecture.

## Dependencies

A Material family consumes another Material family only through its canonical public API. If implementation or migration discovers a required dependency family that is not canonical/complete, process that family through the same workflow before resuming the parent.

Detect dependency cycles and escalate them to architecture. Do not persist a dependency revision graph.

## Handoffs and context

Repository artifacts are the durable handoffs. Pass only exact unresolved findings, affected scope, and lossless operator observations between worker contexts.

Do not pass hidden reasoning, previous narrative reports, copied source encyclopedias, unrelated logs, Git/PR state, or external-check state between workers.

## Existing-family transition

Untouched families may temporarily retain old `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`, and legacy index README files as historical evidence.

When a family completes this workflow:

- establish `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and canonical usage `README.md`;
- make runtime/proof satisfy the three technical contracts;
- migrate consumers using canonical guidance;
- remove that family's obsolete staged artifacts and legacy README index content;
- leave unrelated families untouched.

## Orchestrator boundary

The `material-component` orchestrator may only resolve the family, establish Material MCP source readiness, launch fresh workers, validate structured gate results, preserve exact observations/findings, route corrections, stop on blockers, and hand a successfully reviewed family to the architect.

It must not design Material API/tokens/behavior/guidance, inspect m3e semantics, implement code, migrate consumers, perform semantic review, or claim merge readiness.

## Completion

The coding-agent workflow is complete when:

- Material 3 MCP source readiness was established for the selected family;
- all three technical contracts are complete;
- family usage guidance is complete;
- standalone implementation faithfully satisfies the technical contracts;
- required standalone proof passes;
- all applicable consumers are migrated using canonical Material guidance;
- replaced legacy ownership is removed;
- independent review has no unresolved finding;
- focused implementation/migration verification is complete or an exact external blocker is reported.

Then hand the result to the architect for PR update, exact-head CI, full PR review, and merge readiness.
