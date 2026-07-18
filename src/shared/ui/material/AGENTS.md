# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Purpose

This file contains only local routing and ownership constraints. Detailed source, architecture, diagnosis, token, testing, review, and completion policy lives in `docs/material-3` and the applicable Material skill.

Do not duplicate those documents here.

## Generalization boundary

Shared instructions contain only artifact-independent rules. Concrete selectors, DOM nodes, custom-property names, token values, state endpoints, defects, and proposed structures belong in the owning README, AUDIT, implementation, tests, fixtures/stories, roadmap, or task context.

A pilot finding may change shared instructions only after it is expressed as a rule applicable to every artifact owning the same risk. Do not add a new rule when an existing rule already prohibited the defect.

## Routing

Use `material <artifact-or-request>` by default.

- component family → `material-component-authoring`;
- foundation, interaction primitive, style, or token domain → `material-foundation`;
- independent component review → `material-component-review`;
- automatic queue work → `material-library-next`;
- read-only program state → `material-library-status`.

`material-component` is a compatibility alias only.

Reroute a request sent through the wrong specialized entrypoint. Do not refuse it for classification alone.

An explicit official Material request is sufficient to start. Missing consumers, inactive roadmap position, legacy ownership, or an absent canonical directory are not blockers by themselves.

## Evidence boundary

Use current successful complete Material MCP reads as working official evidence. Capture age alone is not a defect.

Source-control history is not Material authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.

## Canonical ownership

```text
foundations/<official-slug>
styles/<official-slug>
components/<official-docs-slug>
```

Use the narrowest official owner. Generic platform utilities remain generic; Material-specific semantics, state, tokens, clipping, focus, motion, or rendering belong in the Material library.

Dependency direction:

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → product layers
```

Foundations/styles do not import components. Components do not deep-import another family’s private files. Product consumers use curated public exports.

## Local documentation ownership

Each active owner uses:

```text
README.md  # authoring-owned current state
AUDIT.md   # independent reviewer-owned result
```

Authoring never edits AUDIT. Review never edits README or implementation.

README persists reconstructed contract, diagnosis, repair/restructure/replace strategy, source limitations, implementation state, known defects, consumers, verification, and explicit operator feedback.

A reported visible defect remains rejected until production behavior changes and the user explicitly accepts the replacement.

## Implementation constraints

- Follow the applicable canonical documents under `docs/material-3` rather than restating them here.
- Reconstruct the official contract before preserving or changing legacy structure.
- Diagnose the actual defect and owner before editing production.
- Choose repair, restructure, or replace; stop patching after repeated unresolved structural defects.
- Implement the smallest coherent official contract required by the request and affected consumers.
- Keep consumer-specific behavior local unless an official shared owner exists.
- Use exact official token meanings and real dependency routes to the correct final owner.
- Follow the repository-wide rule against unnecessary DOM nodes. Ownership maps describe responsibilities, not a required element count.
- Forced states prove stable appearance only; real input proves lifecycle.
- Do not create fake consumers, placeholder implementation trees, universal validators, generic registries, CSS DSLs, broad wrappers, or speculative APIs.
- Shared-domain changes require affected-consumer analysis and representative proof through final output.

## Completion

Implementation finishes only when the objective authoring/foundation gate passes: code and README agree, repeated claims contain no unresolved contradiction, ownership and routes are correct, consumers and obsolete ownership are handled, applicable proof exists, and local verification passes.

Independent review and explicit operator visual acceptance remain separate gates.
