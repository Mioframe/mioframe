# Material library roadmap

This file owns only current execution state. Durable architecture and workflow live in the other documents in this directory.

## Current state

Last updated: 2026-07-19

Current stage: `MDButton first end-to-end family`

Status: `active`

Blocker: none.

Next action: start a fresh canonical Button migration from current `develop` using `component-development.md`. Do not reuse PR #150 implementation, workflow reports, or audit conclusions; PR #150 was closed without merge.

## Required result

The Button stage exits when:

- one canonical Button family owner exists under `components/button`;
- the minimum complete supported Material 3 Expressive surface is explicit;
- one complete primary vertical slice works before optional family expansion;
- the owner-local Storybook surface and proportional library proof are complete;
- affected consumers use the curated Material API;
- obsolete Button owners and compatibility paths are removed;
- non-visual review passes;
- required operator visual acceptance is recorded;
- final repository verification passes.

## Following work

After Button, use one independent stateful family, currently `MDSwitch`, to validate controlled state, interaction lifecycle, accessibility, and foundation reuse.

After those two families, continue one family at a time based on current product need, consumer reach, correctness risk, foundation leverage, dependency readiness, and migration blast radius.

Do not maintain an exhaustive shared-UI inventory or parallel component registry. Select the next family from current repository evidence when the current family completes, and record only the selected next action here.

## Update rule

Update this file only when the active family, status, blocker, or next action changes. Do not repeat architecture, source, testing, review, or completion policy beyond the short current-stage result above.
