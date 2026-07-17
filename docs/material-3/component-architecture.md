# Material 3 component architecture

Official component families live under:

```text
src/shared/ui/material/components/<official-component-docs-slug>/
```

The directory slug follows the official Material documentation path. For example, the Button family belongs under `components/buttons`, matching `m3.material.io/components/buttons`.

## Required family files

Every implemented or actively migrated family contains:

```text
README.md
AUDIT.md                    # created and replaced by material-component-review
index.ts
<Component>.vue
<Component>.test.ts
<Component>.stories.ts
... only justified implementation files
```

`AUDIT.md` may be absent before the first review. Do not create empty placeholders.

## `README.md` ownership

The family `README.md` is the current implementation documentation. The authoring workflow updates it whenever the supported surface or implementation state changes.

It must contain these sections:

```text
# <Official family name>

## Official documentation mapping
## Implemented
## Not implemented
## Known issues and required follow-up
## Public API and semantics
## Tokens, states, and property ownership
## Foundations and styles used
## Extensions and deviations
## Consumers and migration state
## Verification
## Review status
```

Sections may be concise, but they must be explicit.

### `Official documentation mapping`

Record:

- official family name;
- official documentation path and exact pages inspected;
- source snapshot or capture metadata;
- Design Kit reference only when used.

### `Implemented`

List only working supported capability:

- public components;
- variants, sizes, shapes, modes, and states;
- anatomy and native semantics;
- accessibility behavior;
- token and property routes;
- component-owned interaction behavior;
- consumer scenarios.

A declaration, alias, placeholder, story, or test does not count as implementation unless the final owned output works.

### `Not implemented`

List official capability intentionally outside the current supported surface. Explain briefly why it is omitted, such as no current consumer, missing official evidence, or separate official family ownership.

Unsupported capability is acceptable when documented honestly and does not break required scenarios.

### `Known issues and required follow-up`

Record every known item that is:

- defective;
- incomplete;
- implemented provisionally;
- not independently verified;
- dependent on unfinished foundation/style work;
- awaiting visual comparison;
- intentionally deferred but required by the claimed surface.

Never use `none` while a relevant audit finding, failing check, unresolved source question, or observed visible mismatch exists.

### `Review status`

Use one:

- `not reviewed`;
- `review required after changes`;
- `reviewed — see AUDIT.md`;
- `blocked — <reason>`.

Any production change affecting the documented contract changes this field to `review required after changes`. The authoring workflow does not edit `AUDIT.md`.

## `AUDIT.md` ownership

`AUDIT.md` is the latest independent compliance review for the family. `material-component-review` creates or replaces only this file.

It contains:

```text
# <Family> implementation audit

Reviewed:
Result: compliant | partially-compliant | non-compliant | blocked
Implementation documentation: README.md

## Official evidence
## Documentation claims reviewed
## Confirmed findings
## Evidence gaps
## Verified areas
## Required next work
```

Each finding states:

```text
Severity: critical | high | medium | low
Official requirement:
Implementation evidence:
Documentation claim:
Mismatch:
Required correction:
```

The audit checks both code and documentation. An undocumented omission is a documentation finding; a documented unsupported optional feature is not a defect by itself.

## Minimum complete surface

Implement the smallest coherent official surface required by current consumers and scenarios.

- Use the current canonical Expressive default when no narrower scenario exists.
- Include all reachable states, semantics, accessibility, and dependencies of the supported surface.
- Record unused official capability under `Not implemented`.
- Add no project extension without a current requirement and explicit documentation.

Minimum scope must still be internally complete and usable.

## Family boundary

Multiple components share one directory only when official Material documentation treats them as one family or they share a real current anatomy, token, state, or runtime contract.

Similar appearance or legacy adjacency is insufficient.

## Public contract and ownership

Keep explicit:

- typed props, emits, and slots;
- native element and DOM-critical attributes;
- controlled semantic state;
- anatomy and final rendered-property owners;
- invalid combinations and normalization;
- public exports and affected consumers.

Each semantic, interactive, accessibility, and rendered property has one owner.

## Tokens and motion

Use exact official meanings and the shortest route to the final property owner.

A route exists only when changing its source input can affect the final output through a real dependency. Colocation, aliases to unchanged constants, equality assertions, and comments do not create a dependency.

When official numeric spring parameters cannot be consumed directly on the Web, document them as source evidence and use one honestly documented Web adaptation as the runtime contract. Do not invent fake runtime consumption.

## Foundation and style dependencies

Map shared dependencies to the official navigation structure:

- cross-component layout, accessibility, or interaction concerns → `material/foundations/<slug>`;
- color, elevation, icons, motion, shape, or typography → `material/styles/<slug>`.

Use a shared owner only for a real cross-family contract. Keep a family-local behavior local when no shared contract exists.

Broad changes to root/system tokens, universal selectors, pseudo-elements, or shared formulas require explicit impact analysis across affected families.

## Proof

Every new or migrated component requires:

- colocated component-contract tests;
- one stable canonical visual story when visible.

Add browser, pure, consumer, state-matrix, and visual-regression proof only when the family owns the corresponding risk.

Do not test browser interpolation internals for ordinary CSS transitions. Verify the implementation contract and routing; the operator evaluates perceptual visual fidelity.

## Migration

An end-to-end migration:

- creates the canonical official-docs-slug directory;
- migrates public exports and consumers;
- removes obsolete implementation and exports;
- preserves accepted product behavior except for documented deltas;
- updates the family `README.md` truthfully;
- leaves no hidden incomplete work.

## Completion

Implementation work is finished only when:

- code matches the supported surface documented in `README.md`;
- all omissions and known issues are recorded;
- required consumers and exports are migrated;
- obsolete ownership is removed;
- applicable local verification passes;
- `README.md` says `review required after changes` until the independent audit is rerun.

The auditor, not the implementing agent, decides the result recorded in `AUDIT.md`.
