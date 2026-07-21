# Material component convergence workflow

This is the canonical workflow for creating, repairing, migrating, or completing one official public Material component family from its family name or an explicitly bounded objective.

The coding agent owns technical discovery, architecture, prerequisites, implementation, proof, documentation, and continuation. The operator owns Git operations and repository publication workflow.

## Invocation contract

Invocation scope is determined from the current request:

- `material-component <family>` means `full-family`;
- `focused-correction` exists only when the operator explicitly names a bounded objective;
- a delegated dependency call is `prerequisite-contract` and completes only when that exact public contract is ready or externally blocked.

Persisted README, roadmap, backlog, or previous `Current objective` text cannot narrow a `full-family` invocation.

A correction unit is a bounded implementation/review unit, not a run boundary. For `full-family`, `converging` is internal progress. Terminal results are only `aligned` or `blocked`.

## Portable agent model

Policy lives in scoped `AGENTS.md`, portable `.agents/skills`, this documentation, and the owning family README. Tool-specific agent directories and Git/PR metadata are not policy owners.

Keep orientation, contract synthesis, correction selection, implementation, adoption, prerequisite advancement, state updates, and continuation in the orchestrator context. Use isolated read-only contexts for source research, verbose concern audits, browser evidence, and independent review when supported.

## Sequence

```text
material-component <family>
→ resolve invocation scope
→ canonicalization preflight
→ one bounded family orientation
→ concern-lane and dependency plan
→ selected target research and audits
→ synthesize highest-priority complete correction contract
→ independent contract gate
→ complete exact foundation or official-family prerequisite
→ implement one bounded correction unit
→ conditional adoption and obsolete-owner cleanup
→ focused proof
→ independent correction-final gate
→ refresh affected state and preflight
→ repeat while any required gap or internal prerequisite remains
→ independent material-family-review
→ final verification
```

Production edits are forbidden before the correction contract gate passes. A required prerequisite completes before the calling correction continues.

## Canonicalization preflight

Before selecting any correction, reconstruct current architecture from code rather than trusting persisted status:

```text
CANONICALIZATION PREFLIGHT
Family:
Invocation scope: full-family | focused-correction | prerequisite-contract
Candidate canonical owner:
Public export present: yes | no
Migrated consumers: none | <summary>
Legacy owner state: active | forwarding-only | removed | absent
Direct imports and injected dependencies:
Required CSS/token dependencies:
Legacy Material dependencies:
Dependency closure: closed | blocked
Persisted workflow state: valid | stale | conflicting
```

Always inspect the candidate owner's real imports, styles, token references, public exports, representative consumers, and legacy owner state.

Persisted state may preserve independently confirmed target and behavior facts. It may not preserve a stale objective, scope, alignment result, dependency conclusion, or review history when current code or rules contradict it.

When state is stale, normalize the README before continuing. Previous canonicalization is an architecture claim that must be revalidated; passing behavior tests do not prove it.

## Family orientation

After preflight, record one concise map:

```text
FAMILY ORIENTATION
Family:
Invocation scope:
Mode: new-component | align-existing | focused-correction
Candidate canonical owner:
Legacy or missing owners:
Public entry points:
Family files:
Direct dependencies:
Representative consumers:
Proof owners:
Locked target claims:
Known unresolved concerns:
```

Read applicable instructions and Material documents, then the owning README, implementation, dependencies, exports, consumers, and proof. Expand search only for a named dependency, compatibility path, or ownership question.

Do not repeat complete orientation after each unit. Refresh only invalidated facts.

## Concern plan

Record:

```text
CONCERN PLAN
Invocation scope:
Objective:
Required scenarios and platforms:
Non-goals:
Target claims requiring research:
Semantics lane: required | not-required — reason
Token lane: required | not-required — reason
Web lane: required | not-required — reason
Required direct dependencies:
Dependency closure: closed | blocked
Foundation prerequisite: none | <exact contract>
Official-family prerequisite: none | <exact public contract>
Canonicalization trigger: yes | no
Adoption scope: none | <exact consumers/owners>
```

New families and `full-family` work require every applicable lane. A focused correction runs only affected lanes and direct dependencies unless a canonicalization trigger widens scope.

## Dependency closure and prerequisites

Every required dependency resolves to one ready owner:

- canonical Material foundation;
- canonical official Material family public contract;
- valid generic non-Material foundation;
- explicit Mioframe extension owner.

Classify each as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

Closure is blocked by required temporary legacy Material ownership, missing or unresolved reference/system tokens, unowned shared behavior, known-defective contracts, private cross-family imports, hidden required fallbacks, dependency cycles, or parallel active owners.

A dependency remains inside the calling family's orchestration even when another owner implements it. `Out of family ownership` never means `out of workflow scope`.

When closure is blocked:

1. select dependency ownership before lower-priority local defects affecting the same surface;
2. invoke `material-foundation` for the smallest coherent family-agnostic contract;
3. invoke the owning `material-component` for another official family until the exact public contract is ready;
4. return to the caller automatically;
5. stop only for an exact external blocker or cycle.

An internal prerequisite is work, not a terminal blocker and not a future operator track.

Maintain a prerequisite stack and report exact cycles.

## Canonicalization triggers

The following automatically require complete dependency closure for the supported surface:

- creating or preserving a candidate canonical owner;
- creating or changing the Material root export;
- migrating a consumer to the candidate owner;
- deleting or forwarding the legacy owner;
- claiming canonical, migrated, adoption-complete, or aligned status.

While closure is blocked, do not:

- add or retain the candidate as a ready root export;
- migrate additional consumers;
- remove the only complete legacy owner;
- declare adoption complete;
- classify an actually used dependency as outside the correction.

When resuming a prematurely canonicalized family, close dependencies or safely roll back premature export/adoption before lower-priority local work.

## Target and audit evidence

Use `material-canonical-target` only for missing or invalidated claims. Existing implementation, tests, consumers, and snapshots are evidence, not authority.

Selected read-only audits own separate lanes:

- semantics: API, native/form/event behavior, accessibility, state, extensions, consumers, dependencies;
- token: taxonomy, owners, graph direction, routing, rendered token proof;
- Web: DOM, CSS, layout, adaptive behavior, motion lifecycle, browser and visual proof.

A role reports another-lane dependency to the orchestrator instead of absorbing or discarding it.

Reuse accepted evidence until source, implementation, proof, reviewer, platform, supported-surface, or operator evidence contradicts it. A new session or correction unit does not invalidate accepted evidence.

## Contract synthesis and correction order

Select the smallest complete highest-priority unit:

1. unresolved required source or platform decision;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token ownership, naming, placement, graph, and rendered routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion implementation and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

A lower-priority correction cannot bypass a higher-priority blocker affecting the same supported surface.

## Review scope

`material-component-review` verifies one correction, but it must independently reconstruct actual imports and dependency owners for the affected canonical surface.

Review scope automatically widens to complete dependency closure when the correction creates or preserves a canonical owner, changes a root export, migrates consumers, removes a legacy owner, or claims adoption/alignment.

The reviewer does not trust a supplied dependency inventory as complete and cannot accept a real dependency as `outside this unit` merely because the orchestrator omitted it.

## Convergence

After each accepted correction:

1. update affected facts only;
2. rerun canonicalization preflight when owners, exports, imports, dependencies, consumers, or prerequisites changed;
3. reclassify remaining required concerns;
4. select the next highest-priority complete correction;
5. continue in the same invocation.

Do not stop while a required gap, internal prerequisite, failed Material boundary guard, or repairable verification failure remains.

## Workflow state

The owning README contains one compact current-state block:

```text
MATERIAL WORKFLOW STATE
Family:
Invocation scope:
Mode:
Current objective:
Current stage: preflight | orientation | target | assessment | contract-review | prerequisite | implementation | adoption | correction-review | family-review | verification
Canonical target status: draft | locked | reopened
Candidate canonical owner:
Dependency closure: closed | blocked
Prerequisite stack: none | <ordered stack>
Current correction unit: none | <exact unit>
Implementation status: not-started | complete | blocked
Correction review status: not-started | passed | failed
Family review status: not-started | complete | blocked
Operator visual status: not-required | required | accepted | rejected
Family alignment status: aligned | converging | blocked
Remaining required gaps: none | <exact gaps>
Next action:
Blocker: none | <external blocker only>
```

Store current target, classifications, durable contracts, proof obligations, dependency state, current unit, and remaining gaps. Do not store review history, shell transcripts, search output, route inventories, stage diaries, scorecards, superseded objectives, or future-pass narratives.

## Proof

- unit/component: deterministic API, state, native attributes, token graph, dependency mapping, and routing;
- browser: computed values, layout, focus, keyboard, forms, propagation, pointer/touch, adaptive behavior, animation lifecycle, cancellation, and reduced motion;
- visual: screenshots and official comparison only;
- consumer: integration and compatibility;
- architecture: Material boundary, single-owner, dependency, and repository guards.

Visible changes require operator comparison. Browser behavior is not proved by screenshots alone.

## Terminal semantics

For `full-family`, `converging` is never a final result.

`aligned` requires:

- no required misaligned, unresolved, obsolete, or temporary legacy concern;
- complete dependency closure and completed prerequisites;
- valid semantic, token, DOM, style, and motion contracts;
- one canonical owner and intended public API;
- completed adoption and cleanup;
- sufficient proof and operator acceptance when required;
- `material-family-review: complete`;
- final `pnpm verify` passed.

`blocked` requires an exact unresolved official-source conflict, product decision, platform applicability question, unsafe dependency cycle, unavailable required browser/visual evidence, repeated independent review failure, operator rejection, or verification failure that cannot be corrected within the family or exact prerequisites.

A known next correction, internal prerequisite, ownership outside the family, stale state, or repairable red check is not a terminal blocker.

Do not create duplicate contracts, durable audits, registries, inventories, scorecards, checklists, progress ledgers, or workflow-history documents.
