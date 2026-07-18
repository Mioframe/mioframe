# Buttons implementation audit

Reviewed: 2026-07-18
Result: partially-compliant
Canonical source status: snapshot-complete-stale
Official capability inventory: snapshot-complete (material3 cache captured 2026-06-30T05:53:04.916Z; currentness unverified)
Official coverage: unresolved
Project implementation documentation: README.md
Visual review: rejected

## Evidence

This audit predates the latest authoring documentation correction and is now stale because README says `Review required after changes`.

The current README also records explicit operator rejection of pressed-shape motion. This rejection remains authoritative until production behavior changes and the user explicitly accepts the replacement.

## Current known findings

### Stage 1 — implementation vs project documentation

- Pressed-shape motion is technically connected but remains operator-rejected as visibly incorrect.
- Shared elevation override proof exists for Button, FAB, and Extended FAB; focused equivalent proof remains absent for MDCard and MDSwitch.
- The current README has corrected prior text-toggle and rapid-click classification findings, but this audit has not independently re-reviewed those changes.

### Stage 2 — project documentation vs Material 3 Expressive

- Current canonical completeness remains unresolved because the complete available Button snapshot is stale.

## Required next work

1. Run `material-component Button` with the concrete visual problem stated in the user message.
2. Change production pressed-shape motion behavior.
3. Set README visual status to `awaiting re-review`, preserving the operator feedback.
4. Run applicable local verification.
5. Run `material-component-review Button` to replace this stale audit.
6. Present new canonical evidence to the user and record explicit acceptance or further feedback in README through the next authoring task.