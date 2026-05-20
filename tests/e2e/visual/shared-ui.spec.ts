import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

test('MDButton visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdbutton--visual-states');

  const surface = page.getByTestId('visual-md-button-states');

  await expect(surface).toHaveScreenshot('md-button-states.png');
});

test('MDButton interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdbutton--visual-interaction-states');

  await page.getByRole('button', { name: 'Hover target' }).hover();
  await page.getByRole('button', { name: 'Focus target' }).focus();

  const pressedTarget = page.getByRole('button', { name: 'Pressed target' });
  await pressedTarget.hover();
  await page.mouse.down();

  const surface = page.getByTestId('visual-md-button-interaction-states');

  await expect(surface).toHaveScreenshot('md-button-interaction-states.png');

  await page.mouse.up();
});

test('MDIconButton visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdiconbutton--visual-states');

  const surface = page.getByTestId('visual-md-icon-button-states');

  await expect(surface).toHaveScreenshot('md-icon-button-states.png');
});

test('MDIconButton interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdiconbutton--visual-interaction-states');

  await page.getByRole('button', { name: 'Hover target' }).hover();
  await page.getByRole('button', { name: 'Focus target' }).focus();

  const pressedTarget = page.getByRole('button', { name: 'Pressed target' });
  await pressedTarget.hover();
  await page.mouse.down();

  const surface = page.getByTestId('visual-md-icon-button-interaction-states');

  await expect(surface).toHaveScreenshot('md-icon-button-interaction-states.png');

  await page.mouse.up();
});

test('MDChip visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdchip--visual-states');

  const surface = page.getByTestId('visual-md-chip-states');

  await expect(surface).toHaveScreenshot('md-chip-states.png');
});

test('MDChip interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdchip--visual-interaction-states');

  await page.getByRole('button', { name: 'Hover target' }).hover();
  await page.getByRole('button', { name: 'Focus target' }).focus();

  const pressedTarget = page.getByRole('button', { name: 'Pressed target' }).first();
  await pressedTarget.hover();
  await page.mouse.down();

  const surface = page.getByTestId('visual-md-chip-interaction-states');

  await expect(surface).toHaveScreenshot('md-chip-interaction-states.png');

  await page.mouse.up();
});

test('MDCheckbox visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-states');

  const surface = page.getByTestId('visual-md-checkbox-states');

  await expect(surface).toHaveScreenshot('md-checkbox-states.png');
});

test('MDCheckbox interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-interaction-states');

  await page.locator('label[for="storybook-md-checkbox-hover"]').hover();
  await page.locator('label[for="storybook-md-checkbox-focus"]').focus();

  const defaultSurface = page.getByTestId('visual-md-checkbox-interaction-states');

  await expect(defaultSurface).toHaveScreenshot('md-checkbox-interaction-states-default.png');

  await page.locator('label[for="storybook-md-checkbox-readonly-hover"]').hover();
  await page.locator('label[for="storybook-md-checkbox-readonly-focus"]').focus();

  await expect(defaultSurface).toHaveScreenshot('md-checkbox-interaction-states-readonly.png');

  await page.locator('label[for="storybook-md-checkbox-pressed"]').hover();
  await page.mouse.down();

  await expect(defaultSurface).toHaveScreenshot('md-checkbox-interaction-states-pressed.png');

  await page.mouse.up();
});

test('MDFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-states');

  const surface = page.getByTestId('visual-md-fab-states');

  await expect(surface).toHaveScreenshot('md-fab-states.png');
});

test('MDFab interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-interaction-states');

  await page.getByRole('button', { name: 'Primary hover target' }).hover();
  await page.getByRole('button', { name: 'Focus target' }).focus();

  await page.getByRole('button', { name: 'Pressed target' }).hover();
  await page.mouse.down();

  const surface = page.getByTestId('visual-md-fab-interaction-states');

  await expect(surface).toHaveScreenshot('md-fab-interaction-states.png');

  await page.mouse.up();
});

test('MDListItem visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdlistitem--visual-states');

  const surface = page.getByTestId('visual-md-list-item-states');

  await expect(surface).toHaveScreenshot('md-list-item-states.png');
});

test('MDListItem interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdlistitem--visual-interaction-states');

  await page.getByRole('button', { name: 'Hover target' }).hover();
  await page.getByRole('button', { name: 'Focus target' }).focus();

  const pressedTarget = page.getByRole('button', { name: 'Pressed target' });
  await pressedTarget.hover();
  await page.mouse.down();

  const surface = page.getByTestId('visual-md-list-item-interaction-states');

  await expect(surface).toHaveScreenshot('md-list-item-interaction-states.png');

  await page.mouse.up();
});

test('MDStateLayer visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdstatelayer--visual-states');

  const surface = page.getByTestId('visual-md-state-layer');

  await expect(surface).toHaveScreenshot('md-state-layer-states.png');
});

test('MDStateLayer host integrations match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdstatelayer--visual-host-integration');

  const surface = page.getByTestId('visual-md-state-layer-hosts');

  await expect(surface).toHaveScreenshot('md-state-layer-hosts.png');
});

test('MarkdownContent wide table matches baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-markdowncontent--wide-table');

  const surface = page.getByTestId('visual-markdown-content-wide-table');

  await expect(surface).toHaveScreenshot('markdown-content-wide-table.png');
});

test('MarkdownContent variants overview matches baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-markdowncontent--variants-overview');

  const surface = page.getByTestId('visual-markdown-content-variants');

  await expect(surface).toHaveScreenshot('markdown-content-variants-overview.png');
});
