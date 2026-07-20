---
name: material-component-contract
description: 'Internal Material stage used only by material-component to synthesize a completed material-canonical-target result and a separate material-current-state-audit result into one family contract, alignment map, dependency map, prioritized correction unit, and locked proof lane before independent review.'
---

# Material component contract

Internal stage only. Follow `src/shared/ui/material/docs/component-development.md` and `src/shared/ui/material/docs/tokens.md`; do not redefine their workflow or token architecture.

## Required inputs

Receive:

- locked task scope from `material-component`;
- completed `material-canonical-target` result;
- completed `material-current-state-audit` result;
- current repository ref and applicable instructions;
- owning family README or temporary legacy contract.

Block when target and current-state research were not isolated, either result is incomplete, or production/proof changes for the proposed unit preceded the contract gate.

## Responsibility

Synthesize, validate, and write the single family contract and workflow record.

Resolve:

- canonical supported and unsupported surface;
- source decisions and platform applicability;
- complete concern classifications;
- dependency classifications and ownership;
- proof classifications;
- token taxonomy, public surface, private routing responsibility, and graph defects;
- implementation decomposition;
- durable style and motion contracts;
- highest-priority complete correction unit;
- proof lane, compatibility impact, visual impact, operator requirement, and completion condition;
- remaining known gaps and next gate.

Do not copy role claims without checking them against repository evidence and official sources.

## Classification rules

Use the classifications and correction priority defined by `component-development.md`.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful proof in the correct lane, a valid token graph when applicable, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, an allowed `--mio-*` namespace when public, and separate proof. A known defect prevents completion.

Classify every shared dependency as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation. Repeated use does not establish foundation ownership.

Classify existing proof as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete.

## Token contract

Validate that the current-state audit covered every Material-related custom-property declaration and reference in scope. Use the detailed graph as transient evidence.

Write only durable token facts to the family README:

- supported official token groups and exact path families;
- intentionally unsupported official token surface;
- public Mioframe extension tokens;
- private routing responsibilities and final rendered-property owners;
- static, browser, and consumer proof obligations;
- alignment classifications and unresolved gaps.

Do not copy every declaration, selector, or graph edge into the README.

A token concern cannot be `confirmed-compliant` when the audit reports an invented/shortened official-looking name, ambiguous `--md-<component>-*` alias, wrong declaration location, official/project namespace collision, public private-route dependency, cross-family component-token edge, upward dependency, cycle, unresolved required reference, fallback-masked requirement, duplicate component-token declaration, dead component token, unnecessary private chain, token-driven shorthand without computed-longhand proof, or value-kind mismatch.

Lock the smallest valid route for the correction unit:

```text
official/project token declaration
→ allowed dependencies
→ optional single owner-local private route
→ final rendered property
→ static and rendered proof
```

A second private hop requires an independently changing owner or narrow foundation bridge and explicit justification.

## Motion contract

Validate that the current-state audit covered every motion route in code. Use its detailed route inventory as transient evidence.

Write only durable motion facts to the family README: supported state edges, visible result, owner, official timing/easing or platform decision, lifecycle semantics, proof owner, classification, and unresolved gaps.

Do not copy exact selectors, declarations, keyframe references, token route lists, or runtime route lists into the README.

A motion concern cannot be `confirmed-compliant` when the audit reports a dead token, unused keyframe, `transition: all`, wrong owner, cascade conflict, shorthand reset, unstable endpoints, easing incompatible with the property domain, missing lifecycle behavior, stale runtime resource, incorrect reduced motion, unjustified expensive property, broad persistent `will-change`, or declaration-only proof.

## Correction unit

Select the smallest complete highest-priority unit allowed by the canonical workflow.

Record:

```text
CORRECTION UNIT
Gap:
Affected scenarios:
Canonical expected behavior:
Current defect:
Implementation owner:
Dependencies and blast radius:
Primary proof lane:
Why that lane owns the behavior:
Prepared failing observation:
Affected token graph: none | <exact graph slice>
Affected motion contract: none | <exact concern>
Compatibility impact:
Visible impact:
Operator acceptance required: yes | no
Completion condition:
```

A lower-priority improvement cannot bypass a higher-priority blocker affecting the same supported surface. Styling or motion cannot proceed on top of a known-invalid token graph.

## README state

Update one coherent `MATERIAL WORKFLOW STATE` block and the applicable target, source-decision, assessment, alignment, dependency, decomposition, token/style/motion contract, proof, correction-unit, and remaining-gap sections.

Set:

```text
Current stage: contract-review
Canonical target status: locked | reopened
Assessment status: complete | blocked
Contract review status: not-started | failed
Implementation status: not-started
Final review status: not-started
Next gate: independent contract review
```

The roadmap and README must not contradict each other.

## Exit gate

Pass only when target provenance and source decisions are credible, every mandatory concern is classified, dependencies and proof are classified, the transient token graph and motion audit are complete, durable contracts are accurate, decomposition has explicit owners, the highest-priority complete correction unit is selected, proof and compatibility decisions are locked, workflow state is coherent, and the package is ready for independent contract review.

Passing this stage does not authorize production edits.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Current objective result: ready for contract review | blocked
Family alignment status: aligned | converging | blocked
Canonical target result:
Assessment result:
Source decisions:
Alignment classifications:
Dependency classifications:
Proof classifications:
Token graph evidence: complete | incomplete
Durable token contract:
Motion audit evidence: complete | incomplete
Durable motion contract:
Current correction unit:
Proof lane:
Remaining known gaps:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production, proof, story, snapshot, or consumer edits;
- target and current-state research in one unisolated pass;
- deriving target from existing behavior;
- hidden source conflicts or omitted concerns;
- exact implementation-route or token-graph ledgers in the README;
- invented token namespaces, runtime token registries, or compatibility aliases without current consumers;
- blanket preservation or rewrite decisions;
- lower-priority correction around a higher-priority blocker;
- wrong proof lane;
- roadmap advancement or another stage invocation;
- duplicate contracts, durable audits, registries, checklists, scorecards, or progress ledgers.
