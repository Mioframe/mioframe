# src/entities/cfrDocument

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/cfrDocument` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Entity-level CFR document access and small reusable document-selection or document-list UI.

## Patterns

- Expose document state through the entity composables in this directory instead of ad hoc caller reads.
- Treat document handles and subscriptions as lifecycle-managed resources.
- Keep feature actions and higher-level document orchestration outside this entity layer.

## Anti-patterns

- Do not mutate document structure directly from entity UI.
- Do not move schema ownership here when it belongs in shared document contracts.

## Constraints

- Changes here affect document list, selection, and other consumers of the document read contract.
- Minimum verification: `pnpm type-check`, then exercise at least one document list and one document-selection surface that uses the touched contract.
