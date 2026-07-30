# Loading indicator review

Review ref/commit: working tree on `refactor/material-docs-ownership`, 2026-07-30  
Review date: 2026-07-30  
DESIGN.md status: current  
ARCHITECTURE.md status: ready  
IMPLEMENTATION.md status: complete  
MIGRATION.md status: complete  
Operator visual status: required  
Verdict: blocked

## Goal and scenarios reviewed

Reviewed the complete standalone uncontained Loading indicator family, its accessible purpose and bounded overall sizing, public active-color token, installed renderer integration and defects, Button parent composition, legacy-surface isolation, all current consumers, automated proof, and current-head verification.

The selected scope matches the current scenarios. Contained presentation, pull-to-refresh, determinate progress, long/external waits, and operation-state ownership are correctly deferred or assigned outside the family.

## Official design compliance

`DESIGN.md` is a complete current snapshot of all four official Loading indicator tabs and the resolved eight-row token resource. It covers both containment configurations, complete geometry, color, motion limits, placement, duration guidance, pull-to-refresh, accessibility, all published tokens, source conflicts, and unknowns without Mioframe demand or renderer decisions.

The selected runtime surface implements the official uncontained configuration, required active anatomy/motion handoff, accessible progressbar purpose, 48/38 default geometry with the 24-240 range, and primary active color. Official contained and pull-to-refresh surface remains present in design and explicitly deferred by architecture.

## Architecture compliance

The ready architecture selects the smallest viable current contract and rejects both a raw-renderer export and speculative contained/progress surface. Ownership is narrow: the family owns its public adapter and renderer mapping; Button owns composition semantics; features own operation state and guards; m3e owns private anatomy and motion.

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

The repository-wide inventory confirms Button is the sole current parent composition consumer and already uses the canonical public family API. There are no direct product consumers, raw renderer leaks outside the allowed boundary, or obsolete Loading-indicator-specific owners to remove. Unrelated generic loading test stubs and external/provider wait UIs correctly remain outside this family.

Button preserves decorative child semantics, action labeling, `aria-busy`, 24 px geometry, `currentColor`, icon restoration, native interaction, and consumer-owned disabled/re-entry behavior.

## Proof and verification

- Focused Loading indicator/Button component contracts passed.
- Package-derived type-check passed.
- Focused Storybook browser behavior passed.
- Managed visual verification passed all 215 checks without baseline updates.
- Final `pnpm verify --base origin/develop` passed on the resulting working tree; the outer orchestration report owns the exact run summary.

Automated proof establishes the public contract, browser-observable semantics/geometry/color, stable pixels, and boundary containment. It does not establish subjective conformance or quality of the renderer-owned seven-shape motion.

## Blockers

1. Explicit operator visual/motion acceptance remains required for the standalone size/color stories and Button-composed presentation. Automation and source inspection cannot accept private renderer motion quality.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- Installed `@m3e/web@2.6.3` still has M3E-001 and M3E-002. The accepted exact-version workarounds are local, tested, documented, and must be revalidated or removed on renderer upgrade.
- Material publishes the seven-shape loop concept but not exact motion parameters. m3e owns the private motion implementation; the remaining quality decision is explicitly assigned to the operator.
- Contextual `currentColor` contrast is parent-owned. Current Button composition proof covers the selected visual handoff; future parents must preserve the official 3:1 contrast requirement.

## Items not required

- Contained configuration, container tokens, pull-to-refresh, determinate progress, long-wait behavior, live-region policy, rendered labels, disabled state, public motion controls, and product operation state.
- New product migration, compatibility aliases, shadow-DOM assertions, renderer animation reimplementation, or new visual baselines.

## Required return stage

Operator. No design, architecture, implementation, or migration correction is required.

## Merge readiness

Should not merge until operator visual/motion acceptance is recorded. If accepted without new findings, the family can merge with the listed exact-version renderer risks; any rejection must route to the earliest owning stage.
