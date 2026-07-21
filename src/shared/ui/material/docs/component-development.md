# Material component convergence workflow

This is the single canonical workflow for an official public Material component family.

The workflow separates responsibility by concern as well as by stage. No read-only agent owns the whole family by default. The orchestrator selects only the concern lanes required by the current objective and its direct dependencies.

## Sequence

```text
material-component
→ task and PR scope lock
→ concern-lane selection
→ concern-scoped material-canonical-target when required
→ selected isolated audits
   - material-semantics-audit
   - material-token-audit
   - material-web-audit
→ material-component-contract synthesis
→ independent correction contract gate
→ exact foundation prerequisite when required
→ one material-component-implementation correction unit
→ conditional material-component-adoption
→ independent correction final gate
→ material-pr-review for complete PR merge readiness
→ verification
```

Production edits are forbidden before the correction contract gate passes.

## Responsibility model

`material-component` is the only orchestrator. It selects lanes, synthesizes results, writes workflow state and roadmap facts, and decides whether to advance or stop. Internal roles do not invoke each other.

Read-only concern roles:

- `material-canonical-target`: official target claims for the delegated concern set only;
- `material-semantics-audit`: public API, native/form/event semantics, accessibility, state ownership, extensions, dependencies, consumers, and relevant proof;
- `material-token-audit`: token taxonomy, ownership, graph direction, routing, static validation, and rendered token proof;
- `material-web-audit`: DOM, CSS ownership, layout, responsive behavior, motion implementation, browser lifecycle, and browser/visual proof;
- `material-component-review`: one correction contract gate or correction final gate;
- `material-pr-review`: complete base-to-head PR merge readiness.

The contract and implementation stages are writers with one bounded responsibility. Reviewers never implement fixes.

## Concern-lane selection

Before delegation, record:

```text
CONCERN PLAN
Objective:
PR base/head:
Required scenarios:
Changed/public owners:
Target claims requiring research:
Semantics lane: required | not-required — reason
Token lane: required | not-required — reason
Web lane: required | not-required — reason
Foundation prerequisite: none | <exact prerequisite>
Adoption scope: none | <exact owners/consumers>
```

Rules:

- focused corrections run only affected lanes and direct dependencies;
- a token declaration/routing change requires the token lane and the Web lane when rendered behavior is affected;
- DOM, style, layout, or motion changes require the Web lane;
- API, native semantics, accessibility, state ownership, extensions, or consumer contract changes require the semantics lane;
- new families, full owner migrations, or explicit full-family audits require all applicable lanes;
- no role may absorb another lane merely because it discovers a dependency; report the dependency to the orchestrator.

## Evidence reuse

A fresh context resets reasoning, not independently confirmed repository facts.

- Locked target claims outside the current concern set are reused.
- Re-research is required only when new evidence contradicts a locked claim or the objective changes its applicability.
- Reviewers independently verify changed, disputed, high-risk, or generalized claims; they do not re-derive the entire accepted target by default.
- Once a claim has authoritative source evidence, matching implementation evidence, and proof in the correct lane, do not repeat the same investigation without contradictory evidence.
- Existing tests, consumers, snapshots, names, and green CI remain evidence, not authority.

## Task and PR scope

Lock one family, mode (`new-component`, `align-existing`, or `focused-correction`), correction objective, required scenarios/platforms, non-goals, PR base/head, and public owners affected by the complete PR.

Existing families use `align-existing`. Relocation, decomposition, API preservation, adoption, and cleanup are actions, not modes.

A defect is PR-owned when it exists in the resulting base-to-head change, even when it predates the latest correction round on the feature branch.

## Workflow state

The owning README begins with one current state block:

```text
MATERIAL WORKFLOW STATE
Family:
Mode:
Current objective:
Current stage: target | assessment | contract-review | foundation | implementation | adoption | correction-review | pr-review | verification
Canonical target status: draft | locked | reopened
Assessment status: not-started | complete | blocked
Contract review status: not-started | passed | failed
Current correction unit: none | <exact unit>
Implementation status: not-started | complete | blocked
Correction review status: not-started | passed | failed
PR review status: not-started | passed | failed
Operator visual status: not-required | required | accepted | rejected
Family alignment status: aligned | converging | blocked
Next gate:
Blocker: none | <exact blocker>
```

The README stores current target decisions, classifications, durable contracts, proof obligations, correction unit, and remaining gaps. It must not contain review-round history, shell transcripts, exact route ledgers, repeated source narratives, or counts that do not affect the contract.

## Target research

Run `material-canonical-target` only for the target claims affected by the concern plan. A new family may require a full target; a focused correction normally does not.

Token presence does not prove support. Token absence does not cancel explicit guidance. Platform guidance is not transferable without an explicit decision.

## Concern audits

Each selected audit runs in a separate read-only context and returns only its lane result. Findings are classified as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, `obsolete`, or `not-applicable`.

`confirmed-compliant` requires applicable authority, matching implementation, correct ownership, faithful proof, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, compatible dependencies, and separate proof. A known defect prevents completion.

Dependencies are classified as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation.

## Contract synthesis

`material-component-contract` receives the concern plan, target slices, and only the selected audit results. It must not perform another broad audit.

Select the smallest complete highest-priority correction unit. Priority remains:

1. unresolved required source/platform decision;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token ownership, naming, placement, graph, and rendered routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion implementation and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

A lower-priority improvement cannot bypass a higher-priority blocker affecting the same PR-owned public surface.

## Review budgets and stop conditions

Each gate allows one initial review and at most one correction re-review.

- A second failed review stops the workflow and returns consolidated blockers to the operator.
- The same root ownership, source, proof, or architecture problem appearing after two correction rounds requires architecture reconsideration, not another patch cycle.
- Mechanical corrections that do not change target, ownership, correction scope, proof decision, or observable result do not trigger a new full review. The orchestrator performs a local consistency check.
- A reviewer must not restart complete source research because of a typo, stale cross-reference, wording correction, or file count.
- Role outputs are concise structured results. Consolidate related findings; do not create narrative review history.

Stop immediately for missing required evidence, unresolved platform applicability, unclear ownership, invalid token graph, incomplete browser evidence, unavailable independent context, operator rejection, or failed required verification.

## Proof lanes

- unit/component: deterministic API, state normalization, native attributes, token graph structure, and narrow routing;
- browser: computed token values, inheritance, layout, focus, keyboard, forms, propagation, pointer/touch, responsive behavior, animation lifecycle, and reduced motion;
- visual: screenshots only;
- consumer: integration and compatibility.

Visible changes require official comparison and explicit operator status. Browser behavior does not belong in visual specs.

## Correction and adoption review

The correction contract gate reviews the proposed unit and selected lane evidence only. The correction final gate reviews the implemented unit, affected owners, affected consumers, and required proof. Neither gate decides complete PR merge readiness.

Adoption runs only when ownership migration or cleanup is explicitly in scope and moved consumers receive a ready contract.

## PR review

After correction final review, run `material-pr-review` against the actual PR base and head.

It reviews every owner and consumer changed by the PR, all PR-owned unresolved concerns, migration completeness, architecture guards, proof coverage, workflow state, and PR metadata. Feature-branch history cannot make a resulting PR defect `pre-existing` or `out of scope`.

A bounded correction may be complete while the PR remains unmergeable.

## Verification

Changed Material CSS, Vue styles, token files, or shared Material token foundations must trigger the repository token architecture guard in focused verification. Green CI is not sufficient when an applicable guard was skipped.

Family completion requires no required `misaligned`, `unresolved`, or `obsolete` concern, valid token and motion contracts, one canonical owner, completed adoption/cleanup, required operator acceptance, passed PR review, and final verification.

Do not create duplicate contracts, durable audits, registries, scorecards, checklists, progress ledgers, or workflow-history documents.