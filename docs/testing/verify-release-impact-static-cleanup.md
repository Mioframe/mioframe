# Verify release-impact static cleanup

Status: **completed historical cleanup; superseded as Pass E completion evidence by a later production-build ownership review**.

This document records the completed proof/static cleanup that followed the release-spec execution inventory correction in PR #216. The cleanup itself remains accepted. A later full PR review reopened a different Pass E boundary: production-build input ownership. Current architecture is in `docs/testing/verify-release-impact-correction.md`.

## Scope completed

Changed files were limited to:

```text
scripts/lib/releaseRisk.test.ts
scripts/lib/releaseRisk.ts
```

The cleanup did not change release-impact ownership or planner behavior.

## Final cleanup state

- obsolete RED-phase option alias/wrapper/local duplicate inventory shape removed;
- replacement-only inventory seams use the production resolver surface directly;
- unknown runtime release-check corruption remains proved as `mode: invalid`;
- malformed runtime test data is created with `Object.defineProperty`, without weakening `ReleaseImpactCheck` typing;
- `NarrowReleaseMapping.checks` remains `readonly ReleaseImpactCheck[]`;
- unnecessary `String(check)` diagnostic conversion removed;
- stale RED-phase comments removed/reworded;
- focused unit, static/fix-only and type-check feedback passed at completion.

## What this document does not claim

This cleanup does **not** establish that Pass E as a whole is closed.

The later review found a separate ownership-completeness failure for production-build inputs consumed through tool discovery, TypeScript/build metadata and artifact/file inputs. That architecture is now resolved in `verify-release-impact-correction.md` and remains pending implementation.
