# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `missing`

Status: `required dependency for MDButton`

## Why this adapter is required

Loading indicator is a separate official Material 3 Expressive component with its own overview, specs, guidelines, accessibility, tokens, geometry, and motion contract.

`MDButton` currently renders `m3e-loading-indicator` directly. That bypasses the canonical Material Vue boundary and incorrectly makes Button own Loading indicator renderer typing, accessibility, sizing, private CSS inputs, divergences, and motion.

Required ownership:

```text
MDButton.loading
  → MDLoadingIndicator
      → @m3e/web/loading-indicator
```

`MDButton` owns the documented loading composition state and placement. `MDLoadingIndicator` owns the Loading indicator component contract and private renderer integration.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Related composition source:

- Button placement guidance in `/components/loading-indicator/guidelines`;
- Button icon geometry and color context from `/components/buttons/specs` and `/components/buttons/guidelines`.

Renderer package:

- `@m3e/web@^2.6.2`, resolved `2.6.2`;
- entry point `@m3e/web/loading-indicator`;
- exported `M3eLoadingIndicatorElement` and `LoadingIndicatorVariant` must be the private renderer type sources.

## Confirmed official Material facts

- Loading indicator represents an ongoing process and is never decorative.
- It is intended for short indeterminate loading, generally under five seconds.
- It must not be used for a process that transitions from indeterminate to determinate.
- It has default/uncontained and contained configurations.
- It can scale in size.
- The default token set specifies an active indicator size of 38dp and a 48dp container width/height.
- The active indicator needs at least 3:1 contrast against its background or containing component.
- It uses progressbar accessibility semantics and needs an accessible label describing what is loading.
- It may be placed inside a Button.

## Current demand

Current direct product demand is only the Button composition:

- indeterminate boolean loading state;
- short actions;
- uncontained presentation in the Button leading-icon position;
- accessible purpose derived from or supplied by the parent action;
- size normalized to the current Button icon geometry;
- active indicator color inherited from the rendered Button label/icon color;
- loading presentation compatible with disabled and selected Button states.

No standalone product consumer currently requires contained presentation. Contained configuration may remain deferred unless needed for a coherent selected API.

## Preliminary Material–m3e–Vue matrix

The implementation pass must replace unresolved rows with exact source-backed decisions before production edits.

| Material contract and exact source                                                     | Required now and evidence                              | Public Vue direction                                                                                    | m3e 2.6.2 evidence                                                                                                                 | Owner and decision                                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Loading indicator component identity (`loading-indicator/overview`)                    | yes — required by Button composition                   | canonical `MDLoadingIndicator` component and public export                                              | `m3e-loading-indicator`                                                                                                            | `implement-now`                                                                                      |
| Default/uncontained configuration (`loading-indicator/specs`)                          | yes — Button composition                               | demand-scoped default contract; exact prop surface must not mirror renderer terminology automatically   | renderer default `uncontained`                                                                                                     | `implement-now`                                                                                      |
| Contained configuration (`loading-indicator/specs`)                                    | no current consumer                                    | none yet                                                                                                | renderer `contained` variant                                                                                                       | `defer`                                                                                              |
| Ongoing short indeterminate process (`loading-indicator/overview`)                     | yes                                                    | component exists only while loading is active; no determinate progress API                              | renderer is indeterminate                                                                                                          | `implement-now`                                                                                      |
| Accessible purpose label and progressbar semantics (`loading-indicator/accessibility`) | yes                                                    | explicit Material/Vue accessible-label contract; exact prop naming must be source-backed and documented | renderer supplies `progressbar` role but no useful accessible name                                                                 | wrapper correction required                                                                          |
| Active-indicator contrast in another component (`loading-indicator/accessibility`)     | yes — Button composition                               | public inherited-color or official token boundary                                                       | renderer exposes active-indicator color CSS input                                                                                  | implement through `MDLoadingIndicator`; parent must not set private m3e CSS variables                |
| Scalable size (`loading-indicator/overview`, specs)                                    | yes — Button icon geometry varies by size              | exact public sizing/token contract must be resolved before code                                         | renderer default geometry does not automatically match Button icon sizes                                                           | wrapper correction or m3e fix after exact comparison                                                 |
| Official component tokens (`loading-indicator/specs`)                                  | selected subset required for Button color/size handoff | expose verified `--md-comp-loading-indicator-*` subset only                                             | renderer has `--m3e-loading-indicator-*` inputs                                                                                    | typed/token mapping owned only by `MDLoadingIndicator`                                               |
| Renderer size CSS input                                                                | yes — required for geometry mapping                    | private implementation only                                                                             | element docs name `--m3e-loading-indicator-active-indicator-size`; 2.6.2 token implementation reads `--m3e-loading-indicator-size` | confirmed renderer documentation/implementation divergence; record exact owner before use            |
| Renderer motion and reduced-motion behavior                                            | yes — visible ongoing animation                        | no public animation controls unless Material requires them                                              | 2.6.2 uses infinite shape/rotation animation; reduced-motion path has not been found                                               | exact source assessment and operator review required; assign m3e fix if required behavior is missing |

## Expected public boundary

The final `MDLoadingIndicator` must:

- be a canonical exported Vue component under `src/shared/ui/material/components/loading-indicator`;
- expose only the demand-scoped official Material API;
- require or otherwise guarantee a useful accessible purpose label;
- keep `M3eLoadingIndicatorElement`, `LoadingIndicatorVariant`, raw `m3e-loading-indicator`, and private `--m3e-*` inputs internal;
- expose only selected verified Material component tokens needed by current composition;
- own geometry normalization and renderer divergences;
- own its stories, tests, visual baselines, accessibility proof, and motion assessment.

The exact Vue representation of scalable size must be resolved in the accepted matrix before implementation. Do not copy the renderer CSS variable name into public API and do not use an undocumented renderer variable silently.

## MDButton composition contract

After `MDLoadingIndicator` is accepted, `MDButton` may keep a demand-driven `loading?: boolean` composition prop because Button placement is documented by Material.

`MDButton` must:

- render `MDLoadingIndicator`, not raw m3e;
- provide or derive the accessible loading purpose through the dependency public API;
- hand off Button icon size through the accepted public sizing/token boundary;
- hand off rendered label/icon color through inheritance or official public Material token mapping;
- define loading precedence over both normal and selected icon routes;
- preserve Button label and normal native event behavior;
- cover disabled plus loading and selected plus loading.

## Required verification

`MDLoadingIndicator` requires:

- package-derived type-check using exported renderer types;
- colocated component-contract tests for selected public API, accessible label, renderer mapping, and official token mapping;
- browser accessibility proof for role, name, and active loading semantics;
- visual proof for default presentation, Button-size integrations, inherited color, disabled Button composition, and contrast-relevant states;
- exact-version source assessment for motion, disconnection/reconnection, forced colors, and reduced motion;
- operator motion and visual review;
- final repository verification.

The parent Button composition separately requires proof that it renders `MDLoadingIndicator` and hands off state, accessibility, size, color, selected/disabled behavior, and icon restoration correctly.

## Completion gate

`MDLoadingIndicator` may become `migrated` only when:

- its full source-backed matrix is accepted;
- the demand-scoped Material Vue API is resolved;
- accessibility labeling and progress semantics are correct;
- official size/color token ownership and Button integration are correct;
- m3e 2.6.2 divergences are recorded and assigned;
- exact package-derived typing is used;
- stories, focused tests, browser accessibility proof, visual baselines, final verification, and operator review pass.

Until then, `MDButton` remains `migrating` and must not be approved with raw `m3e-loading-indicator` embedded inside it.
