---
name: implementation-preflight
description: 'Use this skill before non-trivial implementation work to reduce corrective commits by identifying the owner layer, reusable project code, acceptance matrix, risk matrix, and focused verification before the first production edit.'
---

# Implementation preflight

Use this skill before non-trivial code edits. Keep the preflight short and bounded; do not turn it into broad repository exploration.

## Activation check

Use this skill when the task will likely change production code, test behavior, tooling, CI, app configuration, storage semantics, diagnostics, browser behavior, or user-visible UI.

Do not use this skill for trivial typo fixes, formatting-only changes, comments-only changes, or mechanical renames with no behavior or ownership decisions.

## Required preflight

Answer these before the first production edit:

1. **Owner**: which FSD layer owns the behavior, and which public entry points should be used?
2. **Reuse**: what existing helpers, components, configs, schemas, services, tests, or dependencies already cover nearby behavior?
3. **Acceptance matrix**: what non-happy-path states must work in the first implementation?
4. **Risk matrix**: which browser, lifecycle, async, cache, CI/tooling, accessibility, visual, or data-safety risks apply?
5. **Verification**: what focused check proves the riskiest behavior, and what final verification is required?

## Bounded reuse search

Before creating a new helper, component, config, dependency, or test pattern, check reuse with targeted repository search or direct imports.

Use focused searches for names related to the domain, behavior, helper, config, dependency, and test pattern. Stop once the owner and reuse decision are clear.

Do not start with broad repository exploration unless targeted search shows the impact is wider than expected.

## Acceptance and risk matrix guidance

Include only states relevant to the task, but consider:

- unavailable or disabled integrations;
- missing browser APIs or unsupported runtime;
- async pending, cancellation, stale completion, and repeated toggles;
- invalid, malformed, or hostile input;
- cache invalidation after create, update, delete, or failed lookup;
- data-safety-sensitive values in diagnostics, URLs, names, ids, and content;
- accessibility structure and heading hierarchy for rendered UI;
- CI, build, Storybook, Playwright, verify, fix, or verbose modes when tooling changes.

The first implementation should cover the applicable matrix, not only the happy path. If a matrix item is intentionally not covered, state why.

## Output discipline

Keep the preflight concise. A useful preflight is usually 5-10 lines plus a short verification note.

Do not repeat generic repository rules. Name only the rules and risks that apply to the current task.
