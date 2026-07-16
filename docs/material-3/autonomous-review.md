# Autonomous Material review contract

This document defines review ownership for autonomous creation, migration, and alignment of Mioframe Material components.

Its goal is that the coding agent completes and proves every non-visual contract, while the operator normally performs only final visual comparison of prepared screenshots against named official references.

This document does not replace component architecture, testing, foundation, source, inventory, or migration rules. It defines who closes their review gates and what evidence must be handed off.

## Canonical target

Official Mioframe Material components target the current official **Material 3 Expressive** contract.

When official sources distinguish Expressive from baseline Material 3:

- current Expressive usage, anatomy, tokens, geometry, state composition, motion, and adaptive guidance are canonical;
- baseline Material 3 must not be selected merely because it is simpler, already implemented, or more familiar;
- baseline behavior or geometry may remain only when the current official component has no Expressive contract for the supported surface, or when an explicit product compatibility requirement records it as a deviation;
- one component must not silently mix baseline and Expressive contracts;
- the family blueprint records the exact Expressive sources used and any unavailable, unsupported, or deliberately deviated surface.

Existing Mioframe rendering, old baselines, Material Web, third-party libraries, and memory are never evidence that an implementation is canonically Expressive.

## Review layers

### Deterministic automation

Static and structured validators plus repository tests prove objective facts such as:

- allowed locations and dependency direction;
- profile/file consistency and style order;
- exports, imports, references, snapshots, and migration records;
- public component contracts and native/ARIA wiring;
- real browser behavior, cancellation, cleanup, reduced motion, and consumer preservation;
- bounded visual regression against the accepted repository baseline.

Automation does not decide Material meaning or visual correctness.

### Agent evidence review

The coding agent owns the routine architecture and Material review for a source-resolved component.

Before visual handoff, the agent must inspect the finished implementation and record an evidence-backed review covering:

1. current official Material 3 Expressive sources and verified snapshot;
2. supported and unsupported surface, usage, and component choice;
3. family, foundation, state, anatomy, DOM, accessibility, and rendered-property ownership;
4. exact component/system token paths and the shortest valid property pipeline;
5. native semantics, keyboard, focus, pointer/touch, target area, disabled/readonly, cancellation, cleanup, and reduced-motion behavior;
6. Storybook coverage of every distinct supported visual route;
7. deviations and Mioframe extensions;
8. consumers, migration completeness, obsolete-path removal, and compatibility state;
9. completed static, structured, contract, browser, visual-regression, pure, and consumer verification;
10. remaining blockers, if any.

The agent review status is exactly one of:

- `passed` — every non-visual decision is source-resolved, implemented, and proved;
- `blocked` — an exact source, architecture, foundation, compatibility, or verification decision remains unresolved.

The agent must not use `passed` when evidence is missing, contradictory, inferred from existing rendering, or deferred to the operator.

## Required agent review report

Every new, migrated, or alignment-changing component PR includes this concise report in the PR description or a durable review note:

```text
AUTONOMOUS MATERIAL REVIEW
Target: current Material 3 Expressive
Component/family:
Change mode:
Official sources and snapshot:
Design Kit evidence: not required | <file/version and component-set reference>
Supported surface:
Unsupported surface:
Foundation status:
Architecture and ownership review: passed | blocked (<reason>)
Material contract review: passed | blocked (<reason>)
Accessibility and behavior review: passed | blocked (<reason>)
Verification: <named passing checks>
Deviations/extensions: none | <records>
Migration completeness: not applicable | passed | blocked (<reason>)
Agent evidence review: passed | blocked (<reason>)
```

This report summarizes evidence already owned by the blueprint, registries, tests, and migration records. It must not create a second component contract.

## Operator visual acceptance

The operator normally reviews only prepared visual evidence after the agent evidence review is `passed`.

The agent provides:

- canonical `StateMatrix` story id;
- bounded current screenshot artifact and visual diff;
- named official documentation snapshot;
- official Design Kit file/version and component-set reference when required;
- a concise list of intended matches, accepted deviations, and intentionally unsupported visual surface;
- confirmation that all non-visual gates passed.

The operator checks only visible fidelity of the supported surface, including applicable:

- geometry and spacing;
- shape;
- color and state layers;
- typography;
- icons and anatomy alignment;
- elevation, outlines, focus indicators, and disabled appearance;
- simultaneous-state composition;
- visual readability of the matrix.

Behavior, semantics, accessibility, token ownership, source interpretation, dependency architecture, migration completeness, and test sufficiency are agent-owned and must not be deferred to screenshot review.

Motion timing, acquisition/release, cancellation, cleanup, and reduced-motion behavior are proved by source-backed implementation review and browser tests. The operator reviews only motion-related static appearance represented in the matrix or supplied visual artifact.

The visual acceptance status is exactly one of:

- `accepted` — screenshots match the named official references or recorded deviations;
- `rejected` — the operator names visible mismatches for correction;
- `blocked` — required official visual evidence is unavailable.

An automated coding agent must never report operator visual acceptance as `accepted`.

## Exceptional escalation

Operator-only screenshot review is the normal path, not a license to guess unresolved contracts.

The agent must stop with `blocked` and request an architecture/product decision when any of these remain unresolved:

- conflicting or unavailable official guidance that affects a required scenario;
- uncertain family or foundation ownership;
- incompatible public API or consumer migration requirement;
- an intentional product deviation from Material;
- unavailable required Design Kit evidence;
- a required behavior that cannot be proved reliably.

Such escalation is exceptional and names one concrete decision. It must not become a routine broad manual review of the implementation.

## Merge gate

A normal component PR is ready to merge only when:

1. agent evidence review is `passed`;
2. all required automated and repository verification passes;
3. operator visual acceptance is `accepted`, or a relocation-only change validly reuses an unchanged previously accepted matrix;
4. no source, architecture, foundation, compatibility, or migration blocker remains;
5. blueprint, registries, inventory, roadmap, code, exports, consumers, stories, tests, snapshots, and migration map agree.

A visual rejection returns only the named visible mismatches to the agent. It does not reopen already proved non-visual contracts unless the mismatch reveals evidence that one of them is wrong.
