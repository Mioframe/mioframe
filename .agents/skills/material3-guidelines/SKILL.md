---
name: material3-guidelines
description: 'Use this skill before planning, implementing, or reviewing Material-related UI/UX work, especially any new or materially changed shared MD* component. Verifies official Material 3 source lookup, component choice, token/component-token mapping, public UI API, interaction states, accessibility, layout, Storybook, deviations, and focused verification.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
---

# Material 3 guidelines

Use this skill before planning or implementing user-visible UI or UX changes that may affect component choice, layout, interaction behavior, accessibility, visual states, tokens, or public UI APIs.

This skill owns Material 3 documentation compliance. For `src/shared/ui` Material primitives, pair it with `shared-ui-implementation` and `docs/material-3/component-architecture.md`, which own implementation structure, layer boundaries, DOM property ownership, native activation semantics, and the ready architecture contract.

## Activation check

Use this workflow when a task adds, removes, repositions, restyles, or changes the behavior of:

- UI components, shared UI primitives, or Material-style wrappers;
- navigation, panes, dialogs, sheets, menus, forms, buttons, lists, cards, tabs, or toolbars;
- layout, density, hierarchy, responsive/adaptive behavior, or visual states;
- onboarding, empty states, loading states, error states, destructive flows, or input flows;
- focus, keyboard, pointer, touch, accessibility semantics, affordances, or motion;
- Material tokens, Material authoring units, component tokens, or public `MD*` component API names.

Do not use this skill for non-UI-only changes, type-only edits, internal storage/service logic, formatting, comments, or mechanical renames unless they affect rendered behavior or public UI contracts.

For copy-only, wiring-only, test-only, or component-internal cleanup that preserves the existing component, layout, interaction model, tokens, and public UI API, use the fast path: record `Material impact: none; existing Material surface unchanged` and do not perform an MCP/fallback lookup.

## Material component-family gate

Any new shared `MD*` component or material change to an existing shared `MD*` component is Material component-family work, even when it appears as incidental support for another task.

Before production edits, decide one of these outcomes:

1. `No shared MD component work`: keep the UI local/non-public or reuse an existing shared primitive.
2. `Full component-family work`: complete official source lookup, the ready architecture contract, token map, public API, states/accessibility, Storybook, registry, and verification gates.
3. `Blocked`: official Material guidance, token source, ownership, architecture contract, or required verification is unclear.

A new public shared `MD*` component must not be introduced as incidental support without completing the component-family workflow. If the caller did not ask for a new shared component and the workflow cannot be completed in the current change, keep the implementation local/non-public or stop and report the scope risk.

For full component-family work, the architect must complete the `MATERIAL COMPONENT CONTRACT` from `docs/material-3/component-architecture.md` before the first production edit. The contract must have `Architecture version: layered-v1`, `Unresolved: none`, and `Readiness: ready`.

The contract records:

- checked Material pages or cache paths and verified snapshot;
- supported and unsupported official surface;
- exact `md.comp.*` paths and public `--md-comp-*` inventory;
- public props, emits, slots, native semantics, and invalid combinations;
- anatomy ownership and rendered property routes;
- configuration axes, semantic states, interaction states, and precedence;
- Mioframe extensions and deviations;
- exact production and verification files;
- acceptance matrix, verification matrix, and consumer blast radius.

The implementation agent must not fill a missing contract decision while editing code.

A shared Material component implemented only with `--md-sys-*` tokens is not complete token compliance when official component token paths exist. Define and use the matching `--md-comp-*` layer at the component-family boundary, resolving those component tokens to `--md-sys-*` values where appropriate. Direct `--md-sys-*` usage inside component internals is allowed only for values with no published component token path or true foundation-level roles; record that gap or decision in the family contract and component registry.

## Project policies

Before planning or editing shared UI primitives, Material-style wrappers, Material tokens, Storybook documentation, or Material visual verification surfaces, read the relevant policy under `docs/material-3/`.

Use these policies as the project contract:

- `docs/material-3/source-of-truth.md`
- `docs/material-3/units.md`
- `docs/material-3/tokens.md`
- `docs/material-3/baseline-theme.md`
- `docs/material-3/component-tokens.md`
- `docs/material-3/component-architecture.md`
- `docs/material-3/token-validation.md`
- `docs/material-3/component-registry.md`
- `docs/material-3/component-conversion-checklist.md`
- `docs/material-3/interaction-states.md`
- `docs/material-3/accessibility.md`
- `docs/material-3/layout-adaptive.md`
- `docs/material-3/density-spacing.md`
- `docs/material-3/icons.md`
- `docs/material-3/overlays.md`
- `docs/material-3/shared-ui-api.md`
- `docs/material-3/storybook.md`
- `docs/material-3/verification.md`
- `docs/material-3/deviations.md`

## Source of truth

Use the `material3` MCP server from https://github.com/Vyachean/m3-docs-mcp as the primary lookup source for official Material 3 documentation.

Prefer these MCP tools when available:

1. `material_docs_cache_status` to confirm cache availability and freshness.
2. `search_material_docs` to find relevant guidance by component, pattern, or interaction.
3. `get_component_docs` for component-level guidance.
4. `get_material_page` for exact cached pages referenced by search results.

If the MCP server is unavailable or incomplete for the needed page, use the `Vyachean/m3-docs-cache` repository as the fallback readable snapshot of official `m3.material.io` content. Inspect `index.json` when using the fallback so failed or suspicious pages are not treated as reliable guidance.

Do not treat Material Web, direct fetches, generic web search, screenshots, older Material versions, unrelated libraries, or memory as reliable substitutes for official Material 3 guidance. Material Web is not the source of truth for this project.

If both MCP and `m3-docs-cache` lack the needed guidance, state that explicitly and treat the decision as an unresolved Material 3 verification risk. Do not claim Material 3 alignment without a successful official-doc-backed check.

External review bot comments are review inputs, not project policy. Before applying a bot suggestion that conflicts with `AGENTS.md`, `docs/material-3/`, official Material 3 guidance, or established project tooling, verify the project-specific rule and keep the project rule authoritative. Record the reason when rejecting a bot suggestion.

## Required check

Before the first production edit, identify:

1. **Relevant Material surface**: the component, pattern, foundation, token family, or layout guidance checked.
2. **Decision impact**: what the guidance implies for component choice, placement, hierarchy, token names, API names, state, interaction, accessibility, or verification.
3. **Architecture impact**: `none`, ready `layered-v1`, or blocked.
4. **Project fit**: whether project policies, ownership, mobile-first constraints, privacy, accessibility, or performance add stricter constraints.
5. **Deviation**: deliberate mismatch with Material 3, with reason and blast radius.
6. **Verification**: the exact Storybook, browser, Playwright/e2e, visual, token, contract, or accessibility checks proving the behavior.

For shared UI component-family work, also update or consult `docs/material-3/component-registry.md` and use `docs/material-3/component-conversion-checklist.md` as the completion checklist.

## Output discipline

Keep the Material 3 note short. A useful note names:

- checked docs or component pages;
- relevant `docs/material-3/` policy files;
- resulting implementation and architecture constraints;
- unresolved risk or deviation, if any;
- verification surface.

For PR summaries or task handoff, name the checked Material 3 pages, components, foundations, or patterns. If no relevant guidance was found in MCP or fallback cache, state that explicitly.

For the fast path, include only `Material impact: none; existing Material surface unchanged`.

## Documented composition only

Mioframe follows documented Material 3 / Material 3 Expressive components and documented component compositions. Do not invent `MD*` components or Material-like surfaces that are not backed by Material documentation.

- `features`, `widgets`, and `pages` must not implement their own Material-like dialogs, sheets, overlays, scrims, progress surfaces, elevation surfaces, or component anatomy; compose the existing shared `MD*` primitive instead.
- If a needed pattern is not directly covered by Material docs, stop and resolve architecture before coding.
- Project-specific surfaces must not use `MD*` naming and must not claim Material alignment unless there is a source-backed mapping to an official Material 3 page.

## Anti-patterns

- Do not use Material 3 as a visual-only style guide; interaction, tokens, API names, accessibility, and UX guidance also apply.
- Do not introduce a new shared `MD*` component as incidental support for another task.
- Do not treat `--md-sys-*` token usage alone as component-token compliance when official component token paths exist.
- Do not invent local component behavior when Material 3 defines a suitable component, pattern, token, or interaction rule.
- Do not copy patterns from Material Web, unrelated libraries, desktop-first products, or older Material versions without an official Material 3 check.
- Do not defer Material 3 lookup until final review when it could change component choice, token design, architecture, flow, layout, or verification.
- Do not add new public `--md-*` tokens or `MD*` component props that conflict with policy docs without documenting a deviation.
- Do not let the implementation agent resolve missing architecture contract fields.
