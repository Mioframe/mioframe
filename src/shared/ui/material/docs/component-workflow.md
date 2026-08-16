# Material component workflow

## Decision

One official Material family is implemented through three focused technical contracts and two coding stages:

```text
API CONTRACT
     ↓
TOKEN CONTRACT ─┐
                ├─→ CONTRACT READY → IMPLEMENTATION → MIGRATION IF REQUIRED → ARCHITECT REVIEW / CI
BEHAVIOR CONTRACT┘
```

The API contract runs first because it establishes the canonical current structural surface: developer-selectable configurations, content roles, public values and defaults. Token and behavior remain separate owners and may read `contract.ts` only as that structural boundary; Material facts still come only from Material 3 MCP.

The coding workflow ends at architect handoff. Semantic PR review, exact-head CI review, roadmap completion, and merge readiness are architect-owned and are not duplicated by another coding-agent review worker.

The only normal operator command is:

```text
material-component <name>
```

The operator does not remember the current stage or carry correction instructions between agent sessions. The workflow is resume-first and reconstructs its next action from repository state.

## Deterministic routing boundary

Mechanical current-rule compatibility is code, not LLM reasoning.

After resolving the canonical family, run inside the normal agent sandbox:

```text
node scripts/materialComponentCompatibility.mjs --family <family>
```

The resolver returns one compact JSON result:

```json
{"version":1,"family":"exampleAction","status":"clean","owner":null,"violations":[]}
```

or:

```json
{"version":1,"family":"exampleAction","status":"route","owner":"token-contract","violations":[...]}
```

`route` is a normal routing result, not a failed verification. The resolver exits non-zero only when its invocation or repository IO contract is broken.

The resolver owns only mechanically provable repository compatibility, currently including:

- missing mandatory contract/runtime artifacts;
- old function-valued slot-property syntax where the current API artifact requires Vue-shaped slot method signatures;
- renderer-private vocabulary in `contract.ts`;
- `--md-comp-*` component defaults owned by `:root` rather than the family boundary;
- private `--m3e-*` variables in public `tokens.css`;
- Material/m3e custom-property names used by runtime Vue/TypeScript outside CSS ownership.

It must not decide:

- Material semantics or current-vs-baseline classification;
- renderer capability or behavioral fidelity;
- accessibility meaning or motion fidelity;
- consumer demand or migration correctness;
- whether an otherwise structurally valid contract is semantically correct.

Do not reproduce these checks manually in the orchestrator. If the resolver cannot execute or its output contract is invalid, return that exact failure to the architect rather than falling back to an LLM compatibility audit.

The resolver is workflow routing only. It does not replace verifier-managed implementation/proof checks.

## Material source readiness

Before running a contract worker, mechanically verify that the repository-configured `material3` MCP source for the selected component is readable and current enough for that worker.

If the source is missing or stale because the local cache needs refresh, perform one normal non-forced full refresh and recheck. Do not use `force`, `promotePartial`, reduced `maxPages`, web search, memory, or another documentation source to bypass a source failure.

Do not repeat source refresh/check work merely because implementation, migration, or architect review is being resumed from already-complete contracts.

## Contract workers

### API contract

Run `material-component-api-contract` first in a fresh isolated context. It owns only:

```text
components/<family>/contract.ts
```

It establishes the current public structural boundary from Material 3 MCP without reading m3e, legacy code or consumers.

### Token and behavior contracts

After API completes, token and behavior remain separate fresh contexts:

```text
material-component-token-contract
  → components/<family>/tokens.css

material-component-behavior-contract
  → components/<family>/BEHAVIOR.md
```

Both may read `contract.ts` only to reuse the established configuration/content-role boundary and public terminology. They independently query Material 3 MCP for facts in their own scope. They must not copy facts from `contract.ts`, reinterpret it to fit m3e, or edit it.

If Material evidence in token/behavior scope proves `contract.ts` structurally wrong or incomplete, report `return-to-api-contract` with the exact contradiction instead of compensating locally.

## Contract artifact atomicity

A contract artifact becomes a durable completed-stage artifact only when its worker returns `complete`.

For a new/missing contract:

1. finish Material source inspection;
2. perform the worker completion check;
3. write/replace the owned artifact only after that check can return `complete`.

If the worker is blocked, it must not create a new partial owned artifact.

A completed file is reusable only while the deterministic resolver no longer routes to its owner and no pending semantic correction targets it.

## Durable semantic correction recovery

Mechanical incompatibilities are recomputed by `materialComponentCompatibility.mjs` and are **not** persisted.

A semantic correction discovered by a focused worker or architect may not be reconstructable safely from files after context/token-limit interruption. While one such correction is active, store only that fact at:

```text
components/<family>/.material-correction.json
```

Shape:

```json
{
  "owner": "api-contract | token-contract | behavior-contract | implementation | migration",
  "finding": "one exact unresolved defect",
  "affectedScope": "concise contract/proof/consumer scope"
}
```

This is transient recovery state only. It is not a Material contract, source ledger, review artifact, history log, or completion record.

Rules:

1. Keep exactly one active semantic owner.
2. Persist the marker before routing away from a worker or returning with an unresolved semantic correction.
3. Consolidate multiple currently known semantic findings for that owner into one concise finding/scope.
4. Do not store deterministic resolver findings, timestamps, hashes, counters, worker reports, hidden reasoning, Git/PR/CI state, or proposed fixes.
5. If the targeted worker completes and returns another semantic correction owner, replace the marker atomically.
6. Clear the marker only after the active semantic correction is resolved and no replacement semantic route is returned.
7. The marker must be absent at successful architect handoff.
8. Architect review may create the marker directly for a repository-visible semantic correction. The operator still invokes only `material-component <name>`.

## Resume rules

The orchestrator determines the next action in this order:

1. Resolve the canonical family.
2. Read `.material-correction.json` when present.
3. Run `materialComponentCompatibility.mjs`.
4. Compare the pending semantic owner, if any, with the deterministic route owner, if any, using:

   ```text
   api-contract → token-contract → behavior-contract → implementation → migration
   ```

5. Run only the earliest owner. A deterministic route is recomputed after interruption; a semantic marker remains until its own finding is resolved.
6. After the selected owner completes, rerun the deterministic resolver before choosing another stage.
7. When the resolver is `clean` and no semantic correction is pending, continue incomplete standalone implementation/proof.
8. Run migration only when current consumers or replaced legacy ownership still require it.
9. When implementation/proof and required migration are complete and no marker remains, stop and hand the family to the architect.

Do not pre-plan a chain of later corrections. Fix the current earliest owner and rerun the resolver because that correction may invalidate or eliminate later findings.

A fresh agent does not rerun completed stages merely because previous chat context is unavailable.

If current ownership cannot be determined by the deterministic resolver, the semantic marker, or the explicit stage gates, return `needs-architect` instead of rebuilding the pipeline.

## Contract-ready gate

Standalone implementation may start when:

- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist as completed artifacts;
- the deterministic resolver has no contract-owner route;
- no semantic correction targets a contract owner;
- token/behavior workers reported no unresolved `return-to-api-contract` contradiction.

Implementation does not perform another Material definition pass.

## Standalone implementation

Run `material-component-implementation` in one fresh context.

Inputs are only the three fixed contracts, applicable Material adapter/token rules, exact lockfile-resolved `@m3e/web` documentation/public artifacts, and component-owned proof conventions.

The implementation worker owns:

- canonical Vue runtime;
- private renderer mapping;
- canonical exports;
- component-owned unit/browser/visual proof;
- focused verifier-managed checks.

It must not inspect application consumers or migrate legacy call sites.

If implementation proves a contract semantically wrong, return the exact owner (`api-contract`, `token-contract`, or `behavior-contract`) and stop. The orchestrator persists that semantic route before another worker starts. Do not rewrite the contract inside implementation.

An interrupted implementation resumes from current family runtime/proof unless an earlier deterministic or semantic correction takes precedence.

## Migration

Run `material-component-migration` in a separate fresh context only when migration is actually required.

For a first family conversion, migration inventories consumers, adapts them to the finished canonical API, preserves product-owned behavior, removes replaced legacy ownership, and runs focused consumer proof.

For a correction to an already-migrated family, skip migration when consumer usage does not change and legacy ownership is already gone. Adding an optional public configuration with an unchanged default, for example, does not by itself require another migration worker.

Migration does not inspect m3e internals and does not redefine Material contracts.

If migration returns an upstream semantic correction, persist it before routing or returning.

## Correction routing

Semantic correction runs remain targeted:

```text
api-contract
  → API worker → downstream owners only when actually invalidated

token-contract
  → token worker → implementation

behavior-contract
  → behavior worker → implementation → migration only if consumer composition changed

implementation
  → implementation worker

migration
  → migration worker

architecture / unclear ownership
  → architect
```

After every owner correction, rerun the deterministic resolver and inspect any semantic route returned by that worker. Do not rerun unaffected stages. After two unsuccessful correction rounds for the same underlying problem, stop patching and return to architecture.

## Worker handoffs

Repository files are the durable completed-work handoff. `.material-correction.json` is only the durable unresolved **semantic** handoff.

Between workers pass only the selected owner, exact finding/scope, and lossless operator observations that materially affect that worker. Do not pass hidden reasoning, previous narrative reports, copied source encyclopedias, Git/PR history, or unrelated logs.

## Status ownership

Coding stages must not mark the Material roadmap, PR, or family as architect-reviewed, CI-ready, merge-ready, or complete for the program.

`docs/roadmap.md` is updated only after architect review establishes the truthful resulting status. An interrupted coding run therefore cannot leave a false `no blocker` / `review complete` milestone behind.

## Completion

The coding-agent workflow is complete when:

- the three technical contracts exist and the deterministic resolver has no route;
- no semantic correction remains;
- standalone implementation and required proof are complete;
- required consumer migration and legacy removal are complete, or migration is not required;
- focused verifier-managed checks required for edited code/proof have completed or an exact external blocker is reported;
- `.material-correction.json` is absent.

The final action is always handoff to the architect for semantic review, PR handling, exact-head CI, roadmap update, and merge readiness.
