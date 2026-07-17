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

## Implementation scope and documentation coverage

Keep two concepts separate:

- **implementation scope** — the coherent capability currently implemented, selected by product scenarios and migration priority;
- **official capability inventory** — the complete contract-level surface published for the resolved Material 3 Expressive family.

Implementation may be incremental. The official capability inventory must be complete.

Current consumers determine what is implemented now. They do not determine what is documented. Every official capability must appear as implemented, partial/unverified, not implemented, unresolved, or outside the resolved family boundary.

Do not expand the inventory into one line per token when coherent grouping preserves traceability. Do not omit a public subcomponent, variant, configuration, state model, semantic/accessibility behavior, adaptive behavior, or documented interaction because the project does not currently use it.

## `README.md` ownership

The family `README.md` is the current project implementation documentation. The authoring workflow updates it whenever the supported surface or implementation state changes.

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
- official documentation path and every current family page inspected;
- source snapshot or capture metadata;
- Design Kit reference only when used;
- `Official capability inventory: complete | incomplete (<gap>)`;
- `Official coverage: full | partial | unresolved`.

`complete` means every official contract-level capability is classified. It does not mean every capability is implemented.

### `Implemented`

List only working supported capability:

- public components and subcomponents;
- variants, sizes, shapes, widths, modes, and states;
- anatomy and native semantics;
- accessibility behavior;
- token and final property routes;
- component-owned interaction and adaptive behavior;
- supported consumer scenarios.

A declaration, alias, placeholder, story, or test does not count as implementation unless the final owned output works.

### `Not implemented`

List every official capability absent from the implementation, regardless of whether a current consumer needs it.

A concise reason may explain priority or boundary, such as:

- not currently required by a consumer;
- planned later;
- depends on unfinished shared work;
- separate official subcomponent not yet implemented;
- canonical evidence exists but implementation has not started.

No-current-consumer is a reason for deferral, not a reason to omit the capability from documentation.

Unsupported capability is acceptable when documented honestly and the implemented surface remains coherent. `Official coverage` remains `partial` while any official capability is absent.

### `Known issues and required follow-up`

Record every known item that is:

- defective;
- partially implemented;
- implemented provisionally;
- not independently verified;
- dependent on unfinished foundation/style work;
- awaiting visual comparison;
- ambiguous because official evidence is incomplete or conflicting;
- intentionally deferred but required by an implemented claim.

Do not classify a partial capability as fully implemented or fully absent. Never use `none` while a relevant audit finding, failing check, unresolved source question, or observed visible mismatch exists.

### `Review status`

Use one:

- `not reviewed`;
- `review required after changes`;
- `reviewed — see AUDIT.md`;
- `blocked — <reason>`.

Any production change affecting the documented contract changes this field to `review required after changes`. The authoring workflow does not edit `AUDIT.md`.

## `AUDIT.md` ownership

`AUDIT.md` is the latest independent compliance and coverage review for the family. `material-component-review` creates or replaces only this file.

The audit uses three distinct evidence layers:

1. actual implementation evidence;
2. project implementation documentation, including the family README and directly applicable project contracts;
3. canonical Material 3 Expressive evidence.

The project documentation is the intended Mioframe contract, but it is not assumed to be correct relative to Material.

The auditor independently reconstructs the complete official capability inventory and performs two comparisons in order:

1. **Implementation vs project documentation** — verifies that code, exports, consumers, tests, stories, rendered behavior, and shared dependencies match the documented project contract and that absent or unfinished capability is not hidden.
2. **Project documentation vs Material 3 Expressive** — verifies that the documented project contract correctly interprets canonical Material, exhaustively classifies official capability, and marks Mioframe extensions or deviations explicitly.

This order prevents:

- accepting incorrect implementation merely because local documentation claims it is correct;
- changing correct implementation to match stale or incorrect local documentation;
- losing unused official capability because current consumers do not require it.

The audit contains:

```text
# <Family> implementation audit

Reviewed:
Result: compliant | partially-compliant | non-compliant | blocked
Official capability inventory: complete | incomplete | blocked
Official coverage: full | partial | unresolved
Project implementation documentation: README.md
Visual review: not required | required | blocked | accepted

## Evidence
### Project documentation reviewed
### Material 3 Expressive evidence

## Official capability coverage
### Implemented and verified
### Partial / defective / unverified
### Not implemented
### Unresolved evidence
### Outside this family boundary

## Stage 1 — implementation vs project documentation
### Findings
### Verified agreement

## Stage 2 — project documentation vs Material 3 Expressive
### Findings
### Verified agreement

## Evidence gaps
## Required next work
```

The audit independently lists all unimplemented official capability. It does not merely assert that the README list looks correct.

A Stage 1 finding states:

```text
Severity: critical | high | medium | low
Project requirement:
Implementation evidence:
Implementation-to-project mismatch:
Required correction:
```

A Stage 2 finding states:

```text
Severity: critical | high | medium | low
Material 3 Expressive requirement:
Project documentation claim:
Project-to-Material mismatch:
Required correction:
```

When both layers are wrong, the audit records both mismatches and the correction order. When implementation matches Material but project documentation is stale, documentation is corrected rather than regressing implementation.

An undocumented omission is a project-documentation finding. A documented optional unsupported feature is not automatically an implementation defect. A project extension is acceptable only when explicit, coherent, and not presented as canonical Material behavior.

## Compliance and official coverage

Compliance and coverage are separate:

- compliance describes whether the implemented surface, project documentation, and Material interpretation agree;
- coverage describes how much of the complete official family surface is implemented.

Use coverage:

- `full` — every official capability in the resolved family is implemented and verified;
- `partial` — at least one official capability is not implemented, partial, defective, provisional, or unverified;
- `unresolved` — canonical evidence is insufficient to complete the inventory.

A family with partial coverage may have a technically correct implemented subset, but it must not be called fully implemented.

## Minimum complete implemented surface

Implement the smallest coherent official surface required by current consumers and scenarios.

- Use the current canonical Expressive default when no narrower scenario exists.
- Include all reachable states, semantics, accessibility, and dependencies of the implemented surface.
- Classify every unused official capability under `Not implemented`.
- Add no project extension without a current requirement and explicit documentation.

The implemented scope must be internally complete and usable. The documentation inventory must cover the whole official family.

## Family boundary

Multiple components share one directory only when official Material documentation treats them as one family or they share a real current anatomy, token, state, or runtime contract.

Similar appearance or legacy adjacency is insufficient. Official capability outside the resolved family is recorded with its separate owner, not misclassified as an unimplemented member of the current family.

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

When official numeric spring parameters cannot be consumed directly on the Web, document them as canonical source evidence and use one honestly documented Web adaptation as the project runtime contract. Do not invent fake runtime consumption or describe the adaptation as the original spring model.

## Foundation and style dependencies

Map shared dependencies to the official navigation structure:

- cross-component layout, accessibility, or interaction concerns → `material/foundations/<slug>`;
- color, elevation, icons, motion, shape, or typography → `material/styles/<slug>`.

Use a shared owner only for a real cross-family contract. Keep family-local behavior local when no shared contract exists.

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
- leaves no hidden incomplete or unclassified official capability.

## Completion

Implementation work is finished only when:

- code matches the implemented surface documented in `README.md`;
- the complete official capability inventory is recorded;
- every absent capability is listed under `Not implemented`;
- every partial, defective, or unverified capability is recorded under known issues;
- required consumers and exports are migrated;
- obsolete ownership is removed;
- applicable local verification passes;
- `README.md` says `review required after changes` until the independent audit is rerun.

A family is compliant only when the independent audit confirms both comparison stages. A family is fully implemented only when the independent audit also reports `Official coverage: full`.