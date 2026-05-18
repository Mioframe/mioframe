# Material 3 documentation

This directory is the project-local source of truth for Material Design 3 UI work.

The documentation must be generated from the provided `material3-markdown-docs.zip` archive and preserve the original markdown content. Do not replace these rules with summaries when reviewing or implementing components.

## Required structure

- `components/<component>/` contains the canonical Material 3 documentation for each component: landing page, overview, specs, guidelines, accessibility, and any extra component-specific pages present in the archive.
- `styles/` contains color, typography, elevation, icons, motion, and shape documentation.
- `foundations/` contains accessibility, adaptive design, layout, content design, tokens, interaction states, and usability documentation.
- `source/` mirrors the original archive paths for exact source lookup.

## How to use

- Use `components/<component>/` when implementing or reviewing a specific Material component.
- Use `styles/` before changing tokens, color roles, typography, elevation, icons, shape, or motion.
- Use `foundations/` before changing adaptive layout, accessibility, content patterns, design tokens, or interaction states.
- Use `source/` when an exact original path from the imported archive is needed.

## Component implementation rule

Every shared Material-style primitive should have a direct documentation reference to the matching folder in `components/`. If a Material component is not implemented yet, its folder still stays here so future work has a canonical target.

## Update rule

When the upstream Material 3 markdown export is refreshed, regenerate this directory from the new archive and review diffs instead of manually editing copied source pages.
