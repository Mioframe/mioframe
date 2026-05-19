---
name: material3-guidelines
description: 'Use this skill before planning or implementing UI/UX changes to verify component choice, layout, interaction behavior, accessibility, and visual states against the cached official Material 3 documentation from m3-docs-mcp.'
---

# Material 3 guidelines

Use this skill before planning or implementing any user-visible UI or UX change.

## Activation check

Use this skill when a task adds, removes, repositions, restyles, or changes the behavior of:

- UI components, shared UI primitives, or Material-style wrappers;
- navigation, panes, dialogs, sheets, menus, forms, buttons, lists, cards, tabs, or toolbars;
- layout, density, hierarchy, responsive/adaptive behavior, or visual states;
- onboarding, empty states, loading states, error states, destructive flows, or input flows;
- focus, keyboard, pointer, touch, accessibility semantics, affordances, or motion.

Do not use this skill for non-UI-only changes, type-only edits, internal storage/service logic, formatting, comments, or mechanical renames unless they affect rendered behavior.

## Source of truth

Use the `material3` MCP server from `github:Vyachean/m3-docs-mcp` as the reliable lookup source for official Material 3 documentation.

Prefer these MCP tools when available:

1. `material_docs_cache_status` to confirm cache availability and freshness.
2. `search_material_docs` to find relevant guidance by component, pattern, or interaction.
3. `get_component_docs` for component-level guidance.
4. `get_material_page` for exact cached pages referenced by search results.

Do not treat direct fetches, generic web search, screenshots, older Material versions, library examples, or memory as reliable substitutes for the MCP cache. The official Material 3 site is a JavaScript app; direct agent access may miss or distort content.

If the MCP server is unavailable, the cache is missing or stale, or the needed page is absent, state that explicitly and treat the UI/UX decision as an unresolved Material 3 verification risk. Do not claim Material 3 alignment without a successful MCP-backed check.

## Required check

Before the first production edit, identify:

1. **Relevant Material surface**: the component, pattern, or layout guidance checked.
2. **Decision impact**: what the guidance implies for component choice, placement, hierarchy, state, interaction, or accessibility.
3. **Project fit**: whether existing project rules, FSD ownership, mobile-first constraints, privacy, or accessibility requirements add stricter constraints.
4. **Deviation**: any deliberate mismatch with Material 3, with the reason and blast radius.
5. **Verification**: the focused Storybook, browser smoke, Playwright/e2e, visual regression, or accessibility-oriented check that proves the Material-relevant behavior.

## Output discipline

Keep the Material 3 note short. A useful note usually has:

- checked docs or component pages;
- resulting implementation constraint;
- unresolved risk or deviation, if any;
- verification surface.

For PR summaries or task handoff, name the checked Material 3 pages, components, or patterns. If no relevant guidance was found in the MCP cache, state that explicitly.

## Anti-patterns

- Do not use Material 3 as a visual-only style guide; interaction and UX guidance also apply.
- Do not invent local component behavior when Material 3 defines a suitable component, pattern, or interaction rule.
- Do not copy patterns from unrelated libraries, desktop-first products, or older Material versions without an MCP-backed Material 3 check.
- Do not defer the Material 3 lookup until final review when it could change component choice, flow, layout, or verification.
