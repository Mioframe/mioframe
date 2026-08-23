# Review

Verdict: blocked

## Scope reviewed

- PR #216 release-impact planning and execution ownership against the real production `vite build`, release-spec execution inventory and verifier target architecture.
- Static build control, tool/runtime discovery, TypeScript/build metadata, public artifact inputs and dependency-install control.

## Blockers

### B1 — Production-build ownership is not closed over real input mechanisms

Owner: release-impact architecture / `scripts/lib/releaseRisk.ts`.

The release-spec execution correction remains accepted. The unresolved defect is on the production-build side: the planner currently owns statically imported Vite support but can still return `skip` for repository inputs consumed by the real production build through other mechanisms.

Confirmed current missed examples include:

```text
.browserslistrc
postcss.config.js
pwa-assets.config.ts
public/favicon.svg
```

The full audit also confirms that the architecture must account for current TypeScript/build metadata and `pnpm-workspace.yaml` rather than defining completeness from only those four examples.

This is a repeated ownership-completeness failure, so another exact-path patch is forbidden by the repository stop rule.

Ready architecture handoff:

```text
docs/testing/verify-release-impact-correction.md
status: architecture redesigned and ready; implementation pending
```

The resolved boundary is mechanism-based:

- retained static production-build support;
- complete current Browserslist/PostCSS/PWA-assets root discovery families;
- production Vite env filenames when tracked;
- current production TypeScript config chain, with unknown root `tsconfig*.json` fail-closed;
- complete `public/**` production artifact population;
- current `pnpm-workspace.yaml` install-control input.

Known production-build mechanisms select their truthful consumer set:

```text
artifact
build
managed-updates
release-smoke
```

Only explicitly unresolved significant inputs inside the confirmed fail-closed family use full six checks.

Do not introduce a generic dependency graph/registry, broad `config/**`, broad `*.config.*`, or all-root fallback.

## Major issues

None.

## Minor issues

None in this owner. The two verifier-output findings remain separately owned by `scripts/REVIEW.md`.

## Accepted risks

None.

## Items not required

- No release-spec inventory redesign.
- No managed-update grouping change.
- No artifact timeout change.
- No CI topology change.
- No benchmark work before semantic corrections are closed.

## NEXT CORRECTION

Owner: `scripts/lib/releaseRisk.ts`.

Primary proof owner:

```text
scripts/lib/releaseRisk.test.ts
```

Required pass order:

1. fresh independent test-author proof against the mechanism matrix in `verify-release-impact-correction.md`;
2. separate implementation context;
3. focused unit/static feedback only;
4. return to architect for complete Pass E re-review.

Documentation, review state and PR metadata remain architect-owned.
