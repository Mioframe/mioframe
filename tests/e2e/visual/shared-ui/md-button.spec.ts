import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test('MDButton variants and disabled states match the canonical baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');
  const surface = page.getByTestId('visual-md-button-states');

  await expect(surface).toHaveScreenshot('md-button-states.png');
});

test('MDButton five-size geometry matches the canonical baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--size-geometry-matrix');
  const surface = page.getByTestId('visual-md-button-size-geometry');

  await expect(surface).toHaveScreenshot('md-button-interaction-states.png');
});

test('MDButton controlled toggle shapes match the canonical baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-shapes');
  const surface = page.getByTestId('visual-md-button-toggle-shapes');

  await expect(surface).toHaveScreenshot('md-button-toggle-shapes.png');
});

test('MDButton disabled toggle and text routes match the canonical baseline', async ({ page }) => {
  await openStory(
    page,
    'material-3-components-buttons-mdbutton--disabled-selected-outlined-and-text',
  );
  const surface = page.getByTestId('visual-md-button-disabled-selected-outlined-text');

  await expect(surface).toHaveScreenshot('md-button-toggle-interaction-states.png');
});

test('MDButton keeps its label visible with a leading Loading indicator', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-indicator-presentation');
  const surface = page.getByTestId('visual-md-button-loading');

  await expect(surface).toHaveScreenshot('md-button-loading.png');
});
