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
- minimum coherent implemented surface;
- accessibility, interaction, adaptive behavior, and visual evidence;
- whether a surface is official Material, an official constraint, optional guidance, or project-specific UI.

For an official public component family, `material-component-authoring` owns execution, migration, proof, documentation, and completion. This skill supplies source and usage decisions.

## Evidence boundary

For Material component authoring and review, use official Material sources and current workspace files.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history as source or implementation evidence.

## Canonical target

Official Mioframe Material components target the current applicable Material 3 Expressive contract.

- Prefer current Expressive guidance, tokens, measurements, state composition, motion, and Design Kit component sets when available.
- Do not preserve baseline Material 3 merely because it matches current code.
- Use baseline behavior only when no applicable Expressive contract exists or an explicit product deviation requires it.
- Do not silently combine baseline and Expressive contracts.

## No-impact path

For a change preserving component choice, usage, ownership, public imports, API, foundations, tokens, anatomy, states, accessibility, proof surface, behavior, and rendered output, record:

```text
Material impact: none
```

A public, visual, foundation, ownership, or state-model change is not `none`.

## Official authority

Use `docs/material-3/source-of-truth.md`.

- Current published Material 3 Expressive documentation is authoritative for documented usage, anatomy, behavior, accessibility, tokens, foundations, motion, and adaptive guidance.
- The current official Material Design Kit is authoritative only for visual decisions published documentation does not resolve.
- MCP and cache are access mechanisms, not independent authorities.
- Repository code, tests, stories, snapshots, and prior audits are current implementation evidence, not proof of Material correctness.

## Source access workflow

1. Use the `material3` MCP server for relevant official pages.
2. Use `Vyachean/m3-docs-cache` when MCP is unavailable or incomplete for a required page.
3. Directly verify the current published page when cache evidence is missing, stale, partial, suspicious, or inconsistent and access is possible.
4. Use the current official Material Design Kit only when published documentation cannot resolve an exact visual decision.
5. Record exact page names, source status, snapshot/capture metadata, direct verification dates, and Design Kit references.

Record one canonical source status:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Use `complete` inventory only with current-complete evidence.

A stale snapshot may support `snapshot-complete`, not current completeness. A partial cache, failed or missing page, truncated graph, suspicious record, or spot-check-only inspection requires incomplete or blocked inventory status.

Spot checks may verify exact facts. They do not prove the full family inventory.

Do not use Material Web, generic web search results, unproven screenshots, older Material versions, third-party libraries, existing Mioframe rendering, memory, or repository history as Material authority.

Another implementation may be inspected only after the official contract is resolved and only as a non-authoritative reference.

When evidence is unavailable, stale, partial, suspicious, or contradictory:

- identify the exact unresolved decision;
- narrow implementation scope only when required scenarios remain coherent;
- record the source limitation honestly;
- use `blocked` when the unresolved evidence affects a required decision;
- do not infer correctness from an existing baseline.

## Capability interpretation

Distinguish exactly:

- **official capability** — a supported component feature, variant, mode, state, behavior, or configuration;
- **officially unsupported or invalid combination** — a documented prohibition or absent route, not missing capability;
- **optional or non-normative guidance** — a recommendation or available choice, not automatically required capability;
- **required behavior** — a normative contract for the implemented surface;
- **out-of-family capability** — owned by a separate official family.

Do not place invalid combinations under `Not implemented`.

Do not convert optional guidance into missing capability unless the official contract makes it required for the implemented surface.

## Component choice and usage

Start from the user scenario and current official guidance, not from the component already present.

Confirm:

- intended and prohibited scenarios;
- action or content hierarchy;
- allowed Material compositions;
- placement constraints;
- adaptive behavior and owner;
- whether a product composition or official family owns the relationship.

Prefer an existing official component or documented composition when it covers the need.

Do not create an `MD*` surface for a project-specific workflow merely because it resembles Material visually.

## Minimum coherent implemented surface

- Start from named scenarios and affected consumers.
- Use the current canonical Expressive default only when no narrower scenario exists.
- Add variants, sizes, shapes, modes, anatomy, and behavior only for a current scenario or consumer.
- Include every reachable state, accessibility requirement, and dependency of the implemented surface.
- Classify every remaining official item accurately: not implemented, officially unsupported/invalid, unresolved, or out of family.
- Add no Mioframe extension without an explicit requirement, owner, and deviation record.

Minimum scope is not partial correctness. An implemented subset must be internally complete and truthful.

## Product and library ownership

Product layers own:

- information architecture;
- workflow and domain behavior;
- component choice and placement for a screen;
- product-level adaptive composition;
- consumer data and content.

Official families own their public API, native semantics, anatomy, states, tokens, behavior, and rendering.

Reusable compositions belong in `material/patterns` only when official evidence defines them, a current scenario requires them, they are product-independent, and they can be tested without product data.

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

## Visual and motion decisions

A known operator-rejected visible behavior remains an open defect until production behavior changes and new evidence is accepted.

Do not convert a perceptual rejection into a documentation-only issue because the implementation route is technically honest.

Shared motion foundations are verified deeply once. Component evidence remains proportional and does not require frame-by-frame analysis or duplicate equivalent input paths.

## Rule refinement

When current source or implementation evidence proves a project rule inaccurate or needlessly complex, correct the owning rule through `material-component-authoring`. Do not work around it with a component-specific exception.

## Review and verification

Name:

- official sources and source status;
- resulting component-choice, usage, accessibility, or adaptive decision;
- classifications, deviations, and unresolved evidence;
- affected official contracts;
- applicable browser, visual, accessibility, or consumer proof.

`material-component-authoring` owns family documentation, implementation, migration, proportional proof, and local verification. `autonomous-review.md` owns independent review and operator visual separation.

The agent never invents operator visual acceptance.
