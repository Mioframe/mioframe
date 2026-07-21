---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or completing one official Material component family. A family-only invocation reconstructs current truth, closes prerequisites, and stops only when aligned or exactly blocked.'
---

# Material component orchestrator

This is the sole writer and orchestrator for one official Material component family. The operator supplies a family name or an explicit bounded objective. The agent owns technical discovery, architecture, prerequisites, implementation, proof, documentation, and continuation. Git and publication workflow are outside this skill.

Follow the applicable nested `AGENTS.md`, `src/shared/ui/material/docs/component-development.md`, `architecture.md`, and `tokens.md`.

## Invocation

- `material-component <family>` means `full-family`.
- `focused-correction` requires an explicit bounded operator objective.
- A delegated dependency call is `prerequisite-contract` and completes only that exact public contract.

For `full-family`, one correction unit is not the end of the invocation. `converging` is internal progress only. Terminal results are `aligned` or an exact external `blocked` result.

README or roadmap text cannot narrow the invocation, exclude a used dependency, or turn an internal prerequisite into future operator work.

## Current-state preflight

Do not resume from persisted execution state. Reconstruct current truth from code before selecting work:

```text
CANONICALIZATION PREFLIGHT
Family:
Invocation scope:
Candidate canonical owner:
Public export present:
Migrated consumers:
Legacy owner state:
Direct imports and injected dependencies:
Required CSS/token dependencies:
Legacy Material dependencies:
Dependency closure: closed | blocked
Documentation contract: valid | stale | contains-forbidden-execution-state
```

Inspect actual owners, imports, styles, token references, exports, representative consumers, legacy paths, guards, and proof. Existing tests and README contract facts are evidence, not architecture authority.

If an owner README contains workflow state, backlog, correction/review history, shell output, commit narratives, or future passes, remove that execution material before using the README as evidence. Preserve only durable supported surface, API, semantics, ownership, token/style/motion contracts, extensions, unsupported behavior, and proof obligations.

Build one bounded orientation and reuse accepted evidence until contradicted. Refresh only invalidated facts.

## Dependency closure

Classify every dependency required by the supported surface as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

A used dependency remains inside this orchestration even when another owner implements it. Closure is blocked by temporary legacy ownership, missing/unresolved tokens, unowned shared behavior, defective contracts, private cross-family imports, hidden fallbacks, cycles, or parallel owners.

When closure is blocked:

1. do not select lower-priority local work for the same surface;
2. run the smallest complete `material-foundation` prerequisite for a family-agnostic contract;
3. run the owning `material-component` prerequisite for another official family;
4. return to the calling family automatically;
5. stop only for an exact external blocker or cycle.

When supported, run each delegated prerequisite in a fresh focused writable context and return only its structured result. Otherwise execute the owning skill sequentially. The caller retains the prerequisite stack and continuation responsibility.

An internal prerequisite is work, not a terminal blocker or an operator decision.

## Canonicalization gate

A candidate canonical owner, Material root export, migrated consumer, removed/forwarding legacy owner, or canonical/adoption/alignment claim requires complete dependency closure for the supported surface.

While closure is blocked, do not retain a ready root export, migrate more consumers, remove the only complete legacy owner, declare adoption complete, or treat a real dependency as outside scope.

If premature canonicalization already exists, dependency closure or safe rollback is the highest-priority correction.

## Convergence

```text
current-state preflight
→ bounded orientation and concern plan
→ missing/invalidated target and audit evidence only
→ highest-priority complete correction contract
→ independent contract review
→ exact prerequisite when required
→ one bounded implementation
→ conditional adoption and cleanup
→ focused proof
→ independent correction-final review
→ refresh affected facts
→ next correction without restarting accepted work
→ independent material-family-review
→ final pnpm verify
```

Wrong ownership/dependencies outrank semantics, API, state, DOM, token cleanup, layout, motion, extensions, adoption, and cleanup for the same surface.

After each accepted unit, refresh affected facts, rerun preflight when ownership/exports/imports/consumers/prerequisites changed, and continue. Do not end while a required gap, internal prerequisite, failed Material guard, or repairable verification failure remains.

Each correction gate permits one initial review and at most one substantive re-review. Repeated ownership failure reopens architecture rather than adding workarounds.

## Documentation

Repository documentation is not execution memory:

- owner README: durable contract only;
- roadmap: active family, alignment status, exact external blocker, and one next action only;
- current correction, prerequisites, review results, and continuation remain in the active context and structured stage results.

Never write workflow-state blocks, backlogs, correction/review history, shell transcripts, commit narratives, route inventories, scorecards, or future-pass plans into owner documentation.

## Completion

`full-family` is `aligned` only when required concerns are compliant or validly unsupported, dependencies/prerequisites are complete, one canonical owner/public contract remains, adoption/cleanup and required proof are complete, operator comparison is accepted when required, `material-family-review` returns `complete`, and final `pnpm verify` passes.

Return `blocked` only for an exact unresolved source conflict, product decision, platform applicability question, unsafe cycle, unavailable required evidence, repeated independent review failure, operator rejection, or verification failure that cannot be corrected inside the family or exact prerequisites.

A known next correction, internal prerequisite, ownership outside the family, stale documentation, or repairable red check means continue.

## Result

```text
MATERIAL COMPONENT RESULT
Family:
Invocation scope:
Mode:
Status: aligned | blocked
Canonical owner:
Supported surface:
Completed correction units:
Dependency closure:
Completed prerequisites:
Family review:
Operator visual status:
Verification:
Remaining required gaps: none | <exact gaps>
Blocker: none | <exact external blocker>
Next action: none | <exact action required to unblock>
```

## Forbidden

- persisted execution state in owner README;
- lower-priority work around open ownership/dependency closure;
- treating a used dependency or prerequisite as out of scope;
- canonical export/adoption/removal with open closure;
- asking the operator to choose technical Material ownership;
- duplicate registries, audits, histories, checklists, scorecards, ledgers, or workflow policy;
- Git, branch, commit, pull-request, or merge operations.