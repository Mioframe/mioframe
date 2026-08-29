import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/visual/storybook';

test('MDIconButton visual states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-states');

  const surface = page.getByTestId('visual-md-icon-button-states');

  await expect(surface).toHaveScreenshot('md-icon-button-states.png');
});

test('MDIconButton interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-interaction-states');

  const surface = page.getByTestId('visual-md-icon-button-interaction-states');

  await expect(surface).toHaveScreenshot('md-icon-button-interaction-states.png');
});

test('MDIconButton compact toolbar layout matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--compact-toolbar-layout');

  const surface = page.getByTestId('visual-md-icon-button-toolbar-layout');

  await expect(surface).toHaveScreenshot('md-icon-button-toolbar-layout.png');
});

test('MDIconButton geometry matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--geometry');

  const surface = page.getByTestId('visual-md-icon-button-geometry');

  await expect(surface).toHaveScreenshot('md-icon-button-geometry.png');
});

test('MDIconButton toggle interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--toggle-interaction-states');

  const surface = page.getByTestId('visual-md-icon-button-toggle-interaction-states');

  await expect(surface).toHaveScreenshot('md-icon-button-toggle-interaction-states.png');
});
