# Release checklist

Use this checklist for every promotion of `develop` into `main`, direct
hotfix, and pre-tag release repair into `main`. See `docs/release.md` for the
full policy this checklist enforces.

## Before opening the PR into `main`

- [ ] `develop`, the hotfix branch, or the pre-tag repair branch is green on its
      own `verify` workflow.
- [ ] For a promotion or hotfix, `package.json` `version` is bumped above the
      version currently on `main`. A pre-tag repair may keep the current `main`
      version only while its matching tag does not exist.
- [ ] `docs/releases/<version>.md` exists and describes what changed in this
      release, in product-facing language.
- [ ] No storage format, data model, routing model, or product UX behavior
      changed unintentionally as a side effect of release infrastructure
      work.
- [ ] For the first managed release, the complete promoted artifact is accepted
      as the managed baseline: it may include already-reviewed product changes
      (including local fixes retained in the managed-update PR), rollback to
      legacy Workbox is unsupported after activation, no irreversible
      user-data migration is included, and the complete product/UI surface has
      been manually accepted.

## Opening the PR into `main`

- [ ] PR target branch is `main`.
- [ ] PR description fills in the pull request template's ownership matrix,
      verification, current-head readiness, and merge-method sections.
- [ ] Merge method is `merge commit` for `develop` -> `main` promotion PRs and
      `squash` for direct hotfix or pre-tag repair PRs.
- [ ] The `release` workflow run is green:
  - [ ] `pnpm verify --full` full-project gate passed (format, lint,
        type-check, unit tests, mutation, full app e2e, full visual
        regression, managed update lifecycle proof).
  - [ ] production build and artifact validation passed.
  - [ ] release smoke coverage (first-user and returning-user flows)
        passed.
  - [ ] release/version metadata validation passed: promotion and hotfix
        versions are greater than the current `main` version; an untagged
        pre-tag repair may keep the current version.
  - [ ] release config validation passed (base path consistency, PWA not
        disabled, no preview-only settings, env/config presence — see
        `docs/release.md#release-config-validation`). Absent optional
        Google/Sentry integrations do not block this — only real
        release-mode misconfiguration (wrong base path, PWA disabled, a
        PR-preview base path, or an explicitly empty optional value outside
        GitHub Actions) does.
- [ ] For a release containing managed-update changes, the focused
      managed-update proof (its owning `static`, `browser-integration`, and
      `e2e` types) passed without flaky classification before the final
      `pnpm verify --full` run.
- [ ] Operator UI/accessibility acceptance covers update settings,
      notifications, clean-launch activation, rollback, controller-state-loss
      recovery, known-active-release recovery, and the rest of the promoted
      product changes.

## After merging into `main`

- [ ] The `release` workflow's push-to-`main` run is green (this re-runs the
      full release gate before `deploy-stable`).
- [ ] `deploy-stable` succeeded and the stable GitHub Pages deployment shows
      the new version.
- [ ] For the first managed release, confirm the managed worker became active
      and the application completed `BOOT_OK`; treat that deployed artifact as
      managed release 1. Full rollback guarantees begin with the next managed
      release.
- [ ] Create and push the `vX.Y.Z` tag matching `package.json` version.
      The tag push runs the lightweight `release-tag` workflow, which only
      confirms the tag matches `package.json` — it does not rerun the full
      release gate.
- [ ] If `main` received commits that are not already in `develop` (for example
      a direct hotfix or pre-tag repair), open the documented `main` ->
      `develop` sync-back PR and merge it with a merge commit. Do not
      cherry-pick or squash the sync-back. A normal `develop` -> `main`
      promotion requires no content replay back into `develop`.

## If the release gate fails

- [ ] Read the failing step's log in the Actions run, or download the
      `release-logs` artifact.
- [ ] Do not bypass the gate. Fix the failure (or, for a flaky
      infrastructure issue, re-run the workflow) — do not disable checks or
      force-merge around a failing release gate.
- [ ] If the gate reveals a defect only visible at full-project scope
      (e.g. a lint or type-check failure outside the PR's changed files),
      treat it as a release blocker and fix it before promoting.

## Direct-main repair steps

- [ ] For a published stable defect, branch from `main` as `hotfix/<name>` and
      bump the version (PATCH unless the fix requires more).
- [ ] For an unpublished current-main release candidate, branch as
      `release-repair/<name>`; keep the same version only while its matching
      tag does not exist.
- [ ] Follow the same PR-into-`main` and after-merge steps above.
- [ ] When the repair commit is not already in `develop`, open the documented
      `main` -> `develop` sync-back PR in the same release cycle and merge it
      with a merge commit.
