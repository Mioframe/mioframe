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

For an official public component family, `material-component-authoring` owns contract reconstruction, diagnosis, strategy, implementation, proof, documentation, and completion. This skill supplies source and usage decisions.

## Evidence boundary

Use official Material sources and current workspace files.

Source-control history is not Material authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, and regression risk; do not use it to derive canonical behavior.

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

A public, visual, foundation, ownership, state-model, or proof-contract change is not `none`.

## Official authority

Use `docs/material-3/source-of-truth.md`.

- Current published Material 3 Expressive documentation is authoritative for documented usage, anatomy, behavior, accessibility, tokens, foundations, motion, and adaptive guidance.
- The current official Material Design Kit is authoritative only for objective visual decisions published documentation does not resolve.
- MCP and cache are access mechanisms, not independent authorities.
- Repository code, tests, stories, snapshots, and prior audits are current implementation evidence, not proof of Material correctness.

## Source access workflow

1. Read every required official page and structured route through the current `material3` MCP run.
2. Treat a successful complete MCP read as working current evidence when it is not reported partial, failed, suspicious, truncated, or conflicting.
3. Use `Vyachean/m3-docs-cache` when MCP is unavailable or incomplete for a required source.
4. Directly verify the current published page only when evidence is missing, partial, suspicious, conflicting, or there is a concrete reason to suspect the contract changed.
5. Use the current official Material Design Kit only when published documentation cannot resolve an exact objective visual decision.
6. Record exact page names, current-run lookup status, provenance metadata, direct verification dates, and Design Kit references.

Capture age alone is not a defect and does not downgrade a healthy current MCP read.

Record one canonical source status:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Use `snapshot-complete-stale` only when relying on a retained snapshot without a healthy current read, or when freshness is explicitly unresolved by the source mechanism.

Use complete inventory only with `current-complete` evidence. A partial cache, failed or missing page, truncated graph, suspicious record, conflicting source, or spot-check-only inspection requires incomplete or blocked inventory status.

Spot checks may verify exact facts. They do not prove the full family inventory.

Do not use Material Web, generic search results, unproven screenshots, older Material versions, third-party libraries, existing Mioframe rendering, memory, or repository history as Material authority.

Another implementation may be inspected only after the official contract is resolved and only as a non-authoritative reference.

When evidence is unavailable, partial, suspicious, or contradictory:

- identify the exact unresolved decision;
- narrow implementation scope only when required scenarios remain coherent;
- record the source limitation honestly;
- use `blocked` when unresolved evidence affects a required decision;
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

Shared motion foundations are verified deeply once. Component evidence remains proportional, but forced states prove only stable appearance; real input is required for lifecycle claims.

Sample intermediate transition composition only when endpoints cannot prove the changed or reported risk.

## Rule refinement

When current source or implementation evidence proves a project rule inaccurate or needlessly complex, correct the owning rule through the calibrated Material workflow.

Do not add a component-specific exception. Do not add a new universal rule when an existing rule already prohibited the defect; strengthen execution or report agent non-compliance instead.

## Review and verification

Name:

- official sources and source status;
- resulting component-choice, usage, accessibility, or adaptive decision;
- classifications, deviations, and unresolved evidence;
- affected official contracts;
- applicable browser, visual, accessibility, or consumer proof.

`material-component-authoring` owns family documentation, implementation, migration, proportional proof, and the objective gate. `autonomous-review.md` owns independent contradiction-seeking review and operator visual separation.

The agent never invents operator visual acceptance.
