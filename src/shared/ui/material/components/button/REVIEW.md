# Button review

Reviewed workspace state: current Button design, architecture, runtime, tokens, consumer migration, proof, and stage artifacts inspected on 2026-07-30  
DESIGN.md status: `current`  
ARCHITECTURE.md status: `ready`  
IMPLEMENTATION.md status: `complete`, correction required  
MIGRATION.md status: `complete`, correction required  
Operator visual status: required  
Verdict: blocked

## Goal and scenarios reviewed

The independent worker reviewed the complete demand-scoped Button family: filled, outlined, and text actions; extra-small and small sizes; required label and optional leading icon; native button/submit behavior; disabled behavior; loading composition; target geometry; keyboard, pointer, focus, press, and reduced-motion behavior; contextual text tokens; Snackbar action integration; and current product consumers.

The architect follow-up reviewed the observable workspace result rather than accepting the stage report as authority. The accepted official design, selected API, dependency boundary, seven-token contextual contract, runtime mappings, Snackbar overrides, and consumer inventory remain valid.

## Official design compliance

`DESIGN.md` records all four official Button tabs and the complete associated Button token resource. It separates official facts from renderer and product demand and documents the newest successfully acquired complete snapshot. No design correction is required by the current findings.

## Architecture compliance

`ARCHITECTURE.md` selects the narrowest complete current surface, keeps the single renderer host as the interaction and native-semantics owner, and rejects speculative renderer surface and wrapper-owned interaction state.

The seven contextual text tokens are demand-backed by Snackbar and use official Material paths. Loading remains presentation-only and composes the independently owned Loading Indicator without moving pending, disabled, or re-entry ownership into Button.

No architecture correction is required.

## Implementation compliance

The Button runtime and token correction are accepted:

- the public Vue API remains limited to the selected contract;
- the seven official contextual text tokens replace the provisional five-token surface;
- old `hover`/`focus` names, the unconsumed icon token, and compatibility aliases are absent;
- private renderer mappings remain inside the family;
- rendered label color is covered in resting, hovered, focused, and pressed states;
- Button loading composition remains decorative, busy, 24 px, `currentColor`, and independent from activation blocking.

One implementation-owned test-boundary correction remains: visual specs still assert `toBeFocused()`. Focus behavior already belongs to Storybook behavior proof. Visual specs must only establish deterministic focus state and capture the screenshot.

## Migration and legacy removal

Snackbar correctly supplies inverse-primary through all seven selected contextual Button tokens. Existing product consumers remain on the canonical root export, and renderer vocabulary does not leak outside the Material boundary.

One migration-owned cleanup remains: `MDAppBar.__trailing-elements` still declares ineffective legacy `--md-content-color` without an accepted Button or contextual-color contract. Remove that declaration; do not replace it with a generic descendant color bridge.

## Documentation consistency

`docs/token-api.md` is the populated supported catalogue and records the accepted seven Button tokens and Loading Indicator token without provisional lifecycle claims. `docs/roadmap.md` routes the next invocation to Button implementation correction.

Downstream stage records must be refreshed after the two file corrections and final project verification.

## Proof and verification

The implementation and migration records contain successful automated proof from before the two follow-up findings. The required project verification must be rerun after the resulting workspace corrections.

Automated proof does not substitute for operator assessment of appearance and renderer-owned motion.

## Blockers

1. Remove behavior assertions from Button visual specs while preserving focus assertions in behavior tests.
2. Remove the ineffective AppBar trailing-elements `--md-content-color` declaration.
3. Pass the required project verification after those corrections.
4. Record operator visual/motion acceptance for Button, standalone and Button-composed Loading Indicator, Snackbar contextual states, and the other affected color-ownership surfaces.

## Major issues

None.

## Minor issues

1. Visual and behavior proof ownership is mixed by `toBeFocused()` assertions in the visual lane.
2. AppBar retains an ineffective legacy contextual-color declaration.

## Accepted risks

- Official Web Expressive availability is documented as unavailable, so the installed renderer remains accepted only for the selected subset backed by observable browser proof.
- Rapid successive activation remains a subjective motion risk because official guidance provides no normative Web timing parameters.
- The newest complete official snapshot is older than the nominal refresh threshold; refresh tooling found no evidence of a newer revision.
- Loading Indicator retains dependency-owned exact-version workarounds M3E-001 and M3E-002, which require revalidation on a renderer update.

## Items not required

- No change to `DESIGN.md`, `ARCHITECTURE.md`, the public Button API, or the accepted seven-token set.
- No toggle, additional colors/sizes/shapes, trailing-icon, link, form-data, or disabled-interactive API.
- No Button-owned operation state, status messaging, disabled guard, or re-entry guard.
- No renderer compatibility layer, interaction clone, descendant cascade, private shadow-DOM contract, or contextual icon token.
- No migration of Icon Button, FAB, navigation, menu, or ordinary native HTML controls.

## Required return stage

`implementation`.

The orchestrator must launch a fresh implementation worker for the visual-test ownership correction, continue through a fresh migration worker for AppBar cleanup and downstream record refresh, run the required project verification, and then launch a new independent review worker. It must not repeat design or architecture unless a correction worker discovers evidence that invalidates those artifacts.

## Completion status

Blocked until the two technical corrections, resulting project verification, and operator visual/motion acceptance are complete.
