# Review

Verdict: blocked

## Scope reviewed

- Directory entity ownership/removal after PR #215 moves reactive directory lifecycle into `shared/service/fileSystem`, including owner instructions and obsolete barrel cleanup.

## Blockers

None.

## Major issues

### M1 — Directory entity ownership cleanup is incomplete

Owner: `src/entities/directory`

Problem: PR #215 removes `useDirectory` because reactive directory lifecycle is now owned by `shared/service/fileSystem`, but the directory entity's binding `AGENTS.md` still describes this directory as containing and owning reactive directory listing state. The obsolete barrel was also reduced to an empty `index.ts` instead of being removed as required by the implementation preflight.

Evidence:

- [AGENTS.md](./AGENTS.md) — still states that this owner contains “Reactive directory listing state” and instructs agents to treat directory contents as live filesystem state here.
- [index.ts](./index.ts) — is an empty obsolete barrel after the `useDirectory` export was removed.
- [directory-state-reactivity-implementation-preflight.md](../../../docs/directory-state-reactivity-implementation-preflight.md) — explicitly requires removal of dead `entities/directory/useDirectory.ts` and its obsolete barrel export/file while preserving `DirectoryContentEntry.vue`.

Basis:

- [directory-state-reactivity.md](../../../docs/directory-state-reactivity.md) — assigns canonical reactive directory lifecycle/order to `shared/service/fileSystem`; `entities/directory` is not a lifecycle owner in the accepted design.
- [project-review](../../../.agents/skills/project-review/SKILL.md) — review must check documentation affected by the change and complete removal of obsolete/replaced logic; stale ownership/contracts are material maintenance findings.

Risk: The repository's own binding instructions direct future work back toward an ownership model this PR intentionally removes, increasing the risk of architectural drift and duplicate lifecycle logic. Keeping an empty obsolete barrel also leaves a misleading dead public entry point contrary to the approved cleanup.

Required final state: `src/entities/directory` instructions accurately describe only responsibilities that remain after this refactor and do not claim reactive directory lifecycle ownership; the obsolete empty barrel is removed if no current consumer requires it; retained directory-entry UI remains unchanged.

Verification: Confirm no current production/test import requires the empty barrel, run instruction-compatibility/static verification for the updated repository instruction, and focused type-check for the removal.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Redesign or removal of retained `DirectoryContentEntry.vue` is not part of this PR.

## Unresolved questions

None.
