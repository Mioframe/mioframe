# Material component DESIGN.md template

Use this template exactly unless a section is explicitly inapplicable according to the inspected Material MCP records.

## Contents

- MCP snapshot provenance and route/resource coverage
- Identity, purpose, family, variants, configurations, and sizes
- Anatomy, content, states, and interaction
- Visual specification and token inventory
- Motion, accessibility, directionality, and adaptation
- Conformance matrix, source issues, and acceptance criteria

```md
---
document: material-component-design
component: <official title>
canonical-slug: <official route slug>
material-source: material3-mcp
material-origin: m3.material.io
source-snapshot: <reported cache generatedAt or not reported>
source-cache-schema: <schema/version or not reported>
generated-at: YYYY-MM-DD
status: review-ready | blocked
approval: pending | approved
---

# <Official component title>

## Source provenance

- MCP source: `material3`
- Cache generated at:
- Cache schema/version:
- Cache freshness/status:
- Canonical component route:

## Source coverage

| Source ID | MCP record or route | Official title | Original URL | Coverage or resolution | Evidence used or disposition |
| --------- | ------------------- | -------------- | ------------ | ---------------------- | ---------------------------- |
| M3-...    | ...                 | ...            | ...          | inspected              | ...                          |

Account for every route returned by `get_component_tabs`, every token-table group returned by `get_component_tokens`, and every unresolved resource returned by `get_component_resources`. Use `not applicable` or `blocked` with a reason when a record is not used as evidence.

## Component identity

- Official title:
- Category:
- Canonical slug:
- Family boundary:

## Purpose and choice guidance

### Purpose

### Use when

### Do not use when

### Alternative components

## Official family and related components

| Requirement ID | Component or member | Relationship | Source ID |
| -------------- | ------------------- | ------------ | --------- |

## Variants

| Requirement ID | Variant | Purpose or emphasis | Distinguishing properties | Source ID |
| -------------- | ------- | ------------------- | ------------------------- | --------- |

## Configurations

| Requirement ID | Configuration | Required content | Optional content | Constraints | Source ID |
| -------------- | ------------- | ---------------- | ---------------- | ----------- | --------- |

## Sizes and density

| Requirement ID | Size or density | Dimensions | Content sizing | Target size | Source ID |
| -------------- | --------------- | ---------- | -------------- | ----------- | --------- |

## Anatomy

| Requirement ID | Part | Required or optional | Design role | Source ID |
| -------------- | ---- | -------------------- | ----------- | --------- |

## Content guidance

| Requirement ID | Area | Requirement or recommendation | Strength | Conditions or exceptions | Source ID |
| -------------- | ---- | ----------------------------- | -------- | ------------------------ | --------- |

## State model

### States

| Requirement ID | State | Meaning | Visual change | Source ID |
| -------------- | ----- | ------- | ------------- | --------- |

### State combinations

| Requirement ID | Combination | Allowed | Result | Source ID |
| -------------- | ----------- | ------- | ------ | --------- |

## Interaction behavior

| Requirement ID | Input or condition | Observable behavior | Source ID |
| -------------- | ------------------ | ------------------- | --------- |

## Visual specification

### Dimensions and layout

| Requirement ID | Element | Token or value | Conditions | Source ID |
| -------------- | ------- | -------------- | ---------- | --------- |

### Color

| Requirement ID | Variant or element | State | Token or role | Source ID |
| -------------- | ------------------ | ----- | ------------- | --------- |

### Typography

| Requirement ID | Element | Typescale role or value | Source ID |
| -------------- | ------- | ----------------------- | --------- |

### Shape and outline

| Requirement ID | Variant or element | State | Token or value | Source ID |
| -------------- | ------------------ | ----- | -------------- | --------- |

### Elevation

| Requirement ID | Variant or element | State | Token or value | Source ID |
| -------------- | ------------------ | ----- | -------------- | --------- |

### State layers and focus

| Requirement ID | State | Layer, indicator, or opacity | Source ID |
| -------------- | ----- | ---------------------------- | --------- |

### Icons

| Requirement ID | Context | Size, placement, or behavior | Source ID |
| -------------- | ------- | ---------------------------- | --------- |

## Material token inventory

| Design role | Official component token | Official system role or value | Source ID |
| ----------- | ------------------------ | ----------------------------- | --------- |

The official component token name is the stable identifier for a token row. Do not create arbitrary duplicate requirement IDs for every token unless two rows would otherwise be ambiguous.

## Motion

| Requirement ID | Transition | Trigger | From | To | Motion model | Published parameters | Source ID |
| -------------- | ---------- | ------- | ---- | -- | ------------ | -------------------- | --------- |

### Interruption and reduced motion

| Requirement ID | Condition | Published behavior | Source ID |
| -------------- | --------- | ------------------ | --------- |

Do not force spring damping/stiffness into duration/easing fields. Record the motion model and only the parameters published by the MCP source.

## Accessibility

| Requirement ID | Area | Published Material requirement | Conditions or exceptions | Source ID |
| -------------- | ---- | ------------------------------ | ------------------------ | --------- |

## Directionality and adaptation

| Requirement ID | Condition | Required behavior | Source ID |
| -------------- | --------- | ----------------- | --------- |

## Cross-section consistency

| Check | Result | Related requirement IDs | Resolution or conflict ID |
| ----- | ------ | ----------------------- | ------------------------- |
| Content vs accessibility | pass | ... | ... |
| States vs interaction | pass | ... | ... |
| Visual summaries vs token tables | pass | ... | ... |
| Motion vs token inventory and gaps | pass | ... | ... |
| Family boundary vs related records | pass | ... | ... |

## Canonical conformance matrix

| ID | Member | Variant | Size | Configuration | State | Scheme or direction | Requirement IDs | Token references | Source IDs |
| -- | ------ | ------- | ---- | ------------- | ----- | ------------------- | --------------- | ---------------- | ---------- |

Every matrix case must reference requirements already defined above. Use official token names for token-specific coverage. Do not introduce a new scheme, platform mode, accessibility condition, or behavior only in this table.

## Source conflicts

None.

<!-- When present, use: conflict ID, source IDs, conflicting requirements, affected requirement IDs, impact, unresolved decision. -->

## Source gaps

None.

<!-- Use `Not specified by the inspected Material MCP records`; never invent the missing rule. -->

## Design acceptance criteria

- [ ] The official target and family boundary are deterministic.
- [ ] MCP snapshot provenance is recorded or explicitly reported unavailable.
- [ ] Every component route is accounted for in Source coverage.
- [ ] Token-table groups and unresolved resources are accounted for.
- [ ] The complete official surface represented by the MCP snapshot is documented.
- [ ] Variants, configurations, sizes, and states are distinct.
- [ ] Every behavior/design requirement has a requirement ID and source ID.
- [ ] Every token row uses an official token name and source ID.
- [ ] Cross-section consistency checks pass or blocking conflicts are recorded.
- [ ] Missing guidance and conflicts are explicit.
- [ ] The conformance matrix references only defined requirements, official tokens, and sources.
- [ ] Motion is represented using its published model and parameters.
- [ ] No Mioframe architecture, code, test, or migration decision is present.
```

For a newly generated or materially changed artifact, use `approval: pending`. Preserve `approval: approved` only under the unchanged-artifact rule in `SKILL.md`.