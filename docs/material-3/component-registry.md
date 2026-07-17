# Material component registry

This registry is a compact program index. It does not duplicate family implementation documentation or audit findings.

## Fact ownership

- Migrated or actively migrated family state lives in its colocated `README.md`.
- The latest independent family review lives in its colocated `AUDIT.md`.
- This file owns only the official-family mapping, current program status, and navigation pointer.
- Historical pre-pilot detail may remain in `component-family-audit.md` but is not current implementation authority.

## Status values

- `missing` — no implementation exists.
- `legacy` — implementation exists outside the canonical Material library and has not started migration.
- `active` — implementation or alignment is currently in progress; read the local README/AUDIT.
- `aligned` — canonical implementation has a truthful README, compliant audit, required verification, and accepted visual review when applicable.
- `project-specific` — not an official Material component family.
- `deprecated` — compatibility-only surface awaiting removal.
- `blocked` — required official evidence or a named dependency prevents progress.

## Official component families

| Official family         | Current Mioframe surface                         | Status    | Current state owner                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons                 | `MDButton`                                       | `active`  | [`src/shared/ui/material/components/buttons/README.md`](../../src/shared/ui/material/components/buttons/README.md) and [`AUDIT.md`](../../src/shared/ui/material/components/buttons/AUDIT.md) |
| Icon buttons            | `MDIconButton`                                   | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Floating action buttons | `MDFab`, `MDExtendedFab`                         | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Button groups           | none                                             | `missing` | future family documentation when a consumer requires it                                                                                                                                       |
| Lists                   | `MDList`, `MDListItem`, `MDListSelectionItem`    | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Dialogs                 | shared Dialog surfaces                           | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Text fields             | `MDTextField`, `MDFieldContainer`                | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Checkbox                | `MDCheckbox`, `MDCheckboxField`                  | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Switch                  | `MDSwitch`                                       | `legacy`  | planned independent stateful pilot after Buttons                                                                                                                                              |
| Chips                   | `MDChipBase` and wrappers                        | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Menus                   | `MDMenuBase`, `MDMenuItemBase`, related surfaces | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Bottom sheets           | `MDBottomSheet*`                                 | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Cards                   | `MDCard`                                         | `legacy`  | previously aligned implementation remains outside the canonical library until migrated and locally documented                                                                                 |
| Progress indicators     | shared circular/linear surfaces                  | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Tooltips                | `MDPlainTooltip` and related tooltip surfaces    | `legacy`  | official-family mapping must be resolved during migration; project-specific tooltip surfaces remain outside                                                                                   |
| Snackbar                | `MDSnackbar`                                     | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Navigation bar          | `MDNavigationBar`                                | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Navigation rail         | `MDNavigationRail`                               | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Navigation drawer       | `MDNavigationDrawer`                             | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Tabs                    | `MDTabs` and tab surfaces                        | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Top app bars            | `MDTopAppBar`, `MDAppBar`                        | `legacy`  | exact official-family ownership resolved during migration                                                                                                                                     |
| Sliders                 | slider surfaces                                  | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Search                  | search surfaces                                  | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Dividers                | divider surfaces                                 | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Badges                  | badge surfaces                                   | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |
| Segmented buttons       | segmented-button surfaces                        | `legacy`  | current legacy implementation until migration starts                                                                                                                                          |

## Project-specific surfaces

Project-specific compositions and helpers do not become official component families merely because they use Material components or styles. Their classification remains in `ui-library-inventory.md`.

Examples include placement containers, product toolbars, workflow-specific rows, and compositions not represented by an official Material component page.

## Update rule

When a family migration starts:

1. resolve its official documentation slug;
2. create the canonical family directory and README;
3. set the registry row to `active` and link the local documentation;
4. keep detailed implemented, unsupported, incomplete, and audit state out of this registry;
5. set `aligned` only after the family-local completion gates pass.

Do not use this registry as proof that an implementation is correct.
