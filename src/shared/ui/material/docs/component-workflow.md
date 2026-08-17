# Material component workflow

## Decision

One canonical Material family is delivered through three definition contracts, one standalone implementation stage, and migration only when product consumers require it:

```text
API CONTRACT
     ↓
TOKEN CONTRACT ─┐
                ├─→ CONTRACT READY → IMPLEMENTATION → MIGRATION IF REQUIRED
BEHAVIOR CONTRACT┘                                      ↓
                                                   ARCHITECT REVIEW / CI
```

The normal operator command is:

```text
material-component <name>
```

`.agents/skills/material-component/SKILL.md` is the **single executable orchestration specification**. This document records architecture and rationale only; it must not become a second step-by-step workflow.

## Why the contracts are separate

`contract.ts` owns renderer-independent Vue structure: public configuration, content roles, values, events when genuinely component-owned, and defaults.

`tokens.css` owns the current Material component-token catalogue.

`BEHAVIOR.md` owns observable behavior, accessibility, geometry, states, and motion.

API runs first because token and behavior workers need one shared structural vocabulary. Token and behavior remain independent semantic owners and derive their own facts from the repository-configured Material3 MCP. They may use `contract.ts` as structural scope, not as token or behavior authority.

This prevents renderer details, legacy code, and current Mioframe demand from shaping the canonical Material surface.

## Standalone implementation before consumers

Implementation consumes the fixed three contracts and exact installed `@m3e/web` public artifacts. It owns only:

- canonical Vue runtime;
- private family-local renderer adaptation;
- public-to-private token bridge in CSS;
- component-owned unit/browser/visual proof;
- focused verifier-managed implementation feedback.

It does not inspect application consumers to shape the component.

Migration is a separate stage because consumer composition and legacy removal are product concerns. It runs only when they actually need changes.

## Resume model

The operator does not carry stage state between sessions.

Two deliberately small mechanisms make resume deterministic:

- `scripts/materialComponentCompatibility.mjs` recomputes mechanically provable stale repository state;
- `.material-correction.json` temporarily stores one unresolved **semantic** owner/finding/scope only when that fact cannot be reconstructed mechanically.

Completed contract/runtime/proof files remain the durable work product. There is no workflow history database, completion manifest, review agent, or generic Material manager.

Mechanical routing is code; Material semantics stay with focused workers. After a correction, routing is recomputed rather than pre-planning a chain of speculative follow-up work.

## Completion boundary

A coding run is complete only when the three contracts are ready, no correction remains, standalone implementation has faithful proof with required focused verifier checks completed, and migration is complete or unnecessary.

Sandbox/container restrictions are execution-environment concerns, not operator work: coding workers use the repository-approved verifier approval/escalation path and report an exact environment blocker only when that path itself cannot run.

Coding work then stops. The architect owns semantic review of the whole family/PR, shared-UI blast radius, roadmap truth, GitHub PR handling, exact-head CI review, and merge readiness.

## Design constraints

Prefer this minimum workflow over adding more infrastructure:

- no operator-authored handoffs;
- no coding-agent final review stage;
- no proof/status database;
- no second compatibility model;
- no generic adapter/token framework created for workflow convenience;
- no rerun of completed owners merely because previous chat context is unavailable.

If repeated corrections show that ownership or the architecture itself is wrong, return to the architect instead of adding workaround stages.
