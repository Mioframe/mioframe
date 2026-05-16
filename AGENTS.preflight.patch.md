# Pending AGENTS.md preflight hook

Add this bullet to the `## Patterns` section of `AGENTS.md`, near the other skill activation rules:

```md
- Use the `implementation-preflight` skill before non-trivial implementation work to identify the owner layer, reuse opportunities, acceptance matrix, risk matrix, and focused verification before the first production edit.
```

This separate patch note exists because updating the full root `AGENTS.md` through the available GitHub API was blocked while preserving the existing file content unchanged.
