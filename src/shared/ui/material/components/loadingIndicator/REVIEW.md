# Loading indicator review

Reviewed workspace state: current Loading Indicator design, architecture, runtime, consumers, proof, and stage artifacts inspected on 2026-07-30  
DESIGN.md status: current  
ARCHITECTURE.md status: ready  
IMPLEMENTATION.md status: complete  
MIGRATION.md status: complete  
Operator visual status: required  
Verdict: blocked

## Goal and scenarios reviewed

Reviewed the complete standalone uncontained Loading Indicator family, accessible purpose and bounded overall sizing, public active-color token, installed renderer integration and defects, Button parent composition, legacy-surface isolation, current consumers, automated proof, and project verification.

The selected scope matches current scenarios. Contained presentation, pull-to-refresh, determinate progress, long/external waits, and operation-state ownership are correctly deferred or assigned outside the family.

## Official design compliance

`DESIGN.md` is a complete current snapshot of all four official Loading Indicator tabs and the resolved eight-row token resource. It covers containment configurations, geometry, color, motion limits, placement, duration guidance, pull-to-refresh, accessibility, published tokens, source conflicts, and unknowns without Mioframe demand or renderer decisions.

The selected runtime surface implements the official uncontained configuration, required active anatomy/motion handoff, accessible progressbar purpose, 48/38 default geometry with the 24-240 range, and primary active color. Official contained and pull-to-refresh surface remains present in design and explicitly deferred by architecture.

## Architecture compliance

The ready architecture selects the smallest viable current contract and rejects both a raw-renderer export and speculative contained/progress surface. Ownership is narrow: the family owns its public adapter and renderer mapping; Button owns composition semantics; features own operation state and guards; the renderer owns private anatomy and motion.

The public Vue API (`label`, optional `size`, attribute fallthrough) and single public active-color token derive from official terminology and current demand. Renderer vocabulary remains private. M3E-001 and M3E-002 have explicit temporary-workaround ownership and removal triggers. `TEST IMPACT`, migration inventory, risks, and forbidden approaches are resolved.

## Implementation compliance

The implementation matches every selected architecture decision without deviation:

- canonical root export and family-local Vue adapter;
- required accessible label and deterministic bounded size normalization;
- explicit overall host geometry plus proportional active-size mapping;
- family-owned primary color token and private renderer mapping;
- package-derived custom-element typing and narrow registration;
- family-local exact-version workarounds with no shadow-DOM access or recreated motion;
- component, browser, visual, token, and renderer-boundary proof.

No unsupported public variant, state, token, event, slot, compatibility alias, or operation ownership was added. No `!important`, descendant cascade, private renderer inspection, or timing workaround exists in the family.

## Migration and legacy removal

The workspace inventory confirms Button is the sole current parent composition consumer and already uses the canonical public family API. There are no direct product consumers, raw renderer leaks outside the allowed boundary, or obsolete Loading Indicator owners to remove. Unrelated generic loading test stubs and external/provider wait UIs correctly remain outside this family.

Button preserves decorative child semantics, action labeling, `aria-busy`, 24 px geometry, `currentColor`, icon restoration, native interaction, and consumer-owned disabled/re-entry behavior.

## Proof and verification

- Focused Loading Indicator/Button component contracts passed.
- Package-derived type-check passed.
- Focused Storybook browser behavior passed.
- Managed visual verification passed without baseline updates.
- Required project verification passed for the reviewed workspace state.

Automated proof establishes the public contract, browser-observable semantics, geometry, color, stable pixels, and boundary containment. It does not establish subjective quality of the renderer-owned seven-shape motion.

## Blockers

1. Explicit operator visual/motion acceptance remains required for standalone size/color stories and Button-composed presentation. Automation and source inspection cannot accept private renderer motion quality.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- The installed renderer still has M3E-001 and M3E-002. The accepted exact-version workarounds are local, tested, documented, and must be revalidated or removed on renderer upgrade.
- Material publishes the seven-shape loop concept but not exact Web motion parameters. The renderer owns the private motion implementation; the remaining quality decision is assigned to the operator.
- Contextual `currentColor` contrast is parent-owned. Current Button composition proof covers the selected visual handoff; future parents must preserve the official contrast requirement.

## Items not required

- Contained configuration, container tokens, pull-to-refresh, determinate progress, long-wait behavior, live-region policy, rendered labels, disabled state, public motion controls, and product operation state.
- New product migration, compatibility aliases, shadow-DOM assertions, renderer animation reimplementation, or new visual baselines.

## Required return stage

Operator. No design, architecture, implementation, or migration correction is required.

## Completion status

Blocked only on operator visual/motion acceptance. If accepted without new findings, a fresh independent review may mark the family compliant with the listed renderer risks; any visual rejection routes to the earliest owning stage.
