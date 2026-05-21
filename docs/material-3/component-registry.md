# Material 3 component registry

## Principle

The shared UI kit must be tracked as a registry that maps official Material 3 surfaces to project components, Storybook pages, tokens, verification, and deviations.

Do not migrate components only by local inspection. Use the registry to keep the UI kit coherent and to avoid duplicating or partially reimplementing the same Material surface in multiple places.

## Registry table

Maintain the registry as the source of planning truth for Material component conversion.

| Material surface | Project component | Status | Material docs | Tokens | API | Storybook | Visual tests | Deviations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Buttons | `MDButton` | partial | `components/buttons/*` | partial | partial | missing/partial | missing/partial | TBD |
| Icon buttons | `MDIconButton` | partial | `components/icon-buttons/*` | partial | partial | missing/partial | missing/partial | TBD |
| FAB | `MDFab` | partial | `components/floating-action-button/*` | partial | partial | partial | partial | TBD |
| Lists | `MDList`, `MDListItem` | partial | `components/lists/*` | partial | partial | missing | missing | TBD |
| Dialogs | `MDDialog` | partial | `components/dialogs/*` | partial | partial | missing | missing | TBD |

This initial table is intentionally incomplete. The foundation audit must expand it before broad component conversion.

## Status values

Use these status values consistently:

- `missing`: no project component exists;
- `partial`: project component exists but is not fully aligned or verified;
- `aligned`: component has docs-backed API, tokens, Storybook, verification, and documented deviations;
- `project-specific`: component is not an official Material component but uses Material foundations;
- `deprecated`: component remains only as a compatibility surface;
- `blocked`: Material guidance is missing, conflicting, or unavailable.

## Required fields

Each registry row should answer:

1. Which official Material surface does this correspond to?
2. Which project component or components implement it?
3. Which Material pages were checked?
4. Which public tokens are supported?
5. Which public props are supported?
6. Which Storybook page documents it?
7. Which visual or browser checks cover it?
8. Which deviations or unsupported official features exist?

## Usage

Before starting a component family conversion:

1. update or add the registry row;
2. identify the Material docs to check;
3. identify existing project components and deprecated aliases;
4. decide whether the component is official Material-aligned or project-specific;
5. define the verification target.

A component family is not done until the registry row can be marked `aligned` or its remaining gaps are explicitly documented.
