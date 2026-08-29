import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/visual/storybook';

// Pixel-diff snapshots only. Behavioral, DOM/ARIA, geometry, and computed-style/token
// proof for Lists lives at its correct owner instead of here:
// - Vue/native/ARIA/component contracts: src/shared/ui/Lists/*.test.ts
// - reusable real-browser behavior (keyboard, pointer, focus indicator, StateLayer,
//   Material Expressive geometry/token contract): src/shared/ui/Lists/MDList.behavior.spec.ts
//
// Baseline audit (V3C-A correction): every surviving baseline below protects one distinct
// accepted visible invariant not already covered by another surviving baseline. Three
// baselines were removed because their visible invariant duplicated a surviving one:
// - the segmented "diagnostic" contrasting-wrapper screenshot (same segmented rows as the
//   Material-parity "surface context segmented" screenshot, just a different background
//   color to narrate the same already-tested transparent-gap fact — the transparency
//   contract itself is proven precisely by a computed-style check in
//   MDList.behavior.spec.ts, not by this pixel);
// - the "Repository Explorer" reproduction (a standard contiguous list of single/multi-action
//   rows with a leading icon — the same visible pattern already captured by the "Repository:
//   File and directory rows" section inside the consumer-patterns screenshot below, plus the
//   plain standard-list appearance already in the surface-context-standard screenshot);
// - the standalone "EntryAddSheet consumer rows" gallery (contiguous standalone single-action
//   rows with a leading icon — the same row pattern already shown in the standalone basic
//   gallery's "Single-action with leading icon" section; the row-stacking/overflow contract
//   for this exact fixture stays proven by dedicated geometry checks in
//   MDList.behavior.spec.ts, which do not need a screenshot to justify their existence).
test.describe('MDList / technical and consumer visual regression snapshots', () => {
  // Technical interaction/state-gallery regression — forced data-state fixtures, not a
  // Material doc-comparable example (see Material reference 'states' for that).
  test('MDListItem visual states do not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const surface = page.getByTestId('visual-md-list-states');

    await expect(surface).toHaveScreenshot('md-list-item-states.png');
  });

  // Anatomy/configuration regression — implementation detail (avatar/media fixture CSS,
  // trailing text) alongside the configuration gallery, not a Material doc-comparable crop.
  test('MDListItem configurations do not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const surface = page.getByTestId('visual-md-list-configurations');

    await expect(surface).toHaveScreenshot('md-list-item-configurations.png');
  });

  // Technical interaction-state regression: forced hover/pressed/focus gallery fixtures
  // plus the real-pointer multi-action independence row.
  test('MDListItem interaction states do not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const surface = page.getByTestId('visual-md-list-interaction-states');

    await expect(surface).toHaveScreenshot('md-list-item-interaction-states.png');
  });

  // Technical interaction/ownership regression for the trailing action hit-zone, not a
  // Material docs parity screenshot.
  test('MDListItem trailing action layout does not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const surface = page.getByTestId('visual-md-list-trailing-action');

    await expect(surface).toHaveScreenshot('md-list-item-trailing-action.png');
  });

  // Project selection regression (single/multi listbox + long-text wrapping), not strict
  // Material checkbox/radio parity.
  test('MDListItem selection modes do not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

    const surface = page.getByTestId('visual-md-list-selection');

    await expect(surface).toHaveScreenshot('md-list-item-selection.png');
  });

  // Technical surface-inheritance regression (wrapped/private-var-leak scenarios), not a
  // Material doc-comparable crop — see Material reference 'standard list' for that.
  test('MDListItem surface context standard story does not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const surface = page.getByTestId('visual-md-list-surface-standard');

    await expect(surface).toHaveScreenshot('md-list-item-surface-context-standard.png');
  });

  // Technical surface-context regression including its explanatory caption text, not a
  // Material doc-comparable crop — see Material reference 'segmented list' for that.
  test('MDListItem surface context segmented story does not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const surface = page.getByTestId('visual-md-list-surface-segmented');

    await expect(surface).toHaveScreenshot('md-list-item-surface-context-segmented.png');
  });

  // Consumer/product regression (Settings, Home actions, etc.), not a Material doc-comparable
  // screenshot.
  test('MDListItem consumer patterns story does not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

    const surface = page.getByTestId('visual-md-list-consumer-patterns');

    await expect(surface).toHaveScreenshot('md-list-item-consumer-patterns.png');
  });

  // Public API regression: the compact state/configuration gallery proving MDListItem works
  // standalone without MDList, not a Material doc-comparable screenshot.
  test('MDListItem standalone public API basic gallery does not regress', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const surface = page.getByTestId('visual-md-list-item-standalone-basic');

    await expect(surface).toHaveScreenshot('md-list-item-standalone-basic.png');
  });
});

// Compact, documentation-like screenshots intended for manual side-by-side comparison
// against the Material 3 Expressive List docs (material3 MCP / m3.material.io). These are
// not exhaustive regression coverage — see 'MDList / technical and consumer visual
// regression snapshots' above for that. Keep these fixtures free of product-specific data,
// long explanatory copy, and diagnostic wrapper labels so they stay directly comparable
// to the docs.
test.describe('MDList / Material reference screenshots', () => {
  test('Material reference: list item states', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--material-reference');

    const surface = page.getByTestId('visual-md-list-material-states');

    await expect(surface).toHaveScreenshot('md-list-material-states.png');
  });

  test('Material reference: standard list', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--material-reference');

    const surface = page.getByTestId('visual-md-list-material-standard');

    await expect(surface).toHaveScreenshot('md-list-material-standard.png');
  });

  test('Material reference: segmented list', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--material-reference');

    const surface = page.getByTestId('visual-md-list-material-segmented');

    await expect(surface).toHaveScreenshot('md-list-material-segmented.png');
  });

  test('Material reference: anatomy and configurations', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--material-reference');

    const surface = page.getByTestId('visual-md-list-material-configurations');

    await expect(surface).toHaveScreenshot('md-list-material-configurations.png');
  });
});
