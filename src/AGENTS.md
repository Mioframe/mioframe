# /src

Inherits the rules from the root `AGENTS.md`. Applies to all application source code under `src`.

## Material 3 guideline checks

For user-visible UI or UX changes, use the `material3-guidelines` skill before planning component choice, layout, interaction behavior, visual states, accessibility semantics, tokens, public UI API names, or verification.

For shared UI primitives, Material-style wrappers, Material tokens, Material authoring units, Storybook UI documentation, or Material visual verification surfaces, also follow the relevant policies under `docs/material-3/` before editing production code.

Use the `material3` MCP server from https://github.com/Vyachean/m3-docs-mcp as the primary source of official Material 3 guidance. If MCP is unavailable or incomplete for the needed page, use `Vyachean/m3-docs-cache` as the fallback snapshot of official `m3.material.io` content.

Do not claim Material 3 alignment unless the relevant guidance was checked through MCP or the documented fallback cache. If that check is unavailable or incomplete, report it as an unresolved Material 3 verification risk.
