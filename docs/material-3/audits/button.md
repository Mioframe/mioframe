# Button Material 3 Expressive compliance audit

- Requested name: button
- Resolved family: Button (`MDButton` — common and toggle buttons)
- Audit date: 2026-07-17
- Implementation ref: `fix/md-button-material-token-contract`
- Implementation commit: `064b8a765e7e88caca3e3870d38e090c1661d5d7`
- Current owner: `src/shared/ui/Button/MDButton.vue`
- Canonical owner: `src/shared/ui/material/components/button`
- Compliance result: `non-compliant`
- Operator visual status: blocked

## Official evidence

- `material3` MCP button documentation and token graph used by the earlier review.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.
- `pages/components/buttons/specs.md` publishes pressed container shape motion using `md.sys.motion.spring.fast.spatial.stiffness` (`800`) and damping (`0.6`) for every supported size.
- `src/shared/ui/material/README.md` defines `src/shared/ui/material/components/<family>` as the canonical owner and classifies existing `src/shared/ui/<LegacyFamily>` implementations as legacy.

This file is an explicit invalidation record, not a completed fresh review. The earlier audit was written against an older implementation commit, misidentified the legacy file as canonical, and did not perform the required empirical interaction review. It must be replaced by a new `material-component-review Button` run after the complete migration and implementation work.

## Claimed supported surface

The repository currently claims five color styles, five sizes, round and square shapes, default and toggle variants, native button semantics, loading extension, component token overrides, state layers, ripple, focus indication, and Expressive shape motion.

## Required consumer scenarios

- primary, secondary, and tertiary actions in forms, dialogs, sheets, cards, and toolbars;
- toggle-style controls;
- disabled and loading states;
- light and dark themes;
- real pointer, keyboard, and touch interaction where applicable.

## Empirical interaction evidence

Result: failed / incomplete.

The previous review did not record a real-browser press/release sequence, intermediate motion samples, interruption/cancellation behavior, or reduced-motion behavior. Existing forced-state and endpoint assertions do not prove the visible interaction.

## Confirmed findings

1. Severity: high
   Area: physical ownership and migration
   Official requirement: official public Material component families are canonically owned under `src/shared/ui/material/components/<family>` and legacy owners must be migrated and removed by the end-to-end workflow.
   Official source and snapshot: repository Material architecture and physical migration map in `src/shared/ui/material/README.md`.
   Implementation evidence: `MDButton` remains at `src/shared/ui/Button/MDButton.vue`; PR 150 contains no canonical `material/components/button` owner, family README, Material root export, complete consumer import migration, or obsolete MDButton owner removal.
   Observed mismatch: `material-component Button` did not perform the required end-to-end migration.
   Required correction: create the canonical Button family, migrate exports and every consumer, remove the legacy MDButton files and export, and update directly affected records.

2. Severity: high
   Area: interaction motion
   Official requirement: pressed container shape morph uses the fast spatial spring with stiffness `800` and damping `0.6` for every supported size.
   Official source and snapshot: `pages/components/buttons/specs.md` from the verified July 13 Material documentation snapshot.
   Implementation evidence: `MDButton.vue` animates `border-radius` through a fixed private duration/cubic-bezier adaptation; existing tests assert transition declarations and final radii but do not prove the real spring trajectory. The component-level stiffness and damping values are declared but the prior audit did not establish a traceable derivation or empirical equivalence of the Web approximation.
   Observed mismatch: the operator reports visibly incorrect interaction animation, and no empirical evidence exists that the implementation matches the official spring acquisition and release behavior.
   Required correction: reproduce the defect in the canonical browser story, implement the official spring or a traceable and empirically validated Web adaptation, and prove onset, intermediate trajectory, release, interruption/cancellation, settled state, and reduced-motion behavior using real input.

3. Severity: high
   Area: public shadow-color token final rendering
   Official requirement: a supported public component token must affect the final rendered property it owns.
   Official source and snapshot: current Button token graph and repository public token contract.
   Implementation evidence: the shadow-color override reaches `--md-private-elevation-shadow-color`, while the final rendered `box-shadow` does not consistently re-derive from the changed color source.
   Observed mismatch: the public route is claimed as supported although only an intermediate bridge changes.
   Required correction: fix the shared elevation foundation so the public override changes the final rendered shadow, or remove/narrow the claimed public support with an explicit contract decision. Do not classify a broken final route as an evidence-only gap.

4. Severity: medium
   Area: audit lifecycle
   Official requirement: the durable audit must review the implementation commit proposed for completion.
   Official source and snapshot: `docs/material-3/audits/README.md`.
   Implementation evidence: the earlier audit records commit `064b8a765e7e88caca3e3870d38e090c1661d5d7`, while implementation continued afterward.
   Observed mismatch: the audit became stale immediately after fixes and still presented obsolete conclusions.
   Required correction: run a fresh compliance review after final implementation and verification; the final audit metadata must match the final implementation commit.

## Evidence gaps

- Exact frame-by-frame behavior of the current press and release animation has not yet been recorded.
- Reduced-motion behavior has not yet been reviewed empirically.
- Final visual fidelity against the official reference cannot be handed to the operator until agent-owned motion and migration defects are resolved.

## Rule defects

The pilot exposed incomplete workflow rules. They have been corrected in this PR in:

- `.agents/skills/material-component/SKILL.md`;
- `.agents/skills/material-component-authoring/SKILL.md`;
- `.agents/skills/material-component-review/SKILL.md`;
- `docs/material-3/autonomous-review.md`;
- `docs/material-3/audits/README.md`.

## Verified compliant areas

No broad compliance conclusion from the earlier audit remains current. Individual token, semantics, accessibility, and endpoint findings may be reused as investigation evidence, but they must be revalidated after canonical migration and motion/foundation corrections.

## Recommended next action

Run `material-component Button` again on this PR using the corrected workflow. Complete the canonical migration, fix real interaction motion and the broken final shadow-color route, run full verification, then run `material-component-review Button` against the final implementation commit. Only after the fresh audit passes agent-owned gates should operator visual acceptance begin.
