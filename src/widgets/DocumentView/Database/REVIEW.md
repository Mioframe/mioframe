# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database widget composition after the inline-edit feature extraction.
- `EditableInlineValue` resolving-state interaction contract and focused component proof.
- `DatabaseToolbar` controlled configuration contract and focused component proof.
- Exact-head mutation verification for the touched widget components.

## Blockers

### B1 — Touched Database widget contracts are below the required mutation-proof threshold

Owner: `src/widgets/DocumentView/Database`

Problem: the semantic correction is implemented correctly, but the focused component tests prove only the newly corrected paths. Exact-head mutation verification mutates the complete touched `DatabaseToolbar.vue` and `EditableInlineValue.vue` files and still leaves enough observable component behavior unproved that the required mutation gate fails. The current mutation scores are 40.00% for `DatabaseToolbar.vue` and 14.81% for `EditableInlineValue.vue`; the aggregate changed-source score is 32.84% against the repository breaking threshold of 60%.

Evidence:

- [`DatabaseToolbar.test.ts`](./DatabaseToolbar.test.ts) — proves controlled configuration request/open/close behavior, but does not exercise several existing toolbar branches now included in the touched-file mutation scope, including add-item lifecycle and property-presence behavior.
- [`EditableInlineValue.test.ts`](./EditableInlineValue.test.ts) — correctly proves target detachment/recovery for a resolving session, but leaves other public inline-value states and actions in the touched component unproved under mutation.
- [`DatabaseToolbar.vue`](./DatabaseToolbar.vue) and [`EditableInlineValue.vue`](./EditableInlineValue.vue) — both are current mutation targets because this PR changed them.
- [`../../../../stryker.config.mjs`](../../../../stryker.config.mjs) — mutation verification has `thresholds.break: 60`.
- [Exact-head verify run](https://github.com/Mioframe/mioframe/actions/runs/32644171094) — `verification-static` fails only at `Verify mutation`; format, oxlint, eslint, type-check, and unit tests pass. The mutation report records 32.84% overall, 40.00% for `DatabaseToolbar.vue`, and 14.81% for `EditableInlineValue.vue`.

Basis:

- [`../../../../.agents/skills/project-review/SKILL.md`](../../../../.agents/skills/project-review/SKILL.md) — required mutation proof cannot be replaced by green unit tests or other checks.
- [`../../../../stryker.config.mjs`](../../../../stryker.config.mjs) — the repository-defined breaking threshold is 60% and must not be weakened for the PR.

Risk: observable Database toolbar/inline-value behavior can regress while the current focused tests remain green, and exact-head verification cannot pass. Treating the failed gate as incidental would bypass a repository-required proof specifically triggered by the production files changed in this correction.

Required final state: add focused component-contract coverage for the meaningful public behavior of the two touched components until the normal verifier-managed mutation run passes the existing threshold. Preserve the current production architecture and behavior; do not alter production logic, mutation configuration, thresholds, exclusions, or verifier scope merely to improve the score.

Verification: run the focused unit tests while developing, then `pnpm verify --only mutation` through the normal verifier-managed path. The exact-head GitHub verification must subsequently pass without threshold/configuration weakening.

## Major issues

None.

## Minor issues

### m1 — `EditableInlineValue` still describes the lifted session as widget-owned

Owner: `src/widgets/DocumentView/Database`

Problem: the `onBeforeUnmount` comment still says the session is `widget-owned`, although the session is now owned by `features/databaseInlineValueEdit`.

Evidence:

- [`EditableInlineValue.vue`](./EditableInlineValue.vue) — the virtual-unmount comment still says `widget-owned session`.
- [`../../../../docs/database-virtualization.md`](../../../../docs/database-virtualization.md) — canonical ownership assigns the active inline-edit session to `features/databaseInlineValueEdit`.

Basis:

- [`AGENTS.md`](./AGENTS.md) — this directory is Database UI composition, not the user-action/domain owner.

Risk: the stale ownership comment contradicts the current architecture and can mislead later maintenance back toward widget-owned session state.

Required final state: make the comment ownership-neutral or identify the session as feature-owned; no behavior change.

Verification: source review/type-check is sufficient.

## Accepted risks

None.

## Items not required

- The pre-existing `RelationValueFieldData.onSelect` function prop remains outside PR #217.
- The pre-existing direct item-removal entity mutation in `DatabaseViewWidget` remains separate FSD debt.
- The pre-existing duplicate Database read subscriptions remain separate cleanup.
- Historical `props.class` / `props.inputSize` usage in `DatabasePropertyValueField.vue` is unrelated to this correction.

## Unresolved questions

None.
