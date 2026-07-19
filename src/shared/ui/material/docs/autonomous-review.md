# Autonomous Material review contract

This document defines review ownership for autonomous creation, migration, and alignment of Mioframe Material components.

The coding agent closes every non-visual contract. The operator normally performs only final visual comparison of prepared evidence against named official references.

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
- browser behavior, cancellation, cleanup, and consumer preservation;
- bounded visual regression against an accepted repository baseline.

There is no assumption that a standalone static or structured Material validator exists. Automation does not decide Material meaning, architecture rationale, or visual correctness.

### Agent evidence review

Before visual handoff, the agent reviews applicable:

1. official Material 3 Expressive sources and snapshot;
2. supported and unsupported surface, usage, and component choice;
3. family, foundation, state, anatomy, DOM, accessibility, and property ownership;
4. exact token paths and shortest applicable property routes;
5. native semantics and owned keyboard, focus, pointer, touch, target-area, disabled, cancellation, cleanup, and reduced-motion behavior;
6. proportional Storybook and visual coverage;
7. extensions and deviations;
8. consumers, migration completeness, obsolete-path removal, and compatibility state;
9. applicable contract, browser, pure, consumer, visual-regression, and repository checks;
10. rule corrections made from real migration evidence;
11. remaining blockers.

The agent review status is:

- `passed` — every applicable non-visual decision is source-resolved, implemented, and proved;
- `blocked` — a concrete source, product, architecture, foundation, compatibility, or verification decision remains unresolved.

The agent must not report `passed` when evidence is missing, contradictory, inferred from existing rendering, or delegated to the operator.

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
Architecture and ownership review: passed | blocked (<reason>)
Material contract review: passed | blocked (<reason>)
Accessibility and behavior review: passed | blocked (<reason>)
Proportional verification: <named checks and not-applicable layers>
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
- confirmation that every non-visual gate passed.

The canonical story may be a `StateMatrix` or a simpler bounded story when the component has one meaningful visual route.

The operator checks visible fidelity, including applicable geometry, spacing, shape, color, state layers, typography, icon alignment, elevation, outlines, focus indicators, disabled appearance, and simultaneous-state composition.

Behavior, semantics, accessibility, token ownership, source interpretation, dependency architecture, migration completeness, rule correctness, and test sufficiency remain agent-owned.

Motion acquisition, release, cancellation, cleanup, and reduced-motion behavior are proved by source-backed review and browser tests. The operator reviews only supplied visible motion evidence.

Visual status is:

- `accepted` — evidence matches named official references or recorded deviations;
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
- required behavior that cannot be proved reliably;
- rejected visible evidence requiring correction.

Escalation names one decision. It must not become broad manual re-review of the implementation.

## Merge gate

A component PR is ready to merge only when:

1. agent evidence review is `passed`;
2. every applicable existing repository and focused check passes;
3. required operator visual acceptance is `accepted`, or the change validly requires no new visual acceptance;
4. no source, product, architecture, foundation, compatibility, migration, or rule blocker remains;
5. code, family contract, exports, consumers, applicable stories/tests/evidence, physical map, and directly affected records agree;
6. obsolete ownership and permanent compatibility paths are removed.

A visual rejection returns the named visible mismatches to the agent. It reopens a non-visual decision only when the mismatch supplies evidence that the underlying contract is wrong.
