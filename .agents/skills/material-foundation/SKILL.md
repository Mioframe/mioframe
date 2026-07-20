---
name: material-foundation
description: 'Use for focused evidence-gated convergence of one real cross-family Material token, theme, unit, typography, shape, elevation, motion, interaction, icon, overlay, accessibility, density, or adaptive contract, or when material-component delegates an exact prerequisite.'
---

# Material foundation

Follow `src/shared/ui/material/docs/foundation-development.md` as the canonical workflow and `docs/architecture.md` for ownership.

Use standalone for one focused cross-family correction or when `material-component` delegates an exact prerequisite. Do not choose or advance a component stage.

## Sequence

```text
material-canonical-target in foundation scope
→ target lock
→ material-current-state-audit in foundation scope
→ domain contract synthesis
→ independent foundation contract review
→ one correction unit
→ affected families and consumers
→ independent final review
→ verification
```

Production edits are forbidden before the foundation contract review passes.

## Isolation

Use the portable `material-canonical-target` and `material-current-state-audit` skills in separate read-only contexts. Review must also run in a fresh read-only context that did not author the contract or implementation.

Claude Code may use thin adapters that preload portable skills. Codex may use the same skills in separate threads or worktrees. Tool-specific adapters do not own foundation policy.

The main foundation session owns synthesis and writes. Researchers and reviewers receive bounded scope, scenarios, platforms, repository ref, instructions, and required output—not preferred conclusions or implementation reasoning. Never use concurrent writers on the same owner or worktree.

## Foundation gate

Confirm the concern is inherently cross-family and family-agnostic. For new capability, prove existing mechanisms are insufficient. Existing use by several families does not prove foundation ownership.

Resolve source conflicts and platform applicability before assessment. Classify every applicable contract, lifecycle, browser adaptation, rendered output, style, motion, accessibility, testing bridge, dependency, affected family, proof, and obsolete owner according to `foundation-development.md`.

Use the current-state audit's exact motion route result as transient evidence. Keep only durable motion semantics, ownership, and proof obligations in the domain README; do not mirror code routes as documentation.

Choose one highest-priority complete correction unit with explicit owner, dependencies, affected families, proof lane, failing observation, compatibility impact, visible impact, operator requirement, and completion condition.

## Reviews

Before production, an independent context validates target provenance, source decisions, platform applicability, cross-family necessity, complete assessment, dependencies, correction priority, proof lane, transient motion audit, blast radius, and workflow state.

After implementation, a different independent context reviews the complete domain, affected families, consumers, evidence, motion routes, cleanup, and resulting patch.

When independent context is unavailable, return `independent review handoff required`.

## Result

When delegated by `material-component`, return:

```text
MATERIAL FOUNDATION RESULT
Domain:
Status: complete | blocked
Exit gate: passed | failed
Current correction objective:
Domain alignment status: aligned | converging | blocked
Canonical target status: locked | reopened
Foundation contract gate: passed | failed | unavailable
Alignment classifications:
Dependency classifications:
Changed ownership:
Correction unit completed:
Proof result:
Motion code audit: passed | failed
Motion route findings:
Affected families:
Final independent review: confirmed | failed | unavailable
Operator visual status: not-required | required | accepted | rejected
Remaining known gaps:
Blocker: none | <exact blocker>
```

Return control to `material-component`; do not update the Material roadmap, start component implementation, or select another family.

## Forbidden

- target and current-state assessment in one context;
- production edits before independent contract review;
- hidden source conflicts or platform assumptions;
- same-context final approval;
- dependencies accepted because they exist or are widely reused;
- wrong proof lanes or visible changes without operator handoff;
- exact code-route ledgers in documentation;
- universal bases, runtime token/state managers, generic resolvers, cross-family state machines, duplicate foundation systems, speculative domains, accidental monoliths, mechanical fragmentation, or full-domain rewrites without owner-level justification.
