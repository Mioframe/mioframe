---
name: material3-guidelines
description: 'Use this skill before planning or implementing UI/UX changes to verify component choice, layout, interaction behavior, accessibility, visual states, tokens, and public UI APIs against official Material 3 guidance and the project Material 3 policies.'
---

# Material 3 guidelines

Use this skill before planning or implementing any user-visible UI or UX change.

## Activation check

Use this skill when a task adds, removes, repositions, restyles, or changes the behavior of:

- UI components, shared UI primitives, or Material-style wrappers;
- navigation, panes, dialogs, sheets, menus, forms, buttons, lists, cards, tabs, or toolbars;
- layout, density, hierarchy, responsive/adaptive behavior, or visual states;
- onboarding, empty states, loading states, error states, destructive flows, or input flows;
- focus, keyboard, pointer, touch, accessibility semantics, affordances, or motion;
- Material tokens, Material authoring units, component tokens, or public `MD*` component API names.

Do not use this skill for non-UI-only changes, type-only edits, internal storage/service logic, formatting, comments, or mechanical renames unless they affect rendered behavior or public UI contracts.

## Project policies

Before planning or editing shared UI primitives, Material-style wrappers, Material tokens, Storybook documentation, or Material visual verification surfaces, read the relevant policy under `docs/material-3/`.

Use these policies as the project contract:

- `docs/material-3/source-of-truth.md`
- `docs/material-3/units.md`
- `docs/material-3/tokens.md`
- `docs/material-3/baseline-theme.md`
- `docs/material-3/component-tokens.md`
- `docs/material-3/interaction-states.md`
- `docs/material-3/accessibility.md`
- `docs/material-3/layout-adaptive.md`
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

If both MCP and `m3-docs-cache` lack the needed guidance, state that explicitly and treat the UI/UX decision as an unresolved Material 3 verification risk. Do not claim Material 3 alignment without a successful official-doc-backed check.

## Required check

Before the first production edit, identify:

1. **Relevant Material surface**: the component, pattern, foundation, token family, or layout guidance checked.
2. **Decision impact**: what the guidance implies for component choice, placement, hierarchy, token names, API names, state, interaction, accessibility, or verification.
3. **Project fit**: whether existing project policies, FSD ownership, mobile-first constraints, privacy, accessibility, or performance requirements add stricter constraints.
4. **Deviation**: any deliberate mismatch with Material 3, with the reason and blast radius.
5. **Verification**: the focused Storybook, browser smoke, Playwright/e2e, visual regression, token/unit check, or accessibility-oriented check that proves the Material-relevant behavior.

## Output discipline

Keep the Material 3 note short. A useful note usually has:

- checked docs or component pages;
- relevant `docs/material-3/` policy files;
- resulting implementation constraint;
- unresolved risk or deviation, if any;
- verification surface.

For PR summaries or task handoff, name the checked Material 3 pages, components, foundations, or patterns. If no relevant guidance was found in MCP or fallback cache, state that explicitly.

## Anti-patterns

- Do not use Material 3 as a visual-only style guide; interaction, tokens, API names, accessibility, and UX guidance also apply.
- Do not invent local component behavior when Material 3 defines a suitable component, pattern, token, or interaction rule.
- Do not copy patterns from Material Web, unrelated libraries, desktop-first products, or older Material versions without an official Material 3 check.
- Do not defer the Material 3 lookup until final review when it could change component choice, token design, flow, layout, or verification.
- Do not add new public `--md-*` tokens or `MD*` component props that conflict with the policy docs without documenting a deviation.
