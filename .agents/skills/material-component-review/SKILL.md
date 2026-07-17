---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants its current implementation checked against current official Material 3 Expressive documentation and project rules. Produce an evidence-backed compliance report and persist the latest family audit without modifying production implementation.'
---

# Material component review

Use this as the one-name, review-only entrypoint for an existing Material component implementation.

This skill owns target resolution, compliance-review orchestration, and the durable family audit. Source interpretation, component architecture, testing policy, and implementation remain owned by their canonical documents and skills.

## Required input

The only required input is a component or family name.

```text
material-component-review Button
material-component-review MDButton
material-component-review Switch
material-component-review Navigation rail
```

Do not ask the user to predefine variants, API, states, sources, tests, or known defects.

## Review boundary

The review inspects and reports. Its only required repository change is:

```text
docs/material-3/audits/<family-slug>.md
```

Do not modify production code, tests, stories, snapshots, registries, family contracts, roadmap, or project rules. Later fixes run through `material-component` or `material-component-authoring`.

## Resolve the target

1. Normalize the supplied name against current official Material 3 Expressive terminology.
2. Inspect existing `MD*` implementations, public exports, direct consumers, family README, latest family audit, component registry, inventory, physical migration map, roadmap, stories, and tests.
3. Resolve the official component surface and smallest cohesive family.
4. Identify the current production owner, canonical owner, claimed supported surface, and active consumers.
5. Ask one precise question only when source and repository inspection still leave two materially different official targets unresolved.

Resolve ownership from the architecture and physical migration map:

- official public families are canonically owned by `src/shared/ui/material/components/<family>`;
- an implementation under `src/shared/ui/<LegacyFamily>` remains legacy even when it is the only mature implementation;
- missing canonical ownership, public export, consumer migration, or obsolete-owner removal is a migration finding when completion is claimed.

Repository documentation, prior audits, tests, snapshots, and current rendering are implementation claims to verify, not Material authority.

## Resolve authoritative evidence

Use `material3-guidelines` and `docs/material-3/source-of-truth.md`.

- Resolve current official Material 3 Expressive guidance first.
- Record exact pages, token names, snapshot metadata, and Design Kit evidence when applicable.
- Do not use legacy Mioframe output, baseline snapshots, Material Web, another library, memory, or generic web content as proof.
- Distinguish honestly unsupported optional capability from a blocker affecting a required or claimed scenario.

## Review the supported contract

Compare applicable:

- component choice, intended usage, and prohibited usage;
- family boundary and physical ownership;
- variants, sizes, shapes, configurations, and defaults;
- public API, slots, emits, invalid combinations, and controlled state;
- native semantics, accessibility, keyboard, pointer, touch, focus, target area, disabled, readonly, cancellation, and cleanup;
- anatomy and DOM ownership;
- component, system, reference, and extension token ownership;
- color, typography, shape, elevation, state layers, ripple, focus indicators, and motion;
- responsive, adaptive, overlay, and containment behavior when applicable;
- consumers, exports, migration completeness, and obsolete owners;
- family contract, stories, tests, visual evidence, and directly affected records.

Review only capability the repository claims or current consumers require.

## Implementation evidence boundary

Review our implementation, not browser internals.

For each applicable contract:

1. identify the exact official requirement;
2. identify its accepted component or foundation owner;
3. trace configuration and state routing to the actual DOM property or behavior owner;
4. verify that public tokens, props, selectors, and foundation contracts are consumed rather than merely declared;
5. verify that no conflicting local route overrides the accepted contract;
6. verify focused tests at the layer that owns the behavior.

For motion:

- identify the official spring, easing, duration, or state-transition contract;
- require one accepted foundation owner for a shared Web adaptation;
- verify that the component applies that contract to the actual animated property owner;
- verify press/release and other state routing in code or focused contract tests;
- verify reduced-motion wiring when the project contract requires it;
- reject unused motion tokens, arbitrary local timing, conflicting transitions, or an undocumented approximation.

Do not require frame-by-frame sampling, browser interpolation analysis, overshoot measurement, or re-proving a shared motion foundation in every component.

Use focused browser verification only when correctness cannot be established reliably from source and contract tests, including:

- native focus, keyboard, pointer, touch, target-area, or cancellation behavior the component changes or constrains;
- layout, containment, overlay, scrolling, or DOM measurement;
- JavaScript or WAAPI timing and lifecycle;
- computed CSS cascade, inheritance, custom-property propagation, or final rendered-property behavior that is uncertain;
- a reproducible user-visible defect that source inspection alone cannot explain.

Test only materially different input paths. Do not duplicate pointer, touch, and keyboard checks when they use the same implementation route and native behavior is unchanged.

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

Browser reproduction belongs in `Implementation evidence` only when the finding depends on browser-owned or computed behavior. Otherwise exact code, token route, owner, and focused-test evidence are sufficient.

Severity:

- `critical` — invalid component choice, unsafe semantics, severe accessibility failure, data or interaction corruption, or a false complete claim hiding a blocker;
- `high` — a required scenario, public contract, state behavior, motion contract, token route, migration, or major visual contract is materially wrong;
- `medium` — bounded mismatch, incomplete proof, inconsistent documentation, or a maintainability defect with real regression risk;
- `low` — minor documentation, naming, evidence, or cleanup issue.

Do not report speculative risks as findings. Separate confirmed defects from unavailable evidence.

## Compliance result

Use exactly one:

- `compliant` — every claimed and required non-visual contract is source-resolved and correctly implemented, applicable proof exists, one canonical owner remains, and required operator visual acceptance is recorded;
- `technically-compliant-visual-review-required` — every agent-owned contract passes, but final official visual comparison remains an operator gate;
- `partially-compliant` — usable, but confirmed non-critical defects or proof gaps remain;
- `non-compliant` — a critical or high defect invalidates a required or claimed contract;
- `blocked` — authoritative evidence or required verification is unavailable or materially conflicting.

Green CI, existing tests, accepted snapshots, or an `aligned` registry value are not sufficient by themselves.

The operator is not responsible for discovering ownership, API, semantics, token-routing, foundation, or implementation defects. Perceptual visual and motion fidelity remains part of operator visual acceptance after the technical contract passes.

## Rule defects

When the review exposes an inaccurate, contradictory, obsolete, incomplete, or needlessly complex project rule:

- report the owning source and evidence;
- classify it separately from implementation findings;
- recommend the smallest correction;
- do not modify it during the review-only run.

## Durable audit artifact

Create or replace exactly one file:

```text
docs/material-3/audits/<family-slug>.md
```

Follow `docs/material-3/audits/README.md`.

- Use the resolved family slug in kebab case.
- Keep one current file per family; do not create dated copies.
- Record the implementation ref and commit reviewed before writing.
- Write the audit for every result, including `compliant` and `blocked`.
- Replace stale prior content.
- Do not update other records from a review-only run.

The review is incomplete until the audit exists, matches the reported result, and its path is reported.

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
## Required consumer scenarios
## Confirmed findings
## Evidence gaps
## Rule defects
## Verified compliant areas
## Recommended next action
```

Use explicit `none` values for empty sections.

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
Audit file: docs/material-3/audits/<family-slug>.md

Confirmed findings:
1. <severity> — <summary>

Evidence gaps:
- none | <exact unresolved evidence>

Rule defects:
- none | <owner, defect, recommended correction>

Verified compliant areas:
- <concise list>

Recommended next action:
- no action | run material-component <family> with this audit | resolve <exact blocker>
```

Do not return only a checklist. Persist the audit and prioritize actionable defects.