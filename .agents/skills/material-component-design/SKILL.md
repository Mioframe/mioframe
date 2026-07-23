---
name: material-component-design
description: 'Creates a source-backed DESIGN.md for one official Material component. Applies when the user supplies an exact or uniquely resolvable component name from the current Material catalogue; excludes Mioframe implementation, architecture, testing, and migration.'
---

# Material component design

Create the normative Material design contract for one official component.

## Contract

**Input:** one official component name from the current Material catalogue.

**Output:** exactly one artifact when the target is resolved:

```text
src/shared/ui/material/components/<canonical-material-slug>/DESIGN.md
```

Use [DESIGN-TEMPLATE.md](DESIGN-TEMPLATE.md) for the required structure.

This skill answers only what the cached official Material documentation requires. It does not decide Mioframe scope, architecture, API, implementation, tests, or migration.

## Authority and read boundary

Use the configured `material3` MCP as the only normative interface. It serves a validated snapshot of official `m3.material.io` content.

Do not attempt to open or scrape `m3.material.io` directly. Search snippets are not evidence.

Record both:

- the original official route URL represented by each MCP record;
- the MCP cache provenance returned by the source.

`source-snapshot` describes the MCP cache snapshot, normally its reported `generatedAt` value. `generated-at` describes when `DESIGN.md` was produced. Never substitute one for the other.

Read repository `AGENTS.md` files needed for placement and editing rules. Do not inspect Mioframe component source, styles, tokens, foundations, exports, consumers, tests, snapshots, Storybook, README files, audits, or legacy components.

An existing target `DESIGN.md` may be read only to preserve artifact history and approval state. It is not Material authority.

Do not use Figma, Material Web, another library, MDN, WAI-ARIA, blogs, screenshots, direct-site scraping, or memory to fill missing MCP guidance. Record the gap instead.

Do not call `refresh_material_docs` as part of this skill. A design run must use one stable existing snapshot. If the cache is unavailable or cannot provide the required records, return `blocked` without changing the source cache.

## Required MCP sequence

Use these tools in order where available:

1. `material_docs_cache_status` — record cache status and snapshot provenance.
2. `list_material_components` — resolve the canonical component slug.
3. `get_component_tabs` — enumerate the component routes/tabs represented by the graph.
4. `get_route` — inspect canonical/virtual route metadata and coverage for every component route.
5. `get_page` with `view: structured` — read each applicable component route.
6. `get_component_tokens` — read official token/status tables.
7. `get_component_resources` — account for referenced resources and unresolved records.
8. `get_route_artifacts` — record route provenance when needed for source identity.
9. `explain_route_coverage` or `explain_resource_resolution` — resolve any partial, ambiguous, stale, or unresolved record before selecting status.

Use `get_component_docs` or `get_material_page` only as compatibility views when structured records are insufficient. Do not treat the Markdown compatibility view as more authoritative than the structured graph and token tables.

## Workflow

### 1. Resolve the target

- Match the supplied name against `list_material_components`.
- Normalize case and harmless singular/plural differences only when unambiguous.
- Use the official title and route slug returned by the MCP.
- Preserve the family boundary represented by the MCP component graph.
- Do not merge separately documented components or split one documented component.

When no deterministic target exists, report the MCP candidates and make no repository change.

### 2. Capture source provenance

Before extracting requirements, record:

- MCP source name;
- cache `generatedAt` or equivalent snapshot timestamp;
- cache schema/version when reported;
- cache freshness/availability status;
- canonical component route;
- every component route, resource, token table, and provenance record actually inspected.

If any provenance field is unavailable, write `not reported by material3 MCP`. Do not convert that absence into invented metadata.

### 3. Collect official evidence

Inspect every route returned by `get_component_tabs`. For each route:

- inspect route metadata and coverage;
- read the structured page;
- account for referenced resources and token tables;
- explain any non-covered or unresolved status.

Follow a related foundation route only when the component graph links it and the component records do not fully define the relevant requirement.

For each inspected record assign a short source ID and record:

- MCP record or route identifier;
- original official title;
- original `m3.material.io` URL;
- coverage/resolution status;
- evidence used.

Every normative claim must reference a source ID. Every applicable component route and unresolved resource must appear in Source coverage as `inspected`, `not applicable`, or `blocked`, with a reason.

### 4. Define the complete official surface

Capture all documented:

- purpose, choice guidance, family members, and alternatives;
- variants, configurations, sizes, and density;
- anatomy and content rules;
- states, state combinations, and interaction behavior;
- dimensions, color, typography, shape, outline, elevation, state layers, focus, icons, and official tokens;
- motion, interruption, and reduced-motion guidance;
- accessibility, directionality, and adaptive behavior.

Keep variants, configurations, sizes, and states distinct. Include the complete official surface represented by the snapshot, not the current Mioframe subset.

Assign stable requirement IDs to behavior and design requirement groups. Official token names identify token inventory rows; do not create a second arbitrary identifier for every token row unless needed to resolve ambiguity.

Use exact published token names and values. Write `Not specified by the inspected Material MCP records` when guidance is absent. Do not infer hidden values from images or convert examples and recommendations into requirements.

### 5. Check cross-section consistency

Before building the conformance matrix, compare:

- content guidance against accessibility requirements;
- states against interaction behavior;
- dimensions and visual summaries against token tables;
- motion summaries against motion tokens and source gaps;
- family boundary against related-component records.

When two source-backed rules differ by condition, state the condition and precedence explicitly. When they cannot be reconciled, record a source conflict and use `status: blocked` if the conflict prevents a coherent contract.

### 6. Build the conformance matrix

Create the smallest concrete set of cases that covers each documented dimension at least once:

- family member;
- variant;
- size;
- configuration;
- base and interaction state;
- meaningful state combination;
- scheme and direction when applicable;
- documented adaptive and content edge cases.

Do not create a full Cartesian product. Each case must reference existing requirement IDs, relevant official token names, and source IDs. Do not introduce a scheme, platform mode, accessibility condition, or behavior that is not defined elsewhere in the document.

### 7. Validate before writing

Check that:

- the target and family boundary are deterministic;
- source provenance distinguishes cache snapshot from artifact generation time;
- every route returned by `get_component_tabs` is accounted for;
- route and resource coverage problems are resolved or explicit blockers;
- all normative claims are traceable to source IDs;
- every conformance case points to defined requirements and sources;
- source gaps and conflicts are explicit;
- cross-section consistency checks pass;
- the motion table represents the published model without forcing spring parameters into duration/easing fields;
- the template is complete;
- no project-specific or implementation decision is present;
- only the target `DESIGN.md` will change.

If validation fails, correct the document and repeat this check.

### 8. Set status and approval

Use:

```yaml
status: review-ready
approval: pending
```

only when the MCP research is complete, provenance is recorded, all component routes are accounted for, and the contract is internally coherent.

Use:

```yaml
status: blocked
approval: pending
```

when the target is resolved but cache availability, route/resource coverage, a source conflict, or a source gap prevents a coherent contract. Preserve confirmed evidence and state the exact blocker.

Never set `approval: approved` for a new or materially changed artifact.

For an existing approved artifact:

- preserve approval only when normative content, requirement IDs, source evidence, and snapshot identity are unchanged;
- reset approval to `pending` when any normative content, source snapshot, source conflict, or source gap changes.

Neither status authorizes architecture or implementation.

## Forbidden content

The artifact must not contain:

- current Mioframe implementation status or project-specific scope;
- Vue, TypeScript, DOM, CSS, event-handler, ownership, dependency, or foundation API decisions;
- implementation or test file plans;
- Storybook or verification plans;
- migration consumers or legacy-removal plans;
- estimates, phases, branches, commits, or PR instructions.

## Completion report

When an artifact is written, report:

```text
MATERIAL DESIGN RESULT
component: <official title>
artifact: src/shared/ui/material/components/<canonical-material-slug>/DESIGN.md
status: review-ready | blocked
approval: pending | approved
source: material3 MCP
snapshot: <reported cache generatedAt or not reported>
routes inspected: <count>
resources unresolved: none | <count>
source gaps: none | <count>
source conflicts: none | <count>
```

When target resolution fails, report candidates and `artifact: not created`.

Do not claim implementation readiness, current-code compliance, migration readiness, or merge readiness.

## Maintainer validation

[EVALS.md](EVALS.md) defines required real-run evaluations. Do not treat document review or repository CI alone as proof that this skill is stable.