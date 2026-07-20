---
name: material-current-state-audit
description: 'Internal read-only role for auditing the complete existing Material component family or foundation domain against a locked canonical target. Use only after material-canonical-target completes and when material-component or material-foundation delegates current-state assessment.'
---

# Material current-state audit

Audit exactly one existing Material family or foundation domain against the supplied locked target. Do not redefine that target.

## Inputs

Receive:

- the locked canonical-target result;
- required scenarios and platforms;
- current repository ref;
- applicable repository instruction paths.

Inspect current and previous owners, exports, dependencies, consumers, DOM, API, state, styles, motion, tests, stories, snapshots, browser evidence, visual evidence, and obsolete ownership.

## Required coverage

Cover every applicable concern or return `not-applicable` with a reason:

- API, defaults, invalid combinations, and attributes;
- native, keyboard, form, event-propagation, and accessibility semantics;
- anatomy, DOM, target area, and unnecessary nodes;
- semantic and transient state, precedence, interruption, cancellation, and cleanup;
- token, configuration, state, and rendered-property routing;
- geometry, typography, icon placement, RTL, responsive behavior, and text scaling;
- motion implementation and browser lifecycle;
- project extensions;
- Material and generic dependencies;
- owners, exports, consumers, aliases, and obsolete paths;
- unit, component, browser, visual, consumer, and verification evidence.

For each concern return current behavior, owner, dependency classification, proof classification, candidate alignment classification, and exact evidence gap or correction.

## Motion code audit

Search the complete scope and directly owned dependencies for every:

- CSS transition and animation shorthand or longhand;
- `@keyframes` definition and reference;
- WAAPI or `Element.animate` call;
- animation frame, timer, class, or completion listener;
- `will-change` declaration;
- motion custom-property declaration and use;
- reduced-motion override.

For each route report owner and location, target, trigger, animated properties or keyframes, timing, token-to-declaration route, initial and final values, interruption/reversal/cancellation/cleanup, reduced-motion result, performance risk, proof, and candidate classification.

Report dead tokens, unused keyframes, `transition: all`, wrong-owner or shadowed declarations, shorthand resets, duplicate or conflicting transitions, stale runtime resources, persistent broad `will-change`, and evidence that only proves declarations exist.

The detailed route list is a stage result, not a durable copy of code in the family README. The README retains only the canonical motion contract, owner, proof obligations, classification summary, and unresolved gaps.

## Result

```text
MATERIAL ROLE RESULT
Role: current-state-audit
Scope: component | foundation
Target status: locked
Status: complete | blocked
Concern coverage:
Alignment candidates:
Dependency classifications:
Proof classifications:
Motion code audit: passed | failed
Motion routes and findings:
Obsolete ownership:
Unresolved evidence:
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits;
- changing or narrowing the locked target;
- treating existing tests, stories, snapshots, consumers, names, or green CI as authority;
- omitting an applicable concern or motion route;
- selecting or implementing a correction unit;
- delegation.