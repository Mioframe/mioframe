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

This skill answers only what current published Material documentation requires. It does not decide Mioframe scope, architecture, API, implementation, tests, or migration.

## Authority and read boundary

Use only inspected pages on `https://m3.material.io` as normative evidence. Search may locate those pages, but search snippets are not evidence.

Read repository `AGENTS.md` files needed for placement and editing rules. Do not inspect Mioframe component source, styles, tokens, foundations, exports, consumers, tests, snapshots, Storybook, README files, audits, or legacy components.

An existing target `DESIGN.md` may be read only to preserve artifact history and approval state. It is not Material authority.

Do not use Figma, Material Web, another library, MDN, WAI-ARIA, blogs, screenshots, or memory to fill missing Material guidance. Record the gap instead.

## Workflow

### 1. Resolve the target

- Match the supplied name to one current official component page.
- Normalize case and harmless singular/plural differences only when unambiguous.
- Use the official page title and URL slug.
- Preserve the family boundary used by the official documentation.
- Do not merge separately documented components or split one documented component.

When no deterministic target exists, report the official candidates and make no repository change.

### 2. Collect official evidence

Inspect every applicable official page, including available overview, guidelines, specifications, accessibility, related-component, and linked foundation pages.

For each inspected page record:

- a short source ID;
- exact title;
- URL;
- evidence used.

Every normative claim or table row in `DESIGN.md` must reference a source ID.

### 3. Define the complete official surface

Capture all documented:

- purpose, choice guidance, family members, and alternatives;
- variants, configurations, sizes, and density;
- anatomy and content rules;
- states, state combinations, and interaction behavior;
- dimensions, color, typography, shape, outline, elevation, state layers, focus, icons, and official tokens;
- motion, interruption, and reduced-motion guidance;
- accessibility, directionality, and adaptive behavior.

Keep variants, configurations, sizes, and states distinct. Include the complete official surface, not the current Mioframe subset.

Use exact published token names and values. Write `Not specified by the inspected Material sources` when guidance is absent. Do not infer hidden values from images or convert examples and recommendations into requirements.

### 4. Build the conformance matrix

Create the smallest concrete set of cases that covers each documented dimension at least once:

- family member;
- variant;
- size;
- configuration;
- base and interaction state;
- meaningful state combination;
- scheme and direction when applicable;
- documented adaptive and content edge cases.

Do not create a full Cartesian product. Each case must name the requirements it covers.

### 5. Validate before writing

Check that:

- the target and family boundary are deterministic;
- every applicable official section was considered;
- all normative claims are traceable;
- source gaps and conflicts are explicit;
- the template is complete;
- no project-specific or implementation decision is present;
- only the target `DESIGN.md` will change.

If validation fails, correct the document and repeat this check.

### 6. Set status and approval

Use:

```yaml
status: review-ready
approval: pending
```

when the official research is complete and internally coherent.

Use:

```yaml
status: blocked
approval: pending
```

when the target is resolved but an official-source conflict or gap prevents a coherent contract. Preserve confirmed evidence and state the exact blocker.

Never set `approval: approved` for a new or materially changed artifact.

For an existing approved artifact:

- preserve approval only when normative content and source evidence are unchanged;
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
sources: <count>
source gaps: none | <count>
source conflicts: none | <count>
```

When target resolution fails, report candidates and `artifact: not created`.

Do not claim implementation readiness, current-code compliance, migration readiness, or merge readiness.

## Maintainer validation

[EVALS.md](EVALS.md) defines required real-run evaluations. Do not treat document review alone as proof that this skill is stable.
