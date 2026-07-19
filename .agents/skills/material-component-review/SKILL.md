---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants its current implementation checked against current official Material 3 Expressive documentation and project rules. Produce an evidence-backed compliance report and persist the latest family audit without modifying production implementation.'
---

# Material component review

Use this as the one-name, review-only entrypoint for checking an existing Material component implementation.

This repository-level skill owns target resolution and orchestration only. Material-specific source, architecture, testing, review, and audit policy is owned under `src/shared/ui/material`.

## Required input

The only required input is a component or family name.

Examples:

```text
material-component-review Button
material-component-review MDButton
material-component-review Switch
material-component-review Navigation rail
```

Do not ask the user to predefine expected variants, API, states, sources, tests, or known defects.

## Load canonical owners

Read:

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/source-of-truth.md`;
- `src/shared/ui/material/docs/component-architecture.md`;
- `src/shared/ui/material/docs/component-testing.md`;
- `src/shared/ui/material/docs/autonomous-review.md`;
- `src/shared/ui/material/docs/audits/README.md`;
- the selected family contract, registry record, inventory record, roadmap state, and latest audit.

Do not create or rely on Material-specific policy outside this boundary.

## Review boundary

The default task is inspection, durable audit recording, and reporting only.

- The required repository change is `src/shared/ui/material/docs/audits/<family-slug>.md`.
- Do not modify production code, tests, stories, snapshots, registries, family contracts, roadmap, or policies during the review.
- Do not convert findings into implementation work unless the user explicitly asks to fix them.
- When fixes are requested later, hand the resolved family and findings to `material-component` or `material-component-authoring`.

## Resolve the target

1. Normalize the supplied name against current official Material 3 Expressive terminology.
2. Inspect existing `MD*` implementations, public exports, direct consumers, family contract, latest family audit, component registry, UI inventory, migration map, roadmap, owner-local stories, and tests.
3. Resolve the official component surface and smallest cohesive owning family.
4. Identify the current production owner, canonical owner, supported surface claimed by the library, and external compatibility scenarios.
5. Ask one precise question only when source and repository inspection still leave two materially different official targets unresolved.

Treat repository documentation, prior audits, tests, snapshots, and current rendering as implementation claims to verify, not as Material authority.

## Resolve authoritative evidence

Use `material3-guidelines` and `src/shared/ui/material/docs/source-of-truth.md`.

- Resolve current official Material 3 Expressive guidance first.
- Record exact pages, snapshot metadata, and Design Kit evidence when applicable.
- Do not use legacy Mioframe output, baseline snapshots, Material Web, another library, memory, or generic web content as proof of Material correctness.
- When official evidence is incomplete, distinguish unsupported optional surface from a blocker affecting a required or claimed contract.

## Review the claimed supported surface

Compare the implementation against official evidence and canonical shared-library rules across every applicable area:

- component choice, intended usage, and prohibited usage;
- family boundary and ownership;
- variants, sizes, shapes, configurations, and defaults;
- generic public API, slots, emits, invalid combinations, and controlled-state contract;
- native semantics, accessibility, keyboard, pointer, touch, focus, target area, disabled, readonly, cancellation, and cleanup;
- anatomy and DOM ownership;
- component, system, reference, and extension token ownership;
- color, typography, shape, elevation, state layers, ripple, focus indicators, and motion;
- responsive, adaptive, overlay, and containment behavior when applicable;
- owner-local Storybook, component tests, browser tests, visual evidence, and directly affected shared records;
- external consumer compatibility, public imports, migration completeness, and obsolete owners without allowing consumers to define internal library architecture.

Review only capabilities the library claims or the accepted supported surface requires. Do not mark honestly unsupported optional Material capabilities as defects.

## Evidence standard

Every finding contains:

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

- `critical` — invalid component choice, unsafe semantics, severe accessibility failure, interaction corruption, or a false complete/aligned claim hiding a blocker;
- `high` — required contract, state behavior, token ownership, migration, or major visual contract is materially wrong;
- `medium` — bounded Material mismatch, incomplete proof, inconsistent documentation, or maintainability defect with real regression risk;
- `low` — minor documentation, naming, evidence, or cleanup issue that does not invalidate the supported contract.

Do not report speculative risks as findings. Separate confirmed defects from unavailable evidence.

## Compliance result

Use exactly one result:

- `compliant` — every claimed and required non-visual contract is source-resolved and correctly implemented, required proof exists, one canonical owner remains, and operator visual acceptance is already recorded when required;
- `technically-compliant-visual-review-required` — every non-visual contract passes, but final visual comparison remains an operator gate;
- `partially-compliant` — usable, but confirmed non-critical defects or proof gaps remain;
- `non-compliant` — a critical/high defect invalidates a required or claimed contract;
- `blocked` — authoritative evidence required for a decision is unavailable or materially conflicting.

Green CI, existing tests, accepted snapshots, or an `aligned` registry value are not sufficient by themselves for `compliant`.

The coding agent must not claim operator visual acceptance unless it is already durably recorded.

## Rule defects

When the review exposes an inaccurate, contradictory, obsolete, incomplete, or needlessly complex Material rule:

- report the owning file under `src/shared/ui/material` and the evidence exposing the defect;
- classify it separately from component findings;
- recommend the smallest correction;
- do not modify the rule during a review-only run.

## Durable audit artifact

Create or replace exactly one file:

```text
src/shared/ui/material/docs/audits/<family-slug>.md
```

Follow `src/shared/ui/material/docs/audits/README.md`.

- Use the resolved owning-family slug in kebab case, not raw user input.
- Keep one current file per family; do not create dated copies.
- Record the implementation branch/ref and commit reviewed before writing the audit.
- Write the audit even when the result is `compliant`, there are no findings, or the review is `blocked`.
- Preserve all required sections and use explicit `none` values.
- Replace stale prior content rather than appending a second result.
- Do not update registries, roadmap, family contracts, production claims, or policy during a review-only run.

The review is incomplete until the audit exists, matches the reported result, and its path is included in the final response. When repository write access is unavailable, report `blocked` rather than claiming completion.

## Audit structure

```text
# <Resolved family> Material 3 Expressive compliance audit

- Requested name:
- Resolved family:
- Audit date:
- Implementation ref:
- Implementation commit:
- Current owner:
- Canonical owner:
- Compliance result:
- Operator visual status: accepted | required | not applicable | blocked

## Official evidence
## Claimed supported surface
## External compatibility scenarios
## Confirmed findings
## Evidence gaps
## Rule defects
## Verified compliant areas
## Recommended next action
```

Each confirmed finding uses the evidence fields defined above.

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
External compatibility scenarios:
Compliance result:
Operator visual status: accepted | required | not applicable | blocked
Audit file: src/shared/ui/material/docs/audits/<family-slug>.md

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
- no action | run material-component <family> with this audit | resolve <exact blocker>
```

Do not return only a checklist. State a clear compliance result, persist the audit inside the shared Material boundary, and prioritize actionable defects.
