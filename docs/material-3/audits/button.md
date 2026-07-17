# Button Material 3 Expressive compliance audit

- Requested name: button
- Resolved family: Button (`MDButton` — common and toggle buttons)
- Audit date: 2026-07-17
- Implementation ref: `fix/md-button-material-token-contract`
- Implementation commit: `d9a5dd60f7b811574d547af242169196160eba76`
- Current owner: `src/shared/ui/Button/MDButton.vue`
- Canonical owner: `src/shared/ui/material/components/button`
- Compliance result: `non-compliant`
- Operator visual status: blocked

## Official evidence

- `material3` MCP Button documentation and token graph.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.
- `pages/components/buttons/specs.md` publishes pressed container shape motion through `md.sys.motion.spring.fast.spatial.stiffness` (`800`) and damping (`0.6`) for every supported size.
- `src/shared/ui/material/README.md` defines `src/shared/ui/material/components/<family>` as canonical and classifies existing `src/shared/ui/<LegacyFamily>` implementations as legacy.

This audit replaces the earlier incorrect review conclusion. It records the current pilot blockers and must be replaced again after the complete migration and implementation fixes.

## Claimed supported surface

The repository claims five color styles, five sizes, round and square shapes, default and toggle variants, native button semantics, loading extension, public component-token overrides, state layers, ripple, focus indication, and Expressive shape motion.

## Required consumer scenarios

- primary, secondary, and tertiary actions in forms, dialogs, sheets, cards, and toolbars;
- toggle-style controls;
- disabled and loading states;
- light and dark themes;
- native pointer and keyboard activation.

## Confirmed findings

1. Severity: high
   Area: physical ownership and migration
   Official requirement: official public Material component families are canonically owned under `src/shared/ui/material/components/<family>` and legacy owners are removed by end-to-end migration.
   Official source and snapshot: repository Material architecture and physical migration map in `src/shared/ui/material/README.md`.
   Implementation evidence: `MDButton` remains at `src/shared/ui/Button/MDButton.vue`; there is no canonical `material/components/button` owner, family README, Material root export, complete consumer import migration, or obsolete MDButton owner removal.
   Observed mismatch: `material-component Button` did not perform the required end-to-end migration.
   Required correction: create the canonical Button family, migrate exports and consumers, remove the legacy MDButton files/export, and update only directly affected records.

2. Severity: high
   Area: interaction motion implementation
   Official requirement: pressed container shape morph uses the fast spatial spring with stiffness `800` and damping `0.6` for every supported size.
   Official source and snapshot: `pages/components/buttons/specs.md` from the verified July 13 documentation snapshot.
   Implementation evidence: per-size stiffness and damping component tokens are declared, but `border-radius` is animated through separate fixed `--md-private-motion-expressive-fast-spatial-duration` and easing variables. The repository describes those variables as a Web conversion, but the accepted foundation contract does not provide a traceable derivation from the official spring values, and the component-level spring tokens do not participate in the final property route.
   Observed mismatch: the implementation claims official Expressive spring motion while the official spring tokens are unused and the fixed approximation is not sufficiently owned or justified. The reported visible mismatch is consistent with this wiring defect.
   Required correction: establish one documented motion-foundation adaptation for the official fast-spatial spring, verify that adaptation at the foundation owner, and wire Button `border-radius` to it without conflicting local timing. Component tests should verify the route and state selectors; use a focused browser reproduction only if final computed behavior remains uncertain.

3. Severity: high
   Area: public shadow-color token final rendering
   Official requirement: a supported public component token must affect the final property it owns.
   Official source and snapshot: current Button token graph and repository public token contract.
   Implementation evidence: the shadow-color override reaches `--md-private-elevation-shadow-color`, while the final rendered `box-shadow` does not consistently re-derive from the changed source.
   Observed mismatch: the public route is claimed as supported although only an intermediate bridge changes.
   Required correction: fix the shared elevation foundation so the override changes the final rendered shadow, or explicitly narrow the supported public contract. Do not classify a broken final route as an evidence-only gap.

## Evidence gaps

- The accepted official-to-Web fast-spatial spring adaptation is not yet defined with sufficient ownership and derivation.
- The final public shadow-color route remains unresolved.
- Final visual acceptance is blocked until migration and technical findings are resolved.

## Rule defects

The pilot exposed workflow defects that are corrected in this PR:

- canonical ownership must come from architecture and the physical map;
- review must verify actual token/property consumption rather than declarations;
- browser tests are conditional and must not retest CSS interpolation;
- final completion requires a fresh audit for the final implementation commit;
- `StateMatrix` is conditional, not mandatory for every component.

## Verified compliant areas

The inverse dark-theme system-role defect found by the earlier review is corrected. Existing token, semantics, accessibility, and endpoint tests remain useful investigation evidence, but broad compliance must be re-evaluated after canonical migration and the motion/elevation corrections.

## Recommended next action

Run `material-component Button` again in PR 150 using the corrected workflow. Complete canonical migration, correct the motion-foundation wiring and final shadow-color route, run proportional and final verification, then replace this file through `material-component-review Button` against the final implementation commit. Operator visual acceptance begins only after agent-owned blockers are closed.