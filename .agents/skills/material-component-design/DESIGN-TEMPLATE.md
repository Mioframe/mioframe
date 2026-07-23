# Material component DESIGN.md template

Use this template exactly unless a section is explicitly inapplicable according to the inspected Material sources.

## Contents

- Metadata and sources
- Identity, purpose, family, variants, configurations, and sizes
- Anatomy, content, states, and interaction
- Visual specification and token inventory
- Motion, accessibility, directionality, and adaptation
- Conformance matrix, source issues, and acceptance criteria

```md
---
document: material-component-design
component: <official title>
canonical-slug: <official URL slug>
material-source: m3.material.io
source-snapshot: YYYY-MM-DD
status: review-ready | blocked
approval: pending
---

# <Official component title>

## Sources

| ID     | Official page | URL | Evidence used |
| ------ | ------------- | --- | ------------- |
| M3-... | ...           | ... | ...           |

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

| Component or member | Relationship | Source |
| ------------------- | ------------ | ------ |

## Variants

| Variant | Purpose or emphasis | Distinguishing properties | Source |
| ------- | ------------------- | ------------------------- | ------ |

## Configurations

| Configuration | Required content | Optional content | Constraints | Source |
| ------------- | ---------------- | ---------------- | ----------- | ------ |

## Sizes and density

| Size or density | Dimensions | Content sizing | Target size | Source |
| --------------- | ---------- | -------------- | ----------- | ------ |

## Anatomy

| Part | Required or optional | Design role | Source |
| ---- | -------------------- | ----------- | ------ |

## Content guidance

| Area | Requirement or recommendation | Strength | Source |
| ---- | ----------------------------- | -------- | ------ |

## State model

### States

| State | Meaning | Visual change | Source |
| ----- | ------- | ------------- | ------ |

### State combinations

| Combination | Allowed | Result | Source |
| ----------- | ------- | ------ | ------ |

## Interaction behavior

| Input or condition | Observable behavior | Source |
| ------------------ | ------------------- | ------ |

## Visual specification

### Dimensions and layout

| Element | Token or value | Conditions | Source |
| ------- | -------------- | ---------- | ------ |

### Color

| Variant or element | State | Token or role | Source |
| ------------------ | ----- | ------------- | ------ |

### Typography

| Element | Typescale role or value | Source |
| ------- | ----------------------- | ------ |

### Shape and outline

| Variant or element | State | Token or value | Source |
| ------------------ | ----- | -------------- | ------ |

### Elevation

| Variant or element | State | Token or value | Source |
| ------------------ | ----- | -------------- | ------ |

### State layers and focus

| State | Layer, indicator, or opacity | Source |
| ----- | ---------------------------- | ------ |

### Icons

| Context | Size, placement, or behavior | Source |
| ------- | ---------------------------- | ------ |

## Material token inventory

| Design role | Official component token | Official system role or value | Source |
| ----------- | ------------------------ | ----------------------------- | ------ |

## Motion

| Transition | Trigger | From | To  | Duration | Easing | Source |
| ---------- | ------- | ---- | --- | -------- | ------ | ------ |

### Interruption and reduced motion

## Accessibility

| Area | Published Material requirement | Source |
| ---- | ------------------------------ | ------ |

## Directionality and adaptation

| Condition | Required behavior | Source |
| --------- | ----------------- | ------ |

## Canonical conformance matrix

| ID  | Member | Variant | Size | Configuration | State | Scheme or direction | Requirements covered |
| --- | ------ | ------- | ---- | ------------- | ----- | ------------------- | -------------------- |

## Source conflicts

None.

<!-- When present, use: ID, conflicting sources, conflict, impact, unresolved decision. -->

## Source gaps

None.

<!-- Use `Not specified by the inspected Material sources`; never invent the missing rule. -->

## Design acceptance criteria

- [ ] The official target and family boundary are deterministic.
- [ ] Every applicable official component page was inspected.
- [ ] The complete official surface is represented.
- [ ] Variants, configurations, sizes, and states are distinct.
- [ ] Every normative claim is traceable to an inspected source.
- [ ] Missing guidance and conflicts are explicit.
- [ ] The conformance matrix covers every documented dimension.
- [ ] No Mioframe architecture, code, test, or migration decision is present.
```
