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
  into `main`. After the hotfix ships, merge the same change back into
  `develop` (a release sync-back PR, see below) so the two branches do not
  diverge.
- Stable publish only ever happens from `main`. `develop` never deploys the
  stable build; it may still build/deploy PR previews for review.

### Merge strategy for `develop` <-> `main` synchronization

`develop` -> `main` promotion PRs and `main` -> `develop` release sync-back
PRs **must be merged with a merge commit, not squash or rebase**. Ordinary
feature/fix PRs into `develop` may keep the repository's normal merge policy
unless another rule says otherwise.

- **Why**: `develop` and `main` are both long-lived branches. Squashing or
  rebasing a promotion/sync-back merge rewrites history and breaks shared
  ancestry between the two branches. The next synchronization in either
  direction then has no common base for the same content, which Git reports
  as spurious conflicts even though nothing actually diverged.
- A `develop -> main` PR that was squash/rebase-merged is the reason a later
  `main -> develop` sync-back PR conflicts (see `Release sync-back` below) —
  do not repeat the mistake in the sync-back PR itself.

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
  strictly above the version currently on `main`, with one narrow exception:
  see `Pre-tag release repair` below.
- CI verifies that a bump exists and is monotonically increasing. CI does
  **not** decide whether the bump should be PATCH, MINOR, or MAJOR — that is
  a product/review decision made by the PR author and reviewer.

### Pre-tag release repair

A version on `main` is not actually "released" until its matching `vX.Y.Z`
tag is pushed (see `Creating and pushing the vX.Y.Z tag` above) — until then
it is an unpublished release candidate that may still need fixes.

To allow those fixes without forcing a version bump for every follow-up
commit, `scripts/release/validateVersion.mjs` allows a PR into `main` to keep
the **same** version as `main`'s current version only when the matching tag
does not exist yet:

- PR version `==` `main` version, and tag `vX.Y.Z` (`X.Y.Z` = that version)
  does **not** exist yet: passes, as a pre-tag release repair.
- PR version `==` `main` version, and tag `vX.Y.Z` already exists: fails —
  that version is already published, so a new PR must bump the version.
- PR version `<` `main` version: always fails.
- This exception applies only to PRs targeting `main`. A PR into `develop`
  with the same version as `develop`'s current version always fails,
  regardless of tag state — `develop` is never tagged — **except** for the
  narrow release sync-back exception described below.

Once the tag is created, every subsequent change to `main` requires a new
version bump; the same-version exception no longer applies for that version.

### Release sync-back

A release sync-back PR merges already-released `main` changes (typically a
hotfix) back into `develop` so the two branches do not diverge. It is a
maintenance path, not new product work, so it is exempt from the ordinary
`develop` version-bump requirement — but only when it is unambiguously a
sync-back, not an ordinary feature/fix PR in disguise.

`scripts/release/validateVersion.mjs` allows a PR into `develop` to keep the
**same** version as `develop`'s current version only when **all** of the
following hold:

- the PR targets `develop`;
- the current `package.json` version equals `develop`'s current version
  (no bump, and no downgrade);
- the PR head branch name matches `sync/main-X.Y.Z-back-to-develop`, where
  `X.Y.Z` is the release being synchronized back (see
  `isReleaseSyncBackBranch` in `scripts/release/validateVersion.mjs`);
- `X.Y.Z` in the branch name matches the current `package.json` version
  exactly.

If the branch name does not match this pattern, or the embedded version
does not match `package.json`, the PR is treated as an ordinary PR into
`develop` and must bump the version like any other change. This keeps the
exception narrow: it is not possible to open an arbitrary same-version PR
into `develop` by picking any branch name.

A release sync-back PR:

- must not create a new release or tag;
- must be merged with a merge commit, not squash or rebase (see
  `Merge strategy for develop <-> main synchronization` above), to preserve
  shared ancestry with `main`;
- does not get a PR preview deployment — `deploy-preview` in
  `.github/workflows/verify.yml` is skipped for branches matching
  `sync/main-*-back-to-develop`, since the PR only synchronizes already-
  published `main` changes back into `develop` and changes no runtime app
  behavior. The `release-version` job and aggregate `verify` merge gate still run.

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
  branch except `main`, and pushes to `develop`. Its `pull_request` trigger uses
  `branches-ignore: [main]`, so it never fires for a PR into `main`. The workflow
  separates three responsibilities:
- `verification` runs focused development verification (`pnpm verify`,
  changed-file scope) and owns whether deployable PR source is valid;
- PR-only `release-version` enforces the version-bump policy independently;
- aggregate `verify` preserves the required merge check and succeeds only when
  `verification` and, for PRs, `release-version` both succeed.
  `deploy-preview` depends only on `verification`: an incorrect PR version blocks
  merge through `verify` but does not block the application and Storybook demo.
  Implementation verification failures still block the preview. `deploy-develop`
  also depends on `verification` for pushes to `develop` — see
  `docs/release.md#organization-pages-deployment-model`.
- **`release` workflow** (`.github/workflows/release.yml`): PRs into `main`
  and pushes to `main` only. Runs the full release gate
  (`pnpm verify:release`, full-project scope, see below), which includes
  version/build metadata and release-config validation. Stable deploy
  (`deploy-stable`, `/`) runs only after this gate passes on a push to
  `main`.
- **`release-tag` workflow** (`.github/workflows/release-tag.yml`): `vX.Y.Z`
  tag pushes only. Runs a single lightweight check
  (`node scripts/release/validateVersion.mjs`) confirming the tag matches
  `package.json` version — it does not rerun e2e, visual, artifact, or
  deploy steps, since `main` was already validated by the `release`
  workflow before the tag was created.
- **`deploy-branch` workflow** (`.github/workflows/deploy-branch.yml`):
  `workflow_dispatch` only, for a maintainer-selected manual branch
  deployment (`/branch/<slug>/`). Never runs automatically.
- **`deploy-branch-tombstone` workflow**
  (`.github/workflows/deploy-branch-tombstone.yml`): runs on every branch
  deletion; a no-op unless that branch had an existing `/branch/<slug>/`
  deployment.
- **`deploy-branch-tombstone-cleanup` workflow**
  (`.github/workflows/deploy-branch-tombstone-cleanup.yml`): scheduled,
  removes tombstones past their retention period.
- **`deploy-cleanup` workflow** (`.github/workflows/deploy-cleanup.yml`):
  runs on PR close, removes that PR's `/pr/<number>/` deployment.

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

## Organization Pages deployment model

Mioframe publishes to the organization Pages repository
`Mioframe/mioframe.github.io`, not a project-site path inside this
repository. This source repository (`Mioframe/mioframe`) owns source, CI,
verification, and build scripts; `Mioframe/mioframe.github.io` owns only
generated static deployment output, published to its `gh-pages` branch.

Canonical deployment paths:

- stable (`main`): `https://mioframe.github.io/`
- develop: `https://mioframe.github.io/branch/develop/`
- manual branch: `https://mioframe.github.io/branch/<branch-slug>/`
- PR preview: `https://mioframe.github.io/pr/<number>/`
- PR preview Storybook: `https://mioframe.github.io/pr/<number>/storybook/`

Each deployed channel is isolated by `BASE_URL`, service worker scope,
manifest identity, and Cache Storage cache-name namespace (see
`config/plugins/pwa.ts`). Every deployment writes a `deployment.json` at its
own root, produced by `scripts/pages/writeDeploymentMetadata.mjs`,
recording channel, channel id, source ref/branch/slug, commit SHA, build
date, app version, base URL, and a tombstone flag when applicable.

### Cross-repository publishing (GitHub App)

Publishing to `Mioframe/mioframe.github.io` uses a short-lived installation
token from a GitHub App, minted per publish job with
`actions/create-github-app-token@v3`, passing the app's **client ID** (not
its numeric app ID) as `client-id: ${{ vars.MIOFRAME_PAGES_APP_CLIENT_ID }}`
— the configured repository variable holds a client ID, and `v3`'s
`client-id` input is the correct match for it — plus
`private-key: ${{ secrets.MIOFRAME_PAGES_APP_PRIVATE_KEY }}`, scoped to
`owner: Mioframe`, `repositories: mioframe.github.io`. The source
repository's own `GITHUB_TOKEN` is never used for the cross-repository
write — it only needs `contents: read` to check out the source and, for PR
previews, `pull-requests: write` to post the preview comment on this
repository. The GitHub App is installed only on
`Mioframe/mioframe.github.io`, not on this repository.

#### Trusted publishing boundary

A job may build application source from a less-trusted ref — a PR head or a
manually selected branch — but any step that holds the
`Mioframe/mioframe.github.io` write token must run only trusted code, never
scripts checked out from that less-trusted ref. `deploy-preview` (in
`verify.yml`) and `deploy-branch` (in `deploy-branch.yml`) both check out
two separate directories to keep this boundary explicit:

- `app-source/` — the PR head or selected branch. Only ever built
  (`pnpm install` + `pnpm run build`); never executed after the Pages deploy
  token exists.
- `tooling/` — this repository's own trusted base (the PR's base ref for
  `deploy-preview`, `develop` for `deploy-branch`). Every script that
  computes a slug, writes `deployment.json`, generates the Pages deploy
  token, or publishes to `Mioframe/mioframe.github.io` runs from this
  checkout, using `--dist app-source/dist` to point at the untrusted build
  output.

`deploy-develop` (push to `develop`) and `deploy-stable` (push to `main`)
do not need this split: by the time either job runs, its source has already
passed the `verify`/`release-gate` check on a long-lived trusted branch, so
running publish scripts from that same checkout is acceptable.
`deploy-branch-tombstone` and `deploy-branch-tombstone-cleanup` also do not
need it — they check out this repository's default branch only and never
touch PR/manual-branch source at all.

Every publish script (`scripts/pages/publish*.mjs`,
`scripts/pages/cleanup*.mjs`) commits to the target repository's `gh-pages`
branch through `scripts/pages/lib/ghPagesBranch.mjs`, retrying on push
conflicts. Each publish only touches its own slot:

- stable publish (`publishStable.mjs`) replaces everything at the target
  repository root except `.git/`, `branch/`, and `pr/` — so it never evicts
  develop, manual branch, or PR preview deployments;
- branch publish (`publishBranch.mjs`) replaces only `branch/<slug>/`;
- PR preview publish (`publishPreview.mjs`) replaces only `pr/<number>/`;
- PR preview cleanup (`cleanupPreview.mjs`, run on PR close) removes only
  `pr/<number>/`.

The org-root `404.html` SPA fallback is generated by
`scripts/pages/lib/spaFallback.mjs`. `scripts/pages/writeSpaFallback.mjs`
is only the CLI writer for that generated fallback. The fallback is
channel-independent — it dispatches any unmatched deep link to `/`,
`/branch/<slug>/`, or `/pr/<number>/` based on the URL path alone. Trusted
Pages publish tooling enforces that root `404.html` invariant for stable,
branch, and PR preview publishes, while branch/PR publish paths still own
only their deployment slot plus that shared root fallback file.

### Develop branch deployment

On push to `develop`, the `verify` workflow's `deploy-develop` job builds
with `BASE_URL=/branch/develop/`, `VITE_RELEASE_CHANNEL=branch`,
`VITE_RELEASE_CHANNEL_ID=develop`, PWA enabled, and publishes to
`branch/develop/`.

### Manual branch deployment

`.github/workflows/deploy-branch.yml` is `workflow_dispatch`-only and never
runs automatically — arbitrary branches are not auto-published. It takes a
`branch` input — a branch **name** only, not an arbitrary ref, tag, or SHA —
and validates it against `origin`'s branch list before building anything
(`git ls-remote --exit-code --heads origin refs/heads/<branch>`) so tags and
commit SHAs are rejected outright. This keeps the manual deployment
lifecycle (slug, metadata, tombstone-on-delete, branch-delete cleanup)
branch-based end to end.

The slug is derived by `scripts/pages/lib/slug.mjs` `slugifyBranch`:

- the literal `develop` branch name maps to the bare slug `develop`, so a
  manual dispatch against `develop` resolves to the same `branch/develop/`
  slot the automatic develop-push deployment uses;
- every other branch name is lower-cased, has non-`[a-z0-9]` runs (including
  `/` from `feature/x` names) collapsed to a single `-`, is truncated to
  leave room for an appended 8-character hex hash, then gets that hash
  suffix appended — the hash is derived from the raw (pre-normalization)
  branch name, not the normalized prefix.

This makes the slug collision-safe: branch names that normalize to the same
prefix (`feature/a`, `feature-a`, `feature_a` all normalize to `feature-a`)
still produce different slugs, since each has a different raw name and
therefore a different hash suffix — so one branch's manual deployment can
never silently overwrite another's, or share its PWA scope/cache/manifest
identity. The resulting slug still rejects the reserved `branch`/`pr`
namespace names and stays within a DNS-label-safe length. Deleting a branch
computes the identical slug from the same branch name (see `Branch deletion
tombstone` below), so tombstoning always targets the correct slot.

Given the validated branch name, the workflow builds with
`BASE_URL=/branch/<slug>/`, `VITE_RELEASE_CHANNEL=branch`,
`VITE_RELEASE_CHANNEL_ID=<slug>`, PWA enabled, and publishes to
`branch/<slug>/`. Deployment metadata records the actual checked-out commit
(`git -C app-source rev-parse HEAD`), not `github.sha` — for a
`workflow_dispatch` run, `github.sha` is the workflow's own trigger commit,
not necessarily the selected branch's tip.

### PR preview deployment

PR previews remain owned by the `verify` workflow's `deploy-preview` job:
`BASE_URL=/pr/<number>/`, `VITE_DISABLE_PWA=1` (PWA stays disabled for PR
previews in this implementation), publishing to `pr/<number>/`. Publication is
gated by the `verification` job, not by the independent `release-version` merge
gate. Therefore an incorrect PR version does not block the demo, while failed
implementation verification still does. The sticky preview comment links to
`https://mioframe.github.io/pr/<number>/`. PR previews for release sync-back
branches remain skipped, as before (see `Release sync-back` above). PR preview
cleanup on PR close removes only that PR's `pr/<number>/` slot.

`deploy-preview` checks out trusted tooling from the PR's **base** ref (see
`Trusted publishing boundary` above), never from the PR head, so that
publish scripts never run untrusted PR-head code with the Pages write
credential. `develop` now carries this tooling for every PR, so no
branch-specific bootstrap exclusion is needed.

#### PR preview Storybook

Every PR preview also builds and publishes Storybook, generated from the
same PR head commit as the application build, at
`https://mioframe.github.io/pr/<number>/storybook/`. Both surfaces are
published as one atomic PR preview slot — there is no separate Storybook
deployment job, Pages publish operation, cleanup path, or `deployment.json`.

In `deploy-preview`, after the application build (`pnpm run build`) and
before the trusted-tooling checkout:

- `pnpm storybook:build` runs in `app-source` with
  `BASE_URL=/pr/<number>/storybook/`. This is the same
  `scripts/storybook.mjs build` command used everywhere else in the
  repository; it already sets `APP_STORYBOOK=1`, disables Storybook
  telemetry, and writes to the repository-configured `storybook-static`
  directory (`config/tooling.json` `storybook.staticDir`). No application
  secrets (`VITE_GOOGLE_CLIENT_ID`, `VITE_SENTRY_DSN`,
  `SENTRY_AUTH_TOKEN`) are passed to this build — Storybook stays isolated
  from PWA and Sentry production behavior;
- a local, explicit assembly step verifies `app-source/dist/index.html`
  exists, verifies `app-source/storybook-static/index.html` and
  `app-source/storybook-static/iframe.html` exist, fails clearly if
  `app-source/dist/storybook` already exists, then copies the complete
  contents of `app-source/storybook-static` into `app-source/dist/storybook`.
  This step only inspects and copies already-built static output — it does
  not execute any PR-head script, and it runs before the Pages write
  credential exists.

The resulting `app-source/dist/` tree (application at the root, Storybook
nested under `storybook/`) is then published exactly like any other PR
preview build: `publishPreview.mjs` copies the complete dist tree into
`pr/<number>/` in one commit, so the nested `storybook/` directory is
published automatically by the existing recursive copy — no
Storybook-specific publish script exists. PR preview cleanup
(`cleanupPreview.mjs`) removes the whole `pr/<number>/` slot, including
Storybook, with no separate cleanup step.

The sticky preview comment (`upsertPreviewComment.mjs`) accepts an optional
`--storybook-url`; when provided it renders both an Application and a
Storybook link in the one sticky comment. The required `--url` argument is
unchanged, so trusted tooling invoking the script without
`--storybook-url` still gets valid application-only behavior.

PR preview Storybook is not published for stable, develop, or manually
deployed branches — only for ordinary PR previews.

### Branch deletion tombstone

When a branch with an existing `branch/<slug>/` deployment is deleted,
`.github/workflows/deploy-branch-tombstone.yml` (triggered by GitHub's
`delete` branch event) does not immediately remove that slot. Instead it
replaces its content with a tombstone
(`scripts/pages/lib/tombstoneContent.mjs`):

- `index.html` — a static notice that the branch preview was removed, with
  a link back to the stable app root (`/`);
- `sw.js` — a service worker that, on activation, deletes only Cache
  Storage entries whose name is prefixed `branch-<slug>-` (the same
  namespace that branch's real PWA build used — see
  `buildChannelCacheNamespace` in `config/plugins/pwa.ts`), then claims
  existing clients. It registers no `fetch` handler and never messages
  clients to reload — this is passive cache self-cleanup, not forced-reload
  coordination;
- `manifest.webmanifest` — keeps the same `scope`/`start_url`/`id` as the
  removed deployment so an already-installed PWA icon still resolves;
- `deployment.json` — the same shape as a normal deployment, with
  `tombstone: true`.

For branches that were never deployed to `branch/<slug>/` (almost all
ordinary feature branches), this is a clean no-op — the workflow checks the
slot exists before doing anything.

Tombstones are retained for `config/tooling.json`
`pages.tombstoneRetentionDays` (14 days by default). The scheduled
`.github/workflows/deploy-branch-tombstone-cleanup.yml` workflow removes
`branch/<slug>/` slots whose `deployment.json` is a tombstone older than the
retention period (`scripts/pages/lib/tombstoneRetention.mjs`
`findExpiredTombstoneSlugs`); live deployments and tombstones still within
retention are left untouched.

### PWA channel isolation

`config/plugins/pwa.ts` makes the Vite PWA plugin channel-aware:

- `manifest.scope`, `start_url`, and `id` are pinned explicitly to the
  build's `BASE_URL` for every channel, so the manifest never drifts from
  the deployment it was built for;
- Cache Storage is per-origin, not per service-worker-scope, so cache names
  are explicitly namespaced per channel (`stable-*` for the stable build,
  `branch-<channel-id>-*` for a branch build) — otherwise a stable and a
  branch build sharing the same origin would silently share (and corrupt)
  Cache Storage entries;
- the stable channel's service worker scope is `/`, wide enough to
  otherwise intercept `/branch/*` and `/pr/*` navigation and asset
  requests, so it additionally denies those paths from its navigation
  fallback and runtime caching. A branch channel's scope (e.g.
  `/branch/develop/`) is narrower than every other channel's path, so the
  browser never dispatches fetch/navigate events for foreign paths to it in
  the first place — no equivalent denylist is needed there;
- manifest `name`/`short_name` make branch identity visible when installed:
  develop is `Mioframe Develop`; a manual branch uses its slug (or the
  branch name it was derived from);
- PR previews build with `VITE_DISABLE_PWA=1` and register no service
  worker at all.

## Production artifact validation

Owned by `scripts/release/buildArtifact.mjs`, `scripts/release/artifactServer.mjs`,
and `tests/e2e/release/productionArtifactSmoke.spec.ts`. It validates the
_published_ artifact, not internal build tooling:

- the production build (`vite build`) completes;
- the built `dist/` opens through a local static server the same way GitHub
  Pages would serve it, at the configured base path (`/`, the organization
  root — see `docs/release.md#organization-pages-deployment-model`);
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

- `config/tooling.json` `release.basePath` is `/` — the organization root
  Pages path, the same base path the release artifact build and
  `deploy-stable` use (see
  `docs/release.md#organization-pages-deployment-model`);
- `VITE_DISABLE_PWA` is not `1` (that is a PR-preview-only setting; see
  `deploy-preview` in `.github/workflows/verify.yml`);
- `BASE_URL`, if set, is exactly `/` — it must not start with `/branch/` or
  `/pr/` (those are branch and PR preview paths, not the stable release
  path);
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
