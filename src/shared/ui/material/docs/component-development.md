# Material component workflow

This is the only implementation workflow for an official public Material component family.

The process has one external implementation entry point and three internal stage owners. Supporting source, foundation, Vue, testing, and verification skills do not create parallel plans or choose the next stage.

## Workflow map

```text
material-component
→ lock one family and objective
→ material-component-contract
   documentation
   → implementation decomposition
   → style ownership
   → proof map and implementation order
→ material-foundation when the resolved contract requires it
→ material-component-implementation
   initial executable proof
   → implementation units
   → primary composed slice
   → representative consumer validation
   → complete supported family
→ material-component-adoption
→ independent material-component-review
→ verification
```

`material-component-review` may also be invoked directly for review-only work. It never becomes an implementation path.

## Invariants

- Work on exactly one component family per task and PR.
- `material-component` is the only implementation orchestrator.
- Internal stage skills do not invoke each other, choose another family, or update the roadmap.
- Follow the named phases in order and pass each exit gate before advancing.
- Do not begin production edits until the family contract, decomposition, style ownership, proof map, implementation order, and required foundation dependencies are ready.
- Create applicable initial failing proof before the production change it protects.
- Implement documented responsibility owners in order; do not write the complete family as one undifferentiated patch.
- Validate the primary architecture in one real representative consumer before expanding the full family.
- Review the complete result from a context independent of implementation reasoning.
- Do not report completion while an obsolete owner, compatibility path, unresolved decision, failed check, or required visual acceptance remains.
- Use repository code and consumers as compatibility evidence, not Material authority.
- Use current official Material sources as authority for Material semantics and visible contracts.
- Create no registry, inventory, durable audit, separate checklist, progress ledger, or second family contract.

## Task lock

`material-component` resolves and keeps fixed:

- one family;
- one change mode: `new-component`, `end-to-end-migration`, `library-relocation-only`, or `alignment-only`;
- one concrete objective;
- required user and component scenarios;
- explicit non-goals;
- the current phase and its next exit gate.

A family name is optional only when `docs/roadmap.md` already names one active family. Do not infer another family from an inventory or begin a second family.

Use `end-to-end-migration` by default for a legacy official family. Use a narrower mode only when it produces a complete independently valid result and the reason is recorded in the family contract.

**Exit gate:** family, mode, objective, scenarios, non-goals, current phase, and next gate are unambiguous.

## Contract and implementation blueprint

Owner: `material-component-contract`.

Before production edits:

1. inspect the current owner, public exports, direct consumers, tests, stories, snapshots, known defects, and applicable repository rules;
2. resolve the current official Material 3 Expressive requirements for the required scenarios;
3. identify the canonical owner under `components/<family>`;
4. define the minimum complete supported surface and explicit unsupported surface;
5. resolve public API, native semantics, accessibility, anatomy, DOM ownership, state ownership, token routing, and required proof;
6. identify only foundation domains required by this family;
7. decompose the implementation into explicit responsibility owners;
8. resolve style ownership and the ordered configuration → state → rendered-property route;
9. map every observable contract to one primary proof owner and identify applicable initial failing proof;
10. record the implementation order and representative consumer;
11. create or update `components/<family>/README.md`.

The family README is the only durable family contract and implementation blueprint:

```text
MATERIAL COMPONENT CONTRACT

Change mode:
Family:
Components:
Objective:
Required scenarios:
Non-goals:
Current owner:
Canonical owner:
Public export:
Affected consumers:
Representative consumer:
Official sources and snapshot:
Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics and accessibility:
Anatomy and DOM ownership:
State ownership and lifecycle:
Token and rendered-property routing:
Required foundation dependencies:

IMPLEMENTATION DECOMPOSITION
Public composition root:
API normalization and invalid combinations:
Native host and anatomy:
Semantic state resolution:
Interaction lifecycle:
Token selection:
Style owner:
Rendered-property application:
Foundation integrations:
Stories and fixtures:
Co-location decisions:

PROOF MAP
Observable contract → primary proof owner:
Initial failing proof:
Browser scenarios prepared before implementation:
Visual acceptance surface:
Consumer proof:

Implementation order:
Consumer migration:
Extensions or deviations: none | <records>
Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

Omit only objectively inapplicable fields. Do not replace unresolved decisions with placeholders or defer architecture to implementation.

The decomposition describes responsibility owners, not a universal file template. A concern with an independent reason to change or primary proof owner needs an explicit implementation owner. Co-location is valid only when the README explains why the responsibilities change and are proved together. A non-trivial visual contract normally has an owner-local stylesheet separate from the public Vue composition root.

When the contract proves that a cross-family foundation change is required, the orchestrator invokes `material-foundation` and resumes only after that foundation exit gate passes.

**Exit gate:** `Unresolved: none`, `Readiness: ready`, every decomposition and proof field is resolved, implementation order is explicit, and every required foundation dependency is available or reported as exact required foundation work.

## Component implementation

Owner: `material-component-implementation`.

### Checkpoint A — Initial executable proof

Before production edits, create or update the smallest applicable executable proof for already-resolved observable contracts:

- component contract tests for public API, native host, explicit attributes, ARIA ownership, controlled state, slots, emits, and invalid combinations;
- deterministic tests for extracted normalization, configuration, state-precedence, or lifecycle decisions;
- one regression test for a reproducible known defect when applicable.

Run the focused proof and confirm that it fails for the expected missing or incorrect contract, not because of broken setup, an invented internal API, or unrelated repository failure.

For contracts requiring a real browser, define the public-input scenario and expected observable result before implementation. A browser fixture or test may be prepared when it can express the public contract honestly, but do not force browser behavior into unit tests merely to obtain a pre-code failure.

Do not create or update a visual baseline before the rendered result is implemented, compared with official evidence, and accepted. A baseline protects an accepted visual contract; it does not establish correctness.

**Exit gate:** applicable initial proof exists and fails for the expected reason; browser scenarios and visual acceptance surface are defined; inapplicable pre-code proof is explicitly justified by proof ownership.

### Checkpoint B — Implementation units

Implement the responsibility owners recorded in the family README in the documented order. For each unit:

1. keep its inputs, outputs, dependencies, and owner explicit;
2. use red/green proof at the lowest faithful layer when the unit has an executable observable contract;
3. run focused verification before moving to the next dependent unit;
4. update the family contract only by returning an exact contract blocker when new evidence invalidates it.

Expected ownership:

- the public `.vue` component remains a thin composition root for the Vue API, native host, required anatomy, and integration of internal owners;
- independently testable normalization, invalid-combination handling, configuration selection, and state precedence use owner-local TypeScript modules when extraction improves ownership and proof;
- Vue or browser lifecycle uses focused composables rather than hidden managers;
- non-trivial visual contracts use owner-local stylesheets organized by configuration, state resolution, and final rendered-property application;
- foundation integrations remain narrow and family-agnostic on the foundation side;
- no extraction introduces unnecessary wrapper components, props, forwarding, or DOM nodes.

Do not implement the complete family in one `.vue`, `.ts`, or stylesheet when the contract identifies independent owners. Do not fragment simple cohesive code merely to satisfy an artifact count.

### Checkpoint C — Primary composed slice

Choose one representative configuration and compose the implemented units end to end:

- canonical production component and public entry point;
- native semantic and accessible owner;
- required anatomy without unnecessary DOM nodes;
- actual token-to-rendered-property route;
- required state and interaction path;
- one stable bounded canonical Storybook story;
- focused proof at the lowest faithful layers.

Do not implement every size, variant, configuration, or state before this slice is coherent.

### Checkpoint D — Representative consumer

Integrate the primary slice into the one representative consumer named by the contract and verify:

- public API usability in real composition;
- placement and parent-owned layout;
- attribute, slot, event, and state wiring;
- focus, keyboard, pointer, touch, disabled, and loading behavior when applicable;
- token inheritance and surrounding theme behavior;
- preservation of the required product scenario.

If this integration exposes an API, ownership, DOM, state, decomposition, style, or foundation defect, return an exact contract blocker. Do not patch the consumer around a wrong library contract.

### Checkpoint E — Complete supported family

Expand only the supported surface recorded in the contract:

- required components, variants, sizes, configurations, and states;
- invalid-combination handling;
- complete public props, emits, slots, attributes, and events;
- required interaction, ripple, focus, motion, cancellation, interruption, disabled, failure, and cleanup behavior;
- materially distinct Storybook examples and behavior fixtures;
- proportional component, browser, pure, and visual proof.

Rules:

- Consumer-controlled semantic state must not gain a hidden internal copy.
- Browser-owned facts such as hover and focus-visible remain browser or foundation owned.
- Every canonical token has one declaration owner.
- Configuration selects token sources; state resolves output; rendering applies the final value to the actual DOM owner.
- Use the shortest explicit route with clear ownership. Do not add aliases, managers, generic resolvers, universal bases, or files that merely move lines.
- Do not create Cartesian Storybook matrices or tests for framework behavior the project does not own.
- Create visual baselines only after official comparison and required operator acceptance of the prepared surface.

**Exit gate:** initial proof now passes, the implementation matches the documented decomposition, the public composition roots remain focused, the representative consumer works without contract workarounds, every supported family route is implemented and proved, and unsupported routes remain absent.

## Adoption

Owner: `material-component-adoption`.

For an end-to-end migration:

1. migrate every remaining in-repository consumer through the curated public API;
2. preserve accepted product behavior except for named intentional deltas;
3. verify only integration risks introduced by the migration;
4. remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, and compatibility paths.

Do not keep two active family owners. Do not leave permanent aliases or deferred cleanup for another PR.

**Exit gate:** all consumers use the canonical owner and no obsolete active path remains.

## Independent review

Owner: `material-component-review`.

The final review must run from a fresh agent session or an isolated read-only review context that did not implement the current patch. The reviewer receives the family, objective, required scenarios, current repository ref, and applicable operator evidence, then reconstructs the contract from current repository and official sources. Do not pass implementation reasoning, rejected approaches, or claims of correctness as review evidence.

When the environment cannot provide an independent context, stop and report `independent review handoff required`; do not substitute same-context self-review for the exit gate.

Review the complete resulting family, not only the latest diff. Compare official sources, the family contract, implementation decomposition, production code, actual rendered Storybook output, tests, direct consumers, and removed legacy ownership.

README text, tests, snapshots, stories, and green checks are claims or regression guards, not proof of Material correctness by themselves.

The review reports consolidated findings and exactly one verdict. The orchestrator routes corrections back to:

- `material-component-contract` for source, ownership, supported-surface, API, anatomy-contract, state-contract, decomposition, style ownership, proof-map, or foundation decisions;
- `material-component-implementation` for implementation units, composition roots, behavior, token routing, rendered properties, Storybook, or proof defects;
- `material-component-adoption` for consumer, compatibility, parallel-owner, or cleanup defects.

After corrections, run the complete independent review again.

When visible output changed, prepare the canonical Storybook location, bounded screenshots or diffs, official visual references, expected deviations, and confirmation that non-visual review is complete. The agent never invents operator acceptance.

**Exit gate:** independent review reports no unresolved blocker or major issue, and required operator visual acceptance is recorded.

## Verification and finish

Owner: `verification` through the orchestrator.

1. run focused checks during the owning implementation stage;
2. run final read-only `pnpm verify`;
3. update `docs/roadmap.md` only when active family, status, blocker, or single next action changes;
4. report the final family, change mode, supported and unsupported surface, foundation impact, decomposition, proof, consumer migration, removed ownership, review verdict, visual status, verification, and exact remaining blockers.

**Exit gate:** final verification passes and every required acceptance gate is complete.

## Stage result contract

Every internal stage returns:

```text
MATERIAL STAGE RESULT

Family:
Stage: contract | implementation | adoption | review
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Blocker: none | <exact blocker>
```

Only `material-component` chooses and starts the next stage.

## Progression and recovery

- Every intermediate report names the family, current phase, current objective, next exit gate, and exact blocker or `none`.
- Do not stop after research, contract writing, initial proof, Storybook preparation, a primary slice, or focused tests when end-to-end implementation was requested.
- Do not ask the user to choose variants, APIs, files, foundations, or tests that official sources and repository evidence can resolve.
- Do not start another family because the current family is blocked.
- If new evidence invalidates the contract, return explicitly to the contract owner.
- If two correction rounds retain the same defect, add workaround logic, or create ownership ambiguity, stop the patch strategy and require a fresh implementation session that reconstructs the responsible contract from current repository evidence.
- Persistent agent memory is never Material authority. Ignore memory that conflicts with the current repository and do not delete unrelated memory automatically.

## Proof ownership

- component contract tests: API, defaults, native owner, explicit attributes, ARIA, controlled state, slots, emits, invalid combinations, and non-browser wiring;
- browser behavior tests: real focus, keyboard, pointer/touch, target area, overlay, responsive behavior, ripple, motion lifecycle, cancellation, interruption, and cleanup owned by the family;
- pure tests: extracted deterministic logic or lifecycle only;
- visual regression: bounded protection of an already accepted stable rendered contract;
- consumer checks: compatibility and composition risks introduced by representative integration or migration;
- repository verification: format, lint, types, tests, build, and dependency guards selected by `verify`.

Generic foundation behavior is proved once by its owner. A family proves only its routing into that contract and its own semantics, anatomy, behavior, and rendering.

## Forbidden

- product or domain dependencies inside the Material family;
- public APIs shaped around one Mioframe consumer;
- speculative variants, abstractions, managers, registries, validators, extension points, or foundations;
- universal base components or cross-family component state machines;
- unnecessary DOM nodes;
- generic component test DSLs or public test-only API;
- universal file templates or mandatory artifact counts unrelated to resolved ownership;
- production edits before contract, decomposition, foundation, and initial-proof gates pass;
- visual baselines used to define correctness before official comparison and acceptance;
- screenshots used as proof of behavior or official correctness;
- permanent compatibility aliases, duplicated owners, or deferred cleanup;
- a second implementation workflow.
