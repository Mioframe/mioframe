---
name: material3-guidelines
description: 'Use for official Material source lookup, component choice, usage, composition, supported surface, accessibility, adaptive behavior, and product-facing Material UI/UX decisions. Supplies evidence and decisions for an architect-approved contract; it does not implement or approve a component PR.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/material/docs/**'
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

For official component implementation, this skill supplies source-backed decisions to the architect-owned family contract. `material-component-implementation` owns coding only after that contract is `Readiness: ready`.

## Canonical target

Official Mioframe Material components target the current applicable Material 3 Expressive contract.

- Prefer current Expressive guidance, tokens, measurements, state composition, motion, and Design Kit component sets when available for the supported surface.
- Do not preserve baseline Material 3 merely because it matches current code.
- Use baseline behavior or geometry only when no applicable Expressive contract exists or an approved deviation requires it.
- Do not silently combine baseline and Expressive contracts.

## Official authority

Use `src/shared/ui/material/docs/source-of-truth.md`.

- Current published Material 3 Expressive documentation is authoritative for documented usage, anatomy, behavior, accessibility, tokens, foundations, motion, and adaptive guidance.
- The current official Material Design Kit is authoritative only for applicable visual decisions unresolved by published guidance.
- MCP and cache are access mechanisms, not independent authorities.
- Repository code, tests, stories, snapshots, prior audits, and other implementations are evidence to inspect, not proof of Material correctness.

## Source access

1. Use the `material3` MCP server first.
2. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete for the required page.
3. Directly verify the current official page when available evidence is missing, stale, suspicious, or contradictory.
4. Use the current official Design Kit only for visual decisions not resolved by published documentation.
5. Record exact pages, snapshot/capture metadata, direct verification dates, and Design Kit references.
6. Stop source lookup when every required decision is resolved by traceable official evidence.

Do not use Material Web, generic search results, unproven screenshots, older Material versions, third-party libraries, existing Mioframe rendering, or memory as Material authority.

When evidence remains unavailable or contradictory:

- identify the exact unresolved decision;
- narrow unsupported optional scope when required scenarios remain satisfied;
- otherwise mark the contract `Readiness: blocked`;
- do not infer correctness from the existing implementation.

## Component choice and usage

Start from the user scenario and official guidance, not from the component already present.

Confirm applicable:

- intended and prohibited scenarios;
- action/content hierarchy;
- allowed compositions;
- placement constraints;
- adaptive behavior and owner;
- whether product composition or a reusable Material pattern owns the relationship.

Prefer an existing official component or documented composition when it covers the need. Do not create an `MD*` surface for a product-specific workflow merely because it resembles Material visually.

## Minimum complete surface

- Start from named scenarios and affected consumers.
- Use the current applicable Expressive default only when no narrower scenario exists.
- Add variants, sizes, shapes, modes, anatomy, and behavior only for a current scenario or consumer.
- Include every reachable state, accessibility requirement, and applicable dependency of the supported surface.
- Record remaining official capabilities as unsupported.
- Add no Mioframe extension without an explicit requirement, owner, and deviation record.

Minimum scope is not partial correctness.

## Product and library ownership

Product layers own information architecture, workflows, component placement, product-level adaptive composition, data, and content.

Official component families own only approved supported usage, public API, native semantics, anatomy, states, tokens, behavior, and rendering.

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
- overlay focus and dismissal;
- reduced motion.

Visual similarity alone is not alignment.

## Output to the contract

Provide concise source-backed decisions for:

- official sources and snapshot;
- component choice and intended usage;
- supported and unsupported surface;
- anatomy, states, tokens, motion, accessibility, and adaptivity when applicable;
- extensions or deviations;
- unresolved evidence and its impact;
- applicable proof requirements.

This skill does not mark its own implementation ready, modify production code, perform independent review, or claim merge readiness.
