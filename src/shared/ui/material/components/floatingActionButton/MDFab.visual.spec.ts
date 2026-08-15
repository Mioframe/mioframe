import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/visual/storybook';

test('MDFab medium/primary-container resting state matches the canonical baseline', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-floating-action-button-mdfab--visual-states');
  const surface = page.getByTestId('visual-md-fab-states');

  await expect(surface).toHaveScreenshot('md-fab-states.png');
});

// The following three tests prove the renderer-owned Material state layer/elevation is actually
// visible on real pointer/keyboard interaction, matching the MDButton/MDCheckbox/MDSwitch
// real-interaction-feedback pattern (ARCHITECTURE.md "Implementation passes" #8). Each drives a
// real interaction against the public MDFab host and captures the settled visible result with
// `animations: 'disabled'` (fast-forwards the renderer's private shadow-DOM CSS
// transitions/animation to their end state deterministically). None of these tests query, style,
// or otherwise inspect the private m3e shadow DOM directly; only the public host box is
// screenshotted.
test('MDFab renders visible renderer-owned hover feedback on real pointer hover', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-floating-action-button-mdfab--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-fab-real-interaction');
  const fab = surface.getByRole('button', { name: 'Press me' });

  await fab.hover();

  await expect(surface).toHaveScreenshot('md-fab-hover.png', { animations: 'disabled' });
});

test('MDFab renders visible renderer-owned focus feedback on real keyboard focus', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-floating-action-button-mdfab--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-fab-real-interaction');

  // Deterministic focus setup only: focus success is proven by the Storybook behavior lane
  // (`MDFab.browser.spec.ts`). This visual spec only establishes focus state and captures the
  // settled screenshot.
  await page.keyboard.press('Tab');

  await expect(surface).toHaveScreenshot('md-fab-focus.png', { animations: 'disabled' });
});

test('MDFab renders a visible settled state layer/elevation on real pointer press', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-floating-action-button-mdfab--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-fab-real-interaction');
  const fab = surface.getByRole('button', { name: 'Press me' });
  const box = await fab.boundingBox();
  if (!box) throw new Error('Missing MDFab bounding box for real pointer pressed test.');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect(surface).toHaveScreenshot('md-fab-pressed.png', { animations: 'disabled' });

  await page.mouse.up();
});
