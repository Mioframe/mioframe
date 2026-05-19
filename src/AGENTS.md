# /src

Applies to all application source code under `src`.

## Material 3 guideline checks

- Treat the official Material 3 documentation as the source of truth for UI and UX decisions.
- Before planning or implementing any change that adds, removes, repositions, restyles, or changes the behavior of UI components, navigation, dialogs, sheets, menus, layout, empty states, error states, onboarding, input flows, or other user interactions, check the relevant Material 3 guidance first.
- Use the `material3` MCP server from `github:Vyachean/m3-docs-mcp` for Material 3 documentation lookup when it is available. Prefer its cached official `m3.material.io` content over memory, screenshots, copied snippets, or generic web search.
- If the `material3` MCP server is unavailable or lacks the needed page, use the official `m3.material.io` documentation directly. Do not replace this with memory, older Material versions, library examples, or generic design-system advice.
- If the relevant Material 3 guidance cannot be checked, state that explicitly in the task plan or PR summary and treat the UI/UX decision as an unresolved risk instead of claiming Material 3 alignment.
- Perform the Material 3 lookup during planning, before the first production edit, not only during final review.
- In task plans and PR summaries for UI or UX changes, state which Material 3 pages, components, or patterns were checked. If no relevant guidance was found, state that explicitly.
- Apply Material 3 guidance to both visual design and interaction design: component choice, placement, hierarchy, density, adaptive layout, focus behavior, keyboard behavior, touch targets, motion expectations, affordances, empty/error/loading states, and accessibility semantics.
- Do not invent local component behavior when Material 3 defines a suitable component, pattern, or interaction rule. Prefer aligning the product behavior with the documented Material 3 pattern unless an existing product invariant requires a deliberate exception.
- When deviating from Material 3 guidance, keep the deviation minimal and document the reason in the task notes or PR summary.
- If Material 3 guidance conflicts with existing project rules, accessibility requirements, privacy requirements, mobile-first constraints, or FSD ownership, do not silently choose one. Record the conflict and use the stricter or safer option unless the task explicitly decides otherwise.
- For component additions or significant UI behavior changes, include a focused Storybook story, browser smoke check, Playwright/e2e check, or visual regression coverage when the existing verification surface does not already prove the Material 3-relevant behavior.

## Anti-patterns

- Do not rely on memory of Material Design rules for new UI or UX decisions when the `material3` MCP server can answer the question.
- Do not copy patterns from unrelated libraries, desktop-first products, or older Material versions without checking Material 3 first.
- Do not treat Material 3 as a purely visual style guide. Interaction flows and layout decisions must also be checked against it.
