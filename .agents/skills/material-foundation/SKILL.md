---
name: material-foundation
description: 'Use for one focused cross-family Material token, theme, typography, shape, elevation, motion, interaction, icon, overlay, accessibility, density, or adaptive correction, or when material-component delegates an exact foundation prerequisite.'
---

# Material foundation orchestrator

Follow `src/shared/ui/material/docs/foundation-development.md`, `docs/architecture.md`, and `docs/tokens.md`.

Use standalone for one real cross-family correction or when `material-component` delegates an exact prerequisite. Do not choose or advance a component stage.

## Concern plan

Lock domain, objective, required cross-family scenarios, affected families, platforms, non-goals, actual PR base/head, and selected lanes:

- concern-scoped `material-canonical-target` when target claims need research;
- `material-semantics-audit` for public/lifecycle/consumer contracts;
- `material-token-audit` for reference/system graph work;
- `material-web-audit` for rendered/platform/motion behavior.

Run only affected lanes and direct dependencies. Existing cross-family use does not by itself prove foundation ownership.

## Sequence

```text
selected target research and isolated audits
→ domain contract synthesis
→ independent correction contract gate
→ one correction unit
→ affected-family validation and cleanup
→ independent correction final gate
→ return to calling component or material-pr-review when standalone
→ verification
```

Production edits are forbidden before the contract gate passes.

## Isolation and budget

Read-only roles run in separate bounded contexts and receive only concern scope, scenarios, platforms, repository ref, locked claims, paths, and result format. They do not absorb another lane.

Each contract/final gate allows one initial review and at most one substantive re-review. A second failure stops with consolidated blockers. Mechanical documentation fixes do not trigger a full re-review. Do not repeat accepted target/audit work without contradictory evidence.

## Foundation gate

Confirm the concern is inherently cross-family, family-agnostic, currently required, and not already correctly owned by a generic or family-local mechanism.

For token work:

- reference/system tokens and real `--mio-sys-*` extensions are foundation-owned;
- component tokens and family-private routes remain family-owned;
- exact names, locations, dependency direction, cycles, unresolved references, fallbacks, and public/private surface are explicit;
- the legacy token file receives no new canonical category;
- a coherent group moves without duplicate active declarations;
- the static token guard and affected-family computed proof are required.

Keep exact graph and motion-route evidence transient. Store current durable ownership, semantics, public surface, proof obligations, and gaps only.

Choose one highest-priority complete correction unit with explicit owner, dependencies, affected families, proof lane, failing observation, compatibility/visual impact, operator requirement, and completion condition.

## Result

```text
MATERIAL FOUNDATION RESULT
Domain:
Objective:
Concern plan:
Status: complete | blocked
Correction contract gate:
Correction unit result:
Selected lane results:
Affected families:
Correction final review:
Standalone PR review: passed | failed | not-applicable
Operator status:
Verification:
Remaining gaps:
Blocker: none | <exact blocker>
```

When delegated by `material-component`, return control without roadmap updates, component implementation, or another family selection.

## Forbidden

- broad domain audit for a bounded concern;
- target and implementation assessment in one context;
- production edits before contract approval;
- more than one substantive re-review per gate;
- same-context approval;
- foundation justified only by duplication, reuse count, or hypothetical need;
- component tokens/private routes/API/anatomy/state in foundation;
- invented names, invalid graph edges, parallel owners, hidden required fallbacks, runtime token managers, registries, generic resolvers, duplicate foundation systems, or full-domain rewrites without owner justification;
- review history, shell transcripts, exact route ledgers, checklists, or scorecards.
