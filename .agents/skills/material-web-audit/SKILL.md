---
name: material-web-audit
description: 'Internal read-only role for auditing only rendered DOM, CSS ownership, shared Web dependency ownership, layout, responsive behavior, transitions, animations, browser lifecycle, and browser proof for a bounded Material concern set. Use only when material-component or material-foundation delegates the Web lane.'
---

# Material Web audit

Audit only the delegated rendered Web concern set against the locked target and token contract. Do not redefine public API or token taxonomy.

## Inputs

Receive:

- family or foundation domain and exact Web concern set;
- locked rendered, style, and motion claims;
- required viewports, input modes, and browser scenarios;
- bounded current-state implementation, shared-dependency, Storybook, browser-proof, and visual paths to inspect;
- applicable repository instructions.

Do not broaden into unrelated family or foundation concerns.

## Responsibility

Inspect only:

- rendered DOM, native host, node budget, target area, slots, and ownership;
- every shared state-layer, ripple, focus, symbol, motion, overlay, or other rendered Material dependency used by the concern set;
- dependency owner, public/private route, readiness, duplicate implementation, cleanup obligation, and browser proof;
- cascade owner, selector boundaries, specificity, inheritance, overflow, clipping, containing blocks, stacking contexts, and style leakage;
- geometry, typography, logical properties, RTL, zoom, text scaling, responsive behavior, forced colors, and high contrast when applicable;
- every transition or animation longhand or shorthand, keyframe, WAAPI or JS route, frame, timer, class, completion listener, `will-change`, and reduced-motion override in scope;
- actual rendered target, trigger, endpoints, timing, token route, interruption, reversal, cancellation, cleanup, property-domain compatibility, and performance risk;
- browser and visual evidence for the delegated scenarios.

Report `transition: all`, dead motion tokens, unused keyframes, wrong-owner or shadowed declarations, shorthand resets, conflicting routes, unstable endpoints, incompatible easing/property domains, stale runtime resources, unbounded `will-change`, layout read/write loops, declaration-only proof, required shared behavior still owned by temporary legacy Material code, private deep imports, and parallel foundation or legacy implementations.

A family-specific motion route remains family-owned. A genuinely shared family-agnostic behavior with a missing or legacy owner is an exact foundation blocker. Another official component family remains a canonical-family dependency, not Web foundation.

## Browser evidence

Static inspection may verify routing, but user-visible lifecycle requires browser proof through public input. Required proof includes only scenarios affected by the delegated concern set.

When the role has no browser execution capability, inspect existing browser evidence. If required evidence is absent or cannot establish the observable result, return `blocked — insufficient browser evidence`; never infer success from CSS syntax or screenshots alone.

## Result

```text
MATERIAL ROLE RESULT
Role: web-audit
Scope:
Concern set:
Status: complete | blocked
Shared dependency findings:
Foundation prerequisite: none | <exact contract>
Dependency closure contribution: closed | blocked
DOM/style findings: <consolidated, maximum 8>
Motion findings: <consolidated, maximum 8>
Browser evidence: sufficient | insufficient | unavailable
Visual evidence: sufficient | required | not-applicable
External lane blockers: none | token | semantics | foundation | canonical-family | <exact blocker>
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits or delegation;
- public API, target, or token taxonomy changes;
- full-family or full-domain audit outside the delegated Web concern set;
- accepting required shared rendered behavior from a temporary legacy, private, defective, or parallel owner for canonical ownership or adoption;
- treating another component family as foundation;
- accepting declaration existence, snapshots, framework behavior, or browser internals as lifecycle proof;
- correction-unit selection or implementation;
- Git, branch, commit, pull-request, or merge analysis;
- durable route inventories or review-history documents.
