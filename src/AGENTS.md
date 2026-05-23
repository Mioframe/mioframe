# /src

Inherits the rules from the root `AGENTS.md`. Applies to all application source code under `src`.

## Material 3 guideline checks

For user-visible UI or UX changes, use the `material3-guidelines` skill before planning component choice, layout, interaction behavior, visual states, accessibility semantics, tokens, public UI API names, or verification.

For shared UI primitives, Material-style wrappers, Material tokens, Material authoring units, Storybook UI documentation, or Material visual verification surfaces, also follow the relevant policies under `docs/material-3/` before editing production code.

Use the `material3` MCP server from https://github.com/Vyachean/m3-docs-mcp as the primary source of official Material 3 guidance. If MCP is unavailable or incomplete for the needed page, use `Vyachean/m3-docs-cache` as the fallback snapshot of official `m3.material.io` content.

Do not claim Material 3 alignment unless the relevant guidance was checked through MCP or the documented fallback cache. If that check is unavailable or incomplete, report it as an unresolved Material 3 verification risk.

## Diagnostics and privacy

This section refines the root `Privacy-safe errors` rules for source code under `src`.

The goal is not to hide all unexpected errors from diagnostics. Sentry must still receive actionable internal failures so real bugs can be fixed.

Distinguish error sources before reporting:

- External or user-data boundary errors must be privacy-safe before they reach `reportHandledError`. This includes browser APIs, File API, File System Access API, IndexedDB, Google APIs, storage adapters, Automerge/repo internals, Zod parsing of user-controlled payloads, network responses, and any library error that may include paths, names, ids, file contents, document contents, URLs, or raw user data.
- Internal programmer errors and project-controlled invariant failures may be reported as raw `Error` objects when their messages are stable and do not include user-controlled values. Do not wrap these only to satisfy privacy wording, because losing the original message/stack makes Sentry less useful.
- Expected user outcomes such as cancelled file picking, invalid user input, unsupported file format, permission denial handled by a recovery UI, or validation errors that are already part of normal UX should usually be handled without diagnostics reporting unless there is a product reason to track them.

When wrapping boundary errors:

- Use a project-controlled user-facing `DomainError.message`.
- Use `createSafeErrorCause` or another project-controlled safe technical cause before diagnostics can see the cause.
- Keep machine-readable codes stable and free of user data.
- Do not attach local paths, virtual paths, file names, folder names, document names, document ids, file ids, Google Drive ids, URLs, record values, document contents, or raw external error text to `reportHandledError` options, Sentry tags, Sentry extra, error messages, or causes.

`reportHandledError` and Sentry `beforeSend` limit metadata, but they do not make arbitrary exception messages and stacks privacy-safe. Treat the boundary where the error is created or converted as the place to decide whether the original error is safe to report.
