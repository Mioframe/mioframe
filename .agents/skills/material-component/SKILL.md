---
name: material-component
description: 'Use when the user provides a Material component or family name and wants it created, implemented, migrated, or aligned. The component name is sufficient input: resolve the official family, current ownership, change mode, supported surface, consumers, and required proof, then run material-component-authoring end to end.'
---

# Material component

Use this as the one-name entry point for Material 3 Expressive component work.

Expected invocation:

```text
material-component <component-or-family-name>
```

Examples:

```text
material-component Button
material-component MDButton
material-component Switch
material-component Navigation rail
```

This skill selects and starts the work. `material-component-authoring` remains the canonical execution workflow and owns implementation order, completion gates, and rule refinement.

## Input contract

The only required input is one Material component or family name.

Do not ask the user to predefine:

- scenarios;
- variants, sizes, states, or anatomy;
- public API;
- foundation dependencies;
- official source pages;
- file structure;
- testing layers;
- migration consumers.

Derive those facts from official Material sources and the repository.

Use existing consumers and current user flows as required scenarios. When no current consumer exists, the explicit component request is sufficient to implement the current canonical Material 3 Expressive default surface. Record optional official capabilities as unsupported unless a current requirement needs them.

Optional user qualifiers may narrow the work, but their absence must not block discovery or implementation.

## 1. Resolve the requested component

Normalize the supplied name against:

- current official Material 3 Expressive component names;
- existing `MD*` components and exports;
- the component registry;
- the shared UI inventory;
- the physical migration map.

Resolve:

```text
Requested name:
Official component surface:
Owning family:
Current owner:
Canonical owner:
Current consumers:
Roadmap state:
```

Accept common names, plural names, and `MD*` class names. Do not require the user to know the repository family directory name.

When one name maps to an official parent/child family, select the smallest cohesive family required by official ownership and current production contracts. Do not migrate visually similar but unrelated components together.

Ask one precise question only when two materially different official components remain genuinely indistinguishable after source and repository inspection. Otherwise choose the source-backed interpretation and continue.

## 2. Select the change mode

Choose automatically:

- `end-to-end-migration` when a legacy production owner exists;
- `alignment-only` when the canonical owner exists but has named Material deviations or incomplete alignment;
- `new-component` when no production implementation exists;
- no production rewrite when the canonical component is already complete and current; verify the claim and update only stale owned records when necessary.

A user-supplied component name selects the target for this run instead of automatic queue selection. Read the roadmap for real prerequisite blockers, but do not treat priority order alone as a blocker.

Do not ask the user to select the change mode.

## 3. Establish the supported surface

Use `material3-guidelines` and official sources to resolve:

1. intended and prohibited usage;
2. the current Expressive default;
3. current consumers and required compatibility;
4. minimum complete variants, states, anatomy, accessibility, and behavior;
5. exact supported and unsupported official capability;
6. required foundation contracts and source snapshots.

Do not implement the entire published optional surface merely because it exists. Do not retain baseline Material 3 behavior merely because it matches legacy code.

When official guidance is incomplete, narrow the supported surface if all required scenarios remain valid. Block only when a required decision cannot be resolved safely.

## 4. Run the canonical authoring workflow

Load and execute `material-component-authoring` from family selection through completion.

Do not stop after:

- research;
- an audit;
- an implementation plan;
- a family contract;
- foundation discovery;
- production code;
- tests without migration;
- migration without legacy removal.

Continue through all applicable work in the current task:

```text
source resolution
→ adaptive family contract
→ rule validation and refinement
→ required foundation work
→ canonical implementation
→ consumer and export migration
→ proportional proof
→ obsolete-owner removal
→ agent evidence review
→ operator visual package when required
→ roadmap and queue update
```

Use focused prerequisite work only when a foundation or public compatibility change has materially wider blast radius than the selected family. Do not create another general architecture phase.

## 5. Autonomous decision policy

Resolve technical decisions without requesting routine approval.

The agent owns:

- family boundary;
- official source lookup;
- minimum supported surface;
- API and native semantics derived from sources and consumers;
- foundation reuse and narrow additions;
- production structure;
- proportional testing;
- consumer migration;
- documentation and registry updates;
- obsolete-path removal;
- correction of inaccurate project rules;
- final non-visual review.

Escalate only for:

- a genuine product choice not answered by current behavior or official guidance;
- materially conflicting or unavailable official evidence for a required scenario;
- an intentional Mioframe deviation;
- an incompatible public contract requiring product approval;
- an unsafe cross-family foundation change that needs a separate decision;
- an unresolved verification failure;
- rejected operator visual evidence.

A blocker must name one exact decision, provide the evidence already gathered, and recommend the safest default.

## 6. Rule refinement

Treat real implementation as validation of project rules.

When an applicable rule is inaccurate, contradictory, incomplete, obsolete, ambiguous, or needlessly complex:

1. identify its owning document, skill, checklist, registry, or scoped instruction;
2. identify the concrete component evidence exposing the defect;
3. make the smallest source-backed correction;
4. update only directly affected rule owners;
5. continue implementation after the applicable rules are coherent.

Do not preserve a bad rule through a component-specific exception or silent violation.

## 7. Completion result

Finish with a concise report:

```text
MATERIAL COMPONENT RESULT
Requested name:
Resolved family:
Change mode:
Canonical owner:
Supported surface:
Unsupported surface:
Consumers migrated:
Foundation changes:
Rule refinements: none | <summary>
Verification:
Legacy owner removal: not applicable | complete | blocked
Operator visual acceptance: not applicable | required | blocked
Status: complete | blocked (<exact reason>)
```

`complete` requires every non-visual gate to pass and the component to have one canonical owner. Operator visual acceptance may remain `required` only when the implementation and prepared evidence are otherwise complete.
