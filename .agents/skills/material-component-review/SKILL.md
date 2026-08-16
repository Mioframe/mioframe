---
name: material-component-review
description: 'Deprecated coding-agent route. Final Material semantic review is architect-owned; do not invoke this skill from material-component.'
---

# Material component review

This coding-agent stage is retired from the normal Material workflow.

The architect owns final semantic review of the complete family/PR, including:

- Material 3 contract fidelity;
- cross-contract reachability;
- exact-version m3e mapping;
- rendered proof quality;
- consumer/legacy migration;
- shared-UI blast radius;
- exact-head GitHub CI and merge readiness.

`material-component` must stop after contracts, standalone implementation/proof, and required migration are complete, then hand the family to the architect.

If this skill is invoked directly by an old task or stale instruction, do not perform another full source/m3e/consumer review. Return:

```text
MATERIAL REVIEW RESULT
verdict: architect-owned
next action: hand current family state to architect
```

Do not edit production/definition files, regenerate contracts, update roadmap status, or claim PR/CI/merge readiness from this retired route.
