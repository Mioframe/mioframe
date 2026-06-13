import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

test('MDButton visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdbutton--visual-states');

  const surface = page.getByTestId('visual-md-button-states');

  await expect(surface).toHaveScreenshot('md-button-states.png');
});

test('MDButton interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdbutton--visual-interaction-states');

  const surface = page.getByTestId('visual-md-button-interaction-states');

  await expect(surface).toHaveScreenshot('md-button-interaction-states.png');
});

test('MDButton expanded target activates clicks outside the visible button box', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdbutton--expanded-target-hit-area');

  const surface = page.locator('#visual-md-button-target-hit');
  const button = surface.getByRole('button', { name: 'OK', exact: true });
  const target = surface.locator('.md-button__target');
  const count = page.locator('#visual-md-button-target-hit-count');
  const buttonBox = await button.boundingBox();
  const targetBox = await target.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  if (buttonBox == null || targetBox == null) {
    throw new Error('Missing MDButton bounding boxes for expanded target hit test.');
  }

  const clickPoint = {
    x: buttonBox.x + buttonBox.width / 2,
    y: buttonBox.y - 2,
  };

  expect(clickPoint.x).toBeGreaterThan(targetBox.x);
  expect(clickPoint.x).toBeLessThan(targetBox.x + targetBox.width);
  expect(clickPoint.y).toBeGreaterThan(targetBox.y);
  expect(clickPoint.y).toBeLessThan(targetBox.y + targetBox.height);
  expect(clickPoint.y).toBeLessThan(buttonBox.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
});

test('MDIconButton visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdiconbutton--visual-states');

  const surface = page.getByTestId('visual-md-icon-button-states');

  await expect(surface).toHaveScreenshot('md-icon-button-states.png');
});

test('MDIconButton interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdiconbutton--visual-interaction-states');

  const surface = page.getByTestId('visual-md-icon-button-interaction-states');

  await expect(surface).toHaveScreenshot('md-icon-button-interaction-states.png');
});

test('MDIconButton compact toolbar layout matches baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdiconbutton--compact-toolbar-layout');

  const surface = page.getByTestId('visual-md-icon-button-toolbar-layout');

  await expect(surface).toHaveScreenshot('md-icon-button-toolbar-layout.png');
});

test('MDIconButton expanded target activates clicks outside the visible button box', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdiconbutton--expanded-target-hit-area');

  const surface = page.locator('#visual-md-icon-button-target-hit');
  const button = surface.getByRole('button', { name: 'Expanded target', exact: true });
  const target = surface.locator('.md-icon-button__target');
  const count = page.locator('#visual-md-icon-button-target-hit-count');
  const buttonBox = await button.boundingBox();
  const targetBox = await target.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  if (buttonBox == null || targetBox == null) {
    throw new Error('Missing MDIconButton bounding boxes for expanded target hit test.');
  }

  const clickPoint = {
    x: buttonBox.x - 2,
    y: buttonBox.y + buttonBox.height / 2,
  };

  expect(clickPoint.x).toBeGreaterThan(targetBox.x);
  expect(clickPoint.x).toBeLessThan(targetBox.x + targetBox.width);
  expect(clickPoint.y).toBeGreaterThan(targetBox.y);
  expect(clickPoint.y).toBeLessThan(targetBox.y + targetBox.height);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
});

test('MDChip visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdchip--visual-states');

  const surface = page.locator('#visual-md-chip-states');

  await expect(surface).toHaveScreenshot('md-chip-states.png');
});

test('MDChip interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdchip--visual-interaction-states');

  const surface = page.locator('#visual-md-chip-interaction-states');

  await expect(surface).toHaveScreenshot('md-chip-interaction-states.png');
});

test('MDCheckbox visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-states');

  const surface = page.getByTestId('visual-md-checkbox-states');

  await expect(surface).toHaveScreenshot('md-checkbox-states.png');
});

test('MDCheckbox interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-interaction-states');
  const surface = page.getByTestId('visual-md-checkbox-interaction-states');
  await expect(surface).toHaveScreenshot('md-checkbox-interaction-states.png');
});

test('MDFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-states');

  const surface = page.getByTestId('visual-md-fab-states');

  await expect(surface).toHaveScreenshot('md-fab-states.png');
});

test('MDFab interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-interaction-states');

  const surface = page.getByTestId('visual-md-fab-interaction-states');

  await expect(surface).toHaveScreenshot('md-fab-interaction-states.png');
});

test('MDExtendedFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdextendedfab--visual-states');

  const surface = page.getByTestId('visual-md-extended-fab-states');

  await expect(surface).toHaveScreenshot('md-extended-fab-states.png');
});

test('MDListItem visual states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

  const surface = page.getByTestId('visual-md-list-states');

  await expect(surface).toHaveScreenshot('md-list-item-states.png');
});

test('MDListItem interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

  const surface = page.getByTestId('visual-md-list-interaction-states');

  await expect(surface).toHaveScreenshot('md-list-item-interaction-states.png');
});

test('MDListItem trailing action layout matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

  const surface = page.getByTestId('visual-md-list-trailing-action');

  await expect(surface).toHaveScreenshot('md-list-item-trailing-action.png');
});

test('MDListItem trailing action story avoids nested native buttons', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

  const nestedButtons = page.getByTestId('visual-md-list-trailing-action').locator('button button');

  await expect(nestedButtons).toHaveCount(0);
});

test('MDListItem trailing action icon buttons meet the Material 48dp minimum target size', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

  // The visible button element may be smaller than 48px; the interactive
  // target is the .md-icon-button__target span that expands the hit area.
  const surface = page.getByTestId('visual-md-list-trailing-action');
  const targets = surface.locator('.md-list-item__trailing-action .md-icon-button__target');
  const count = await targets.count();

  expect(count).toBeGreaterThan(0);

  const boxes = await Promise.all(
    Array.from({ length: count }, (_, i) => targets.nth(i).boundingBox()),
  );

  for (const [i, box] of boxes.entries()) {
    expect(box, `trailing action target ${i} must have a bounding box`).not.toBeNull();
    if (box) {
      expect(
        box.width,
        `trailing action target ${i} width must be at least 48px (Material min target)`,
      ).toBeGreaterThanOrEqual(48);
      expect(
        box.height,
        `trailing action target ${i} height must be at least 48px (Material min target)`,
      ).toBeGreaterThanOrEqual(48);
    }
  }
});

test('MDListItem configurations match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

  const surface = page.getByTestId('visual-md-list-configurations');

  await expect(surface).toHaveScreenshot('md-list-item-configurations.png');
});

test('MDListItem selection modes match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

  const surface = page.getByTestId('visual-md-list-selection');

  await expect(surface).toHaveScreenshot('md-list-item-selection.png');
});

test('MDList DOM contract keeps list semantics and separate action surfaces', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--dom-contract');

  await expect(page.locator('#dom-static-list')).toHaveAttribute('role', 'list');
  await expect(page.locator('#dom-static-item')).toHaveAttribute('role', 'listitem');
  await expect(page.locator('#dom-static-item button')).toHaveCount(0);

  await expect(page.locator('#dom-single-item')).toHaveAttribute('role', 'listitem');
  await expect(page.locator('#dom-single-item .md-list-item__primary-action')).toHaveCount(1);

  await expect(page.locator('#dom-multi-item')).toHaveAttribute('role', 'listitem');
  await expect(page.locator('#dom-multi-item .md-list-item__primary-action')).toHaveCount(1);
  await expect(page.locator('#dom-multi-item .md-list-item__trailing-action')).toHaveCount(1);
  await expect(page.locator('#dom-multi-item button button')).toHaveCount(0);
});

test('MDList segmented style rounds the first and last item wrappers', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--dom-contract');

  const first = page.locator('#dom-segmented-list .md-list-item').first();
  const last = page.locator('#dom-segmented-list .md-list-item').last();

  const firstRadius = await first.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
  const lastRadius = await last.evaluate((node) => getComputedStyle(node).borderBottomRightRadius);

  expect(firstRadius).toBe('16px');
  expect(lastRadius).toBe('16px');
});

test('MDListItem multi-action rows keep the trailing action independent from the primary action', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

  const targetRow = page.getByTestId('md-list-multi-action-independence');
  const primaryAction = targetRow.locator('.md-list-item__primary-action');
  const trailingAction = targetRow.getByRole('button', { name: 'Edit' });
  const primaryCount = page.locator('#md-list-primary-action-count');
  const trailingCount = page.locator('#md-list-trailing-action-count');

  await primaryAction.click();
  await expect(primaryCount).toHaveText('1');
  await expect(trailingCount).toHaveText('0');

  await trailingAction.click();
  await expect(primaryCount).toHaveText('1');
  await expect(trailingCount).toHaveText('1');
});

test('MDList selection uses list-level option semantics and a visible selected indicator', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

  const surface = page.getByTestId('visual-md-list-selection');
  const listboxes = surface.getByRole('listbox');

  await expect(listboxes).toHaveCount(2);
  await expect(listboxes.nth(0)).not.toHaveAttribute('aria-multiselectable', /true/);
  await expect(listboxes.nth(1)).toHaveAttribute('aria-multiselectable', 'true');

  const selectedOptions = surface.locator('[role="option"][aria-selected="true"]');
  await expect(selectedOptions).toHaveCount(3);
  await expect(
    selectedOptions.locator('.md-list-option__selection-indicator .md-symbol'),
  ).toHaveCount(3);
});

test('MDIconButton compact toolbar buttons keep the develop-sized layout footprint', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdiconbutton--compact-toolbar-layout');

  const buttons = page.getByTestId('visual-md-icon-button-toolbar-layout').getByRole('button');
  const count = await buttons.count();
  const boxes = await Promise.all(
    Array.from({ length: count }, (_, index) => buttons.nth(index).boundingBox()),
  );

  for (const box of boxes) {
    expect(box?.width).toBe(40);
    expect(box?.height).toBe(40);
  }
});

test('MDIconButton keeps a 48dp target layer for extra-small and small sizes without growing layout', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdiconbutton--visual-states');

  const targetButtons = page.getByTestId('visual-md-icon-button-targets').getByRole('button');
  const targetLayers = page
    .getByTestId('visual-md-icon-button-targets')
    .locator('.md-icon-button__target');
  const buttonBoxes = await Promise.all([
    targetButtons.nth(0).boundingBox(),
    targetButtons.nth(1).boundingBox(),
  ]);
  const targetBoxes = await Promise.all([
    targetLayers.nth(0).boundingBox(),
    targetLayers.nth(1).boundingBox(),
  ]);

  expect(buttonBoxes[0]?.width).toBe(32);
  expect(buttonBoxes[0]?.height).toBe(32);
  expect(buttonBoxes[1]?.width).toBe(40);
  expect(buttonBoxes[1]?.height).toBe(40);

  for (const box of targetBoxes) {
    expect(box?.width).toBeGreaterThanOrEqual(48);
    expect(box?.height).toBeGreaterThanOrEqual(48);
  }
});

test('MDButton keeps a 48dp target layer for extra-small and small sizes without growing layout', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdbutton--target-layers');

  const targetButtons = page.getByTestId('visual-md-button-targets').getByRole('button');
  const targetLayers = page.getByTestId('visual-md-button-targets').locator('.md-button__target');
  const buttonBoxes = await Promise.all([
    targetButtons.nth(0).boundingBox(),
    targetButtons.nth(1).boundingBox(),
  ]);
  const targetBoxes = await Promise.all([
    targetLayers.nth(0).boundingBox(),
    targetLayers.nth(1).boundingBox(),
  ]);

  expect(buttonBoxes[0]?.height).toBe(32);
  expect(buttonBoxes[1]?.height).toBe(40);

  for (const box of targetBoxes) {
    expect(box?.width).toBeGreaterThanOrEqual(48);
    expect(box?.height).toBeGreaterThanOrEqual(48);
  }
});

test('MDIconButton dense toolbar buttons keep click ownership near adjacent boundaries', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdiconbutton--dense-toolbar-interaction');

  const surface = page.locator('#visual-md-icon-button-toolbar-interaction');
  const addButton = surface.getByRole('button', { name: 'add', exact: true });
  const filterButton = surface.getByRole('button', { name: 'filter', exact: true });
  const addCount = page.locator('#toolbar-count-add');
  const filterCount = page.locator('#toolbar-count-filter');
  const addBox = await addButton.boundingBox();
  const filterBox = await filterButton.boundingBox();

  expect(addBox).not.toBeNull();
  expect(filterBox).not.toBeNull();

  if (addBox == null || filterBox == null) {
    throw new Error('Missing MDIconButton bounding boxes for dense toolbar edge-click test.');
  }

  await page.mouse.click(addBox.x + addBox.width / 2, addBox.y + addBox.height / 2);
  await expect(addCount).toHaveText('1');
  await expect(filterCount).toHaveText('0');

  await page.mouse.click(filterBox.x + filterBox.width / 2, filterBox.y + filterBox.height / 2);
  await expect(addCount).toHaveText('1');
  await expect(filterCount).toHaveText('1');

  await page.mouse.click(addBox.x + addBox.width - 1, addBox.y + addBox.height / 2);
  await expect(addCount).toHaveText('2');
  await expect(filterCount).toHaveText('1');

  await page.mouse.click(filterBox.x + 1, filterBox.y + filterBox.height / 2);
  await expect(addCount).toHaveText('2');
  await expect(filterCount).toHaveText('2');
});

test('MDIconButton dense toolbar hover handoff does not leave stale hover state', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdiconbutton--dense-toolbar-interaction');

  const surface = page.locator('#visual-md-icon-button-toolbar-interaction');
  const addButton = surface.getByRole('button', { name: 'add', exact: true });
  const filterButton = surface.getByRole('button', { name: 'filter', exact: true });
  const hovered = page.locator('#toolbar-hovered-button');

  await addButton.hover();
  await expect(hovered).toHaveText('add');
  await expect(addButton).toHaveClass(/md-state_hover/);

  await filterButton.hover();
  await expect(hovered).toHaveText('filter');
  await expect(filterButton).toHaveClass(/md-state_hover/);
  await expect(addButton).not.toHaveClass(/md-state_hover/);
});

test('MDIconButton default small layout footprint remains 40dp', async ({ page }) => {
  await openStory(page, 'shared-ui-mdiconbutton--visual-states');

  const button = page.getByRole('button', { name: 'Standard', exact: true });
  const box = await button.boundingBox();

  expect(box?.width).toBe(40);
  expect(box?.height).toBe(40);
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
