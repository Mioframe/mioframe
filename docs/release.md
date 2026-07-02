# Release model

Mioframe ships from two long-lived branches with different guarantees. This
document is the source of truth for how code moves from a feature branch to a
stable public release. `AGENTS.md` links here; keep the detailed policy in
this file, not in `AGENTS.md`.

## Branches

- **`develop`** is the active development branch. Every feature and fix lands
  here first. It is verified on every PR but is never published as the stable
  build.
- **`main`** is the stable public branch. Only `main` is published to the
  stable GitHub Pages deployment. Every push to `main` and every PR into
  `main` runs the full release gate (see below).

## Flows

```
feature/* -> develop -> main
fix/*, hotfix/* -> main -> develop
```

- **Feature flow**: branch from `develop` as `feature/<name>`, open a PR into
  `develop`. When `develop` is ready to ship, open a promotion PR from
  `develop` into `main`.
- **Hotfix flow**: for a defect that must be fixed directly on the stable
  branch, branch from `main` as `fix/<name>` or `hotfix/<name>`, open a PR
  into `main`. After the hotfix ships, merge (or cherry-pick) the same change
  back into `develop` so the two branches do not diverge.
- Stable publish only ever happens from `main`. `develop` never deploys the
  stable build; it may still build/deploy PR previews for review.

## Versioning

- `package.json` `version` is the single source of truth for the app version.
  Vite injects it into the runtime as `__APP_VERSION__` (see
  `vite.config.ts`).
- Versions are SemVer-compatible `X.Y.Z` (no pre-release/build suffix).
- Git tags for stable releases use the format `vX.Y.Z` and must match
  `package.json` exactly at the point the tag is created.
- The first public release is `0.1.0`.

### PR-level version bump policy

- **Every PR into `develop` must bump `package.json` version** strictly above
  the version currently on `develop`. This is enforced by CI (see
  `scripts/release/validateVersion.mjs`, run as the `release-version` /
  version-bump check).
- **Every PR into `main`** (promotion or hotfix) must also carry a version
  strictly above the version currently on `main`.
- CI verifies that a bump exists and is monotonically increasing. CI does
  **not** decide whether the bump should be PATCH, MINOR, or MAJOR — that is
  a product/review decision made by the PR author and reviewer.

### Choosing PATCH / MINOR / MAJOR

This is a manual decision, not automated by CI:

- **PATCH** (`0.1.0` -> `0.1.1`): bug fixes, internal refactors, verification
  or tooling changes with no user-facing behavior change.
- **MINOR** (`0.1.0` -> `0.2.0`): new user-facing functionality that does not
  break existing data, storage formats, or workflows.
- **MAJOR** (`0.x.y` -> `1.0.0`, or `x.y.z` -> `(x+1).0.0`): breaking changes
  to storage format, public APIs, or user workflows that require migration or
  explicit user action.

## What CI verifies automatically

- **PRs into `develop`**: normal focused development verification
  (`pnpm verify`, changed-file scope) plus a version-bump check — the PR
  version must be strictly greater than `develop`'s current version.
- **PRs into `main`** and **pushes to `main`**: the full release gate
  (`pnpm verify:release`, full-project scope, see below), which includes
  version/tag/build metadata validation.
- **Tag pushes (`vX.Y.Z`)**: the tag must match `package.json` version
  exactly.
- Stable deploy runs only after the release gate passes on a push to `main`.

## What remains a manual product/release decision

- Whether a change is PATCH, MINOR, or MAJOR.
- Whether a given `develop` state is ready to promote to `main`.
- Writing the release notes for a version (`docs/releases/<version>.md`).
- Creating and pushing the `vX.Y.Z` tag after `main` is updated.

## Full release verification

`pnpm verify` remains the normal development command: it scopes checks to
changed files and is meant for fast PR feedback on `develop`.

`pnpm verify:release` (= `node scripts/verify.mjs --full`) is the release
gate. It ignores changed-file scope and always runs, for the whole project:

- format check (`oxfmt`) across the full supported file set;
- `oxlint` across the full project;
- `eslint` across the full project;
- full TypeScript type-check;
- the full `vitest run` unit/component suite;
- full app Playwright E2E smoke coverage;
- full approved visual regression coverage;
- mutation testing over the defined release high-risk subset (the pure
  logic covered by `stryker.config.mjs`, excluding `src/shared/ui`);
- production build and artifact validation (`docs/release.md#production-artifact-validation`);
- release smoke coverage (`docs/release.md#release-smoke-coverage`);
- release/version metadata validation (`scripts/release/validateVersion.mjs`).

Full mode never reports a check as skipped because there were no changed
files. Use `pnpm verify --full --only <label>` to focus on a single release
check while keeping the release-scope framing.

## Production artifact validation

Owned by `scripts/release/buildArtifact.mjs`, `scripts/release/artifactServer.mjs`,
and `tests/e2e/release/productionArtifactSmoke.spec.ts`. It validates the
_published_ artifact, not internal build tooling:

- the production build (`vite build`) completes;
- the built `dist/` opens through a local static server the same way GitHub
  Pages would serve it, at the configured base path (`/mioframe/`);
- an unmatched deep route falls back to the site's `404.html` redirect and
  the app restores the original path after boot (the same mechanism
  `scripts/pages/writeSpaFallback.mjs` writes for the real deployment);
- critical assets referenced by `index.html` load without errors under the
  base path;
- the PWA manifest is linked and fetchable, and the app does not throw a
  page error during first launch when a service worker is registered.

This does not assert on Workbox route internals — only the user-visible
artifact behavior.

## Release smoke coverage

Owned by `tests/e2e/release/*.spec.ts`, using existing Playwright helpers
(`tests/e2e/helpers.ts`) and user-facing locators, run against the built
production artifact (see above), not the dev server.

- **First-user flow**: open the artifact, land on Home, open Browser
  Storage, create a first document, add minimal data, confirm no save
  error, reload, confirm the data survived.
- **Returning-user flow**: with data already created (from the same test's
  own setup), reopen the app, confirm the previous data is visible, and
  confirm reopening does not create duplicate data or overlay an empty
  state on top of existing data.

## Required checks and branch protection

Configure these as required status checks in GitHub branch protection
settings (this repository does not control branch protection directly —
apply these manually in the GitHub UI):

- `main`: require the `release` workflow (`release-gate` and its
  sub-jobs) to pass before merge, and require branches to be up to date.
  Disallow direct pushes; only merges through a reviewed PR.
- `develop`: require the `verify` workflow (`verify` job and the
  version-bump check) to pass before merge.

## What blocks a release

- Any failing check inside `pnpm verify:release` (format, lint, type-check,
  unit, e2e, visual, mutation, build, artifact, release smoke, version
  metadata).
- A missing or non-monotonic version bump.
- A tag that does not match `package.json` version.
- Missing release notes for the target version
  (`docs/releases/<version>.md`) or a missing `docs/release-checklist.md`.

CI failing any of the above must block the `deploy-stable` job; it never
runs as a fallback or manual override.

## Where to inspect release verification logs

- Locally: `.verify/logs/<label>.log`, one file per check
  (see `pnpm verify:status`).
- In GitHub Actions: the failing step's inline log, plus the `verify-logs`
  / `release-logs` artifact uploaded on failure or cancellation for the run
  (Actions run page -> Summary -> Artifacts).

See `docs/release-checklist.md` for the step-by-step promotion/hotfix
checklist.
