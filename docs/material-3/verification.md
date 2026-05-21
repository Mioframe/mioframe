# Material 3 verification

## Principle

Material 3 alignment must be verified at the layer where the change matters.

Visual screenshots alone are not enough. Verification should cover the relevant source-of-truth lookup, tokens, units, public APIs, interaction states, accessibility, layout behavior, Storybook documentation, and visual output.

## Verification matrix

| Changed layer           | Expected verification                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| Source policy or docs   | Read the affected docs and check links/paths.                                    |
| Unit conversion         | Focused PostCSS transform check or generated CSS inspection.                     |
| Reference/system tokens | Token diff review and at least one rendered surface if values affect UI.         |
| Component tokens        | Storybook surface showing affected variants/states and token usage.              |
| Public component API    | TypeScript checks, consumer migration review, and Storybook controls/docs.       |
| Interaction states      | Browser-based state checks, preferably Storybook + Playwright for visual states. |
| Accessibility behavior  | Keyboard/focus/ARIA checks in a real browser surface when behavior changes.      |
| Adaptive layout         | Responsive browser smoke or visual tests for affected breakpoints.               |
| Visual appearance       | Playwright screenshot assertions against deterministic Storybook stories.        |

## Required Material lookup

Before implementation, identify the relevant official Material guidance checked through:

1. `material3` MCP; or
2. `Vyachean/m3-docs-cache` fallback.

If the guidance is unavailable or incomplete, document the risk and do not claim full Material 3 alignment.

## Storybook and visual tests

Use Storybook as the preferred harness for shared UI visual verification. Visual tests should be deterministic and focused on stable surfaces.

Use Playwright screenshots for visual appearance, rendered layout, and Material state regressions. Do not use Vue unit tests, happy-dom, or Vitest for visual appearance.

## Final verification

After implementation changes, follow the repository verification policy in `AGENTS.md`. Documentation-only policy changes may be reviewed without broad browser verification, but the final PR should still state what was and was not run.

## Review checklist

For each Material UI PR, reviewers should be able to answer:

1. Which Material 3 pages were checked?
2. Which tokens or API names changed?
3. Which states and accessibility behaviors are affected?
4. Which Storybook surfaces document the behavior?
5. Which focused verification proves the change?
6. Are deviations documented?
