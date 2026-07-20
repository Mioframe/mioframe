---
name: material-foundation
description: 'Use for focused evidence-gated convergence of a real cross-family Material token, theme, unit, typography, shape, elevation, motion, interaction, icon, overlay, accessibility, density, or adaptive contract, or when material-component delegates an exact prerequisite.'
paths:
  - 'src/shared/ui/material/foundation/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
---

# Material foundation

Canonical policy lives in Material architecture, source, and foundation-development documents plus the owning domain README.

Use this skill standalone for one focused foundation correction or conditionally when `material-component` reports an exact prerequisite. It does not choose or advance a component stage.

## Workflow

```text
isolated canonical foundation target
→ target lock
→ isolated current-state audit
→ domain contract, alignment, dependency, decomposition, correction, and proof synthesis
→ independent read-only foundation contract review
→ one correction unit
→ affected families and consumers
→ independent read-only final review
→ verification
```

Production edits are forbidden before the foundation contract review passes.

## Responsibility isolation

The main foundation session owns synthesis and writes. Use delegated agents or fresh isolated sessions for canonical target research, current-state audit, pre-production contract review, and final review.

Researchers and reviewers are read-only. The canonical researcher must not inspect current implementation or proof. The auditor starts after target lock and cannot redefine it. Reviewers receive evidence and scenarios, not preferred conclusions or implementation reasoning.

Do not use concurrent writers on the same owner or worktree. If delegation is unavailable, use fresh isolated sessions without weakening gates.

## Contract and assessment

Confirm why the concern is inherently cross-family and family-agnostic. For new capability, prove why existing mechanisms are insufficient. Existing use by several families does not prove correct foundation ownership.

Resolve source conflicts and platform applicability before assessment. Cover public or internal contract, deterministic behavior, reactive lifecycle, browser adaptation, rendered output, styles, motion, accessibility, testing bridges, dependency direction, affected families, proof, and obsolete ownership.

Classify concerns as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, `obsolete`, or `not-applicable`.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful proof in the correct lane, and no unresolved contradiction.

Every dependency is classified as canonical Material, temporary legacy Material, project extension, or generic non-Material infrastructure.

## Correction unit

Choose the highest-priority complete unit: source/platform conflict; ownership/dependency; public or family-facing contract; lifecycle and browser behavior; rendered output and motion; extension behavior; adoption and cleanup.

Record owner, dependencies, affected families, proof lane, prepared failing observation, compatibility impact, visible impact, operator requirement, and completion condition.

Rewrite only the smallest owner when incremental repair would preserve wrong ownership or add more workaround logic.

## Foundation contract review

Before production, a fresh read-only context independently validates target provenance, source conflicts, platform applicability, cross-family necessity, complete assessment, classifications, dependencies, correction priority, proof lane, blast radius, and workflow-state consistency.

Return `foundation contract gate passed` or an exact blocker. Do not substitute same-context self-review.

## Implementation and final review

Implement only the approved unit. If evidence invalidates target, classification, dependency, owner, proof lane, or blast radius, return to contract and preserve unaffected work.

Validate all materially affected families and representative consumers. Visible changes require official comparison and honest operator status.

After implementation, a different fresh read-only context reviews the complete domain and resulting patch. Report `independent review handoff required` when unavailable.

## Result

When invoked by `material-component`, return:

```text
MATERIAL FOUNDATION RESULT
Domain:
Status: complete | blocked
Exit gate: passed | failed
Current correction objective:
Domain alignment status: aligned | converging | blocked
Canonical target status: locked | reopened
Foundation contract gate: passed | failed | unavailable
Evidence:
Alignment classifications:
Dependency classifications:
Changed ownership:
Correction unit completed:
Proof lane and result:
Affected families:
Final independent review: confirmed | failed | unavailable
Operator visual status: not-required | required | accepted | rejected
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

Return control to `material-component`; do not update the Material roadmap, start component implementation, or select another family.

## Forbidden

- target and current-state assessment in one unisolated reasoning pass;
- production edits before independent contract review;
- hidden source conflicts or platform assumptions;
- same-context final approval;
- dependencies accepted because they already exist or are widely reused;
- wrong proof lanes or visible changes without operator handoff;
- universal bases, runtime token/state managers, generic resolvers, cross-family state machines, duplicate foundation systems, speculative domains, accidental monoliths, mechanical fragmentation, or full-domain rewrites without owner-level justification.
