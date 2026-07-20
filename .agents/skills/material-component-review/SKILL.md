---
name: material-component-review
description: 'Use for an independent read-only contract-gate or final-gate review of one Material component family. Reconstructs official evidence, ownership, token graph, proof, complete motion code routes, consumers, and workflow state without modifying repository files.'
---

# Material component review

Review exactly one family in one scope:

- `contract-gate` before production edits;
- `final-gate` after implementation and conditional adoption.

Follow `src/shared/ui/material/docs/component-development.md` and `src/shared/ui/material/docs/tokens.md`. Do not implement fixes or redefine the workflow.

## Independence

Run in a fresh read-only context that did not author the contract or implementation under review.

Receive only family, review scope, correction objective, required scenarios, platforms, repository ref, applicable instruction paths, and operator evidence. Reconstruct official evidence and repository facts independently. Do not accept implementation reasoning, prior self-review, or green CI as proof.

Claude Code may use a thin `.claude/agents` adapter that preloads this skill. Codex may use this skill in a separate agent thread or isolated worktree. When independent context is unavailable, return `blocked — independent review handoff required`.

## Contract gate

Verify:

- target research was isolated from current implementation and proof;
- platforms, supported surface, source decisions, and exact official token groups are complete;
- every mandatory concern is classified or explicitly not applicable;
- dependency and proof classifications are justified;
- decomposition and ownership are explicit;
- the transient token graph covers every Material-related declaration and reference in scope;
- token taxonomy, names, locations, direction, public/private surface, final rendered owners, and proof follow `tokens.md`;
- durable token contracts are accurate without duplicating exact graph edges in the README;
- the transient motion code audit covers every actual route;
- durable motion contracts are accurate without duplicating exact code routes in the README;
- the selected correction unit is the highest-priority complete unit;
- proof lane, expected failure, compatibility impact, visual impact, and operator requirement are resolved;
- workflow state and roadmap agree;
- production, proof, story, or snapshot changes for the unit did not precede approval.

Return exactly one:

- `contract gate passed`;
- `contract gate failed`;
- `blocked — insufficient evidence`;
- `blocked — independent review handoff required`.

## Final gate

Review the complete current family and resulting PR, not only changed lines.

Inspect target provenance, source decisions, API, native/form/event semantics, accessibility, DOM, state, dependencies, token architecture, rendered-property routing, geometry, typography, RTL, responsive behavior, text scaling, project extensions, decomposition, proof lanes, Storybook, visual/operator evidence, consumers, obsolete ownership, workflow state, and verification readiness.

Independently reconstruct every Material-related custom-property route:

- exact name and taxonomy (`md-ref`, `md-sys`, `md-comp`, `mio-sys`, `mio-comp`, private, invalid/obsolete);
- declaration owner and location;
- public/private status;
- direct dependencies, direction, cycles, duplicates, unresolved references, and fallback behavior;
- configuration/state selection;
- final rendered CSS property or foundation bridge;
- expected value kind and actual CSS grammar;
- static, browser, and consumer proof.

Independently reconstruct every motion route in code:

- transition and animation shorthand/longhands;
- keyframe definitions and references;
- WAAPI or JS routes;
- frames, timers, classes, and completion listeners;
- `will-change`;
- motion custom properties and uses;
- reduced-motion overrides.

For each motion route verify target and owner, trigger and state precedence, properties or keyframes, timing, token routing, initial/final values, property-domain compatibility, interruption/reversal/cancellation/cleanup, reduced-motion result, performance risk, and proof.

Exact graph/route details belong in the review result, not as a durable README ledger.

Static token or motion proof does not replace browser proof for computed substitutions, inheritance/overrides, shorthand parsing, visible acquisition, completion, interruption, reversal, cancellation, and reduced-motion lifecycle. Do not require tests of Vue, browser internals, or third-party internals.

Determine separately:

1. whether the current correction objective is complete and mergeable;
2. whether the family is `aligned`, `converging`, or `blocked`.

## Mandatory findings

Treat as blockers or major issues unless narrowly justified:

- target derived from legacy code or proof;
- hidden source conflict or platform assumption;
- omitted mandatory concern or dependency;
- legacy proof accepted without classification;
- lower-priority correction around a higher-priority blocker;
- wrong proof lane or browser assertions inside visual specs;
- visible change without required comparison or operator status;
- production work before contract approval;
- stale or contradictory workflow state;
- relocation, copied styles, stable snapshots, or green CI presented as correctness;
- omitted token route or motion route;
- invented/shortened official-looking token name or ambiguous `--md-<component>-*` alias;
- component token outside the owning token file, reference/system token inside a component, or project extension under `--md-*`;
- public dependency on `--md-private-*`;
- cross-family component-token dependency, upward edge, cycle, unresolved required reference, or fallback-masked requirement;
- duplicate or dead component token;
- unnecessary multi-hop private route;
- token-driven shorthand without valid computed-longhand proof or a token value-kind mismatch;
- dead motion token, unused keyframe, or `transition: all`;
- wrong-owner, shadowed, reset, or conflicting motion declaration;
- unstable initial/final values or easing incompatible with the property's valid domain;
- missing rapid-input, reversal, cancellation, disable, unmount, or cleanup behavior;
- reduced-motion result that loses final state or leaves unnecessary long motion;
- unjustified layout/paint-heavy animation, synchronous layout loop, per-frame reactive churn, or broad persistent `will-change`;
- proof that only checks declaration/token/keyframe text, snapshots, or framework/browser internals;
- consumer migration onto misaligned surface;
- family declared aligned while required gaps remain.

## Findings and routing

Consolidate findings into blockers, major issues, minor issues, and items outside the current objective. Each actionable finding states requirement, evidence, mismatch, affected scenario, required final state, objective/family impact, and correction owner:

- `material-component-contract`;
- `material-component-implementation`;
- `material-component-adoption`.

## Result

For final review use one objective verdict:

- `correction objective complete`;
- `correction objective complete — operator visual acceptance required`;
- `correction objective incomplete`;
- `blocked — insufficient evidence`;
- `blocked — independent review handoff required`.

Return:

```text
MATERIAL STAGE RESULT
Family:
Stage: review
Review scope: contract-gate | final-gate
Status: complete | blocked
Exit gate: passed | failed
Contract gate result: not-applicable | passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Independent context: confirmed | unavailable
Evidence:
Token graph audit: passed | failed
Token route findings:
Static token guard: passed | failed | not-applicable
Motion code audit: passed | failed
Motion route findings:
Operator visual status: not-required | required | accepted | rejected
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

## Restrictions

- no repository modifications;
- no correction-stage invocation or workflow advancement;
- no durable audit, registry, scorecard, checklist, graph ledger, route ledger, or second family-state document;
- no approval with incomplete ownership, evidence, scenarios, dependencies, token graph, motion audit, workflow state, visual evidence, or verification;
- no requirement to delete confirmed owners merely because another owner is defective.
