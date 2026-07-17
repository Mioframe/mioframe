---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants an independent review against official Material 3 Expressive documentation. Replace the family AUDIT.md without modifying implementation.'
---

# Material component review

Use this as the one-name, review-only entrypoint.

## Input

```text
material-component-review Button
material-component-review Switch
material-component-review Navigation rail
```

The component name is sufficient.

## Review boundary

Resolve the official documentation family and canonical directory:

```text
src/shared/ui/material/components/<official-docs-slug>/
```

The only file changed by this workflow is:

```text
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

Do not modify production code, tests, stories, family `README.md`, exports, consumers, roadmap, registries, or policy during review.

The audit contains no branch, commit, pull-request, remote-check, or merge metadata.

## Resolve evidence

1. Resolve current official Material 3 Expressive pages and exact token references.
2. Read the family `README.md` as the implementation's current claims.
3. Inspect production code, exports, consumers, tests, and stories.
4. Inspect applicable foundation and style owners.
5. Inspect the previous `AUDIT.md` when present, but re-evaluate every conclusion.

Existing code, documentation, tests, snapshots, and rendering are claims and evidence, not Material authority.

## Review implementation documentation

Check that the README states truthfully:

- official documentation mapping;
- implemented surface;
- official capability not implemented;
- known issues and required follow-up;
- API and native semantics;
- tokens, states, and final property ownership;
- foundations and styles used;
- extensions and deviations;
- consumers and migration state;
- verification and review status.

For every `Implemented` claim, verify that the final owned output works.

A declaration, alias, placeholder, story, or test is not implementation by itself. A route exists only when changing its source input can affect the final output through a real dependency.

An undocumented omission, defect, provisional route, missing verification, or visible mismatch is a finding. A documented optional capability intentionally outside the supported surface is not a defect by itself.

## Review supported contract

Check applicable:

- component choice and family boundary;
- variants, sizes, shapes, modes, defaults, and invalid combinations;
- public API, controlled state, native semantics, and accessibility;
- anatomy and DOM/property ownership;
- color, elevation, icons, motion, shape, typography, interaction state, ripple, and focus;
- consumer compatibility and obsolete ownership;
- proportional tests and visual evidence;
- consistency between README and implementation.

Review only capability claimed by the README or required by current consumers. Still report official capability omitted without documentation.

## Motion and shared routes

For motion, verify:

- official requirement;
- accepted runtime contract;
- actual animated property owner;
- state routing;
- absence of dead tokens or conflicting timing;
- reduced-motion handling when required.

Do not require frame-by-frame browser analysis for ordinary CSS transitions.

When numeric official spring parameters cannot drive CSS directly, they may remain documented source evidence while one honest Web adaptation is the runtime contract. Do not accept fake consumption through colocation or equal aliases.

Treat root/system token, universal-selector, pseudo-element, and shared-formula changes as cross-family work. Require explicit affected-family analysis and representative proof.

## Findings

Each finding uses:

```text
Severity: critical | high | medium | low
Official requirement:
Implementation evidence:
Documentation claim:
Mismatch:
Required correction:
```

Use:

- `critical` — invalid component choice, unsafe semantics, severe accessibility or interaction corruption;
- `high` — required API, state, token, motion, ownership, migration, or major visual contract is wrong;
- `medium` — bounded mismatch, incomplete proof, or misleading/incomplete documentation;
- `low` — minor documentation or cleanup defect.

Do not report speculation as a finding. Put unresolved authoritative evidence under `Evidence gaps`.

## Result

Use exactly one:

- `compliant` — every claimed and required technical contract passes and the README truthfully records unsupported and remaining work;
- `partially-compliant` — usable, but confirmed non-critical defects, documentation gaps, or verification gaps remain;
- `non-compliant` — a critical or high defect invalidates a required or claimed contract;
- `blocked` — authoritative evidence required for review is unavailable or materially conflicting.

Visual comparison may still be required after a technically compliant audit. Record it separately; do not hide technical findings behind operator review.

## AUDIT.md structure

Replace the family audit with:

```text
# <Family> implementation audit

Reviewed: <date>
Result: compliant | partially-compliant | non-compliant | blocked
Implementation documentation: README.md
Visual review: not required | required | blocked | accepted

## Official evidence
## Documentation claims reviewed
## Confirmed findings
## Evidence gaps
## Verified areas
## Required next work
```

Use explicit `none` for empty findings and gaps.

## Output

Finish with:

```text
MATERIAL COMPONENT REVIEW
Official family:
Official documentation path:
Implementation path:
Implementation documentation: <path>/README.md
Audit file: <path>/AUDIT.md
Result:
Visual review:
Confirmed findings:
Evidence gaps:
Verified areas:
Required next work:
```

A review is complete only after the colocated `AUDIT.md` is written.