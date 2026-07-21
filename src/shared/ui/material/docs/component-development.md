# Material component convergence workflow

This is the canonical workflow for creating, repairing, migrating, or completing one official public Material component family from only its family name or an explicitly bounded objective.

The coding agent owns technical discovery, architecture, decomposition, implementation, proof, documentation, and continuation. The operator owns Git operations and repository publication workflow.

## Universal agent model

Repository-owned policy lives in:

- scoped `AGENTS.md` files for short routing and stable invariants;
- `.agents/skills/*/SKILL.md` for reusable workflows and specialist contracts;
- this documentation for durable architecture and convergence rules;
- the owning family README for current family state and accepted facts.

No tool-specific agent directory is a policy owner. Any runtime may execute a portable skill in the main context or in an isolated agent context.

Use the main orchestrator context for phases that share substantial state: orientation, contract synthesis, correction selection, implementation, adoption, state updates, and workflow advancement.

Use an isolated read-only context when research, browser evidence, or independent review would otherwise flood the orchestrator context. The isolated role returns only its structured result and cannot delegate further.

## Sequence

```text
material-component <family>
→ resume or initialize family state
→ one bounded family orientation
→ concern-lane and dependency plan
→ concern-scoped material-canonical-target when required
→ selected isolated audits
   - material-semantics-audit
   - material-token-audit
   - material-web-audit
→ synthesize highest-priority complete correction contract
→ independent contract gate
→ complete exact foundation or official-family prerequisite when required
→ implement one bounded correction unit
→ conditional adoption and obsolete-owner cleanup
→ focused proof
→ independent correction-final gate
→ refresh affected state only
→ repeat correction selection while required gaps remain
→ independent material-family-review
→ final verification
```

Production edits are forbidden before the correction contract gate passes. Required prerequisites complete before the calling correction continues.

## Responsibility model

`material-component` is the sole family writer and orchestrator. It:

- resolves the family, mode, supported scenarios, current owner, and public surface;
- builds and maintains the bounded orientation map;
- selects concern lanes;
- inventories dependencies and owns dependency-closure status;
- synthesizes specialist results;
- chooses the next correction unit;
- invokes and returns from exact prerequisites;
- implements corrections and adoption;
- updates family state and roadmap facts;
- decides whether to continue, reopen a decision, complete, or stop.

Read-only concern skills:

- `material-canonical-target`: official target claims for the delegated concern only;
- `material-semantics-audit`: API, native/form/event semantics, accessibility, state, extensions, consumers, and dependencies;
- `material-token-audit`: token taxonomy, ownership, graph direction, routing, and rendered proof;
- `material-web-audit`: DOM, CSS ownership, layout, adaptive behavior, motion, lifecycle, and browser/visual proof;
- `material-component-review`: one proposed or implemented correction unit;
- `material-family-review`: the complete resulting family state after no known required gap remains.

A specialist never edits files, chooses another concern, updates roadmap state, or invokes another role.

## Family orientation

Perform one bounded orientation before detailed research:

```text
FAMILY ORIENTATION
Family:
Mode: new-component | align-existing | focused-correction
Canonical owner:
Legacy or missing owners:
Public entry points:
Family files:
Direct dependencies:
Representative consumers:
Proof owners:
Locked target claims:
Known unresolved concerns:
```

Read applicable instructions and Material documents first, then the owning README, implementation, direct dependencies, public exports, representative consumers, and applicable proof. Expand repository search only for a named dependency, compatibility path, or ownership question.

Do not rebuild the full orientation after every correction. Refresh only changed or invalidated facts.

## Concern plan

Record:

```text
CONCERN PLAN
Objective:
Required scenarios and platforms:
Non-goals:
Target claims requiring research:
Semantics lane: required | not-required — reason
Token lane: required | not-required — reason
Web lane: required | not-required — reason
Required direct dependencies:
Dependency closure: closed | blocked
Foundation prerequisite: none | <exact contract>
Official-family prerequisite: none | <exact public contract>
Adoption scope: none | <exact consumers/owners>
```

Rules:

- new families and complete family alignment require every applicable lane;
- a focused correction runs only affected lanes and direct dependencies;
- token changes require the token lane and also the Web lane when rendered behavior changes;
- DOM, layout, styling, motion, responsive, or browser lifecycle changes require the Web lane;
- API, native semantics, accessibility, state ownership, extensions, or consumer contracts require the semantics lane;
- each role reports cross-lane dependencies to the orchestrator instead of absorbing them.

## Dependency closure and prerequisites

A supported scenario resolves each required dependency to one ready owner:

- canonical Material foundation;
- canonical official Material family public contract;
- valid generic non-Material foundation;
- explicit Mioframe extension owner.

Classify each dependency as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

Closure is blocked by required temporary legacy Material ownership, missing or unresolved reference/system tokens, unowned shared behavior, known-defective contracts, private cross-family imports, hidden required fallbacks, dependency cycles, or parallel active owners.

For a family-agnostic cross-family contract, invoke `material-foundation` for the smallest complete required slice. For another official component, invoke or resume that family's `material-component` workflow only until the exact required public contract is ready. Return to the calling family afterward.

Maintain a prerequisite stack and stop on a cycle with the exact dependency chain.

## Evidence reuse

A fresh context resets reasoning, not independently confirmed repository facts.

Reuse a locked claim until its applicability changes or authoritative, implementation, proof, reviewer, or operator evidence contradicts it. A new session, new correction unit, mechanical documentation change, or unrelated concern does not invalidate accepted evidence.

Canonical target research runs only for missing or invalidated claims. Implementation executes the locked concern contracts and proof lanes; it does not rerun audits unless new contradictory evidence explicitly reopens a lane.

## Contract synthesis and correction order

Synthesize only the selected target and audit results plus dependency closure. Choose the smallest complete highest-priority correction:

1. unresolved required source or platform decision;
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

A lower-priority correction cannot bypass a higher-priority blocker affecting the same supported surface.

## Convergence loop

After each accepted correction-final review:

1. update only affected orientation and durable contract facts;
2. reclassify remaining required concerns;
3. select the next highest-priority complete correction;
4. continue without rerunning full orientation or accepted audits.

The workflow does not stop after one correction while a known required gap remains.

## Workflow state

The owning README contains one compact current-state block:

```text
MATERIAL WORKFLOW STATE
Family:
Mode:
Current objective:
Current stage: orientation | target | assessment | contract-review | prerequisite | implementation | adoption | correction-review | family-review | verification
Canonical target status: draft | locked | reopened
Selected concern status:
Dependency closure: closed | blocked
Prerequisite stack: none | <ordered stack and state>
Current correction unit: none | <exact unit>
Implementation status: not-started | complete | blocked
Correction review status: not-started | passed | failed
Family review status: not-started | complete | blocked
Operator visual status: not-required | required | accepted | rejected
Family alignment status: aligned | converging | blocked
Remaining required gaps: none | <exact gaps>
Next action:
Blocker: none | <exact blocker>
```

The README stores current target decisions, classifications, durable contracts, proof obligations, correction unit, dependency status, and remaining gaps. It does not store review history, shell transcripts, search output, exact route ledgers, stage diaries, or scorecards.

## Review budgets

Each correction contract and correction-final gate allows one initial independent review and at most one substantive re-review. The final family review follows the same budget.

A second failed review stops with consolidated blockers. Mechanical wording, count, or cross-reference fixes receive an orchestrator consistency check rather than another broad review. A recurring root ownership or architecture failure after two correction rounds reopens architecture.

## Proof lanes

- unit/component: deterministic API, state normalization, native attributes, token graph structure, dependency mapping, and narrow routing;
- browser: computed values, inheritance, layout, focus, keyboard, forms, propagation, pointer/touch, adaptive behavior, animation lifecycle, cancellation, and reduced motion;
- visual: screenshots and official comparison only;
- consumer: integration and compatibility;
- architecture: applicable repository guards and single-owner/dependency invariants.

Visible changes require explicit operator comparison. Browser behavior is not proved by screenshots alone.

## Final family review

Run `material-family-review` only when the orchestrator has no known required gap. It independently checks the complete supported surface, ownership, dependencies, public contract, implementation, consumers, cleanup, proof, documentation, and verification obligations.

The family review does not inspect Git history or decide pull-request merge readiness.

## Completion

Family completion requires:

- explicit supported scenarios and unsupported surface;
- no required `misaligned`, `unresolved`, `obsolete`, or `temporary-legacy-material` concern;
- closed dependency graph and completed prerequisites;
- valid token, DOM, semantic, style, and motion contracts;
- one canonical owner and intended public API;
- complete requested adoption and obsolete-owner cleanup;
- sufficient proof and accepted operator comparison when required;
- `material-family-review: complete`;
- final repository verification.

Do not create duplicate contracts, durable audits, registries, inventories, scorecards, checklists, progress ledgers, or workflow-history documents.
