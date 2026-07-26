# Button adapter contract

Material component: Button

Migration target: current `MDButton`

Implementation ownership: `migrating`

Canonical implementation candidate: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The current m3e-backed component is reusable implementation work, but its public API is not yet accepted.

The final API must be derived from official Material Button documentation. Legacy Mioframe names and m3e names are evidence only. Current props, values, slots, defaults, and extensions remain provisional until the matrix below assigns each one an official Material source or a separate non-Material decision.

Do not restore the legacy renderer.

## Sources

Official Material:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`;
- cache snapshot `2026-07-20T16:16:49.323Z`.

Renderer:

- `@m3e/web@^2.6.2`, resolved `2.6.2`;
- `@m3e/web/button`;
- `M3eButtonElement`, `ButtonShape`, `ButtonSize`, `ButtonVariant`.

## Current product needs

Consumers currently need activation, disabled behavior, button/submit/reset integration, accessible label content, icon content, multiple styles and sizes, shape and selected scenarios, focus, expanded target behavior, and an asynchronous/loading presentation.

These needs select the required Material subset. They do not define public terminology and do not prove that loading belongs inside Material Button.

## Required Material–m3e–Vue matrix

The next adapter pass must replace this provisional matrix with exact source-backed rows.

| Material area | Required now | Public Vue API | m3e 2.6.2 | Owner and decision |
| --- | --- | --- | --- | --- |
| official Button naming and taxonomy | yes | pending Material terminology | private renderer vocabulary | Vue adapter, implement now |
| documented styles or variants | yes | pending exact Material names and defaults | typed renderer variants | direct m3e mapping |
| documented sizes | yes | pending exact Material names and defaults | typed renderer sizes | direct m3e mapping |
| documented shapes, configurations, and selected states | yes | pending official classification | shape, toggle, selected APIs | Vue normalization plus m3e |
| official label and icon content roles | yes | pending Material-oriented slots | renderer slots | Vue slot mapping plus m3e |
| native action semantics | yes | Vue/native mapping | button, submit, reset, link APIs | Vue plus browser/m3e |
| disabled, focus, target, and interaction behavior | yes | only Material-configurable public options | mainly renderer-owned | m3e; wrapper only for public mapping |
| asynchronous/loading presentation | consumer need; Material source not established | unresolved | current wrapper extension | decide composition, separate non-MD component, approved extension, or migration |
| other official Button capabilities | not yet required | deferred | some are available | defer unless needed for coherent API |
| official component tokens | not currently required | deferred selected subset | private CSS inputs | expose only when selected |

## Public API rules

- Use official Material terminology, values, defaults, combinations, behavior, and accessibility semantics.
- Implement only the subset required now, but keep it compatible with later Material expansion.
- Do not expose raw m3e vocabulary or types.
- Do not preserve legacy names when they conflict with Material.
- Do not keep a non-Material capability in `MDButton` without an explicit architecture decision.
- Public types come from the Material contract; private mapper outputs must satisfy m3e package types.

## Ownership

Use m3e directly for selected Material behavior it implements correctly.

The Vue adapter owns Material-to-Vue normalization, typed mapping, slots, events, controlled state, native integration, and narrow light-DOM composition.

Renderer geometry, private DOM, accessibility internals, state layer, ripple, focus treatment, elevation, and motion belong to m3e. Missing behavior in those areas requires an m3e fix, not a parallel Vue renderer.

## Existing implementation evidence

Reusable after contract normalization:

- private m3e registration and rendering;
- package-derived renderer typing;
- native and controlled-state integration;
- migrated consumers;
- focused tests, stories, and motion source inspection.

Passing tests do not accept provisional public API.

## Remaining M1 work

1. complete and accept the exact Material–m3e–Vue matrix;
2. define the demand-driven official Material Vue API;
3. classify every current public capability as Material, Vue/native adaptation, deferred, or non-Material;
4. resolve loading separately;
5. normalize implementation, consumers, tests, and stories;
6. route Material gaps to wrapper correction or m3e fix;
7. run verification and operator visual/motion review.

## Completion gate

M1 completes when every public `MDButton` capability has an official Material source or an explicitly approved extension decision, selected Material behavior is implemented by the correct owner, deferred surface and divergences are recorded, consumers use the accepted API, verification passes, and the operator accepts the result.