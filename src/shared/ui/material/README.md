# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material 3 Expressive implementation.

Its navigation mirrors the official Material documentation:

```text
material/
  foundations/
  styles/
  components/
```

This is a navigation and ownership map, not a reason to create empty production layers.

## Navigation

### [Foundations](./foundations/README.md)

Cross-component contracts corresponding to the official Foundations navigation, such as accessibility, adaptive/layout, and interaction foundations.

### [Styles](./styles/README.md)

Cross-component visual systems corresponding to the official Styles navigation: color, elevation, icons, motion, shape, and typography.

### [Components](./components/README.md)

Official public component families. Family directories use the official documentation slug.

Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

Project-specific compositions, screens, workflows, and generic platform infrastructure remain outside this library.

## Family layout

```text
components/<official-docs-slug>/
  README.md
  AUDIT.md
  index.ts
  <Component>.vue
  <Component>.test.ts
  <Component>.stories.ts
  ... only justified files
```

- `README.md` documents current implementation, omissions, incomplete/unverified capability, deviations, operator feedback, and visual status.
- `AUDIT.md` contains the latest independent review and is maintained by `material-component-review`.
- Production code, tests, and stories live beside both documents.

The implementing agent updates `README.md` but does not edit `AUDIT.md`. Any material implementation change sets the documented review status to `review required after changes`.

No separate visual report file is required. The operator reports visible problems or acceptance directly in the user message; authoring persists the result in README.

## Operator feedback

A message may combine the command and concrete observations:

```text
material-component Button

Operator feedback:
- release animation feels too slow;
- the corner shape visibly lags behind pointer release.
```

README records:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

- A reported visual defect means `rejected`.
- After production behavior changes, authoring may set `awaiting re-review`.
- Only an explicit user acceptance message may set `accepted`.

## Public API

Product code uses the curated root entry point:

```ts
import { MDButton } from '@shared/ui/material';
```

Internal implementation, stories, tests, documentation, and audit files are not public API.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → project-specific shared UI and product layers
```

- foundations and styles do not import component families;
- families do not deep-import another family's private files;
- Material code does not import product layers;
- generic infrastructure does not contain component-family knowledge.

## New component work

1. Resolve the official Material documentation path and family.
2. Create or update `components/<official-docs-slug>/README.md`.
3. Persist explicit operator feedback from the current task.
4. Implement the minimum complete surface required by current consumers.
5. Record official capability left unimplemented.
6. Record every known defect, provisional implementation, missing verification, and required follow-up.
7. Add proportional tests and a canonical visual story.
8. Migrate consumers and remove obsolete ownership when applicable.
9. Run `material-component-review <family>` to create or replace the colocated `AUDIT.md`.
10. Obtain explicit operator acceptance when visual review is required.

Do not hide unfinished work to obtain a successful status.

## Current physical state

| Area                                   | Current owner                                                    | Canonical owner                                  | State                                                   |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Button family                          | `material/components/buttons` after this PR's path normalization | `material/components/buttons`                    | active migration; see family `README.md` and `AUDIT.md` |
| Other existing official `MD*` families | existing `src/shared/ui/<LegacyFamily>` directories              | `material/components/<official-docs-slug>`       | legacy until migrated                                   |
| Color/theme tokens                     | `src/shared/lib/md/tokens.css`                                   | `material/styles/color` when migrated            | legacy                                                  |
| Elevation                              | `src/shared/lib/md/tokens.css`                                   | `material/styles/elevation` when migrated        | legacy                                                  |
| Motion                                 | `src/shared/lib/md/tokens.css`                                   | `material/styles/motion` when migrated           | legacy                                                  |
| Shape                                  | current token/style owners                                       | `material/styles/shape` when migrated            | legacy                                                  |
| Typography                             | `src/shared/lib/md`                                              | `material/styles/typography` when migrated       | legacy                                                  |
| Material Symbols                       | `src/shared/ui/Icon`                                             | `material/styles/icons` when migrated            | legacy                                                  |
| State layer, ripple, focus             | `src/shared/ui/State`                                            | `material/foundations/interaction` when migrated | legacy                                                  |

The family documentation is the detailed state owner. This table remains a compact navigation aid and must not duplicate every finding.

## Anti-overengineering

Do not create placeholder implementation folders, fixed file profiles, runtime registries, broad wrappers, separate visual report files, or a second metadata system. The official-documentation hierarchy exists to make the library easy to navigate and review.
