# Material component convergence workflow

This is the only implementation workflow for an official public Material component family.

The workflow must improve an existing family from any current state without treating legacy code as Material authority and without requiring a full-family rewrite by default. It preserves independently confirmed owners, corrects explicit gaps in complete units, and keeps the repository valid after every merged PR.

## Workflow map

```text
material-component
→ lock one family, mode, correction objective, and required scenarios
→ material-component-contract
   canonical target
   → current implementation assessment
   → alignment map
   → correction units
   → decomposition, proof, compatibility, and foundation decisions
→ material-foundation when an exact cross-family prerequisite is required
→ material-component-implementation
   failing or prepared proof for the next correction unit
   → correction unit implementation
   → focused verification
   → representative consumer when affected
   → repeat for the current objective
→ material-component-adoption only when canonical ownership is ready and adoption is in scope
→ independent material-component-review
→ verification
→ next correction unit or family completion
```

`material-component-review` may also be invoked directly for review-only work. It never becomes an implementation path.

## Invariants

- Work on exactly one component family per task and PR.
- One PR may complete the family or one bounded correction objective; it must always leave an independently valid repository state.
- `material-component` is the only implementation orchestrator.
- Internal stage skills do not invoke each other, choose another family, or update the roadmap.
- Resolve the canonical target before using legacy implementation behavior to make Material decisions.
- Treat current code, tests, stories, snapshots, and consumers as current-state and compatibility evidence only.
- Preserve confirmed implementation owners; do not reset correct work merely because another concern is wrong.
- Do not begin a correction unit until its target, owner, dependencies, proof, compatibility impact, and completion condition are resolved.
- Create applicable failing proof before the production change it protects.
- Validate affected real composition before broad consumer migration.
- Review the complete current family state and the current correction objective from a context independent of implementation reasoning.
- Do not report family completion while a required concern is `misaligned`, `unresolved`, or `obsolete`.
- Do not merge an incomplete mechanism that relies on promised later cleanup to be correct.
- Create no registry, inventory, durable audit, separate checklist, progress ledger, or second family contract.

## Task lock

`material-component` resolves and keeps fixed:

- one family;
- one mode: `new-component`, `align-existing`, or `focused-correction`;
- one concrete correction objective;
- required user and component scenarios;
- explicit non-goals;
- current phase and next exit gate.

Use:

- `new-component` only when no active implementation owner exists;
- `align-existing` by default for any existing official family, regardless of current quality or location;
- `focused-correction` when an exact documented gap already exists and the surrounding canonical target is stable.

Relocation, decomposition, API preservation, consumer migration, and cleanup are actions inside the workflow, not modes and not evidence of Material correctness.

A request to migrate or relocate an existing family still uses `align-existing` unless prior independent evidence proves the current implementation already matches the applicable canonical target.

**Exit gate:** family, mode, objective, required scenarios, non-goals, current phase, and next gate are unambiguous.

## Contract, assessment, and correction blueprint

Owner: `material-component-contract`.

### Pass 1 — Canonical target

Before evaluating whether existing implementation is correct:

1. read applicable repository rules and confirmed required scenarios;
2. resolve current official Material 3 Expressive usage, surface, semantics, anatomy, accessibility, states, configurations, tokens, geometry, motion, and foundation requirements;
3. record exact source provenance and unresolved contradictions;
4. define the minimum complete supported surface and explicit unsupported surface;
5. resolve the canonical public contract and ownership boundaries.

Do not copy existing API, DOM, CSS, state, tests, or stories into the canonical target merely because consumers already use them.

When official evidence is missing, stale, suspicious, or contradictory, record the exact unresolved decision. Narrow optional surface when the required scenarios remain complete; otherwise block the affected correction. Do not silently choose the legacy behavior.

### Pass 2 — Current implementation assessment

After the canonical target is recorded, inspect:

- active and legacy owners;
- public exports and direct consumers;
- API and native semantics;
- DOM and anatomy;
- state and lifecycle;
- foundation dependencies;
- token routing, rendered properties, styles, and motion;
- tests, stories, snapshots, browser fixtures, and known defects;
- compatibility obligations and project extensions.

Classify existing proof as one of:

- `canonical-proof`;
- `compatibility-proof`;
- `implementation-detail-test`;
- `legacy-defect-preservation`;
- `obsolete`.

Existing proof is never accepted automatically because it passes or was previously reviewed.

### Alignment map

For every concern relevant to the supported surface or current objective, record:

```text
CURRENT IMPLEMENTATION ASSESSMENT

Concern:
Canonical target:
Current behavior:
Classification: confirmed-compliant | project-extension | misaligned | unresolved | obsolete
Implementation owner:
Primary proof:
Required correction: none | <exact correction>
```

Classification rules:

- `confirmed-compliant`: matches the canonical target, has correct ownership, and has faithful proof;
- `project-extension`: needed by a current Mioframe scenario, explicitly owned, compatible with Material, and separately proved;
- `misaligned`: behavior, ownership, structure, rendering, or proof differs from the target;
- `unresolved`: evidence or required product decision is insufficient or contradictory;
- `obsolete`: replaced or unnecessary implementation, contract, proof, export, or compatibility path.

Consumer dependence does not upgrade a concern to `confirmed-compliant`. It creates a compatibility obligation.

### Implementation decomposition

Map each applicable concern to one implementation owner with:

- inputs and outputs;
- allowed dependencies;
- observable contract;
- primary proof;
- reason for separation or co-location.

A concern with an independent reason to change or primary proof owner needs an explicit implementation owner. Co-location is valid only when the concerns change and are proved together. Do not create files merely to reduce line count, and do not retain monoliths merely because they already exist.

A non-trivial visual contract has explicit style ownership. One cohesive stylesheet is allowed only when configuration, token selection, state resolution, rendered-property application, and motion remain understandable under one owner. Otherwise document narrower style owners without introducing unnecessary Vue wrappers or DOM.

### Correction units

Select the smallest complete units required by the current objective. Each unit records:

```text
CORRECTION UNIT

Gap:
Affected scenarios:
Canonical expected behavior:
Current defect:
Implementation owner:
Dependencies:
Primary failing or prepared proof:
Compatibility impact:
Completion condition:
```

Prefer this order when multiple gaps are required:

1. unresolved official decisions;
2. foundation prerequisites;
3. native semantics and accessibility;
4. public API and invalid combinations;
5. state ownership and precedence;
6. anatomy and DOM;
7. token and rendered-property routing;
8. styles and geometry;
9. motion and browser behavior;
10. project extensions;
11. consumer adoption;
12. obsolete-owner removal.

A unit may replace one local owner when that owner is predominantly wrong or incremental repair would add more workaround logic than replacement. Do not infer that the whole family must be rewritten.

### Family README

The family README is the only durable contract, current-state assessment, alignment map, and correction blueprint:

```text
MATERIAL COMPONENT CONTRACT

Mode:
Family:
Components:
Current objective:
Required scenarios:
Non-goals:
Current owner:
Canonical owner:
Public export:
Affected consumers:
Representative consumers:
Official sources and snapshot:
Supported Material surface:
Unsupported Material surface:
Canonical public API:
Native semantics and accessibility:
Canonical anatomy and DOM ownership:
Canonical state ownership and lifecycle:
Canonical token, style, motion, and rendered-property routing:
Required foundation dependencies:

CURRENT IMPLEMENTATION ASSESSMENT
<one alignment-map entry per applicable concern>

IMPLEMENTATION DECOMPOSITION
Public composition root:
API normalization and invalid combinations:
Native host and anatomy:
Semantic state resolution:
Interaction lifecycle:
Token selection:
Style owners:
Rendered-property application:
Motion owner:
Foundation integrations:
Stories and fixtures:
Co-location decisions:

PROOF MAP
Observable contract → primary proof owner:
Existing proof classification:
Initial failing or prepared proof:
Browser scenarios prepared before implementation:
Visual acceptance surface:
Consumer proof:

CORRECTION UNITS
Current correction units:
Implementation order:
Consumer migration:
Obsolete-owner removal:
Extensions or deviations: none | <records>
Required unresolved decisions: none | <blocking decisions>
Remaining known gaps: none | <non-blocking gaps outside current objective>
Current objective readiness: ready | blocked
Family alignment status: aligned | converging | blocked
```

Omit only objectively inapplicable fields. Do not replace unresolved decisions with placeholders or defer architecture to implementation.

A family may be `converging` while a correction objective is ready. This is valid only when remaining gaps are honestly recorded, outside the current objective, and do not make the current supported surface or merged repository state incorrect.

When the assessment proves that a cross-family foundation change is required, the orchestrator invokes `material-foundation` and resumes only after that exact prerequisite is complete.

**Contract exit gate:** canonical target resolved for the current objective; assessment and proof classifications complete; current correction units, owners, decomposition, compatibility impact, foundation requirements, and completion conditions explicit; `Current objective readiness: ready`.

## Component implementation

Owner: `material-component-implementation`.

### Correction-unit loop

For each current correction unit:

1. create or update the smallest faithful executable proof for the resolved observable contract;
2. confirm it fails for the expected missing or incorrect behavior when a pre-code executable proof is applicable;
3. implement only the documented owner changes required by the unit;
4. run focused verification;
5. validate affected browser behavior and representative consumers;
6. update the alignment map from evidence;
7. continue only when the unit completion condition is met.

For real browser, layout, focus, pointer, ripple, motion, target-area, responsive, or platform behavior, define public inputs and expected observable results before implementation. Do not force them into unit tests merely to obtain a red check.

Do not create or update a visual baseline before the rendered result is implemented, compared with official evidence, and accepted. A baseline protects an accepted rendered contract; it does not establish correctness.

### Implementation ownership

- Public `.vue` components remain thin composition roots for public Vue API, native host, required anatomy, and integration of internal owners.
- Independently testable normalization, configuration selection, invalid combinations, and state precedence use owner-local TypeScript modules when this improves ownership and proof.
- Vue or browser lifecycle uses focused composables rather than hidden managers.
- Non-trivial visual contracts use explicit owner-local style ownership organized by configuration, token selection, state resolution, rendered-property application, and motion.
- Foundation integrations remain narrow and family-agnostic on the foundation side.
- No extraction introduces unnecessary wrapper components, forwarding, or DOM nodes.

Do not preserve an existing owner merely to minimize diff size. Do not replace an existing owner merely to make the implementation look new. Choose the smaller complete change that produces correct ownership and behavior.

If implementation evidence invalidates the canonical target, assessment, classification, decomposition, proof, compatibility, or foundation decision, return an exact blocker to the contract stage. Preserve already completed and still-valid units.

### Representative consumer

Validate every consumer category materially affected by the correction. Use at least one real representative consumer when the unit changes public API, composition, native behavior, token inheritance, layout interaction, or visible output.

Verify:

- public API usability in real composition;
- placement and parent-owned layout;
- attribute, slot, event, and state wiring;
- focus, keyboard, pointer, touch, disabled, loading, and interruption behavior when applicable;
- token inheritance and surrounding theme behavior;
- preservation of required product scenarios.

Do not patch a consumer around a wrong library contract.

**Implementation exit gate:** every current correction unit meets its completion condition; applicable proof passes; affected consumers work without workarounds; the alignment map is updated honestly; no required foundation gap remains; the repository is independently valid even when the family remains `converging`.

## Adoption

Owner: `material-component-adoption`.

Adoption is conditional. Run it only when:

- the current objective includes relocation, public-entry migration, or obsolete-owner removal;
- the canonical implementation owner is ready for every consumer being moved;
- no consumer is being migrated onto a known misaligned contract.

Then:

1. migrate the in-scope consumers through the curated public API;
2. preserve accepted product scenarios except for named intentional deltas;
3. verify only migration-specific integration risks;
4. remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, aliases, and compatibility paths that the current objective replaces.

A focused correction may complete without adoption when ownership and import paths do not change. Do not create two active family owners or permanent aliases.

**Adoption exit gate:** all in-scope consumers use the intended owner, required scenarios remain preserved, and no obsolete path covered by the current objective remains.

## Independent review

Owner: `material-component-review`.

Run from a fresh agent session or isolated read-only context that did not implement the current patch. The reviewer receives the family, current correction objective, required scenarios, current repository ref, and applicable operator evidence, then reconstructs the canonical target and current state from repository and official sources.

Review the complete family state, not only the latest diff. Separately determine:

- whether the current correction objective is complete and mergeable;
- whether the family is `aligned`, `converging`, or `blocked` overall.

The reviewer must compare canonical target, alignment map, implementation, actual rendered output, proof, consumers, and semantic delta from the previous owner. A relocation, decomposition, renamed file, new test, stable screenshot, or green CI must not be accepted as Material improvement without a source-backed or ownership-backed delta.

Route findings to:

- `material-component-contract` for target, source conflict, classification, supported surface, ownership, API, anatomy contract, state contract, decomposition, proof map, compatibility, correction-unit, or foundation decisions;
- `material-component-implementation` for production owners, composition, behavior, DOM, token routing, rendered properties, motion, Storybook, or proof defects;
- `material-component-adoption` for consumer migration, parallel ownership, stale references, compatibility residue, or cleanup defects.

After corrections, run the complete independent review again.

When visible output changes, prepare canonical Storybook locations, bounded screenshots or diffs, official visual references, expected deviations, and confirmation that non-visual review is complete. The agent never invents operator acceptance.

**Review exit gate for the current PR:** independent context confirmed; no blocker or major issue in the current correction objective; remaining family gaps are honestly classified and outside the objective; required operator visual acceptance for changed output is `not required` or `accepted`.

Family completion additionally requires no required `misaligned`, `unresolved`, or `obsolete` concern.

## Verification and finish

Owner: `verification` through the orchestrator.

1. run focused checks during each correction unit;
2. run final read-only `pnpm verify` on the final head;
3. update `docs/roadmap.md` only when active family, status, blocker, or one next action changes;
4. report current objective completion separately from family alignment status.

A completed focused correction may merge while the family remains `converging` only when the merged state is fully valid, the remaining gaps are non-blocking and explicit, and one next correction action is recorded.

**Exit gate:** current objective, review, operator acceptance, and final verification pass. Family completion requires `Family alignment status: aligned`.

## Stage result contract

Every internal stage returns:

```text
MATERIAL STAGE RESULT

Family:
Stage: contract | implementation | adoption | review
Status: complete | blocked
Exit gate: passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Evidence:
Changed ownership:
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

Only `material-component` chooses and starts the next stage.

## Progression and recovery

- Every intermediate report names the family, mode, current correction objective, current phase, next exit gate, and exact blocker or `none`.
- Do not ask the user to choose variants, APIs, files, foundations, or tests that official sources and repository evidence can resolve.
- Do not start another family because the current family is blocked or converging.
- If new evidence invalidates a decision, return to the owning stage and preserve unaffected confirmed work.
- If two correction rounds retain the same defect, add workaround logic, or create ownership ambiguity, stop the patch strategy and require a fresh agent session.
- A fresh session reloads the current repository, canonical target, alignment map, confirmed owners, unresolved findings, and next correction unit. It does not reset code by default.
- Rewrite only the smallest owner when replacement is demonstrably simpler and safer than further correction.
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
- public APIs shaped around one Mioframe consumer or copied from legacy without canonical assessment;
- treating existing code, tests, stories, snapshots, or consumer dependence as Material authority;
- blanket `preserve behavior`, `relocation only`, or `verbatim copy` decisions before alignment assessment;
- tests that preserve a legacy defect or implementation detail as canonical behavior;
- speculative variants, abstractions, managers, registries, validators, extension points, or foundations;
- universal base components or cross-family component state machines;
- unnecessary DOM nodes;
- universal file templates or mandatory artifact counts unrelated to resolved ownership;
- production edits before the current correction-unit target and proof gates pass;
- visual baselines used to define correctness before official comparison and acceptance;
- permanent compatibility aliases, duplicated owners, or knowingly broken intermediate states;
- deleting or rewriting the entire family when correction of smaller owners is sufficient;
- a second implementation workflow.
