import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/visual/storybook';

test('MDCheckbox unselected, selected, indeterminate, disabled, and presentation states match the canonical baseline', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--visual-states');
  const surface = page.getByTestId('visual-md-checkbox-states');

  await expect(surface).toHaveScreenshot('md-checkbox-states.png');
});

// The following three tests prove the renderer-owned Material state layer is actually visible on
// real pointer/keyboard interaction, matching the MDButton/MDSwitch real-interaction-feedback
// pattern (ARCHITECTURE.md "Implementation passes" #10). Each drives a real interaction against
// the public MDCheckbox host and captures the settled visible result with
// `animations: 'disabled'` (fast-forwards the renderer's private shadow-DOM CSS
// transitions/animation to their end state deterministically). None of these tests query, style,
// or otherwise inspect the private m3e shadow DOM directly; only the public host box is
// screenshotted.
test('MDCheckbox renders visible renderer-owned hover feedback on real pointer hover', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-checkbox-real-interaction');
  const checkbox = surface.getByRole('checkbox', { name: 'Press me' });

  await checkbox.hover();

  await expect(surface).toHaveScreenshot('md-checkbox-hover.png', { animations: 'disabled' });
});

test('MDCheckbox renders visible renderer-owned focus feedback on real keyboard focus', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-checkbox-real-interaction');

  // Deterministic focus setup only: focus success is proven by the Storybook behavior lane
  // (`MDCheckbox.behavior.spec.ts`). This visual spec only establishes focus state and captures
  // the settled screenshot.
  await page.keyboard.press('Tab');

  await expect(surface).toHaveScreenshot('md-checkbox-focus.png', { animations: 'disabled' });
});

test('MDCheckbox renders a visible settled state layer on real pointer press', async ({ page }) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-checkbox-real-interaction');
  const checkbox = surface.getByRole('checkbox', { name: 'Press me' });
  const box = await checkbox.boundingBox();
  if (!box) throw new Error('Missing MDCheckbox bounding box for real pointer pressed test.');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect(surface).toHaveScreenshot('md-checkbox-pressed.png', { animations: 'disabled' });

  await page.mouse.up();
});
