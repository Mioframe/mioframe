# Autonomous Material review contract

This document defines review ownership for autonomous creation, migration, and alignment of Mioframe Material components.

The coding agent closes every non-visual and reproducible interaction contract. The operator normally performs only final visual comparison of prepared evidence against named official references.

## Canonical target

Official Mioframe Material components target the current applicable Material 3 Expressive contract.

- Prefer current Expressive usage, anatomy, tokens, geometry, state composition, motion, and adaptive guidance when available for the supported surface.
- Do not preserve baseline Material 3 merely because it matches current code.
- Use baseline behavior or geometry only when no applicable Expressive contract exists or an explicit product deviation requires it.
- Do not silently combine baseline and Expressive contracts.
- Existing output, old baselines, Material Web, third-party libraries, and memory are not official authority.

## Review ownership

### Existing automation

Repository checks and focused tests prove only objective facts and behavior represented by actual tooling, such as:

- syntax, formatting, types, and existing dependency boundaries;
- public component contracts and native/ARIA wiring;
- browser behavior, cancellation, cleanup, and consumer preservation that the tests actually exercise;
- bounded visual regression against an accepted repository baseline.

There is no assumption that a standalone static or structured Material validator exists. Automation does not decide Material meaning, architecture rationale, source correctness, motion fidelity, or visual correctness merely because checks pass.

### Agent evidence review

Before visual handoff, the agent reviews applicable:

1. official Material 3 Expressive sources and snapshot;
2. supported and unsupported surface, usage, and component choice;
3. family, foundation, state, anatomy, DOM, accessibility, property, and physical ownership;
4. exact token paths and shortest applicable final rendered property routes;
5. native semantics and owned keyboard, focus, pointer, touch, target-area, disabled, cancellation, cleanup, and reduced-motion behavior;
6. empirical acquisition, intermediate, release, interruption, and settled motion in a real browser;
7. proportional Storybook and visual coverage;
8. extensions and deviations;
9. consumers, migration completeness, obsolete-path removal, and compatibility state;
10. applicable contract, browser, pure, consumer, visual-regression, and repository checks;
11. rule corrections made from real migration evidence;
12. remaining blockers.

The agent review status is:

- `passed` — every applicable agent-owned decision is source-resolved, implemented, reproduced where applicable, and proved;
- `blocked` — a concrete source, product, architecture, foundation, compatibility, empirical-browser, or verification decision remains unresolved.

The agent must not report `passed` when evidence is missing, contradictory, inferred from existing rendering, inferred from endpoint-only tests, or delegated to the operator.

## Empirical interaction and motion gate

For a visible interactive component, the agent must run the canonical story, preview, or focused product surface in a real browser.

The review must:

- use real pointer, keyboard, and touch input when applicable;
- inspect the resting state, interaction onset, at least one meaningful intermediate sample, release, cancellation or interruption, and settled state;
- inspect the element that actually owns each animated property;
- compare the observed behavior with exact official state, property, and motion evidence;
- check reduced-motion behavior when applicable;
- record the story or surface id, browser command, input sequence, and observed result.

For spring-driven Material motion, the agent must prove use of the official spring model or a traceable and empirically validated Web adaptation. Matching endpoint values, declaring stiffness/damping variables, checking transition metadata, or using a visually plausible cubic-bezier is insufficient by itself.

Forced-state classes and screenshots prove only endpoint appearance. Existing tests are evidence to inspect, not permission to skip direct reproduction. A visibly incorrect interaction is an agent-owned defect even when CI, snapshots, and endpoint assertions pass.

## Agent review report

Every new, migrated, or alignment-changing component PR includes a concise report:

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
Empirical interaction and motion review: passed | blocked (<reason>)
Proportional verification: <named checks and not-applicable layers>
Fresh family audit: <path and implementation commit>
Rule refinement: none | <corrected rules and evidence>
Deviations/extensions: none | <records>
Migration completeness: not applicable | passed | blocked (<reason>)
Agent evidence review: passed | blocked (<reason>)
```

This report summarizes existing owned evidence. It must not become a second family contract.

## Operator visual acceptance

The operator reviews prepared visible evidence only after agent review is `passed`.

The agent provides applicable:

- canonical visual story id;
- bounded screenshot and visual diff;
- named official documentation snapshot;
- Design Kit reference when required;
- intended matches, explicit deviations, and unsupported visual surface;
- supplied visible motion evidence for interactions already technically verified by the agent;
- confirmation that every agent-owned gate passed.

The canonical story may be a `StateMatrix` or a simpler bounded story when the component has one meaningful visual route.

The operator checks final visible fidelity, including applicable geometry, spacing, shape, color, state layers, typography, icon alignment, elevation, outlines, focus indicators, disabled appearance, simultaneous-state composition, and perceptual motion fidelity.

Behavior, semantics, accessibility, token ownership, source interpretation, dependency architecture, physical migration completeness, rule correctness, test sufficiency, and discovery of reproducible motion defects remain agent-owned.

Motion acquisition, release, cancellation, cleanup, reduced-motion behavior, property ownership, and official spring or easing implementation are proved by source-backed agent review and real-browser evidence before operator handoff. The operator is not the first reviewer of motion.

Visual status is:

- `accepted` — supplied evidence matches named official references or recorded deviations;
- `rejected` — visible mismatches are named for correction;
- `blocked` — required official visual evidence is unavailable.

An automated coding agent never reports operator acceptance as `accepted`.

## Rule refinement

When implementation evidence conflicts with a project rule, the agent must determine whether the rule or component is wrong.

If the rule is inaccurate, contradictory, incomplete, obsolete, or needlessly complex:

- identify the owning source and concrete case;
- make the smallest evidence-backed correction;
- update only directly affected rule owners;
- record the reason and migration consequence;
- do not create a family-specific exception.

A resolvable rule conflict is not an operator visual task.

## Exceptional escalation

Stop with `blocked` only for a concrete unresolved decision such as:

- conflicting or unavailable official guidance affecting a required scenario;
- uncertain family or foundation ownership;
- incompatible public API or consumer migration requirement;
- an intentional product deviation;
- an unsafe cross-project contract change;
- required behavior that cannot be proved reliably in a real browser;
- rejected visible evidence requiring correction.

Escalation names one decision. It must not become broad manual re-review of the implementation.

## Merge gate

A component PR is ready to merge only when:

1. agent evidence review is `passed`;
2. every applicable existing repository and focused check passes;
3. a fresh family audit reviews the final implementation commit;
4. required operator visual acceptance is `accepted`, or the change validly requires no new visual acceptance;
5. no source, product, architecture, foundation, compatibility, empirical-interaction, migration, or rule blocker remains;
6. code, canonical family contract, root export, consumers, applicable stories/tests/evidence, physical map, and directly affected records agree;
7. obsolete ownership and permanent compatibility paths are removed.

A visual rejection returns the named visible mismatches to the agent. It reopens a non-visual decision when the mismatch supplies evidence that the underlying behavior, motion model, property ownership, or contract is wrong.
