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

CI is split into three workflows so no PR/push path ever runs both the
focused and the full gate, and tag pushes never rerun the full gate:

- **`verify` workflow** (`.github/workflows/verify.yml`): PRs into any
  branch except `main`, and pushes to `develop`. Runs normal focused
  development verification (`pnpm verify`, changed-file scope) plus, on PRs,
  a version-bump check — the PR version must be strictly greater than
  `develop`'s current version. Its `pull_request` trigger uses
  `branches-ignore: [main]`, so it never fires for a PR into `main`.
- **`release` workflow** (`.github/workflows/release.yml`): PRs into `main`
  and pushes to `main` only. Runs the full release gate
  (`pnpm verify:release`, full-project scope, see below), which includes
  version/build metadata and release-config validation. Stable deploy
  (`deploy-stable`) runs only after this gate passes on a push to `main`.
- **`release-tag` workflow** (`.github/workflows/release-tag.yml`): `vX.Y.Z`
  tag pushes only. Runs a single lightweight check
  (`node scripts/release/validateVersion.mjs`) confirming the tag matches
  `package.json` version — it does not rerun e2e, visual, artifact, or
  deploy steps, since `main` was already validated by the `release`
  workflow before the tag was created.

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
- production build and artifact validation (`docs/release.md#production-artifact-validation`);
- release smoke coverage (`docs/release.md#release-smoke-coverage`);
- release/version metadata validation (`scripts/release/validateVersion.mjs`);
- release config validation (`scripts/release/validateReleaseConfig.mjs`, see
  `docs/release.md#release-config-validation`).

Full mode never reports a check as skipped because there were no changed
files. Use `pnpm verify --full --only <label>` to focus on a single release
check while keeping the release-scope framing.

Mutation testing (`pnpm test:mutate`, or scoped mutation inside ordinary
`pnpm verify`) remains available for test design and PR-quality work, but it
is not part of the release gate: it is slow, and it validates test
robustness rather than the published artifact. `pnpm verify --full` and
`pnpm verify:release` do not run it, and `pnpm verify --full --only
mutation` is not a valid release check.

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

### Avoiding duplicate artifact builds

The `build` check (`scripts/release/buildArtifact.mjs`) always builds a
fresh production artifact and fails fast before the more expensive `artifact`
and `release-smoke` Playwright checks run. Those checks each spin up their
own Playwright webServer, which normally builds its own artifact too — so
without deduplication, one `pnpm verify:release` run would build the same
production artifact three times.

`scripts/verify.mjs` avoids this: once `build` has passed in the same run,
it sets `RELEASE_ARTIFACT_SKIP_BUILD=1` for the `artifact` and
`release-smoke` checks (forwarded through `scripts/e2eReleaseContainer.mjs`
into the Podman container), and `buildArtifact.mjs` reuses the existing
`dist/` instead of rebuilding. Standalone invocations
(`pnpm e2e:release`, `pnpm verify --full --only artifact`) never set this
flag, so they remain self-sufficient and always build their own artifact.

## Release config validation

Owned by `scripts/release/validateReleaseConfig.mjs`, run as the
`release-config` check. It validates release-mode config assumptions that
are not covered by `release-version`:

- `config/tooling.json` `release.basePath` matches `/${package.json name}/`,
  the same base path the release artifact build and `deploy-stable` use;
- `VITE_DISABLE_PWA` is not `1` (that is a PR-preview-only setting; see
  `deploy-preview` in `.github/workflows/verify.yml`);
- `BASE_URL`, if set, is not a PR-preview path and matches the release base
  path;
- `VITE_GOOGLE_CLIENT_ID`, `VITE_SENTRY_DSN`, and `SENTRY_AUTH_TOKEN` are
  optional integrations, not required for a valid public release. Each is
  reported as set/optional-and-unset. Outside GitHub Actions, an explicitly
  empty value fails clearly (a silent misconfiguration, distinct from
  intentionally unset). Inside GitHub Actions (`GITHUB_ACTIONS=true`), an
  empty value is logged as a notice, not an error: GitHub Actions expands
  `${{ secrets.X }}` to an empty string when a secret is not configured, and
  there is no way inside the job to distinguish that from an explicit empty
  value, so treating it as fatal there would make an absent optional secret
  block the release gate;
- partial Sentry configuration (DSN without auth token, or vice versa) is
  reported explicitly so the resulting behavior is not a silent surprise.

It deliberately does not read or assert on secret values themselves — only
presence/absence and mode consistency.

The `Full release verification` step in `.github/workflows/release.yml`
(`release-gate` job) does not pass `VITE_GOOGLE_CLIENT_ID`, `VITE_SENTRY_DSN`,
or `SENTRY_AUTH_TOKEN` at all, since `pnpm verify:release` does not require
them — so in practice these keys are simply absent from that step's
environment, not empty. The GitHub Actions empty-value notice above exists
as a safety net for any other invocation (e.g. `deploy-stable`'s build step,
which does pass these secrets since the build uses them) so an unconfigured
optional secret never fails release-config validation there either.

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
  Disallow direct pushes; only merges through a reviewed PR. The `verify`
  workflow does not run for PRs into `main`, so it is not a required check
  there.
- `develop`: require the `verify` workflow (`verify` job and the
  version-bump check) to pass before merge.
- Tag pushes: the `release-tag` workflow is informational (it validates the
  tag after the fact); it is not a branch-protection required check since
  tags are not a protected branch.

## What blocks a release

- Any failing check inside `pnpm verify:release` (format, lint, type-check,
  unit, e2e, visual, build, artifact, release smoke, version metadata,
  release config).
- A missing or non-monotonic version bump.
- A tag that does not match `package.json` version.
- Missing release notes for the target version
  (`docs/releases/<version>.md`) or a missing `docs/release-checklist.md`.

CI failing any of the above must block the `deploy-stable` job; it never
runs as a fallback or manual override. `deploy-stable` builds with
`pnpm release:build-artifact` (`scripts/release/buildArtifact.mjs`) — the
same build script and base-path contract the release gate validates.

## Where to inspect release verification logs

- Locally: `.verify/logs/<label>.log`, one file per check
  (see `pnpm verify:status`).
- In GitHub Actions: the failing step's inline log, plus the `verify-logs`
  / `release-logs` artifact uploaded on failure or cancellation for the run
  (Actions run page -> Summary -> Artifacts).

See `docs/release-checklist.md` for the step-by-step promotion/hotfix
checklist.
