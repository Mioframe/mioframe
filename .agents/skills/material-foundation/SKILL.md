---
name: material-foundation
description: 'Use for one focused cross-family Material token, theme, typography, shape, elevation, motion, interaction, icon, overlay, accessibility, density, or adaptive correction, or when material-component delegates an exact blocking foundation prerequisite.'
---

# Material foundation orchestrator

Follow `src/shared/ui/material/docs/foundation-development.md`, `src/shared/ui/material/docs/architecture.md`, and `src/shared/ui/material/docs/tokens.md`.

Use standalone for one real cross-family correction or when `material-component` delegates an exact prerequisite. The workflow owns technical discovery and implementation for that foundation domain. Git operations and publication workflow are outside scope.

## Concern plan

Lock:

- foundation domain and mode: `new-foundation`, `align-existing`, or `focused-correction`;
- objective and exact required family-agnostic contract;
- current legacy or missing owner;
- required cross-family scenarios and affected families;
- applicable platforms and non-goals;
- completion condition;
- selected concern lanes.

Select only affected lanes and direct dependencies:

- concern-scoped `material-canonical-target` when official claims need research;
- `material-semantics-audit` for public, lifecycle, and affected-family contracts;
- `material-token-audit` for reference/system graph work;
- `material-web-audit` for rendered, platform, and motion behavior.

Existing cross-family reuse does not by itself prove foundation ownership.

When delegated by a component, use the smallest coherent slice required to close that component's dependency. Do not expand into a full foundation migration.

## Execution model

Use isolated read-only contexts for source research, verbose audits, and independent reviews when available. Otherwise execute the same portable skills sequentially with bounded inputs. Contract synthesis, implementation, affected-family adoption, state updates, and continuation stay in this orchestrator context.

```text
resume or initialize domain state
→ bounded orientation
→ selected target research and audits
→ domain contract synthesis
→ independent correction contract gate
→ one complete prerequisite or correction unit
→ affected-family validation and legacy-owner cleanup or forwarding
→ independent correction-final gate
→ update current domain state
→ continue next required unit or return to calling component
→ final verification
```

Production edits are forbidden before the contract gate passes.

## Evidence reuse and budget

Locked claims remain valid until contradictory source, implementation, proof, reviewer, or operator evidence appears. Do not repeat accepted target or audit work for a new session or correction unit.

Each contract and correction-final gate allows one initial review and at most one substantive re-review. A second failure stops with consolidated blockers. Mechanical documentation fixes receive a local consistency check rather than another broad review.

## Foundation gate

Confirm the concern is inherently cross-family, family-agnostic, currently required, and not already correctly owned by a generic or family-local mechanism.

Another official component family is not foundation. A Button dependency on Progress Indicator requires a ready Progress Indicator public family contract or deferral of the dependent extension.

For token work:

- reference/system tokens and real `--mio-sys-*` extensions are foundation-owned;
- component tokens and family-private routes remain family-owned;
- exact names, locations, dependency direction, cycles, unresolved references, fallbacks, and public/private surface are explicit;
- the legacy token file receives no new canonical category;
- a coherent required group moves without duplicate active declarations;
- the static token guard and affected-family computed proof are required.

For behavior and style foundations such as state layer, ripple, shared motion adaptation, symbols, or focus:

- define one narrow family-agnostic public contract;
- move or replace the complete behavior required by the calling scenario;
- update affected families to the canonical contract;
- retain a legacy entry point only as a forwarding compatibility path when other consumers still need it;
- remove parallel implementations and prove affected-family behavior.

Keep exact graph and motion-route evidence transient. Store only durable ownership, semantics, public surface, proof obligations, current correction, and remaining gaps.

## Correction selection

Choose the highest-priority complete correction with explicit owner, dependencies, affected families, proof lane, failing observation, compatibility and visual impact, operator requirement, and completion condition.

When multiple required units remain, continue the same convergence loop without restarting full orientation or accepted audits.

## Delegated prerequisite completion

Return `complete` only when:

- the canonical foundation owner owns the full required contract;
- the calling component can consume it without a private or legacy import;
- replaced declarations or behavior have one active owner;
- any retained legacy path only forwards to the canonical owner;
- affected-family static, browser, consumer, visual, and architecture proof passes as applicable;
- no known defect remains in the required contract.

Otherwise return blocked and do not allow the calling component to continue.

Track nested prerequisites and stop on a dependency cycle with the exact chain.

## Result

```text
MATERIAL FOUNDATION RESULT
Domain:
Mode:
Objective:
Required contract:
Previous owner:
Canonical owner:
Status: complete | blocked
Completed correction units:
Dependency closure:
Selected lane results:
Affected families:
Legacy owner result: removed | forwarding-only | not-applicable | blocked
Calling-family consumption: canonical | blocked | not-applicable
Correction review:
Operator status:
Verification:
Remaining required gaps: none | <exact gaps>
Blocker: none | <exact blocker>
Next action: return-to-caller | <exact foundation action> | none
```

When delegated by `material-component`, return control without advancing component implementation or roadmap state.

## Forbidden

- broad domain audit for a bounded concern;
- target and implementation assessment in one context;
- production edits before contract approval;
- repeated accepted research without contradiction;
- more than one substantive re-review per gate;
- same-context approval when independent review is required;
- foundation justified only by duplication, reuse count, or hypothetical need;
- another component family's tokens, private routes, API, anatomy, or state in foundation;
- invented names, invalid graph edges, parallel owners, hidden required fallbacks, runtime token managers, registries, generic resolvers, duplicate systems, or unjustified full-domain rewrites;
- returning complete while the calling family still depends on the required legacy owner;
- Git, branch, commit, pull-request, or merge operations;
- review history, shell transcripts, exact route ledgers, checklists, or scorecards.
