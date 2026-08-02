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
feature/*, feat/*, fix/*, refactor/*, docs/*, chore/*, agent/* -> develop -> main
hotfix/*, release-repair/* -> main -> develop when the change is main-only
```

- **Development flow**: branch from `develop` with a descriptive prefix, open a PR
  into `develop`, and squash merge after current-head review and verification. When
  `develop` is ready to ship, open a promotion PR from `develop` into `main`.
- **Direct main repair flow**: for a defect in an already-published stable version,
  branch from `main` as `hotfix/<name>`. For an unpublished current-main release
  candidate, branch as `release-repair/<name>`. Open the PR into `main` and squash
  merge after the release gate. When the resulting commit is not already in
  `develop`, open the documented release sync-back PR into `develop` and merge it
  with a merge commit so the branches do not diverge.
- Stable publish only ever happens from `main`. `develop` never deploys the
  stable build; it may still build/deploy PR previews for review.

Branch prefixes are descriptive, not an allow-list. Use a prefix that communicates ownership and intent, including `feature/`, `feat/`, `fix/`, `hotfix/`, `release-repair/`, `refactor/`, `docs/`, `chore/`, or `agent/`. The target branch and release flow determine policy; the prefix alone does not grant an exception.

### Merge strategy

Use these merge methods explicitly:

- ordinary feature, fix, refactor, docs, tooling, and agent PRs into `develop`: **squash merge**;
- direct hotfix and pre-tag repair PRs into `main`: **squash merge**;
- `develop` -> `main` promotion PRs and `main` -> `develop` release sync-back PRs: **merge commit**.

Rebase merge is forbidden. Synchronization PRs preserve shared ancestry; ordinary PRs collapse implementation-history noise into one reviewed change.

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
  `Merge strategy` above), to preserve
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
cleanup on PR close removes only that PR's `/pr/<number>/` slot.

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

## Managed pinned application updates

Stable and develop each run a version-independent controller worker
(`src/sw.ts`, `src/shared/service/appUpdate/**`) instead of a generated
Workbox worker. Every other branch and every PR preview keep the ordinary
generated `generateSW` worker (or no worker at all for PR previews).

Two lifecycles are deliberately kept separate and owned by different
parties:

```
Browser Service Worker lifecycle:
install controller code
→ wait while old controlled windows exist
→ activate after they close

Managed application release controller:
active release
→ approved release
→ clean-launch activation
→ boot commit or rollback
```

The browser controls versions of `sw.js`. The managed controller controls
versions of the Mioframe application. The two are independent: a
controller-code (worker script) update never reads, discovers, or changes
the pinned application release, and a Manual application pin survives a
controller-code replacement untouched.

### Native browser lifecycle for controller-code updates

The managed worker never calls `self.skipWaiting()` or `self.clients.claim()`
and contains no code path that distinguishes a legacy Workbox worker from an
older managed one — `install`/`waiting`/`activate` for this worker's own code
is entirely the browser's ordinary Service Worker lifecycle:

- **`install`**: reads persisted state. Invalid state rejects installation
  outright (the browser keeps any previous worker active). Absent state
  fetches `latest.json`, fetches and validates the exact descriptor,
  prepares the release completely, and persists it as the initial
  `activeRelease` — this always runs, including while an older worker (a
  legacy Workbox worker or an older managed one) still controls the page
  that triggered registration, since `fetch()` calls the installing
  worker's own script makes are never routed through a _different_
  worker's `fetch` handler. Valid state is preserved completely unchanged:
  no discovery, no active-release change, no approval, and no cache
  restoration — a controller-code upgrade must never change, or need to
  re-verify, the selected application release. Missing local cache for an
  already-valid installation is the ordinary selected-release fetch
  responsibility (see "Request routing" below), not an install-time one.
- **Waiting**: a successful installation enters the browser's ordinary
  waiting state whenever another worker still controls open clients. The
  page that first registers a fresh worker may remain uncontrolled until
  its next navigation — standard first-install behavior, not an error.
- **`activate`**: runs only best-effort managed-cache housekeeping
  (`runReleaseCacheCleanup`); it never selects, initializes, or verifies an
  application release. A cleanup failure never fails activation.

Proven end to end by `tests/e2e/release/managedUpdatesMigration.spec.ts`
(migration from the exact frozen pre-feature generated Workbox config,
including an install-time-failure case that leaves the legacy worker
active) and `tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts` (a
byte-different controller update preserving an already-pinned release and
an unapproved newer one), both wired into the `managed-updates` release
verification label (see below).

### Clean-launch semantics

The worker persists one `activeRelease` per channel (IndexedDB), an optional
`latestRelease` discovered from the channel pointer, mutually exclusive
`approvedRelease` (fully prepared and waiting for a clean launch) or
`activation` (`{ targetRelease, deadlineAt }`), and an optional single
`failedActivationRelease`. Starting an activation removes `approvedRelease`
and never changes `activeRelease` — only a later `BOOT_OK` commit does. While
an activation is in progress, update checks may refresh `latestRelease` but
must not prepare or approve another release.

The portable activation contract is:

```text
close every Mioframe window
→ reopen Mioframe
→ the scheduled release starts activation
```

For each navigation, the worker counts every other controlled or uncontrolled
same-channel window and excludes only the navigation identities exposed by the
standard `FetchEvent.clientId` and `FetchEvent.resultingClientId` fields. When
no other same-channel window is live and a valid approval exists, the worker
starts `activation`, serves its target, and arms the 30-second
`BOOT_CONFIRMATION_TIMEOUT_MS` deadline.

The worker does not read non-standard navigation identity fields, detect or
classify reloads, or branch by browser. A sole-window reload may or may not
qualify depending on browser timing; the system neither promises nor forbids
that behavior. Closing every Mioframe window and reopening it is the only
cross-browser guaranteed trigger and is the scenario verified in Chromium,
Firefox, and WebKit.

The publisher-injected boot watchdog reports `BOOT_OK`/`BOOT_FAILED` back to
the worker over an acknowledged `MessageChannel` request; the worker only
disarms the watchdog once it confirms a durable `committed` (`BOOT_OK`) or
`rolled-back` (`BOOT_FAILED`) persistence — never merely because a message was
sent. An already-open session is never force-updated when a Manual installation
or Automatic background approval is scheduled.

A rollback never copies or restores a previous release, because
`activeRelease` never changed during activation; it only clears the
activation and records the failed target as the single
`failedActivationRelease`. Automatic mode never re-approves the exact
failed release again; an explicit Manual action may retry it, and a
successful retry clears the failure. A strictly newer discovery also clears
an obsolete failure once it can no longer affect approval or UI state. The
failure remains visible in the UI-facing snapshot (`failedRelease`) after
the rollback reload, not only as an ephemeral response error.

### Request routing and non-release pass-through

The worker's `fetch` handler only ever intercepts same-channel top-level
navigations and requests whose path is one of the currently selected
release's own listed files, and only when the request's origin matches this
worker's own registration-scope origin — a fetch event can fire for a
cross-origin request a controlled page makes (a font, an external API), and
scope alone only limits which pages the worker controls, not which of their
requests reach its `fetch` handler. Everything else — cross-origin
requests, the manifest, PWA icons, API routes, and any other same-origin
resource outside the release — falls through to an ordinary network
`fetch()`, never a synthetic release-cache response. A release asset that
is listed but locally missing is still served (or restored) from that exact
release only, deduplicated through the same `PreparationCoordinator` every
other preparation path uses; it never silently falls back to a different
release or the current live deployment.

### Boot-success boundary

`BOOT_OK` is reported only once: the initial router navigation has resolved
successfully (`router.isReady()`), the root Vue app has mounted, and the
first render has completed (`nextTick()`). It never waits on a selected
space, document loading, Google Drive, Sentry delivery, or other optional
integrations. A failed initial navigation (e.g. a lazy-loaded route's
dynamic import throwing) is never masked — `reportAppBootOk()` is simply
never called, and the watchdog's own early-fatal-error detection reports
`BOOT_FAILED`.

### Rollback and reload

A `BOOT_FAILED` report is only acted on once the worker durably persists
the rollback. The worker posts the `rolled-back` acknowledgement first, then
starts the `APP_UPDATE_ROLLBACK` broadcast to every same-channel window
(never a foreign channel, branch, or PR preview); that broadcast triggers
each failed-release window's reload. If rollback persistence itself fails,
the watchdog never reloads — it shows a small, self-contained recovery
message and leaves the page recoverable by a later launch, avoiding a reload
loop.

### Message-event lifetime and response ordering

Worker command handling returns an immediate response plus an optional
deferred `runLifetimeWork: () => Promise<void>` callback. `src/sw.ts` posts
the response first and only then invokes and awaits the callback inside the
originating `message` event's `event.waitUntil()` promise.

Cache cleanup, state-change invalidation, and rollback broadcasts therefore
cannot begin before the requesting client has received the durable command
result. Read-only and true no-op commands return no follow-up callback.
Follow-up failures remain best effort and never alter an already-persisted
transition or its response. No durable cleanup scheduler, operation record,
or retry database is introduced.

### Stable/develop isolation

Stable (`/`) and develop (`/branch/develop/`) share one origin. Isolation
comes entirely from this project's own namespacing, not browser storage
partitioning: distinct IndexedDB database names
(`mioframe-update-controller-stable` / `-branch-develop`), distinct Cache
Storage name prefixes, and channel-scoped window filtering
(`isSameChannelPath`, which checks origin before pathname) for clean-launch
window counts, private-protocol message authorization, and rollback
broadcasts. Proven in one shared `BrowserContext` (see
`tests/e2e/release/managedUpdatesDevelop.spec.ts`) — two separate contexts
would each get their own storage partition from the test tooling itself,
which would validate nothing about this project's own logic.

### One immutable cache per release

Each release owns exactly one Cache Storage cache
(`<channel-namespace>-release-<releaseId>`) — there is no separate
staging/final pair. Preparation only ever mutates a release's cache once it
has already confirmed that cache is not yet valid (missing descriptor
marker, missing archived-index marker, or a missing listed file); an
already-valid committed cache is never rebuilt or deleted. An incomplete or
failed attempt deletes the cache it was populating before rethrowing, so a
repeated failure never leaves stale partial content behind. The descriptor
marker is always written last — its presence and validity is what makes a
release "available" — and availability checks independently confirm the
archived-index marker is present too, rather than relying only on write
ordering, since Cache Storage entries may be evicted individually under
storage pressure.

### Release retention and cleanup

Cache Storage cleanup (deleting stale release caches) runs as a best-effort
side effect after lifecycle transitions that can release cache ownership —
commit, rollback, cancellation, a mode change that clears an approval, an
Automatic approved-target replacement, and controller activation. It
protects the active release, the latest discovered release, an
approved-but-not-yet-activated release, an in-progress activation's target,
and every release currently registered as an in-flight preparation.
Protecting `latestRelease` closes the short ownership gap after preparation
finishes but before approval is persisted; once a newer discovery supersedes
it, the old release becomes removable unless another owner still references
it.

`PreparationCoordinator` serializes cleanup callbacks so they never overlap.
A new preparation waits for every cleanup already scheduled when it is
registered; a cleanup scheduled after a preparation is registered captures
that release ID when the cleanup actually starts and protects its cache.
For message commands, cleanup starts only through deferred
`runLifetimeWork()` after the response is posted. Cleanup never blocks or
changes the lifecycle transition's own response, and a cleanup failure never
makes an already-persisted transition appear to have failed or poisons later
cleanup/preparation work. Release downloads and hashing use a small bounded
concurrency limit, not an unbounded fetch over every file.

### Reconciliation event lifetime

Every owned top-level navigation joins the worker-local reconciliation promise
and attaches it to that fetch event through `event.waitUntil`. Concurrent
navigation and explicit Check triggers join without requesting another pass;
a successful mode change requests one fresh-state rerun. The navigation's own
`event.respondWith` promise remains independent, so discovery and preparation
never delay its response.

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
