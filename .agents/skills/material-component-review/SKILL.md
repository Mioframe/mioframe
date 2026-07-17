---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants its current implementation checked against current official Material 3 Expressive documentation and project rules. Produce an evidence-backed compliance report without modifying production code unless the user separately asks for fixes.'
---

# Material component review

Use this as the one-name, review-only entrypoint for checking an existing Material component implementation.

This skill owns target resolution and compliance review orchestration. It must not duplicate source, architecture, testing, or authoring rules owned by `material3-guidelines`, `material-component-authoring`, `docs/material-3`, and the applicable testing skills.

## Required input

The only required input is a component or family name.

Examples:

```text
material-component-review Button
material-component-review MDButton
material-component-review Switch
material-component-review Navigation rail
```

Do not ask the user to predefine the expected variants, API, states, sources, tests, or known defects.

## Review boundary

The default task is inspection and reporting only.

- Do not modify production code, tests, stories, snapshots, registries, or rules during the review.
- Do not convert findings into implementation work unless the user explicitly asks to fix them.
- When fixes are requested later, hand the resolved family and findings to `material-component` or `material-component-authoring` rather than implementing through this review skill.

## Resolve the target

1. Normalize the supplied name against current official Material 3 Expressive terminology.
2. Inspect existing `MD*` implementations, public exports, direct consumers, family README, component registry, UI inventory, migration map, roadmap, stories, and tests.
3. Resolve the official component surface and smallest cohesive owning family.
4. Identify the current production owner, canonical owner, supported surface claimed by the repository, and active consumers.
5. Ask one precise question only when source and repository inspection still leave two materially different official targets unresolved.

Treat repository documentation, tests, snapshots, and current rendering as implementation claims to verify, not as Material authority.

## Resolve authoritative evidence

Use `material3-guidelines` and the source hierarchy in `docs/material-3/source-of-truth.md`.

- Resolve current official Material 3 Expressive guidance first.
- Record exact pages, snapshot metadata, and Design Kit evidence when applicable.
- Do not use legacy Mioframe output, baseline snapshots, Material Web, another library, memory, or generic web content as proof of Material correctness.
- When official evidence is incomplete, distinguish unsupported optional surface from a blocker affecting a required or claimed scenario.

## Review the claimed supported surface

Compare the implementation against official evidence and project rules across every applicable area:

- component choice, intended usage, and prohibited usage;
- family boundary and ownership;
- variants, sizes, shapes, configurations, and defaults;
- public API, slots, emits, invalid combinations, and controlled-state contract;
- native semantics, accessibility, keyboard, pointer, touch, focus, target area, disabled, readonly, cancellation, and cleanup;
- anatomy and DOM ownership;
- component, system, reference, and extension token ownership;
- color, typography, shape, elevation, state layers, ripple, focus indicators, and motion;
- responsive, adaptive, overlay, and containment behavior when applicable;
- consumer compatibility, exports, migration completeness, and obsolete owners;
- family contract, Storybook coverage, component tests, browser tests, visual evidence, and directly affected records.

Review only capabilities the repository claims or current consumers require. Do not mark unimplemented optional Material capabilities as defects when they are honestly unsupported.

## Evidence standard

Every finding must contain:

```text
Severity: critical | high | medium | low
Area:
Official requirement:
Official source and snapshot:
Implementation evidence:
Observed mismatch:
Required correction:
```

Severity guidance:

- `critical` — invalid component choice, unsafe semantics, severe accessibility failure, data or interaction corruption, or a false complete/aligned claim hiding a blocking defect;
- `high` — required scenario, public contract, state behavior, token ownership, migration, or major visual contract is materially wrong;
- `medium` — bounded Material mismatch, incomplete proof, inconsistent documentation, or maintainability defect with real regression risk;
- `low` — minor documentation, naming, evidence, or cleanup issue that does not invalidate the supported contract.

Do not report speculative risks as findings. Separate confirmed defects from unavailable evidence.

## Compliance result

Use exactly one result:

- `compliant` — every claimed and required non-visual contract is source-resolved and correctly implemented, required proof exists, one canonical owner remains, and operator visual acceptance is already recorded when required;
- `technically-compliant-visual-review-required` — every non-visual contract passes, but final official visual comparison remains an operator gate;
- `partially-compliant` — the implementation is usable but one or more confirmed non-critical defects or proof gaps remain;
- `non-compliant` — a critical/high defect invalidates a required or claimed contract;
- `blocked` — authoritative evidence needed for a required decision is unavailable or materially conflicting.

Green CI, existing tests, accepted snapshots, or an `aligned` registry value are not sufficient by themselves for `compliant`.

The coding agent must not claim operator visual acceptance unless it is already durably recorded.

## Rule defects

When the review exposes an inaccurate, contradictory, obsolete, incomplete, or needlessly complex project rule:

- report the owning document or skill and the evidence exposing the defect;
- classify it separately from component implementation findings;
- recommend the smallest correction;
- do not modify the rule during a review-only run.

## Output

Finish with:

```text
MATERIAL COMPONENT COMPLIANCE REVIEW
Requested name:
Resolved family:
Current owner:
Canonical owner:
Official sources and snapshot:
Claimed supported surface:
Required consumer scenarios:
Compliance result:
Operator visual status: accepted | required | not applicable | blocked

Confirmed findings:
1. <severity> — <summary>
   Official requirement:
   Implementation evidence:
   Required correction:

Evidence gaps:
- none | <exact unresolved evidence>

Rule defects:
- none | <owner, defect, recommended correction>

Verified compliant areas:
- <concise list>

Recommended next action:
- no action | run material-component <family> with these findings | resolve <exact blocker>
```

Do not return only a checklist. State a clear compliance result and prioritize actionable defects.