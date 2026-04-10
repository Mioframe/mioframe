# src/features

Inherits the rules from the root `AGENTS.md`. Applies to `src/features` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- value-editing flows such as `stringValueEdit`, `numberValueEdit`, `dateValueEdit`, `booleanValueEdit`, `relationValueEdit`.
- database-oriented flows such as `databaseFilterEdit`, `databaseItemEdit`, `databaseItemSorting`, `databasePropertyCreate`, `databasePropertyEdit`, `databasePropertyRemove`, `databaseViewCreate`, `databaseViewRename`, `databaseViewMapEdit`.
- file and document actions such as `documentCreate`, `documentRename`, `documentRemove`, `directoryCreate`, `entryRename`, `entryRemove`, `importDocument`, `exportDocument`.
- platform and integration flows such as `googleSessionAdd`, `googleSessionManage`, `googleDriveRecovery`, `localDirectoryPick`, `permanentStorageRequest`.

## Patterns

- A feature owns a complete user action: a dialog, form, button flow, or mutation orchestration path.
- A feature may be expressed as a UI component, a `use*` composable, or a small pair of both when that keeps action logic reusable and the UI surface thin.
- Feature UI should stay action-focused: buttons, menu controls, dialogs, forms, sheets, and other interactive surfaces are appropriate here, but not combined display-plus-entity wrappers that belong to widgets or pages.
- Build features on top of `entities` and `shared`; do not reimplement their domain contracts.
- Expose a clear public API through `index.ts` when the feature is imported from elsewhere.
- Dialogs and forms should handle loading, cancel, reset, and error states explicitly.
- Keep features focused on actions and orchestration; if a module mostly derives state for display, move that logic to `entities`.
- Keep feature actions callable from composition layers; do not hide them inside entity UI when a slot or explicit binding keeps the layering clearer.
- When a user can click, submit, revoke, delete, retry, confirm, or trigger feedback, that interaction flow belongs in a feature wrapper even if the visible row or card is an entity component.
- Feature component contracts should still stay narrow. Compose entity data, service access, and mutation handlers inside the feature instead of exporting that complexity through deeply nested props.
- Feature `use*` composable contracts should still stay narrow. Keep orchestration inside the feature and expose focused IDs, payloads, and explicit options instead of mixed service bundles or generic configuration records.
- Name public methods returned from feature `use*` composables after the user action in the system, such as `addAccount`, `deleteSession`, or `submitForm`. Reserve the `on*` prefix for UI event handlers and callback bindings inside components.

## Anti-patterns

- Do not import deep internals from other features unless there is a clear shared public API.
- Do not pull widget composition into features when entity/shared APIs are sufficient.
- Do not merge entity presentation with feature actions into one row or card component inside `features`; compose display and actions together in `widgets` or `pages`.
- Do not place generic UI primitives or low-level helpers here.
- Do not duplicate entity or service logic just to simplify one form.

## Constraints

- A feature should remain a replaceable composition unit, not hidden global state.
- Mutation-heavy flows must be checked for reopen/reset behavior and submit success/error states.
- Use `index.ts` as the external entry point when present.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected user flow.
