# Review

Verdict: blocked

## Scope reviewed

- PR #216 release-impact planning and execution ownership against the real production `vite build`, release-spec execution inventory and verifier target architecture.
- Static build control, tool/runtime discovery, TypeScript/build metadata, public artifact inputs and dependency-install control.

## Blockers

### B1 — Production-build ownership is not closed over real input mechanisms

Owner: `scripts/lib/releaseRisk.ts`.

The release-spec execution correction remains accepted. The unresolved defect is only on the production-build side: the planner can still return `skip` for repository inputs consumed by the real production build outside the static import boundary.

Confirmed current missed examples:

```text
.browserslistrc
postcss.config.js
pwa-assets.config.ts
public/favicon.svg
```

The mechanism audit also covers production env discovery, TypeScript build/config metadata, the complete `public/**` artifact population and `pnpm-workspace.yaml` install control.

This is a repeated ownership-completeness failure, so another example-only path patch is forbidden.

Ready architecture handoff:

```text
docs/testing/verify-release-impact-correction.md
status: architecture simplified and ready; implementation pending
```

The accepted correction is deliberately small:

- current positively-known production-build inputs → focused `artifact + build + managed-updates + release-smoke`;
- `public/**` → the same focused consumer set because Vite copies the whole population;
- production Vite env exact paths → the same focused set;
- non-current paths inside confirmed Browserslist/PostCSS/PWA-assets/tsconfig families → fail closed to full six until audited;
- `pnpm-workspace.yaml` → full six;
- known non-production members remain negative.

Do not mirror exhaustive third-party loader extension lists. Do not introduce a generic dependency graph/registry, broad `config/**`, generic `*.config.*`, or all-root fallback.

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

1. fresh independent test-author proof against `verify-release-impact-correction.md`;
2. separate implementation context;
3. focused unit/static feedback only;
4. return to architect for complete Pass E re-review.

Documentation, review state and PR metadata remain architect-owned.
