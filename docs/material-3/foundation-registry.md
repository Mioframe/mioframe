# Material 3 foundation registry

This registry is the current status source for Material foundation domains. It complements [Foundation architecture](./foundation-architecture.md).

Update a record whenever source meaning, snapshot, current/canonical owner, migration status, public/private/testing contract, consumers, gaps, or verification changes.

Historical audits remain evidence only.

## Status values

- `missing`: no accepted contract exists.
- `partial`: an owner exists, but source coverage, contract completeness, consistency, or verification has known gaps.
- `verified`: the supported contract is source-backed, implemented, and verified against an exact recorded snapshot.
- `deviated`: the accepted contract intentionally differs from current Material guidance.
- `blocked`: required source guidance or ownership is unresolved.

`verified` applies only to the supported contract. It does not claim every optional Material capability.

For legacy `partial` records, `Verified snapshot` may state `not yet recorded — legacy owner`. A record must not be promoted to `verified` without a concrete snapshot and named verification.

## Registry

### Official source evidence

- Status: `partial`.
- Official sources: Material documentation through `material3` MCP; `Vyachean/m3-docs-cache` fallback; official Material Design Kit for unresolved exact visual geometry and state composition.
- Verified snapshot: source workflow reviewed 2026-07-16; individual domain snapshots remain record-specific.
- Current production owner: tooling and policy outside application runtime.
- Canonical library owner: none; policy remains under `docs/material-3`.
- Migration status: `migrated` as policy.
- Public contract: source authority order, bounded lookup, exact page/snapshot recording, Design Kit role, and explicit blocked/partial behavior when evidence is insufficient.
- Private bridge contract: none.
- Verification-only contract: none.
- Known consumers: every Material foundation, component, pattern, state-matrix, and alignment decision.
- Known gaps: historical domain records still need exact snapshots when revalidated.
- Verification: policy review and domain records naming checked pages, snapshots, and Design Kit references where applicable.
- Last reviewed: 2026-07-16.

### Authoring units

- Status: `partial`.
- Official sources: Material unit usage in component and typography specifications.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `postcss.config.js` and shared base-unit variables.
- Canonical library owner: Material-facing contract under `material/foundation`; generic PostCSS infrastructure may remain outside.
- Migration status: `legacy`.
- Public contract: `dp` for Material dimensions, `sp` for Material typography; `step` for project layout composition; `pt` legacy-only.
- Private bridge contract: centralized build-time custom-unit conversion.
- Verification-only contract: none.
- Known consumers: all Material CSS authored with custom units.
- Known gaps: `--one-sp: 1px` preserves current rendering; future scaling policy and legacy `pt` removal remain unresolved.
- Verification: PostCSS transform tests and representative typography/shape/layout checks.
- Last reviewed: 2026-07-16.

### Reference palette and typeface tokens

- Status: `partial`.
- Official sources: Material reference palette and typeface-token documentation.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/tokens` when focused migration proves the boundary.
- Migration status: `legacy`.
- Public contract: verified `--md-ref-palette-*` and `--md-ref-typeface-*` tokens only.
- Private bridge contract: none.
- Verification-only contract: none.
- Known consumers: system color and typography roles.
- Known gaps: complete official inventory and current role requirements are not mechanically validated; no generated-palette contract exists.
- Verification: token vocabulary/ownership checks and representative theme surfaces.
- Last reviewed: 2026-07-16.

### Theme and system color roles

- Status: `partial`.
- Official sources: Material color roles, light/dark schemes, and current deprecation guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/theme` plus token owner as proven by migration.
- Migration status: `legacy`.
- Public contract: `--md-sys-color-*` roles mapped from reference tokens; light defaults and dark `prefers-color-scheme` overrides.
- Private bridge contract: none.
- Verification-only contract: deterministic theme contexts used by Storybook verification.
- Known consumers: all Material components and product surfaces using system roles.
- Known gaps: complete role parity, explicit app-controlled theme context, and removal of deprecated `--md-sys-color-surface-tint-color` remain unresolved.
- Verification: token graph checks, computed light/dark values, and representative component visuals.
- Last reviewed: 2026-07-16.

### Typography

- Status: `partial`.
- Official sources: Material type-scale roles and typography unit guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`, `src/shared/lib/md/typography.ts`, `MD_TYPESCALE`, and `.md-typescale-*` utilities.
- Canonical library owner: `src/shared/ui/material/foundation/typography` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: components use system type-scale roles and shared typography utilities instead of local type declarations.
- Private bridge contract: none.
- Verification-only contract: stable font loading for visual tests.
- Known consumers: shared UI and product text mapped to Material typography.
- Known gaps: exact source parity and future `sp` scaling policy require focused review.
- Verification: token validation, utility tests, generated CSS, and representative text visuals.
- Last reviewed: 2026-07-16.

### Shape roles

- Status: `partial`.
- Official sources: Material shape roles and component-specific shape specs.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/shape` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: `--md-sys-shape-corner-*` roles; published component-specific shape paths route through component tokens.
- Private bridge contract: none.
- Verification-only contract: none.
- Known consumers: shaped Material surfaces.
- Known gaps: mixed `px`, `dp`, and `cqmin` authoring and complete role parity remain unverified.
- Verification: token checks and representative computed-radius/visual tests.
- Last reviewed: 2026-07-16.

### Elevation

- Status: `partial`.
- Official sources: Material elevation roles and current surface-tint guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/elevation` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: `--md-sys-elevation-level0` through `level5`.
- Private bridge contract: generic `--md-private-elevation-shadow-color`.
- Verification-only contract: none.
- Known consumers: elevated components and surfaces.
- Known gaps: shadow definitions, dark-context behavior, component routing, and bridge verification need focused review; deprecated surface tint must not re-enter components.
- Verification: token checks, computed box-shadow ownership, and representative elevated surfaces.
- Last reviewed: 2026-07-16.

### Motion

- Status: `partial`.
- Official sources: Material motion duration/easing guidance and Material 3 Expressive motion pages used by each family.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/lib/md/tokens.css` and documented private Web adaptations.
- Canonical library owner: `src/shared/ui/material/foundation/motion` when focused migration occurs.
- Migration status: `legacy`.
- Public contract: verified `--md-sys-motion-*` values only.
- Private bridge contract: documented `--md-private-motion-expressive-*` Web adaptations where CSS cannot express the official spring model directly.
- Verification-only contract: deterministic settling/reduced-motion setup for browser tests.
- Known consumers: components with Material transitions and motion.
- Known gaps: token-name parity, reduced-motion policy, private adaptation validation, and family usage remain incomplete.
- Verification: static token checks, browser reduced-motion/transition checks, and representative motion assertions.
- Last reviewed: 2026-07-16.

### Interaction state, state layer, ripple, focus, and visual-state verification

- Status: `partial`.
- Official sources: Material interaction-state, state-layer, focus, and component-specific state guidance.
- Verified snapshot: MCP/cache pages reviewed through 2026-07-16; exact consolidated domain snapshot remains to be recorded during migration.
- Current production owner: `src/shared/ui/State/` plus system state tokens in `src/shared/lib/md/tokens.css`.
- Canonical library owner: `src/shared/ui/material/foundation/interaction` after focused migration.
- Migration status: `legacy`.
- Public contract: `MDStateLayer`, `useStateLayer`, `useRipple`, real host focus/activation semantics, and system state/focus tokens.
- Private bridge contract: generic `--md-private-state-*` and state-layer inputs documented by the current owner.
- Verification-only contract: `src/shared/ui/State/testing` and `MDStateLayerForcedStateProvider` may render deterministic generic transient visual states in isolated Storybook fixtures. They are not product/component API and do not prove real acquisition or cleanup.
- Known consumers: interactive Material components and their state matrices.
- Known gaps: ripple policy, focus-indicator ownership, reduced-motion interaction, exact dragged/focus verification, and family coverage remain incomplete; semantic combined-state resolution remains component-owned.
- Verification: foundation tests, real browser focus/pointer/touch checks, deterministic matrix appearance, and representative host integrations.
- Last reviewed: 2026-07-16.

### Iconography

- Status: `partial`.
- Official sources: Material Symbols and component-specific icon guidance.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/ui/Icon/` and `MDSymbol`.
- Canonical library owner: `src/shared/ui/material/foundation/icon` after focused migration.
- Migration status: `legacy`.
- Public contract: shared Material Symbol primitive with explicit size, fill, weight, grade, optical size, and accessibility behavior.
- Private bridge contract: none.
- Verification-only contract: deterministic icon/font readiness in Storybook and visual tests.
- Known consumers: icon-bearing components and product actions.
- Known gaps: public icon API strategy and exact family-specific icon sizing/state behavior remain inconsistently verified.
- Verification: primitive contract tests and representative component browser/visual checks.
- Last reviewed: 2026-07-16.

### Density, spacing, and target area

- Status: `partial`.
- Official sources: component measurements, Material density/layout guidance, and accessibility target requirements.
- Verified snapshot: not yet recorded — policy and family evidence are mixed.
- Current production owner: policy in `density-spacing.md`; each component owns its measurements and target box.
- Canonical library owner: policy remains under `docs/material-3`; runtime owners are component-specific unless a concrete shared artifact is required.
- Migration status: `migrated` as policy.
- Public contract: exact component specs first, layout guidance second, project `step` only for app composition without an exact Material measurement.
- Private bridge contract: none.
- Verification-only contract: browser geometry and hit-target checks.
- Known consumers: all Material components and app composition.
- Known gaps: no complete target-area or compact-behavior inventory across families.
- Verification: component geometry/hit testing and representative visuals.
- Last reviewed: 2026-07-16.

### Accessibility foundation

- Status: `partial`.
- Official sources: relevant Material accessibility pages, native HTML semantics, and repository accessibility policy.
- Verified snapshot: not yet recorded as one exact policy snapshot.
- Current production owner: policy in `accessibility.md`; native/component owners implement the contract.
- Canonical library owner: policy remains under `docs/material-3`; concrete runtime owners remain with components or overlay/focus domains.
- Migration status: `migrated` as policy.
- Public contract: accessible names, native semantics first, focus-visible, keyboard behavior, target areas, contrast-safe role pairings, modal focus handling, and meaningful state exposure.
- Private bridge contract: none.
- Verification-only contract: focused accessibility and browser checks.
- Known consumers: every interactive or semantic Material component and product composition.
- Known gaps: exact policy snapshot and component-family compliance remain incomplete.
- Verification: component contract tests, browser behavior, and focused accessibility checks.
- Last reviewed: 2026-07-16.

### Overlay containment and lifecycle

- Status: `partial`.
- Official sources: overlay component guidance plus project containment policy.
- Verified snapshot: not yet recorded — legacy owner.
- Current production owner: `src/shared/ui/Overlay/useOverlay.ts`, `src/shared/ui/Overlay/index.ts`, and generic teleport/outside-interaction dependencies.
- Canonical library owner: `src/shared/ui/material/foundation/overlay`; generic dependencies remain outside the Material library.
- Migration status: `legacy`.
- Public contract: nearest Material overlay container, nested registration, and shared interaction boundaries.
- Private bridge contract: overlay context/container and child-stack internals.
- Verification-only contract: isolated Storybook overlay fixtures.
- Known consumers: menus, dialogs, sheets, tooltips, FAB helpers, and other transient surfaces.
- Known gaps: lifecycle consistency, escape/back stacking, focus trap, scroll lock, and nested behavior require focused domain and family verification.
- Verification: browser tests for focus entry/restoration, outside interaction, nested teleports, escape/back, scrim, scroll lock, and responsive behavior.
- Last reviewed: 2026-07-16.

### Layout and adaptivity

- Status: `partial`.
- Official sources: Material window classes, canonical layouts, navigation adaptation, pane, app bar, sheet, and toolbar guidance.
- Verified snapshot: not yet recorded — policy and product implementation are mixed.
- Current production owner: policy in `layout-adaptive.md` plus current layout primitives such as `MDPane` and scaffold composition.
- Canonical library owner: policy remains under `docs/material-3`; concrete Material patterns or component adaptations are added only from current needs.
- Migration status: `legacy` or `partial policy`, depending on the concrete owner.
- Public contract: mobile-first compact/medium/expanded decisions, canonical-layout choice, pane ownership, and navigation surface choice based on product information architecture.
- Private bridge contract: current layout contexts and scroll-container contracts where implemented.
- Verification-only contract: deterministic Storybook/browser surfaces at affected sizes.
- Known consumers: pages, panes, navigation surfaces, sheets, app bars, and responsive components.
- Known gaps: no complete canonical-layout/adaptive-switching contract across the application; component-level adaptation remains family-specific.
- Verification: responsive Storybook/browser checks and product-flow verification for navigation/layout choice.
- Last reviewed: 2026-07-16.

## Update rules

For every foundation change:

1. update the affected record before claiming completion;
2. record exact official pages and snapshot when meaning or status changes;
3. keep current/canonical owners and migration status accurate;
4. keep public/private/testing contracts aligned with code and exports;
5. inventory consumers for corrections or replacements;
6. update verification, state-matrix impact, and remaining gaps honestly;
7. keep unrelated domains unchanged.
