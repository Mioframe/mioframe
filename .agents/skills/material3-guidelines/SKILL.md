---
name: material3-guidelines
description: 'Use for official Material source lookup, component choice, usage, composition, minimum supported surface, accessibility, adaptive behavior, and product-facing Material UI/UX decisions. Pair with material-component-authoring for official public component work.'
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
- minimum complete supported surface;
- accessibility, interaction, adaptive behavior, and visual evidence;
- whether a surface is official Material, a pattern, or project-specific UI.

For an official public component family, `material-component-authoring` owns execution, migration, proportional proof, rule refinement, and completion. This skill supplies source and usage decisions.

## Canonical target

Official Mioframe Material components target the current applicable Material 3 Expressive contract.

- Prefer current Expressive guidance, tokens, measurements, state composition, motion, and Design Kit component sets when available for the supported surface.
- Do not preserve baseline Material 3 merely because it matches current code.
- Use baseline behavior or geometry only when no applicable Expressive contract exists or an explicit product deviation requires it.
- Do not silently combine baseline and Expressive contracts.
- `Canonical Material default` means the current Expressive default when available.

## No-impact path

For a change preserving component choice, usage, ownership, public imports, API, foundations, tokens, anatomy, states, accessibility, proof surface, behavior, and rendered output, record:

```text
Material impact: none
```

A public, visual, foundation, ownership, or state-model change is not `none`.

## Source workflow

1. Use the `material3` MCP server first.
2. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete for the required page.
3. Use the current official Material Design Kit Expressive component set only when published documentation cannot resolve an applicable visual decision.
4. Record exact page names, snapshot metadata, and Design Kit references when used.
5. Stop source lookup when required decisions are resolved.

Do not use Material Web, generic web search, unproven screenshots, older Material versions, third-party libraries, existing Mioframe rendering, or memory as Material authority.

Another implementation may be inspected only after the official contract is resolved and only as a non-authoritative implementation reference.

When evidence is unavailable or contradictory:

- identify the exact unresolved decision;
- narrow unsupported scope when required scenarios remain satisfied;
- otherwise report `blocked`;
- do not infer correctness from an existing baseline.

## Component choice and usage

Start from the user scenario and current official guidance, not from the component already present.

Confirm applicable:

- intended and prohibited scenarios;
- action or content hierarchy;
- allowed Material compositions;
- placement constraints;
- adaptive behavior and owner;
- whether product composition or a reusable Material pattern owns the relationship.

Prefer an existing official component or documented composition when it covers the need.

Do not create an `MD*` surface for a project-specific workflow merely because it resembles Material visually.

## Minimum complete surface

- Start from named scenarios and affected consumers.
- Use the current canonical Expressive default only when no narrower scenario is supplied.
- Add variants, sizes, shapes, modes, anatomy, and behavior only for a current scenario or consumer.
- Include every reachable state, accessibility requirement, and applicable dependency of the supported surface.
- Record remaining official capabilities as unsupported.
- Add no Mioframe extension without an explicit requirement, owner, and deviation record.

Minimum scope is not partial correctness.

## Product and library ownership

Product layers own:

- information architecture;
- workflow and domain behavior;
- component choice and placement for a screen;
- product-level adaptive composition;
- consumer data and content.

Official component families own only their supported usage, public API, native semantics, anatomy, states, tokens, behavior, and rendering.

Reusable compositions belong in `material/patterns` only when official evidence defines them, a current scenario requires them, they are independent of one product domain, and they can be tested without product data.

## Accessibility and interaction

Material alignment includes applicable:

- native semantics;
- accessible names and state exposure;
- keyboard and focus behavior;
- pointer and touch behavior;
- target areas;
- disabled and readonly semantics;
- contrast-safe role pairings;
- overlay focus and dismissal behavior;
- reduced motion.

Visual similarity alone is not alignment.

## Rule refinement

When real source evidence or implementation proves a project rule inaccurate or needlessly complex, correct the owning rule through `material-component-authoring`. Do not work around it with a component-specific exception.

## Review and verification

For product-facing Material changes, name:

- official sources checked;
- resulting component-choice, usage, accessibility, or adaptive decision;
- deviations or unresolved evidence;
- affected official component contracts;
- applicable browser, visual, accessibility, or consumer proof.

For official component work, `material-component-authoring` owns adaptive family contracts, proportional proof, migration completion, and continuation to the next ready family. `autonomous-review.md` owns agent/operator role separation.

The agent may mark non-visual evidence review `passed` only when every applicable decision is resolved and proved. It never reports operator visual acceptance as accepted.