# Material 3 source of truth

## Primary source

Use the `material3` MCP server from `Vyachean/m3-docs-mcp` as the primary source for official Material 3 documentation when it is available.

Before planning or implementing Material UI work, check the relevant official Material 3 pages through MCP. Prefer component pages, foundation pages, specs, accessibility pages, and guidance pages that match the touched surface.

## Fallback source

Use `Vyachean/m3-docs-cache` as the fallback source when the `material3` MCP server is unavailable or incomplete for the needed page.

The cache is treated as a readable snapshot of `https://m3.material.io`, not as an independent design system. When using the cache, prefer files under `pages/` and inspect `index.json` for capture metadata, failed URLs, and suspicious pages.

## Non-sources

Do not use Material Web as the source of truth for this project. Material Web may be useful as an implementation reference only after the official Material 3 guidance has been checked, and only if the implementation reference does not override the official guidance.

Do not use older Material versions, third-party component libraries, screenshots, or memory as substitutes for official Material 3 documentation.

## Unavailable guidance

If neither MCP nor `m3-docs-cache` has the needed guidance, state that the Material 3 verification is incomplete and document the decision as a deviation or unresolved risk. Do not claim full Material 3 alignment for that surface.

## PR expectation

For Material UI changes, PR descriptions or review notes should name the Material 3 pages checked, such as:

- `components/buttons/overview`
- `components/buttons/specs`
- `foundations/design-tokens/overview`
- `foundations/interaction/states/overview`
- `styles/color/roles`

Use stable page names or cache paths instead of raw screenshots or generic references.
