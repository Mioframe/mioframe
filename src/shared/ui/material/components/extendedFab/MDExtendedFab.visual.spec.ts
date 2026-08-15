import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/visual/storybook';

test('MDExtendedFab small/primary-container resting appearance (icon+label and label-only) matches the canonical baseline', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-extended-fab-mdextendedfab--visual-states');
  const surface = page.getByTestId('visual-md-extended-fab-states');

  await expect(surface).toHaveScreenshot('md-extended-fab-states.png');
});

// The following three tests prove the renderer-owned Material state layer/elevation is actually
// visible on real pointer/keyboard interaction, matching the MDFab/MDButton/MDCheckbox/MDSwitch
// real-interaction-feedback pattern (ARCHITECTURE.md "Implementation passes" #7). Each drives a
// real interaction against the public MDExtendedFab host and captures the settled visible result
// with `animations: 'disabled'` (fast-forwards the renderer's private shadow-DOM CSS
// transitions/animation to their end state deterministically). None of these tests query, style,
// or otherwise inspect the private m3e shadow DOM directly; only the public host box is
// screenshotted.
test('MDExtendedFab renders visible renderer-owned hover feedback on real pointer hover', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-fab-mdextendedfab--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-extended-fab-real-interaction');
  const fab = surface.getByRole('button', { name: 'Press me' });

  await fab.hover();

  await expect(surface).toHaveScreenshot('md-extended-fab-hover.png', { animations: 'disabled' });
});

test('MDExtendedFab renders visible renderer-owned focus feedback on real keyboard focus', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-fab-mdextendedfab--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-extended-fab-real-interaction');

  // Deterministic focus setup only: focus success is proven by the Storybook behavior lane
  // (MDExtendedFab.browser.spec.ts). This visual spec only establishes focus state and captures
  // the settled screenshot.
  await page.keyboard.press('Tab');

  await expect(surface).toHaveScreenshot('md-extended-fab-focus.png', { animations: 'disabled' });
});

test('MDExtendedFab renders a visible settled state layer/elevation on real pointer press', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-fab-mdextendedfab--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-extended-fab-real-interaction');
  const fab = surface.getByRole('button', { name: 'Press me' });
  const box = await fab.boundingBox();
  if (!box) throw new Error('Missing MDExtendedFab bounding box for real pointer pressed test.');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect(surface).toHaveScreenshot('md-extended-fab-pressed.png', {
    animations: 'disabled',
  });

  await page.mouse.up();
});
