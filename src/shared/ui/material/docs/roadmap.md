# Material library roadmap

This file records only the active family, alignment status, exact external blocker, and one next action. It is not execution memory, a backlog, audit, checklist, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended invocation scope: `full-family`

Family alignment status: `converging`

Blocker: one exact external condition prevents a final `aligned` claim right now — `pnpm verify`'s
`storybook-behavior` check cannot currently be re-run to confirm a clean result, because Podman's
rootless runtime directory in this sandbox is genuinely read-only (`chmod: /run/user/1000/libpod:
read-only file system`, confirmed via direct `touch`), which blocks the Playwright container this
check requires. This is an environment condition, not a repository defect.

All internal dependency-closure work identified this pass is complete and independently
confirmed:

1. The ambient `--md-content-color`/`--md-container-color`/`--md-symbol-size`/
   `--md-circular-progress-color`/`--md-focus-indicator-color`/`-thickness`/`-offset`
   custom-property naming gap: documented as "External generic foundation contracts" in
   `docs/tokens.md` and enforced by `scripts/materialTokenArchitecture.test.mjs` (zero errors).
2. `MDStateLayer`/`useRipple`/`useStateLayer`/`useFocusIndicator`/`usePressed` (real,
   token-driven Material "Interaction states" foundation) relocated from `@shared/ui/State` to
   `src/shared/ui/material/foundation/state/`; old location now forwards only (no parallel
   implementation) for its ~15 real external consumers.
3. `MD_TYPESCALE`/typescale utility classes relocated from `@shared/lib/md` to
   `src/shared/ui/material/foundation/typescale/`; all 10 real consumers migrated to import from
   `@shared/ui/material`.
4. `MDCircularProgressIndicator` (official Material "Progress indicators" family) relocated from
   `@shared/ui/ProgressIndicators` to `src/shared/ui/material/components/progress-indicator/`; old
   location forwards only.
5. `scripts/materialBoundaryArchitecture.test.mjs` (canonical Material must not import legacy
   `@shared/ui/*` or `@shared/lib/md`) now passes with zero errors for Button.
6. The owner README no longer contains workflow state, review-round history, or a backlog; it
   holds durable contract facts only.

`pnpm verify` results this pass: agent-environment, format, oxlint, eslint (1 pre-existing warning
unrelated to this work, `DiagnosticsErrorPrompt.vue`), type-check, unit-tests (including both
guards), and `e2e` all passed. `storybook-behavior`'s last full run failed with a container exit
code 255 and widespread timeouts/visibility failures spanning totally unrelated stories (bottom
sheet keyboard scroll, tooltip lifecycle, menu lifecycle, multiple Button-family variants) after
the Storybook build itself compiled cleanly (1093 modules) — a pattern consistent with container
resource exhaustion under this sandbox's constrained limits (cpus: 2, workers: 1), not a targeted
regression from the relocations above. This is not yet independently confirmed either way because
the environment condition above blocks re-running it.

## Next action

Re-run `pnpm verify` (or at minimum `pnpm test:storybook-behavior`) once Podman's rootless runtime
is usable again, to get a clean confirmation one way or the other. If it passes cleanly, run an
independent `material-family-review` and final `pnpm verify` before any `aligned` claim. If it
reproduces the same widespread failure pattern, treat it as a real regression and bisect against
the relocations in this pass. The spring-to-CSS motion mapping gap (README "Known gaps") is a
separate, non-blocking external platform gap and does not block `aligned`.

Do not select a second family until Button reaches `aligned`.

## Update rule

Update this file only when the active family, alignment status, external blocker, or one next action changes.
