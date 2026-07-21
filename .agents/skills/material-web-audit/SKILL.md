---
name: material-web-audit
description: 'Internal read-only role for auditing only rendered DOM, CSS ownership, layout, responsive behavior, transitions, animations, browser lifecycle, and browser proof for a bounded Material concern set. Use only when material-component delegates the Web implementation lane.'
---

# Material Web implementation audit

Audit only the delegated rendered Web concern set against the locked target and token contract. Do not redefine public API or token taxonomy.

## Inputs

Receive:

- family and exact Web concern set;
- locked rendered, style, and motion claims;
- required viewports, input modes, and browser scenarios;
- current repository ref;
- implementation, Storybook, browser-proof, and visual paths to inspect;
- applicable repository instructions.

Do not broaden into unrelated family concerns.

## Responsibility

Inspect only:

- rendered DOM, native host, node budget, target area, slots, and ownership;
- cascade owner, selector boundaries, specificity, inheritance, overflow, clipping, containing blocks, stacking contexts, and style leakage;
- geometry, typography, logical properties, RTL, zoom, text scaling, responsive behavior, forced colors, and high contrast when applicable;
- every transition/animation longhand or shorthand, keyframe, WAAPI/JS route, frame, timer, class, completion listener, `will-change`, and reduced-motion override in scope;
- actual rendered target, trigger, endpoints, timing, token route, interruption, reversal, cancellation, cleanup, property-domain compatibility, and performance risk;
- browser and visual evidence for the delegated scenarios.

Report `transition: all`, dead motion tokens, unused keyframes, wrong-owner or shadowed declarations, shorthand resets, conflicting routes, unstable endpoints, incompatible easing/property domains, stale runtime resources, unbounded `will-change`, layout read/write loops, and declaration-only proof.

## Browser evidence

Static inspection may verify routing, but user-visible lifecycle requires browser proof through public input. Required proof includes only scenarios affected by the delegated concern set.

When the role has no browser execution capability, inspect existing browser evidence. If required evidence is absent or cannot establish the observable result, return `blocked — insufficient browser evidence`; never infer success from CSS syntax or screenshots alone.

## Result

```text
MATERIAL ROLE RESULT
Role: web-audit
Family:
Concern set:
Status: complete | blocked
DOM/style findings: <consolidated, maximum 8>
Motion findings: <consolidated, maximum 8>
Browser evidence: sufficient | insufficient | unavailable
Visual evidence: sufficient | required | not-applicable
External lane blockers: none | token | semantics | foundation | <exact blocker>
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits or delegation;
- public API, target, or token taxonomy changes;
- full-family audit outside the delegated Web concern set;
- accepting declaration existence, snapshots, framework behavior, or browser internals as lifecycle proof;
- correction-unit selection or implementation;
- durable route inventories or review-history documents.