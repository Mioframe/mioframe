# Autonomous Material review contract

This document separates agent-owned technical review from operator-owned visual acceptance for Material component work.

The agent closes source interpretation, architecture, implementation, semantics, accessibility, migration, and applicable behavior verification. The operator performs final perceptual comparison against named official visual references.

## Canonical target

Official Mioframe Material components target the current applicable Material 3 Expressive contract.

- Prefer current Expressive usage, anatomy, tokens, geometry, state composition, motion, and adaptive guidance when available.
- Do not preserve baseline Material 3 merely because it matches current code.
- Use baseline behavior or geometry only when no applicable Expressive contract exists or an explicit product deviation requires it.
- Do not silently mix baseline and Expressive contracts.
- Existing output, old baselines, Material Web, third-party libraries, and memory are not official authority.

## Review ownership

### Automation

Repository checks and focused tests prove only the facts they actually exercise, such as:

- syntax, formatting, types, and existing dependency boundaries;
- public component contracts and native/ARIA wiring;
- browser behavior represented by focused tests;
- bounded visual regression against an accepted repository baseline;
- consumer preservation represented by current tests.

Automation does not decide Material meaning, architecture rationale, source correctness, perceptual motion fidelity, or visual correctness merely because checks pass.

### Agent evidence review

Before visual handoff, the agent reviews applicable:

1. official Material 3 Expressive sources and snapshot;
2. supported and unsupported surface, usage, and component choice;
3. family, foundation, anatomy, DOM, accessibility, property, and physical ownership;
4. exact token paths and shortest final property routes;
5. native semantics and component-owned state/lifecycle;
6. motion contract, property owner, foundation adaptation, state routing, and reduced-motion wiring;
7. browser-owned behavior only where the component changes or constrains it;
8. proportional stories and tests;
9. extensions and deviations;
10. consumers, migration completeness, obsolete paths, and compatibility;
11. rule corrections and remaining blockers;
12. freshness and conclusions of the final family audit.

Status:

- `passed` — every applicable agent-owned decision is source-resolved, implemented, and proved at its owning layer;
- `blocked` — one concrete source, product, architecture, foundation, compatibility, or verification decision remains unresolved.

The agent must not infer correctness from existing rendering, endpoint-only assertions, or green CI when the required implementation route is not actually verified.

## Behavior and motion boundary

Review our implementation; do not retest browser internals.

For ordinary component behavior and CSS motion, the agent verifies:

- the official requirement;
- the accepted component or foundation owner;
- the actual DOM property or behavior owner;
- public API, token, state, and selector routing;
- absence of conflicting local behavior;
- focused proof at the owning layer.

A shared official-to-Web motion adaptation is proved once by its foundation owner. Each component verifies only that it consumes the accepted contract correctly.

Do not require frame-by-frame animation analysis, interpolation measurements, overshoot sampling, or duplicate pointer/touch/keyboard tests when the browser and implementation path are the same.

Use focused browser verification when correctness genuinely depends on browser-owned behavior or cannot be established reliably from source and contract tests, including native focus/input behavior, layout, overlay, scrolling, DOM measurement, JavaScript/WAAPI lifecycle, computed CSS propagation, or a reproducible runtime defect.

A user-visible mismatch remains valid evidence: investigate the implementation and use the narrowest browser reproduction needed to locate the defect. The operator is not responsible for diagnosing technical ownership or routing.

## Agent review report

Every new, migrated, or alignment-changing component PR includes:

```text
AUTONOMOUS MATERIAL REVIEW
Target: current applicable Material 3 Expressive
Component/family:
Change mode:
Official sources and snapshot:
Design Kit evidence: not required | <file/version and reference>
Supported surface:
Unsupported surface:
Foundation status:
Architecture and physical ownership review: passed | blocked (<reason>)
Material contract review: passed | blocked (<reason>)
Accessibility and behavior review: passed | blocked (<reason>)
Motion implementation review: not applicable | passed | blocked (<reason>)
Proportional verification: <named checks and not-applicable layers>
Fresh family audit: <path and implementation commit>
Rule refinement: none | <corrected rules and evidence>
Deviations/extensions: none | <records>
Migration completeness: not applicable | passed | blocked (<reason>)
Agent evidence review: passed | blocked (<reason>)
```

This report summarizes owned evidence and must not become a second family contract.

## Operator visual acceptance

The operator reviews prepared visible evidence only after agent review passes.

The agent provides applicable:

- canonical visual story id;
- bounded screenshot or visual diff;
- named official documentation snapshot;
- Design Kit reference when required;
- intended matches, deviations, and unsupported visual surface;
- confirmation that every agent-owned gate passed.

The operator checks perceptual fidelity, including applicable geometry, spacing, shape, color, state layers, typography, icon alignment, elevation, outlines, focus indicators, disabled appearance, simultaneous states, and visible motion quality.

API, semantics, accessibility, token ownership, source interpretation, dependency architecture, physical migration, rule correctness, and test sufficiency remain agent-owned.

Visual status:

- `accepted` — supplied evidence matches named official references or recorded deviations;
- `rejected` — visible mismatches are named for correction;
- `blocked` — required official visual evidence is unavailable.

An automated coding agent never reports operator acceptance as `accepted`.

## Rule refinement

When implementation evidence conflicts with a project rule:

- determine whether the rule or implementation is wrong;
- correct an inaccurate, contradictory, incomplete, obsolete, or needlessly complex rule in its owning source;
- make the smallest evidence-backed change;
- update only directly affected owners;
- do not create a family-specific exception.

## Exceptional escalation

Stop with `blocked` only for one concrete unresolved decision, such as:

- conflicting or unavailable official guidance for a required scenario;
- uncertain family or foundation ownership;
- incompatible public API or consumer migration;
- an intentional product deviation;
- unsafe cross-project or cross-family impact;
- required verification that cannot be performed reliably;
- rejected visual evidence requiring correction.

## Merge gate

A component PR is ready only when:

1. agent evidence review is `passed`;
2. applicable repository and focused checks pass;
3. a fresh family audit reviews the final implementation commit;
4. required operator visual acceptance is recorded;
5. no source, architecture, foundation, compatibility, verification, migration, or rule blocker remains;
6. code, canonical contract, root export, consumers, applicable stories/tests, physical map, and directly affected records agree;
7. obsolete ownership and permanent compatibility paths are removed.

A visual rejection returns the named mismatch to implementation. It reopens a technical decision only when the mismatch reveals that the underlying contract, property ownership, state routing, or motion wiring is wrong.