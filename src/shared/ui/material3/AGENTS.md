# src/shared/ui/material3

Inherits the rules from `src/shared/ui/AGENTS.md`. Applies to the local Material 3 documentation source of truth.

## Contains

- Exact markdown documentation imported from the provided Material 3 documentation archive.
- Component documentation folders for all Material 3 components present in the archive, including components not yet implemented in the project UI library.
- Foundation and style documentation used to verify tokens, typography, layout, accessibility, adaptive behavior, motion, shape, elevation, and interaction states.

## Patterns

- Treat these files as reference documentation, not as app content.
- When implementing or refactoring a shared `MD*` primitive, read the matching `components/<component>/` folder before changing API, DOM, tokens, states, accessibility, or layout.
- Prefer links from implementation docs or PR notes to these local files instead of relying on memory or approximate Material rules.
- Preserve original imported markdown content unless regenerating from a newer Material 3 export.

## Anti-patterns

- Do not summarize over these files and delete the original rules.
- Do not use these docs as runtime user-facing help content.
- Do not manually patch copied Material source pages for project preferences; document project-specific divergence outside copied source pages.

## Constraints

- If a copied source page appears wrong because of import/conversion quality, fix the importer or regenerate from a better source rather than silently editing one page.
