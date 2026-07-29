import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test('MDButton variants and disabled states match the canonical baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');
  const surface = page.getByTestId('visual-md-button-states');

  await expect(surface).toHaveScreenshot('md-button-states.png');
});

test('MDButton production-selected size geometry matches the canonical baseline', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--size-geometry');
  const surface = page.getByTestId('visual-md-button-size-geometry');

  await expect(surface).toHaveScreenshot('md-button-size-geometry.png');
});

test('MDButton keeps its label visible with a leading Loading indicator', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-indicator-presentation');
  const surface = page.getByTestId('visual-md-button-loading');

  await expect(surface).toHaveScreenshot('md-button-loading.png');
});

test('MDButton variants keep their Material colors inside a legacy Material surface', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--legacy-surface-color-ownership');
  const surface = page.getByTestId('visual-md-button-legacy-surface');

  await expect(surface).toHaveScreenshot('md-button-legacy-surface.png');
});

// The following four tests prove the renderer-owned Material state-layer and ripple are
// actually visible after normalizing the Mioframe state-opacity foundation tokens to a
// percentage representation compatible with m3e's `color-mix()`-based state layer. Each test
// drives a real pointer/keyboard interaction against the public MDButton host and captures the
// settled visible result with `animations: 'disabled'` (fast-forwards the renderer's private
// shadow-DOM CSS transitions/animation to their end state, deterministically, without an
// arbitrary sleep). None of these tests query, style, or otherwise inspect the private m3e
// shadow DOM directly; only the public host box is screenshotted.
test('MDButton renders visible renderer-owned hover feedback on real pointer hover', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-button-real-interaction');
  const button = surface.getByRole('button', { name: 'Press me', exact: true });

  await button.hover();

  await expect(surface).toHaveScreenshot('md-button-hover.png', { animations: 'disabled' });
});

test('MDButton renders visible renderer-owned focus feedback on real keyboard focus', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-button-real-interaction');
  const button = surface.getByRole('button', { name: 'Press me', exact: true });

  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();

  await expect(surface).toHaveScreenshot('md-button-focus.png', { animations: 'disabled' });
});

test('MDButton renders a visible settled ripple on real pointer press', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-button-real-interaction');
  const button = surface.getByRole('button', { name: 'Press me', exact: true });
  const box = await button.boundingBox();
  if (!box) throw new Error('Missing MDButton bounding box for real pointer ripple test.');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect(surface).toHaveScreenshot('md-button-pointer-pressed.png', {
    animations: 'disabled',
  });

  await page.mouse.up();
});

test('MDButton renders a visible settled ripple on real Space-key press', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--real-interaction-feedback');
  const surface = page.getByTestId('visual-md-button-real-interaction');
  const button = surface.getByRole('button', { name: 'Press me', exact: true });

  await button.focus();
  await page.keyboard.down('Space');

  await expect(surface).toHaveScreenshot('md-button-space-pressed.png', {
    animations: 'disabled',
  });

  await page.keyboard.up('Space');
});
