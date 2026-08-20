# Review

Verdict: blocked

## Scope reviewed

- PR #211 repository-wide configuration changes introduced by the final recovery correction.

## Blockers

None.

## Major issues

### M1 — PR changes global Oxlint policy for a test-local implementation detail

Owner: repository tooling/configuration

Problem: the final correction adds repository-wide `eslint/no-underscore-dangle` allow-list entries for `__isDomainError`, `__sameEntryKey`, and `__writtenContent`. The recovery feature does not require a global lint-policy change; the newly allowed names are used only by test/helper implementation details.

Evidence:

- [.oxlintrc.json](.oxlintrc.json) adds global allow-list entries under `eslint/no-underscore-dangle`.
- [WebFileSystemProvider test utilities](src/shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils.ts) use `__sameEntryKey`/`__writtenContent` as test-only mock fields, which is the local source of the newly allowed names.

Basis:

- [Root repository rules](AGENTS.md) require task scope to stay task-relevant, prefer the minimum complete design, and require verifier/fix-only changes to be inspected rather than retained implicitly.
- [Local-directory recovery handoff](docs/local-directory-access-recovery.md) defines the required recovery state/API/ownership changes and does not require repository-wide lint-policy changes.

Risk: unrelated production/test code can now introduce these underscore-prefixed properties without the previous warning, expanding project-wide policy for a feature-local test detail and creating unnecessary configuration drift.

Required final state: restore `.oxlintrc.json` to its pre-PR rule configuration. Make affected test/helper code comply with the existing lint rule using the narrowest local solution consistent with repository conventions; do not add another repository-wide exception.

Verification: final `pnpm verify` passes with no new global lint-rule relaxation and the reconnect/test contracts remain green.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The agent-reported `/dev/null` mounts for `.env.example`, `.gitconfig`, and `.gitmodules` are not present as PR content: `.env.example` is intact on the GitHub head and `.gitconfig`/`.gitmodules` are not tracked there. Any verifier/container workspace artifact is separate from PR #211 unless reproduced in repository tooling.

## Unresolved questions

None.
