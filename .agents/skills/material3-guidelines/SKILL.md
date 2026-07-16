---
name: material3-guidelines
description: 'Use for official Material source lookup, component choice, usage, composition, minimum supported surface, accessibility, adaptive behavior, and product-facing Material UI/UX decisions. For authoring an official public component family, pair with material-component-authoring as the primary workflow.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
  - 'tests/e2e/storybook/**'
---

# Material 3 guidelines

Use for decisions about:

- which Material component or documented composition fits a scenario;
- intended and prohibited usage;
- component hierarchy and placement;
- official source interpretation;
- minimum supported surface;
- accessibility, interaction, adaptive behavior, and visual evidence;
- whether a surface is official Material, a documented pattern, or project-specific UI.

For creating, migrating, aligning, or materially changing an official public component family, use `material-component-authoring` as the primary execution workflow. This skill supplies source and usage decisions; it does not own the family blueprint, production file plan, migration order, or completion process.

Canonical source, architecture, autonomous review, and operator visual-acceptance rules live in `docs/material-3`.

## Canonical target

Official Mioframe Material components target the current official **Material 3 Expressive** contract.

- Prefer current Expressive guidance, tokens, measurements, state composition, motion, and Design Kit component sets whenever they exist for the supported surface.
- Do not preserve baseline Material 3 merely because it matches current code.
- Use baseline behavior or geometry only when no official Expressive contract exists for the supported surface, or when an explicit product requirement records a deviation.
- Do not silently combine baseline and Expressive contracts in one supported surface.
- `Canonical Material default` means the current Expressive default when available.

## No-impact path

For a change preserving component choice, usage, location, public imports, API, foundation dependencies, tokens, anatomy, states, accessibility, testing surface, behavior, and rendered output, record:

```text
Material impact: none
```

A public contract, visual contract, component choice, foundation, or state-model change is not `none`.

## Source workflow

1. Use the `material3` MCP server first.
2. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete for the required page.
3. Use the current official Material Design Kit Expressive component set only when published documentation cannot resolve exact visual geometry, anatomy, expressive measurements, or state composition.
4. Record exact page names, snapshot metadata, and Design Kit file/component-set reference when applicable.
5. Stop source lookup when the required decisions are resolved.

Do not use Material Web, generic web search, screenshots without official provenance, older Material versions, third-party libraries, existing Mioframe rendering, or memory as Material authority.

Material Web or another implementation may be inspected only after the official contract is resolved and only as a non-authoritative implementation reference.

When required evidence is unavailable or contradictory:

- identify the exact unresolved decision;
- narrow unsupported scope when required scenarios remain satisfied;
- otherwise report `blocked`;
- do not infer correctness from an existing baseline or another library.

## Component choice and usage

Start from the user scenario and current official Material guidance, not from the component already present in the repository.

Confirm:

- intended scenario;
- scenarios where the component must not be used;
- action/content hierarchy;
- allowed Material compositions;
- placement constraints;
- adaptive behavior and its owner;
- whether product composition or a reusable Material pattern owns the relationship.

Prefer an existing official component or documented composition when it covers the need.

Do not create an `MD*` surface for a project-specific workflow merely because it visually resembles Material.

## Minimum complete surface

- Start from named scenarios and affected consumers.
- When no scenario is supplied, use the current canonical Expressive default usage only.
- Add variants, sizes, shapes, modes, anatomy, and behavior only for a current scenario or consumer.
- Include every reachable state, accessibility requirement, and applicable foundation dependency of the supported surface.
- Record remaining official capabilities as unsupported.
- Add no Mioframe extension without an explicit requirement, owner, and deviation record.

Minimum scope is not partial correctness: every reachable contract of the chosen supported surface must be complete.

## Product and library ownership

Product layers own:

- information architecture;
- workflow and domain behavior;
- component choice and placement for a concrete screen;
- product-level adaptive composition;
- consumer content and data.

Official Material component families own only their documented usage contract, API, native semantics, anatomy, state meaning, tokens, behavior, and rendering.

Reusable compositions belong in `material/patterns` only when official evidence defines the composition, it is independent of one feature/domain, a current scenario requires it, and it can be tested without product data.

## Accessibility and interaction

Material alignment includes:

- native semantics where applicable;
- accessible names and meaningful state exposure;
- keyboard and focus behavior;
- pointer/touch behavior;
- target areas;
- disabled and readonly semantics;
- contrast-safe role pairings;
- modal focus and dismissal behavior;
- reduced-motion behavior where contractual.

Visual similarity alone is not alignment.

## Review and verification

For product-facing Material changes, name:

- official sources checked;
- resulting component-choice, usage, placement, accessibility, or adaptive decision;
- deliberate deviation or unresolved evidence;
- affected existing Material component contracts;
- focused browser, visual, accessibility, or consumer proof required.

For official component-family implementation and migration, `material-component-authoring` owns the standard test profile and completion gate, and `docs/material-3/autonomous-review.md` owns review-role separation.

A coding agent may mark the source-backed architecture and Material evidence review as `passed` only when every non-visual decision is resolved and proved. It must never report operator visual acceptance as accepted. Routine operator work is limited to the prepared screenshot comparison; unresolved source, architecture, compatibility, or product decisions remain explicit blockers rather than being deferred to visual review.