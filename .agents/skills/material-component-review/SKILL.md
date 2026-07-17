---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants its current implementation checked against current official Material 3 Expressive documentation and project rules. Produce an evidence-backed compliance report and persist the latest family audit without modifying production implementation.'
---

# Material component review

Use this as the one-name, review-only entrypoint for checking an existing Material component implementation.

This skill owns target resolution, compliance-review orchestration, and the durable family audit artifact. It must not duplicate source, architecture, testing, or authoring rules owned by `material3-guidelines`, `material-component-authoring`, `docs/material-3`, and the applicable testing skills.

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

The default task is inspection, durable audit recording, and reporting only.

- The required repository change is `docs/material-3/audits/<family-slug>.md`.
- Do not modify production code, tests, stories, snapshots, registries, family contracts, or project rules during the review.
- Do not convert findings into implementation work unless the user explicitly asks to fix them.
- When fixes are requested later, hand the resolved family and findings to `material-component` or `material-component-authoring` rather than implementing through this review skill.

## Resolve the target

1. Normalize the supplied name against current official Material 3 Expressive terminology.
2. Inspect existing `MD*` implementations, public exports, direct consumers, family README, latest family audit, component registry, UI inventory, physical migration map, roadmap, stories, and tests.
3. Resolve the official component surface and smallest cohesive owning family.
4. Identify the current production owner, canonical owner, supported surface claimed by the repository, and active consumers.
5. Ask one precise question only when source and repository inspection still leave two materially different official targets unresolved.

Resolve ownership from the architecture and physical migration map, not from current file existence or prior claims.

- Official component families are canonically owned by `src/shared/ui/material/components/<family>`.
- An implementation under `src/shared/ui/<LegacyFamily>` is a legacy owner even when it is the only implementation and already has mature tests.
- Do not report the current owner as canonical merely because no duplicate exists.
- Missing physical migration, canonical public export, consumer migration, or obsolete-owner removal is a confirmed migration finding when the repository claims the family is migrated or the review is being used as the completion gate for `material-component`.

Treat repository documentation, prior audits, tests, snapshots, and current rendering as implementation claims to verify, not as Material authority.

## Resolve authoritative evidence

Use `material3-guidelines` and the source hierarchy in `docs/material-3/source-of-truth.md`.

- Resolve current official Material 3 Expressive guidance first.
- Record exact pages, token names, snapshot metadata, and Design Kit evidence when applicable.
- Do not use legacy Mioframe output, baseline snapshots, Material Web, another library, memory, or generic web content as proof of Material correctness.
- When official evidence is incomplete, distinguish unsupported optional surface from a blocker affecting a required or claimed scenario.
- A component or system motion token is not implemented merely because its name or numeric values appear in CSS. Trace it to the actual rendered property and real interaction.

## Review the claimed supported surface

Compare the implementation against official evidence and project rules across every applicable area:

- component choice, intended usage, and prohibited usage;
- family boundary and physical ownership;
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

## Mandatory empirical interaction review

For every visible interactive component, source and test inspection is insufficient. Run the canonical story, preview, or focused application surface in a real browser and exercise every applicable component-owned interaction with real input.

At minimum:

1. identify the official state or motion requirement and the rendered property owner;
2. reproduce acquisition and release with real pointer, keyboard, and touch input when applicable;
3. inspect the resting state, interaction onset, at least one meaningful intermediate sample, release, and settled state;
4. verify the actual property, duration or spring trajectory, easing or spring model, interruption, cancellation, and reduced-motion behavior owned by the component;
5. compare the observed behavior with the named official source and token route;
6. record the browser command, story or surface id, input sequence, and observed result in the audit.

For spring-driven Material motion:

- verify that the implementation consumes an equivalent spring model or an evidence-backed Web approximation of the official stiffness and damping;
- require traceable derivation or measured browser evidence for any fixed duration/easing approximation;
- a generic transition, an undocumented cubic-bezier, matching endpoint radii, or declarations of spring token values are not proof of spring compliance;
- sample the real trajectory or otherwise prove overshoot, settling, interruption, and release behavior appropriate to the official spring contract;
- classify a visibly wrong interaction as a confirmed implementation or foundation defect even when static screenshots and endpoint assertions pass.

Forced state classes prove only the rendered endpoint. Existing unit, visual, and browser tests are evidence to evaluate, not a substitute for this empirical review. When a required interaction cannot be run in a real browser, record the exact evidence gap and do not mark that interaction compliant.

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

For visible behavior or motion findings, `Implementation evidence` must include the real-browser reproduction and observed behavior, not only source code or existing tests.

Severity guidance:

- `critical` — invalid component choice, unsafe semantics, severe accessibility failure, data or interaction corruption, or a false complete/aligned claim hiding a blocking defect;
- `high` — required scenario, public contract, state behavior, motion, token ownership, migration, or major visual contract is materially wrong;
- `medium` — bounded Material mismatch, incomplete proof, inconsistent documentation, or maintainability defect with real regression risk;
- `low` — minor documentation, naming, evidence, or cleanup issue that does not invalidate the supported contract.

Do not report speculative risks as findings. Separate confirmed defects from unavailable evidence.

## Compliance result

Use exactly one result:

- `compliant` — every claimed and required non-visual contract is source-resolved and correctly implemented, empirical interaction review passes, required proof exists, one canonical physical owner remains, and operator visual acceptance is already recorded when required;
- `technically-compliant-visual-review-required` — every agent-owned contract, including empirical interaction and motion review, passes, but final official visual comparison remains an operator gate;
- `partially-compliant` — the implementation is usable but one or more confirmed non-critical defects or proof gaps remain;
- `non-compliant` — a critical/high defect invalidates a required or claimed contract;
- `blocked` — authoritative evidence or required empirical browser evidence needed for a decision is unavailable or materially conflicting.

Green CI, existing tests, accepted snapshots, endpoint equality, or an `aligned` registry value are not sufficient by themselves for `compliant`.

The coding agent must not claim operator visual acceptance unless it is already durably recorded. The operator is not responsible for discovering motion, interaction, ownership, token-routing, or architecture defects that this review is required to find.

## Rule defects

When the review exposes an inaccurate, contradictory, obsolete, incomplete, or needlessly complex project rule:

- report the owning document or skill and the evidence exposing the defect;
- classify it separately from component implementation findings;
- recommend the smallest correction;
- do not modify the rule during a review-only run.

## Durable audit artifact

Create or replace exactly one file:

```text
docs/material-3/audits/<family-slug>.md
```

Follow `docs/material-3/audits/README.md`.

- Use the resolved owning-family slug in kebab case, not the raw user input.
- Keep one current file per family; do not create dated copies.
- Record the implementation branch/ref and commit reviewed before writing the audit file.
- Write the audit even when the result is `compliant`, there are no findings, or the review is `blocked`.
- Preserve all required sections and use explicit `none` values where applicable.
- Replace stale prior content rather than appending a second result.
- Do not update component registries, roadmap state, family contracts, or production claims from a review-only run.

The review is incomplete until the audit file exists, matches the reported result, and its path is included in the final response. When repository write access is unavailable, report `blocked` with the exact audit-artifact limitation rather than claiming completion.

## Audit file structure

Use:

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

## Empirical interaction evidence

## Confirmed findings

## Evidence gaps

## Rule defects

## Verified compliant areas

## Recommended next action
```

Each confirmed finding uses the evidence fields defined above. `Empirical interaction evidence` records the real browser surface, commands, input sequence, intermediate observation method, reduced-motion coverage, and result for every applicable component-owned interaction.

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
Empirical interaction review: passed | failed | blocked
Compliance result:
Operator visual status: accepted | required | not applicable | blocked
Audit file: docs/material-3/audits/<family-slug>.md

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

Do not return only a checklist. State a clear compliance result, persist the audit, prioritize actionable defects, and never infer interactive fidelity from endpoint-only evidence.