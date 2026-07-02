# Release checklist

Use this checklist for every promotion of `develop` into `main`, and for
every hotfix directly into `main`. See `docs/release.md` for the full policy
this checklist enforces.

## Before opening the PR into `main`

- [ ] `develop` (or the hotfix branch) is green on its own `verify` workflow.
- [ ] `package.json` `version` is bumped above the version currently on
      `main`, following SemVer (`docs/release.md#choosing-patch--minor--major`).
- [ ] `docs/releases/<version>.md` exists and describes what changed in this
      release, in product-facing language.
- [ ] No storage format, data model, routing model, or product UX behavior
      changed unintentionally as a side effect of release infrastructure
      work.

## Opening the PR into `main`

- [ ] PR target branch is `main`.
- [ ] PR description fills in the pull request template's ownership matrix
      and verification sections.
- [ ] The `release` workflow run is green:
  - [ ] `pnpm verify:release` full-project gate passed (format, lint,
        type-check, unit tests, full app e2e, full visual regression,
        release mutation subset).
  - [ ] production build and artifact validation passed.
  - [ ] release smoke coverage (first-user and returning-user flows)
        passed.
  - [ ] release/version metadata validation passed (version format, PR
        version greater than `main`'s current version).

## After merging into `main`

- [ ] The `release` workflow's push-to-`main` run is green (this re-runs the
      full release gate before `deploy-stable`).
- [ ] `deploy-stable` succeeded and the stable GitHub Pages deployment shows
      the new version.
- [ ] Create and push the `vX.Y.Z` tag matching `package.json` version.
      The tag push re-runs release/version validation to confirm the tag
      matches `package.json`.
- [ ] Merge (or cherry-pick) the same change back into `develop` so the
      branches do not diverge. For a normal promotion (`develop` -> `main`
      with no `main`-only commits), this is a fast-forward or a trivial
      merge back.

## If the release gate fails

- [ ] Read the failing step's log in the Actions run, or download the
      `release-logs` artifact.
- [ ] Do not bypass the gate. Fix the failure (or, for a flaky
      infrastructure issue, re-run the workflow) — do not disable checks or
      force-merge around a failing release gate.
- [ ] If the gate reveals a defect only visible at full-project scope
      (e.g. a mutation-test regression outside the PR's changed files),
      treat it as a release blocker and fix it before promoting.

## Hotfix-specific steps

- [ ] Branch from `main` as `fix/<name>` or `hotfix/<name>`.
- [ ] Bump the version (PATCH unless the fix requires more).
- [ ] Follow the same PR-into-`main` and after-merge steps above.
- [ ] After the hotfix ships, merge it back into `develop` in the same PR
      cycle so `develop` does not silently regress.
