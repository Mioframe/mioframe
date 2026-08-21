# Material component workflow

## Decision

One canonical Material family is delivered through three ordered definition contracts, one standalone implementation stage, and migration only when product consumers require it:

```text
API CONTRACT
     ↓
TOKEN CONTRACT
     ↓
BEHAVIOR CONTRACT
     ↓
CONTRACT READY → IMPLEMENTATION → MIGRATION IF REQUIRED
                                      ↓
                                 ARCHITECT REVIEW / CI
```

The normal operator command is:

```text
material-component <name>
```

`.agents/skills/material-component/SKILL.md` is the **single executable orchestration specification**. This document records architecture and rationale only; it must not become a second step-by-step workflow.

## Why the contracts are separate

`contract.ts` owns renderer-independent Vue structure: public configuration, content roles, values, events, and defaults.

`tokens.css` owns the current Material component-token contract and is the sole owner of tokenized visual values. Detailed token cascade/ownership is defined by `component-tokens.md`.

`BEHAVIOR.md` owns remaining observable behavior: anatomy/content relationships, interaction, keyboard, accessibility, state relationships, layout relationships/non-tokenized constraints, motion, and Material-unspecified boundaries. It must not repeat visual values already represented by `tokens.css`.

The order is intentional. API establishes structural scope first. Token then establishes the visual-value contract. Behavior runs last and may read completed `tokens.css` only as an exclusion boundary so one visual fact never gets two normative owners. Behavior still derives its own facts from the repository-configured Material3 MCP; token names/defaults are not behavior authority.

This prevents renderer details, legacy code, current Mioframe demand, and duplicated visual specifications from shaping the canonical Material surface.

## Standalone implementation before consumers

Implementation consumes the fixed three contracts and exact installed `@m3e/web` public artifacts. It owns canonical Vue runtime, private family-local renderer adaptation, CSS token bridges, component-owned proof, and focused verifier-managed implementation feedback when useful.

It does not inspect application consumers to shape the component.

Migration is a separate stage because consumer composition and legacy removal are product concerns. It runs only when they actually need changes.

## Resume model

The operator does not carry stage state between sessions.

Two deliberately small mechanisms make resume deterministic:

- `scripts/materialComponentCompatibility.mjs` recomputes mechanically provable stale repository state;
- `.material-correction.json` temporarily stores one unresolved **semantic** owner/finding/scope only when that fact cannot be reconstructed mechanically.

Completed contract/runtime/proof files remain the durable work product. There is no workflow history database, completion manifest, review agent, or generic Material manager.

Mechanical routing is code; Material semantics stay with focused workers. After a correction, routing is recomputed rather than pre-planning speculative follow-up work.

### Temporary legacy bridge

Families created by the previous staged workflow may still contain `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, or `MIGRATION.md`. Those files only identify that the family has not finished conversion yet.

The old workflow did not create `BEHAVIOR.md` but could already contain a demand-scoped `tokens.css`. Therefore the transition needs one exception only:

```text
legacy staged artifacts remain
+ current contract.ts exists
+ current BEHAVIOR.md does not exist
→ current token-contract is still incomplete
```

The orchestrator runs token normally, reruns deterministic routing, then continues to behavior and the ordinary owner order. If execution stops between token and behavior, token may be derived again on the next invocation. This bounded repeat is cheaper and clearer than introducing completion metadata or another state mechanism.

An old `REVIEW.md` with `Verdict: compliant` is historical evidence while legacy staged artifacts remain. Migration removes replaced staged artifacts after the family is converted.

This bridge is temporary. After the existing legacy families have all been converted, remove the bridge instead of keeping permanent compatibility logic.

## Cross-family architecture migrations

`material-component <name>` is a one-family semantic/implementation workflow, not a batch repository migration framework.

When an architect changes a library-wide mechanical invariant while existing Material facts remain unchanged — for example moving already-known family component-token defaults from the old host selector to the canonical `:root` cascade model — apply that change as one scoped repository architecture correction rather than forcing every affected family through a fresh semantic Material3 MCP derivation.

Such a repository correction may update only mechanically implied state plus its verification/proof:

- unchanged declarations/ownership placement;
- compatibility resolver/guard behavior and tests;
- affected private bridges only where the invariant requires it;
- cross-family composition proof required by the architectural change.

It must not silently change token names/defaults/aliases/current-status semantics. If a family exposes a semantic uncertainty during the migration, stop treating that family as mechanical and route the exact question through the normal owner (`api-contract`, `token-contract`, or `behavior-contract`).

Do not add a new permanent workflow stage, batch manager, compatibility layer, or special family mode for a one-time architecture migration. Once the repository baseline is migrated, normal `material-component` runs operate directly on the new invariant.

## Architect review handoff

`project-review` remains independent architect-owned review and `REVIEW.md` remains review state, not a coding queue.

When architect review returns `blocked` with an actionable `NEXT CORRECTION`, the same architect pass must translate that handoff into the family's `.material-correction.json` before telling the operator to run `material-component <name>` again.

For Material, the generic review handoff maps directly to the existing marker fields:

```text
NEXT CORRECTION owner          → .material-correction.json owner
NEXT CORRECTION finding        → .material-correction.json finding
NEXT CORRECTION affected scope → .material-correction.json affectedScope
```

Only the next owner is routed. Findings owned by later/downstream owners stay in `REVIEW.md` until the next architect re-review. This preserves owner order without a no-op coding run between review and correction.

Do not ask the operator to rerun `material-component` while review is blocked and no correction marker exists, unless `project-review` reported that the next owner/order itself is unresolved. Resolve architecture/ownership first rather than using the coding workflow as a router.

The coding workflow must not select findings from `REVIEW.md` itself; that would create a competing correction queue and blur architect ownership.

## Completion boundary

A coding run is complete when the three contracts are ready, no correction remains, standalone implementation has faithful proof, and migration is complete or unnecessary.

Focused verifier commands are optional implementation/diagnostic feedback or narrow task-specific proof. They are not a mandatory final completion checklist, and coding workers do not reproduce the repository-wide automatic gate solely for handoff.

Coding work then stops. The architect owns semantic review of the whole family/PR, shared-UI blast radius, roadmap truth, GitHub PR handling, exact-head CI review, and merge readiness. GitHub CI on the exact published head is the automatic repository verification gate.

## Design constraints

Prefer this minimum workflow over adding more infrastructure:

- no operator-authored handoffs;
- no coding-agent final review stage;
- no coding-agent final repository verification stage that duplicates CI;
- no proof/status database;
- no second compatibility model;
- no generic adapter/token framework created for workflow convenience;
- no rerun of completed current-workflow owners merely because previous chat context is unavailable;
- one bounded token repeat is acceptable only at the temporary legacy token→behavior boundary;
- no empty operator iteration between blocked architect review and a known correction owner;
- no repeated semantic derivation for a mechanical cross-family architecture migration;
- delete the legacy bridge after the final legacy family is converted.

If repeated corrections show that ownership or the architecture itself is wrong, return to the architect instead of adding workaround stages.
