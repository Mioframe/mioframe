# Material 3 foundation registry

This registry is the current status source for Material foundation domains. It complements `foundation-architecture.md`.

Historical audits remain evidence only. Update the affected record whenever source meaning, snapshot, owner, migration status, contract, consumers, gaps, or verification changes.

## Status

- `missing`: no accepted contract exists.
- `partial`: an owner exists, but source coverage, completeness, consistency, or verification has known gaps.
- `verified`: the supported contract is source-backed, implemented, and verified against an exact recorded snapshot.
- `deviated`: the accepted Mioframe contract intentionally differs from current Material guidance.
- `blocked`: required source guidance or ownership is unresolved.

A legacy `partial` record may use `Verified snapshot: not yet recorded — legacy owner`. A record must not use `verified` without a concrete snapshot and named verification.

## Official source evidence

- Status: `partial`.
- Official sources: `material3` MCP; `Vyachean/m3-docs-cache` fallback; official Material Design Kit for exact visual decisions unresolved by published docs.
- Verified snapshot: source hierarchy reviewed 2026-07-16; domain snapshots remain record-specific.
- Current production owner: policy/tooling outside application runtime.
- Canonical library owner: none; policy remains under `src/shared/ui/material/docs`.
- Migration status: `migrated`.
- Public contract: bounded authority order, exact snapshot recording, Design Kit role, and explicit `partial`/`blocked` handling.
- Private bridge contract: none.
- Verification-only contract: none.
- Known consumers: every Material foundation, component, pattern, and review decision.
- Known gaps: historical domains need exact snapshots when revalidated.
- Verification: policy review plus source records in family blueprints and domain changes.
- Last reviewed: 2026-07-16.

## Authoring units

- Status: `partial`.
- Official sources: Material unit usage in component and typography specs.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `postcss.config.js` and shared base-unit variables.
- Canonical library owner: Material-facing contract under `material/foundation`; generic build infrastructure may remain outside.
- Migration status: `legacy`.
- Public contract: `dp` for Material dimensions, `sp` for typography, `step` for app layout, `pt` legacy-only.
- Private bridge contract: centralized build-time custom-unit conversion.
- Verification-only contract: none.
- Known consumers: all Material CSS using custom units.
- Known gaps: `--one-sp: 1px` preserves rendering; future scaling and `pt` removal remain unresolved.
- Verification: PostCSS transform tests and representative typography/shape/layout checks.
- Last reviewed: 2026-07-16.

## Reference palette and typeface tokens

- Status: `partial`.
- Official sources: Material reference palette and typeface-token docs.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/tokens` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: verified `--md-ref-palette-*` and `--md-ref-typeface-*` tokens only.
- Private bridge contract: none.
- Verification-only contract: none.
- Known consumers: system color and typography roles.
- Known gaps: complete tone/role inventory is not mechanically validated; no generated palette contract.
- Verification: vocabulary/ownership checks and representative theme surfaces.
- Last reviewed: 2026-07-16.

## Theme and system color roles

- Status: `partial`.
- Official sources: Material color roles, schemes, and deprecation guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/theme` plus token owner as proven by migration.
- Migration status: `legacy`.
- Public contract: `--md-sys-color-*` mapped from reference tokens; light defaults and dark media override.
- Private bridge contract: none.
- Verification-only contract: deterministic Storybook theme context.
- Known consumers: Material components and product surfaces using system roles.
- Known gaps: complete role parity, app-controlled theme context, and deprecated surface-tint compatibility removal.
- Verification: token graph, computed scheme checks, and representative visuals.
- Last reviewed: 2026-07-16.

## Typography

- Status: `partial`.
- Official sources: Material type-scale and unit guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`, `typography.ts`, `MD_TYPESCALE`, and `.md-typescale-*` utilities.
- Canonical library owner: `src/shared/ui/material/foundation/typography` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: components use system type-scale roles/shared utilities instead of local type declarations.
- Private bridge contract: none.
- Verification-only contract: stable font readiness for visual tests.
- Known consumers: shared UI and product text using Material typography.
- Known gaps: exact source parity and future `sp` scaling policy.
- Verification: token/utility tests, generated CSS, and representative text visuals.
- Last reviewed: 2026-07-16.

## Shape roles

- Status: `partial`.
- Official sources: Material shape roles and component-specific shape specs.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/shape` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: `--md-sys-shape-corner-*`; published component shapes route through component tokens.
- Private bridge contract: none.
- Verification-only contract: none.
- Known consumers: shaped Material surfaces.
- Known gaps: mixed unit authoring and complete role parity.
- Verification: token checks and representative computed-radius/visual checks.
- Last reviewed: 2026-07-16.

## Elevation

- Status: `partial`.
- Official sources: Material elevation and surface-tint guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/elevation` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: `--md-sys-elevation-level0` through `level5`.
- Private bridge contract: `--md-private-elevation-shadow-color`.
- Verification-only contract: none.
- Known consumers: elevated components/surfaces.
- Known gaps: shadow definitions, dark behavior, component routing, bridge verification, and deprecated tint prevention.
- Verification: token checks, computed owner checks, and representative elevated surfaces.
- Last reviewed: 2026-07-16.

## Motion

- Status: `partial`.
- Official sources: Material motion guidance and family-specific Expressive motion pages.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css` and documented private Web adaptations.
- Canonical library owner: `src/shared/ui/material/foundation/motion` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: verified `--md-sys-motion-*` values only.
- Private bridge contract: documented `--md-private-motion-expressive-*` adaptations when CSS cannot express the official model directly.
- Verification-only contract: deterministic settling and reduced-motion setup.
- Known consumers: components with Material transitions/motion.
- Known gaps: token parity, reduced-motion policy, adaptation validation, and per-family use.
- Verification: static token checks, browser motion/reduced-motion checks, and representative assertions.
- Last reviewed: 2026-07-16.

## Interaction state, state layer, ripple, focus, and visual verification

- Status: `partial`.
- Official sources: Material interaction-state, state-layer, focus, and family-specific state guidance.
- Verified snapshot: reviewed through 2026-07-16; consolidated domain snapshot remains for migration.
- Current production owner: `src/shared/ui/State/` plus system state tokens in `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/interaction` after focused migration.
- Migration status: `legacy`.
- Public contract: `MDStateLayer`, `useStateLayer`, `useRipple`, host focus/activation semantics, and system state/focus tokens.
- Private bridge contract: generic `--md-private-state-*` and state-layer inputs documented by the current owner.
- Verification-only contract: `src/shared/ui/State/testing` and `MDStateLayerForcedStateProvider` render deterministic generic transient appearance only.
- Known consumers: interactive Material components and their matrices.
- Known gaps: ripple policy, focus-indicator ownership, reduced-motion interaction, dragged/focus verification, and family coverage.
- Verification: foundation tests, real browser focus/pointer/touch checks, deterministic appearance, and representative host integration.
- Last reviewed: 2026-07-16.

## Iconography

- Status: `partial`.
- Official sources: Material Symbols and family-specific icon guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/ui/Icon/` and `MDSymbol`.
- Canonical library owner: `src/shared/ui/material/foundation/icon` after focused migration.
- Migration status: `legacy`.
- Public contract: shared Material Symbol primitive with explicit size, fill, weight, grade, optical size, and accessibility behavior.
- Private bridge contract: none.
- Verification-only contract: deterministic icon/font readiness.
- Known consumers: icon-bearing components and product actions.
- Known gaps: public API strategy and exact family-specific icon sizing/state verification.
- Verification: primitive contract tests and representative component browser/visual checks.
- Last reviewed: 2026-07-16.

## Density, spacing, and target area

- Status: `partial`.
- Official sources: component measurements, density/layout guidance, and accessibility target requirements.
- Verified snapshot: not yet recorded — policy and family evidence are mixed.
- Current production owner: `density-spacing.md`; each component owns supported measurements and target box.
- Canonical library owner: policy remains under `src/shared/ui/material/docs`; runtime owner is component-specific unless a shared artifact is required.
- Migration status: `migrated`.
- Public contract: exact component specs first, layout guidance second, app `step` only when no exact Material measure exists.
- Private bridge contract: none.
- Verification-only contract: browser geometry and hit-target checks.
- Known consumers: all Material components and app layout.
- Known gaps: complete family target-area and compact-behavior inventory.
- Verification: component geometry/hit testing and representative visuals.
- Last reviewed: 2026-07-16.

## Accessibility

- Status: `partial`.
- Official sources: Material accessibility pages, native HTML semantics, and repository policy.
- Verified snapshot: not yet recorded as one exact policy snapshot.
- Current production owner: `accessibility.md`; components/overlays/focus owners implement it.
- Canonical library owner: policy remains under `src/shared/ui/material/docs`.
- Migration status: `migrated`.
- Public contract: accessible names, native semantics first, focus-visible, keyboard behavior, target areas, contrast-safe roles, modal focus, and meaningful state exposure.
- Private bridge contract: none.
- Verification-only contract: focused accessibility/browser checks.
- Known consumers: all interactive/semantic Material components and product composition.
- Known gaps: exact policy snapshot and family compliance.
- Verification: component contract, browser behavior, and focused accessibility checks.
- Last reviewed: 2026-07-16.

## Overlay containment and lifecycle

- Status: `partial`.
- Official sources: overlay component guidance plus project containment policy.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/ui/Overlay` plus generic teleport/outside-interaction dependencies.
- Canonical library owner: `src/shared/ui/material/foundation/overlay`; generic dependencies remain outside.
- Migration status: `legacy`.
- Public contract: nearest Material overlay container, nested registration, and shared interaction boundaries.
- Private bridge contract: overlay context/container and child-stack internals.
- Verification-only contract: isolated Storybook overlay fixtures.
- Known consumers: menus, dialogs, sheets, tooltips, FAB helpers, and transient surfaces.
- Known gaps: lifecycle consistency, escape/back stacking, focus trap, scroll lock, and nested behavior.
- Verification: browser focus, outside interaction, nested teleport, escape/back, scrim, scroll lock, and responsive checks.
- Last reviewed: 2026-07-16.

## Layout and adaptivity

- Status: `partial`.
- Official sources: Material window classes, canonical layouts, navigation adaptation, pane, app bar, sheet, and toolbar guidance.
- Verified snapshot: not yet recorded — policy and product evidence are mixed.
- Current production owner: `layout-adaptive.md` plus current layout primitives and product composition.
- Canonical library owner: policy remains under `src/shared/ui/material/docs`; concrete component/pattern owners are added only from current needs.
- Migration status: `legacy`.
- Public contract: compact/medium/expanded decisions, canonical-layout choice, pane ownership, and navigation choice based on product information architecture.
- Private bridge contract: current layout contexts and scroll-container contracts where implemented.
- Verification-only contract: deterministic Storybook/browser surfaces at affected sizes.
- Known consumers: pages, panes, navigation, sheets, app bars, and responsive components.
- Known gaps: no complete app-wide adaptive-switching contract; component adaptation remains family-specific.
- Verification: responsive browser/story checks and product-flow verification for layout/component choice.
- Last reviewed: 2026-07-16.

## Update rules

For every foundation change:

1. update the affected record before claiming completion;
2. record exact official pages and snapshot when meaning/status changes;
3. keep current/canonical owner and migration status accurate;
4. keep public/private/testing contracts aligned with code/exports;
5. inventory consumers for corrections/replacements;
6. update verification, visual impact, and remaining gaps honestly;
7. keep unrelated records unchanged.
