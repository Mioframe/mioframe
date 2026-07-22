# Material foundation development

This document defines the durable convergence model for one real cross-family Material contract.

Foundation exists only when a current component or unavoidable Material/platform contract needs one family-agnostic owner and that owner is simpler than family-local alternatives.

## Ownership

Foundation may own official reference/system tokens and real cross-family typography, shape, elevation, motion, state-layer, ripple, focus, symbol, overlay, accessibility, density, target-area, or adaptive contracts.

It does not own component-family tokens/API/anatomy/state, product behavior, or generic browser mechanisms that already have a correct owner. Another official component family is not foundation.

## Entry modes

For a standalone foundation request, `material-foundation <domain>` is the coordination-only root. It owns the bounded contract, complete foundation stack, delegation, result validation, final verification, and compact roadmap state, but writes no production code.

When a foundation owner is required by `material-component`, no second foundation root is created. The component root pushes that exact foundation owner onto its existing stack and remains the sole coordinator and roadmap writer.

In both modes, the current deepest foundation owner is implemented by a fresh isolated writable `material-component-implementation` context with `Owner kind: foundation`. A different fresh isolated read-only `material-component-review` context performs mandatory correction-final review.

If a fresh writable or review context is unavailable, the owning root checkpoints with the exact isolation reason. There is no same-context fallback.

## Sequence

```text
owning root validates deepest owner and locks bounded foundation contract
→ fresh writable material-component-implementation context
→ one canonical foundation owner correction
→ affected-family and direct-consumer proof
→ fresh read-only material-component-review correction-final
→ owning root accepts and pops, or retries once in a new writable context
```

## Contract and correction

The owning root confirms foundation ownership is required now and an existing family/generic owner is insufficient. The writable owner context must return any invalidated assumption before editing rather than redesigning the contract locally.

For token work:

- preserve `reference → system → family-local component → rendered proof`;
- move the smallest coherent required group;
- keep one active canonical owner under Material foundation;
- forbid upward, cross-family, cyclic, or fallback-masked dependencies;
- allow legacy styles to import canonical declarations but not redeclare them;
- prove affected-family computed behavior.

For shared behavior:

- define one narrow public contract;
- revalidate semantics and lifecycle instead of copying legacy behavior unchanged;
- inspect every direct consumer of the changed contract;
- update affected families through the canonical contract;
- retain only forwarding compatibility and remove parallel ownership;
- prove public-input behavior, browser lifecycle, and reduced motion where applicable.

Relocation, a new directory/barrel, forwarding exports, migrated imports, or green path guards are not canonicalization.

## Stack and nested owners

Only the current deepest owner may be implemented or reviewed. If another canonical owner is required, stop the correction and return the exact nested prerequisite to the owning root. Do not implement two owners in one writable context.

A parent or calling family cannot advance until the nested owner has focused proof and a separate accepted correction-final review.

## Documentation

Create or update a foundation README only for durable owner, API, semantics, token/style/motion, compatibility, unsupported-surface, and proof facts.

Do not persist current stage, findings, backlog, review history, shell output, or future passes. Only the owning root roadmap stores the compact continuation stack and physical checkpoint reason.

## Completion

An implementation result is not readiness. Readiness exists only after a different fresh read-only reviewer accepts the exact foundation owner correction.

A repairable gap or nested owner remains internal work. A physical session boundary returns as a checkpoint to the owning root, never as a separate operator command.

## Forbidden

- implementation in a root or reviewer context;
- self-review or readiness claims;
- a second root or roadmap writer for a foundation prerequisite inside a component operation;
- local redesign of the root-locked foundation contract;
- broad domain work for a bounded prerequisite;
- another family’s component/private ownership in foundation;
- relocation-only completion or copied legacy defects;
- legacy-owned active declarations used by canonical Material;
- several canonical owners in one correction;
- asking the operator to invoke a delegated prerequisite;
- a separate foundation continuation ledger;
- Git, branch, commit, PR, or merge operations.
