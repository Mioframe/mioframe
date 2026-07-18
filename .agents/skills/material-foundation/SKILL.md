---
name: material-foundation
description: 'Use for implementing, migrating, repairing, restructuring, replacing, or aligning an official Material foundation or style contract. An explicit user request is sufficient to start this workflow.'
paths:
  - 'src/shared/ui/material/foundations/**'
  - 'src/shared/ui/material/styles/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'docs/material-3/foundation-*.md'
  - 'docs/material-3/library-architecture.md'
  - 'docs/material-3/source-of-truth.md'
---

# Material foundations and styles

```text
material-foundation <official-foundation-or-style-artifact>
```

## Boundary

- An explicit official Material request is sufficient to start.
- Missing consumers, inactive roadmap position, legacy ownership, or an absent canonical directory are not blockers by themselves.
- Use the current task, current workspace, current successful Material MCP reads, official sources, and local verification.
- Source-control history is not Material evidence. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.
- Authoring updates README and implementation artifacts as required; it never edits AUDIT.
- Keep concrete artifact and consumer facts in the owning README, implementation, tests, fixtures, and task context.

## Policy loading

Always read:

- applicable repository and scoped `AGENTS.md` files;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- current owner README and AUDIT when present;
- current implementation, exports, consumers, tests, fixtures, and directly affected shared owners.

Read only domain documents applicable to the selected artifact. Read `component-tokens.md` or `component-testing.md` when rendered consumer behavior, browser lifecycle, motion, geometry, or visual evidence is affected.

## Workflow

### 1. Resolve official ownership and sources

Classify the request as:

```text
src/shared/ui/material/foundations/<official-slug>
src/shared/ui/material/styles/<official-slug>
```

Use foundations for official shared behavior/platform contracts and styles for official visual systems/token domains.

Read required current-run MCP sources. Treat a healthy complete read as working current evidence; capture age alone is not a defect.

Distinguish Material semantics from generic browser, DOM, event, geometry, lifecycle, timing, and teleport utilities. Do not create a Material wrapper merely to relocate a generic utility.

### 2. Reconstruct the contract

Record:

```text
official artifact and boundary
supported, unsupported, and unresolved capability
public/private contract
state, lifecycle, rendering, clipping, and final-owner responsibilities
official tokens and real runtime routes
current owner, canonical owner, consumers, and blast radius
Web adaptation where literal canonical runtime is unavailable
current defects and required proof
```

Do not design around the existing implementation before reconstructing the official contract.

### 3. Diagnose problems and select strategy

Classify each material problem as:

- `canonical-behavior`;
- `implementation-defect`;
- `architecture-defect`;
- `foundation-defect` or `style-defect` within the resolved owner;
- `generic-infrastructure-defect` outside Material ownership;
- `evidence-gap`;
- `product-deviation`.

Select:

- `repair` when ownership and contract are sound;
- `restructure` when the contract remains valid but routes, lifecycle, or ownership are wrong;
- `replace` when the implementation preserves several conflicting models or is based on a wrong contract.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconsider the strategy.

### 4. Update README before production

Record official mapping, source status, reconstructed contract, diagnosis, strategy, ownership, consumers, known gaps, representative proof, and review state.

Set review status to `review required after changes`.

### 5. Implement the narrowest correct owner

- Keep foundations/styles free of component-family and product knowledge.
- Keep family-specific behavior family-local unless an official shared owner exists.
- Use exact official token meanings and real dependency routes to final owners.
- Follow the repository-wide prohibition on unnecessary DOM nodes.
- Use private names for semantic roles, not raw CSS mechanisms.
- Do not create generic registries, state machines, theme managers, CSS DSLs, broad wrappers, speculative APIs, or variables for one-use constants.
- When the Web platform cannot consume canonical runtime parameters literally, document one honest adaptation rather than claiming literal consumption.

For interaction primitives, resolve only applicable state ownership, rendered bounds, clipping, lifecycle, cancellation, reduced motion, generic bridges, and testing hooks. A token declaration alone is not a rendered implementation.

### 6. Migrate consumers and legacy ownership

- Move Material semantics to the canonical owner.
- Keep genuinely generic utilities in their generic owner.
- Update affected exports and consumers.
- Remove obsolete Material routes and duplicate ownership.
- Preserve accepted behavior except documented corrections.
- Record incomplete migration when atomic removal is genuinely unsafe.

### 7. Prove blast radius proportionally

Use only proof owned by the changed contract:

- owner-local contract or pure tests;
- computed CSS or browser proof for real cascade, clipping, focus, input, layout, transition, or lifecycle behavior;
- bounded fixtures/stories for rendered output;
- representative consumers when existing consumers are affected;
- final rendered-owner, namespace, export, interruption, cancellation, and reduced-motion checks when applicable.

Forced state proves stable appearance only. Real input is required for lifecycle claims. A screenshot baseline proves regression stability, not Material correctness.

### 8. Run the objective foundation gate

For every applicable architecture/checklist rule, record direct evidence and pass/fail.

The gate fails when any applicable issue remains:

- incorrect or ambiguous owner;
- Material semantics left in generic infrastructure or generic behavior wrapped only for folder symmetry;
- invalid, mechanism-named, or unnecessary route;
- token declaration without a real final-output dependency;
- forced-state proof substituted for lifecycle behavior;
- unproved affected-consumer blast radius;
- implementation, README, fixtures, tests, or consumers contradict each other;
- obsolete ownership remains after restructure or replacement;
- required verification fails or is not run.

### 9. Finish

- Confirm code, README, exports, fixtures, tests, and consumers agree.
- Preserve source limits, remaining gaps, visual rejection, and blast-radius uncertainty.
- Run focused verification as needed and final applicable local verification.
- Leave AUDIT unchanged.
- Report exact failed gates rather than delegating objective defects to a component or operator.

## Result

Finish with:

```text
MATERIAL FOUNDATION RESULT
Requested artifact:
Resolved kind: foundation | style
Official documentation path:
Current owner:
Canonical owner:
Canonical source status:
Official capability inventory:
Diagnosis:
Strategy: repair | restructure | replace
Implemented:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid:
Consumers affected:
Legacy ownership:
Representative proof:
Objective gate: passed | failed
Failed gates:
Local verification:
Documentation:
Status: implementation finished | partial | blocked (<exact reason>)
Recommended review:
```

Do not report implementation finished while ownership, real dependency routes, unnecessary structure, affected-consumer proof, contradictions, obsolete ownership, or verification remains unresolved.
