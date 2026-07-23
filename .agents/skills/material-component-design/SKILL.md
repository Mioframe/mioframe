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

Use the MCP component catalogue, page records, graph relations, resources, and token tables. Do not attempt to open or scrape `m3.material.io` directly. Search snippets are not evidence.

Record both:

- the original official route URL represented by the MCP record;
- the MCP cache snapshot identity and capture timestamp returned by the source.

`source-snapshot` describes the MCP cache snapshot, not the artifact generation date. Do not replace it with the current date unless the MCP reports that date as the snapshot capture time.

Read repository `AGENTS.md` files needed for placement and editing rules. Do not inspect Mioframe component source, styles, tokens, foundations, exports, consumers, tests, snapshots, Storybook, README files, audits, or legacy components.

An existing target `DESIGN.md` may be read only to preserve artifact history and approval state. It is not Material authority.

Do not use Figma, Material Web, another library, MDN, WAI-ARIA, blogs, screenshots, direct-site scraping, or memory to fill missing MCP guidance. Record the gap instead.

## Workflow

### 1. Resolve the target

- Use the MCP component catalogue to match the supplied name to one current official component.
- Normalize case and harmless singular/plural differences only when unambiguous.
- Use the official title and route slug returned by the MCP.
- Preserve the family boundary represented by the MCP component graph.
- Do not merge separately documented components or split one documented component.

When no deterministic target exists, report the MCP candidates and make no repository change.

### 2. Capture source provenance

Before extracting requirements, record:

- MCP server/source name;
- cache schema or snapshot identifier when available;
- cache capture timestamp;
- canonical component route;
- every component route, related route, resource, and token table actually inspected.

If snapshot identity or capture timestamp is unavailable, record that as a source gap. Do not invent provenance.

### 3. Collect official evidence

Start with the MCP component bundle for the resolved target. Inspect every applicable record returned for that component, including available overview, guidelines, specifications, accessibility, related-component relations, resources, and token tables.

Follow a related foundation route only when:

- the component bundle explicitly links it; and
- it is needed to interpret a requirement not fully represented in the component records.

For each inspected record assign a short source ID and record:

- MCP record or route identifier;
- original official title;
- original `m3.material.io` URL;
- evidence used.

Every normative claim or table row in `DESIGN.md` must reference a source ID.

Do not claim that every applicable source was inspected merely because the standard component pages were read. The source coverage table must account for every applicable record returned by the MCP bundle or graph as `inspected` or `not applicable` with a reason.

### 4. Define the complete official surface

Capture all documented:

- purpose, choice guidance, family members, and alternatives;
- variants, configurations, sizes, and density;
- anatomy and content rules;
- states, state combinations, and interaction behavior;
- dimensions, color, typography, shape, outline, elevation, state layers, focus, icons, and official tokens;
- motion, interruption, and reduced-motion guidance;
- accessibility, directionality, and adaptive behavior.

Keep variants, configurations, sizes, and states distinct. Include the complete official surface, not the current Mioframe subset.

Assign a stable requirement ID to every normative requirement group. Use exact published token names and values. Write `Not specified by the inspected Material MCP records` when guidance is absent. Do not infer hidden values from images or convert examples and recommendations into requirements.

### 5. Check cross-section consistency

Before building the conformance matrix, compare:

- content guidance against accessibility requirements;
- states against interaction behavior;
- dimensions and visual summaries against token tables;
- motion summaries against motion tokens and source gaps;
- family boundary against related-component records.

When two source-backed rules differ by condition, state the condition and precedence explicitly. When they cannot be reconciled, record a source conflict and set `status: blocked` if the conflict prevents a coherent contract.

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

Do not create a full Cartesian product. Each case must reference the requirement IDs and source IDs it covers. Do not introduce a scheme, platform mode, accessibility condition, or behavior that is not defined elsewhere in the document.

### 7. Validate before writing

Check that:

- the target and family boundary are deterministic;
- source provenance identifies the MCP cache snapshot;
- every applicable MCP component record is accounted for;
- all normative claims are traceable to source IDs;
- every conformance case points to defined requirements;
- source gaps and conflicts are explicit;
- cross-section consistency checks pass;
- the motion table represents the published motion model without forcing spring parameters into duration/easing fields;
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

only when the MCP research is complete, provenance is recorded, source coverage is accounted for, and the contract is internally coherent.

Use:

```yaml
status: blocked
approval: pending
```

when the target is resolved but an MCP source conflict or gap prevents a coherent contract. Preserve confirmed evidence and state the exact blocker.

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
snapshot: <cache snapshot id or capture timestamp>
records inspected: <count>
source gaps: none | <count>
source conflicts: none | <count>
```

When target resolution fails, report candidates and `artifact: not created`.

Do not claim implementation readiness, current-code compliance, migration readiness, or merge readiness.

## Maintainer validation

[EVALS.md](EVALS.md) defines required real-run evaluations. Do not treat document review or repository CI alone as proof that this skill is stable.
