# Review

Verdict: blocked

## Scope reviewed

- PR #211 repository-wide configuration changes introduced by the final recovery correction.

## Blockers

None.

## Major issues

### M1 — PR weakens the global Oxlint rule to accommodate test-only sentinel fields

Owner: repository tooling/configuration

Problem: the final correction adds repository-wide `eslint/no-underscore-dangle` allow-list entries for `__isDomainError`, `__sameEntryKey`, and `__writtenContent`. This changes lint policy for every source file even though the new need is confined to test helpers and the correction task explicitly forbade weakening verifier/lint configuration.

Evidence:

- [.oxlintrc.json](.oxlintrc.json) adds global allow-list entries under `eslint/no-underscore-dangle`.
- [WebFileSystemProvider test utilities](src/shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils.ts) use `__sameEntryKey`/`__writtenContent` as test-only mock fields, which is the local source of the newly allowed names.

Basis:

- [Root repository rules](AGENTS.md) require preserving verifier checks and prohibit weakening existing checks to make a correction pass.
- The current correction contract forbids weakening existing tests or verifier configuration; PR #211 does not require a repository-wide lint-policy change.

Risk: unrelated production/test code can now introduce these underscore-prefixed properties without the previous warning, expanding project-wide lint policy for a feature-local test implementation detail and creating unnecessary configuration drift.

Required final state: restore `.oxlintrc.json` to its pre-PR rule configuration. Make the affected test/helper code comply with the existing lint rule using the narrowest local solution consistent with repository conventions; do not add another repository-wide exception.

Verification: final `pnpm verify` passes with no new global lint-rule relaxation and the reconnect/test contracts remain green.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The agent-reported `/dev/null` mounts for `.env.example`, `.gitconfig`, and `.gitmodules` are not present as PR content: `.env.example` is intact on the GitHub head and `.gitconfig`/`.gitmodules` are not tracked there. Any verifier/container workspace artifact is separate from PR #211 unless reproduced in repository tooling.

## Unresolved questions

None.
