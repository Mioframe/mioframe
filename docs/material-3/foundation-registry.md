# Material 3 foundation registry

This registry is the current status source for Material foundation domains. It complements [Foundation architecture](./foundation-architecture.md).

Historical foundation audits remain evidence only. Update this registry whenever a foundation contract, owner, source snapshot, status, gap, or verification surface changes.

## Source basis

Unless a record says otherwise, source evidence uses:

- the `material3` MCP snapshot recorded by the relevant change;
- `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete;
- current repository production code and tests.

A record must name its exact snapshot when it is changed from `partial` to `verified` or when source guidance changes production behavior.

## Status values

- `missing`: no accepted project contract exists.
- `partial`: an owner exists, but source coverage, contract completeness, consistency, or verification has known gaps.
- `verified`: the supported repository contract is source-backed, implemented, and verified.
- `deviated`: the accepted repository contract intentionally differs from current Material guidance.
- `blocked`: required source guidance or ownership is unresolved.

`verified` applies only to the supported contract. It does not claim every optional Material capability is implemented.

## Registry

### Official source evidence

- Status: `verified`.
- Official sources: Material 3 documentation through `material3` MCP; fallback cache policy in [Source of truth](./source-of-truth.md).
- Production owner: tooling outside application runtime.
- Public contract: source lookup order, cache health check, stable page/snapshot recording, no Material Web or memory as authority.
- Private bridge contract: none.
- Known consumers: every Material foundation, component, and composition decision.
- Known gaps: individual records still need exact snapshot metadata when they are revalidated.
- Verification: PR notes and registry records name checked pages and snapshots.
- Last reviewed: 2026-07-15.

### Authoring units

- Status: `partial`.
- Official sources: Material units used by component and typography specs.
- Production owner: `postcss.config.js` and shared base-unit variables.
- Public contract: `dp` for Material dimensions, `sp` for Material typography; `step` is project layout composition; `pt` is legacy-only.
- Private bridge contract: build-time custom-unit conversion.
- Known consumers: all Material CSS authored with custom units.
- Known gaps: `--one-sp: 1px` intentionally preserves current rendering; future scaling policy remains unresolved; legacy `pt` removal is incomplete.
- Verification: PostCSS transform tests and representative typography/shape/layout visual coverage.
- Last reviewed: 2026-07-15.

### Reference palette and typeface tokens

- Status: `partial`.
- Official sources: Material reference palette and typeface token documentation.
- Production owner: `src/shared/lib/md/tokens.css`.
- Public contract: verified `--md-ref-palette-*` and `--md-ref-typeface-*` tokens only.
- Private bridge contract: none.
- Known consumers: system color and typography roles.
- Known gaps: complete official tone inventory and current role requirements are not mechanically validated; no generated-palette contract is implemented.
- Verification: token vocabulary/ownership validation and theme representative checks.
- Last reviewed: 2026-07-15.

### Theme and system color roles

- Status: `partial`.
- Official sources: Material color roles, light/dark schemes, and current deprecation guidance.
- Production owner: `src/shared/lib/md/tokens.css`.
- Public contract: `--md-sys-color-*` roles mapped from reference tokens; light defaults and dark `prefers-color-scheme` overrides.
- Private bridge contract: none.
- Known consumers: all Material components and product surfaces using system roles.
- Known gaps: full current role parity is not validated; no explicit app-controlled theme-context contract; deprecated `--md-sys-color-surface-tint-color` remains as compatibility surface.
- Verification: token graph validation, light/dark computed-value checks, and representative component visuals.
- Last reviewed: 2026-07-15.

### Typography

- Status: `partial`.
- Official sources: Material typescale roles and typography unit guidance.
- Production owner: `src/shared/lib/md/tokens.css`, `src/shared/lib/md/typography.ts`, and exported `MD_TYPESCALE`/`.md-typescale-*` utilities.
- Public contract: components use system typescale roles and shared typography utilities rather than local type declarations.
- Private bridge contract: none.
- Known consumers: shared UI and product text mapped to Material typography.
- Known gaps: source parity and future `sp` scaling policy require a focused foundation review.
- Verification: token validation, utility contract checks, generated CSS, and representative text visuals.
- Last reviewed: 2026-07-15.

### Shape roles

- Status: `partial`.
- Official sources: Material shape roles and component-specific shape specs.
- Production owner: `src/shared/lib/md/tokens.css`.
- Public contract: `--md-sys-shape-corner-*` roles; component-specific shapes route through component tokens when published.
- Private bridge contract: none.
- Known consumers: all shaped Material surfaces.
- Known gaps: mixed `px`, `dp`, and `cqmin` authoring requires source-backed normalization review; full role parity is unverified.
- Verification: token checks and representative computed border-radius/visual tests.
- Last reviewed: 2026-07-15.

### Elevation

- Status: `partial`.
- Official sources: Material elevation roles and current surface-tint guidance.
- Production owner: `src/shared/lib/md/tokens.css`.
- Public contract: `--md-sys-elevation-level0` through `level5`.
- Private bridge contract: generic `--md-private-elevation-shadow-color` input.
- Known consumers: elevated components and surfaces.
- Known gaps: current shadow definitions, dark-context behavior, component routing, and bridge verification require focused review; deprecated surface-tint behavior must not re-enter components.
- Verification: token checks, computed box-shadow owner checks, and representative elevated surfaces.
- Last reviewed: 2026-07-15.

### Motion

- Status: `partial`.
- Official sources: Material motion duration/easing guidance and Material 3 Expressive motion pages used by each component family.
- Production owner: `src/shared/lib/md/tokens.css` for system roles and documented private Web adaptations.
- Public contract: verified `--md-sys-motion-*` values only.
- Private bridge contract: documented `--md-private-motion-expressive-*` Web adaptations where CSS cannot directly express the official spring model.
- Known consumers: components with Material transitions and motion.
- Known gaps: token-name parity, reduced-motion policy, private adaptation validation, and per-component usage remain incomplete.
- Verification: static token validation, reduced-motion/browser behavior where applicable, and representative motion assertions rather than screenshot-only proof.
- Last reviewed: 2026-07-15.

### Interaction state, state layer, ripple, and focus

- Status: `partial`.
- Official sources: Material interaction-state, state-layer, focus, and component-specific state guidance.
- Production owner: `src/shared/ui/State/` and system state tokens in `src/shared/lib/md/tokens.css`.
- Public contract: `MDStateLayer`, `useStateLayer`, `useRipple`, real host focus/activation semantics, and system state opacity/focus tokens.
- Private bridge contract: generic `--md-private-state-*` and state-layer color inputs documented in `src/shared/ui/State/README.md`.
- Known consumers: interactive shared Material components.
- Known gaps: ripple policy, focus-indicator ownership, reduced-motion interaction, and coverage across all families are not yet fully normalized; semantic combined-state resolution remains component-owned.
- Verification: State contract/unit tests, browser focus/pointer/touch checks, and representative host integrations.
- Last reviewed: 2026-07-15.

### Iconography

- Status: `partial`.
- Official sources: Material Symbols and component-specific icon guidance.
- Production owner: `src/shared/ui/Icon/` and `MDSymbol`.
- Public contract: shared Material Symbol primitive with explicit size, fill, weight, grade, optical size, and accessibility behavior.
- Private bridge contract: none.
- Known consumers: icon-bearing components and product actions.
- Known gaps: public icon API strategy and exact icon sizing/state behavior remain family-specific and inconsistently verified.
- Verification: primitive contract tests and representative component browser/visual checks.
- Last reviewed: 2026-07-15.

### Density, spacing, and target area

- Status: `partial`.
- Official sources: component measurements, Material density/layout guidance, and accessibility target requirements.
- Production owner: policy in `density-spacing.md`; each component owns its supported measurements and target box.
- Public contract: exact component specs first, layout guidance second, project `step` only for app composition without an exact Material measurement.
- Private bridge contract: none.
- Known consumers: all shared components and app layout composition.
- Known gaps: no complete inventory of target-area compliance or compact behavior across component families.
- Verification: component geometry and hit-target browser checks plus representative visuals.
- Last reviewed: 2026-07-15.

### Accessibility foundation

- Status: `verified`.
- Official sources: relevant Material accessibility pages, native HTML semantics, and repository accessibility policy.
- Production owner: policy in `accessibility.md`; native/component owners implement the contract.
- Public contract: accessible names, native semantics first, focus-visible, keyboard behavior, target areas, contrast-safe role pairings, modal focus handling, and meaningful state exposure.
- Private bridge contract: none.
- Known consumers: every interactive or semantic shared component and product composition.
- Known gaps: component-family compliance is tracked by each family and does not change this policy status.
- Verification: component contract, browser behavior, and focused accessibility checks.
- Last reviewed: 2026-07-15.

### Overlay containment and lifecycle

- Status: `partial`.
- Official sources: overlay component guidance plus project containment policy.
- Production owner: `src/shared/ui/Overlay/useOverlay.ts`, `src/shared/ui/Overlay/index.ts`, teleport-container infrastructure, and outside-interaction containment.
- Public contract: nearest overlay container, teleport ownership, nested teleported-container registration, and shared interaction boundaries.
- Private bridge contract: overlay container/context and child stack internals.
- Known consumers: menus, dialogs, sheets, tooltips, FAB placement helpers, and other transient surfaces.
- Known gaps: dialogs and some other surfaces do not yet use one consistent lifecycle path; escape/back stacking, focus trap, scroll lock, and nested behavior require per-family verification.
- Verification: browser tests for focus entry/restoration, outside interaction, nested teleports, escape/back, scrim, scroll lock, and responsive behavior.
- Last reviewed: 2026-07-15.

### Layout and adaptivity

- Status: `partial`.
- Official sources: Material window classes, canonical layouts, navigation adaptation, pane, app bar, sheet, and toolbar guidance.
- Production owner: policy in `layout-adaptive.md` plus current shared layout primitives such as `MDPane` and scaffold composition.
- Public contract: mobile-first compact/medium/expanded decisions, canonical layout choice, pane ownership, and navigation surface choice based on product information architecture.
- Private bridge contract: current layout contexts and scroll-container contracts where implemented.
- Known consumers: pages, panes, navigation surfaces, sheets, app bars, and responsive shared components.
- Known gaps: no complete canonical-layout/adaptive-switching implementation contract across the application; component-level container adaptation is tracked per family.
- Verification: deterministic Storybook/browser surfaces at affected sizes and product-flow checks for navigation/layout choice.
- Last reviewed: 2026-07-15.

## Update rules

For every foundation change:

1. update the affected record before claiming completion;
2. record exact official sources and snapshot when meaning or status changes;
3. keep owner paths and public/private contracts accurate;
4. inventory affected consumers for corrections or replacements;
5. update verification and remaining gaps honestly;
6. keep unrelated domains unchanged.
