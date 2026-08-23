# Database virtualization mutation-proof correction preflight

Status: **implemented; superseded by current review findings**.

This preflight describes the already-executed mutation-proof correction. It is not the implementation plan for the next correction pass.

The verifier-managed mutation gate now passes with the unchanged repository configuration and 60% breaking threshold, but later semantic review found additional work that this preflight intentionally did not cover:

- `src/features/databaseInlineValueEdit/REVIEW.md` — remaining lifecycle proof plus explicit persistence-error semantics;
- `src/widgets/DocumentView/Database/REVIEW.md` — faithful keyboard/boolean/ARIA/sizing/document-identity component proof;
- `src/entities/databaseData/REVIEW.md` — fresh S0/G1 performance revalidation is required because the final measurement predates the current geometry implementation;
- `tests/e2e/REVIEW.md` — the combined inline-edit virtualization E2E exceeds the normal per-test budget, and a separate historical Database property scenario also regressed in the current exact-head E2E lane.

Do not reuse the earlier assumptions that the remaining work is test-only, that runtime behavior cannot change, or that no performance rerun is required. Those assumptions were invalidated by later review evidence.

A new implementation preflight must be produced only after the next architecture/correction scope is resolved. In particular:

1. resolve the feature-owned persistence failure semantics without adding a second edit state, manager/provider, or moving persistence into the widget;
2. diagnose the current E2E slowdown before deciding whether any geometry/runtime code must change;
3. complete owner-local proof corrections;
4. perform final S0/G1 production revalidation only after runtime/geometry changes are finished;
5. require green exact-head GitHub CI after semantic re-review.

The original detailed test matrix remains available in Git history if historical context is needed; current active review documents are the source of truth for unresolved work.
