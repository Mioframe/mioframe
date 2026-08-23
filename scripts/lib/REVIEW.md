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

## Unresolved questions

None.

## NEXT CORRECTION

Owner: `scripts/lib/releaseRisk.ts`.

Primary proof owner:

```text
scripts/lib/releaseRisk.test.ts
```

PROOF INTENT:

```text
Contract/scenario:
  release-impact planning is closed over the confirmed production-build input mechanisms while remaining narrow for known current inputs and fail-closed for unknown significant family members.

Oracle source:
  docs/testing/verify-release-impact-correction.md plus the real repository build mechanisms identified there; production planner constants are not the oracle.

Primary proof owner:
  unit — scripts/lib/releaseRisk.test.ts

Must reject:
  1. a confirmed current production-build input resolving skip;
  2. a non-current significant member of a confirmed Browserslist/PostCSS/PWA-assets/tsconfig family resolving skip or focused instead of full.

Red phase:
  required for the newly uncovered production-build ownership cases.
```

Required pass order:

1. fresh independent test-author context changes only the proof needed in `scripts/lib/releaseRisk.test.ts`;
2. demonstrate contract-relevant RED against the current production implementation;
3. separate implementation context changes `scripts/lib/releaseRisk.ts` and treats accepted test expectations/assertions as read-only;
4. use only focused verifier-managed feedback useful to the pass;
5. return to architect for complete Pass E re-review, including retained release-spec inventory ownership.

If faithful proof or implementation requires changing release execution, release-spec inventory, production build semantics, CI topology, output-contract minors, or architecture outside the accepted local planner boundary, stop and return the conflict rather than expanding scope.

Documentation, review state, PR metadata, CI interpretation and merge readiness remain architect-owned.
