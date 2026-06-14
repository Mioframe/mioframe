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

test('MDListItem multi-action trailing padding fires primary action, not trailing', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

  const targetRow = page.getByTestId('md-list-multi-action-independence');
  const trailingSlot = targetRow.locator('.md-list-item__trailing-action');
  const iconButton = targetRow.getByRole('button', { name: 'Edit' });
  const primaryCount = page.locator('#md-list-primary-action-count');
  const trailingCount = page.locator('#md-list-trailing-action-count');

  const trailingBox = await trailingSlot.boundingBox();
  const iconBox = await iconButton.boundingBox();

  expect(trailingBox, 'trailing slot must have a bounding box').not.toBeNull();
  expect(iconBox, 'trailing icon button must have a bounding box').not.toBeNull();

  if (!trailingBox || !iconBox) {
    throw new Error('Could not get bounding boxes for trailing hit-zone test.');
  }

  // Click the left edge of the trailing slot, which is padding space outside the icon
  // button. With pointer-events: none on the container the click falls through to the
  // primary action that is position: absolute; inset: 0 underneath.
  const paddingClickX = trailingBox.x + 2;
  const paddingClickY = trailingBox.y + trailingBox.height / 2;

  // The trailing container must have measurable padding to the left of the icon button.
  // If there is no gap, the multi-action hit-zone contract is violated.
  expect(
    paddingClickX,
    'trailing slot must have measurable padding to the left of the icon button (trailing-action padding-inline-start must create a non-interactive gap)',
  ).toBeLessThan(iconBox.x);

  await page.mouse.click(paddingClickX, paddingClickY);
  await expect(primaryCount).toHaveText('1');
  await expect(trailingCount).toHaveText('0');
});

test('MDListItem multi-action primary area hover activates row-level hover state', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

  // data-testid propagates to both the listitem root and the primary-action button,
  // so narrow to the role=listitem wrapper for class assertions.
  const targetRow = page.locator(
    '[data-testid="md-list-multi-action-independence"][role="listitem"]',
  );
  const primaryAction = targetRow.locator('.md-list-item__primary-action');

  await primaryAction.hover();

  await expect(targetRow).toHaveClass(/md-state_hover/);
});

test('MDListItem multi-action trailing target hover removes row-level hover state', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

  const targetRow = page.locator(
    '[data-testid="md-list-multi-action-independence"][role="listitem"]',
  );
  const primaryAction = targetRow.locator('.md-list-item__primary-action');
  const trailingButton = targetRow.getByRole('button', { name: 'Edit' });

  await primaryAction.hover();
  await expect(targetRow).toHaveClass(/md-state_hover/);

  await trailingButton.hover();
  await expect(targetRow).not.toHaveClass(/md-state_hover/);
});

test('MDListItem multi-action trailing empty padding hover keeps row-level hover state', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

  const targetRow = page.locator(
    '[data-testid="md-list-multi-action-independence"][role="listitem"]',
  );
  const trailingSlot = targetRow.locator('.md-list-item__trailing-action');
  const iconButton = targetRow.getByRole('button', { name: 'Edit' });

  const trailingBox = await trailingSlot.boundingBox();
  const iconBox = await iconButton.boundingBox();

  expect(trailingBox, 'trailing slot must have a bounding box').not.toBeNull();
  expect(iconBox, 'trailing icon button must have a bounding box').not.toBeNull();

  if (!trailingBox || !iconBox) {
    throw new Error('Could not get bounding boxes for trailing empty-padding hover test.');
  }

  // The trailing container must have measurable padding to the left of the icon button.
  // If there is no gap, the multi-action hover-ownership contract is violated.
  expect(
    trailingBox.x + 4,
    'trailing slot must have measurable padding to the left of the icon button (at least 4px gap required for hover-ownership test)',
  ).toBeLessThan(iconBox.x);

  // Move pointer to the left-edge padding of the trailing slot, which has
  // pointer-events: none, so the event falls through to the primary action.
  await page.mouse.move(trailingBox.x + 2, trailingBox.y + trailingBox.height / 2);

  await expect(targetRow).toHaveClass(/md-state_hover/);
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
    selectedOptions.locator('.md-list-selection-item__selection-indicator .md-symbol'),
  ).toHaveCount(3);
});

test('MDListSelectionItem long text does not overflow the list container', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

  const surface = page.getByTestId('visual-md-list-selection');
  const surfaceBox = await surface.boundingBox();

  expect(surfaceBox, 'selection surface must have a bounding box').not.toBeNull();
  if (!surfaceBox) {
    throw new Error('Could not get bounding box for selection surface.');
  }

  // The long-text item is the third option in the multi-select segmented list.
  const longTextItem = surface.getByRole('option').filter({ hasText: /Very long document title/ });

  const itemBox = await longTextItem.boundingBox();

  expect(itemBox, 'long-text item must have a bounding box').not.toBeNull();
  if (!itemBox) {
    throw new Error('Could not get bounding box for long-text selection item.');
  }

  expect(
    itemBox.x + itemBox.width,
    'long-text item right edge must not exceed the selection surface right edge',
  ).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width + 1);

  // Selection indicator must remain visible alongside the truncated content.
  const indicator = longTextItem.locator('.md-list-selection-item__selection-indicator');
  const indicatorBox = await indicator.boundingBox();

  expect(indicatorBox, 'selection indicator must have a bounding box').not.toBeNull();
  if (!indicatorBox) {
    throw new Error('Could not get bounding box for selection indicator.');
  }

  expect(
    indicatorBox.x,
    'selection indicator must be inside the surface left edge',
  ).toBeGreaterThanOrEqual(surfaceBox.x);
  expect(
    indicatorBox.x + indicatorBox.width,
    'selection indicator must not exceed the surface right edge',
  ).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width + 1);
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

test('MDList standard items have transparent background inheriting parent surface', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

  const surface = page.getByTestId('visual-md-list-surface-standard');

  // Standard list items must be transparent. Verify by checking the item background
  // is transparent (no non-transparent background on the list item root).
  const listItems = surface.locator('.md-list_style_standard .md-list-item').first();

  const bgColor = await listItems.evaluate((node) => getComputedStyle(node).backgroundColor);

  // transparent computes as rgba(0, 0, 0, 0) in browser.
  expect(
    bgColor,
    'standard list item background must be transparent to inherit the parent surface color',
  ).toBe('rgba(0, 0, 0, 0)');
});

test('MDList standard container has transparent background', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

  const standardList = page.locator('#surface-context-wrapped-standard .md-list').first();

  const bgColor = await standardList.evaluate((node) => getComputedStyle(node).backgroundColor);

  expect(
    bgColor,
    'standard list container must be transparent so wrapper and parent surfaces remain visible',
  ).toBe('rgba(0, 0, 0, 0)');
});

test('MDList standard surface context survives intermediate wrappers', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

  const wrappedSurface = page.locator('#surface-context-wrapped-standard');
  const wrappedItem = wrappedSurface.locator('.md-list-item').first();

  const [surfaceColor, itemColor] = await Promise.all([
    wrappedSurface.evaluate((node) => getComputedStyle(node).backgroundColor),
    wrappedItem.evaluate((node) => getComputedStyle(node).backgroundColor),
  ]);

  expect(surfaceColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(
    itemColor,
    'intermediate wrappers must not inject a background or break inherited surface context',
  ).toBe('rgba(0, 0, 0, 0)');
});

test('MDList segmented container owns the grouped surface background', async ({ page }) => {
  await openStory(
    page,
    'material-3-components-lists-mdlistitem--surface-context-repository-explorer',
  );

  const segmentedList = page.locator('#surface-context-repository-segmented-list .md-list').first();

  const bgColor = await segmentedList.evaluate((node) => getComputedStyle(node).backgroundColor);

  expect(bgColor, 'segmented list container must own the grouped surface background').not.toBe(
    'rgba(0, 0, 0, 0)',
  );
});

test('MDList segmented items remain transparent inside the grouped surface', async ({ page }) => {
  await openStory(
    page,
    'material-3-components-lists-mdlistitem--surface-context-repository-explorer',
  );

  const segmentedItem = page
    .locator('#surface-context-repository-segmented-list .md-list-item')
    .first();

  const bgColor = await segmentedItem.evaluate((node) => getComputedStyle(node).backgroundColor);

  expect(
    bgColor,
    'segmented list items should stay transparent so the grouped container owns the base surface',
  ).toBe('rgba(0, 0, 0, 0)');
});

test('MDList segmented surface does not leak into the Repository Explorer header', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-lists-mdlistitem--surface-context-repository-explorer',
  );

  const header = page.locator(
    '#surface-context-repository-documents .md-list-item-surface-repository-story__repo-header',
  );
  const segmentedList = page.locator('#surface-context-repository-segmented-list .md-list').first();

  const [headerColor, listColor] = await Promise.all([
    header.evaluate((node) => getComputedStyle(node).backgroundColor),
    segmentedList.evaluate((node) => getComputedStyle(node).backgroundColor),
  ]);

  expect(
    headerColor,
    'the Repository Explorer header must remain transparent and inherit the parent section surface',
  ).toBe('rgba(0, 0, 0, 0)');
  expect(listColor).not.toBe(headerColor);
});

test('MDListItem surface context standard story matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

  const surface = page.getByTestId('visual-md-list-surface-standard');

  await expect(surface).toHaveScreenshot('md-list-item-surface-context-standard.png');
});

test('MDListItem surface context segmented story matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

  const surface = page.getByTestId('visual-md-list-surface-segmented');

  await expect(surface).toHaveScreenshot('md-list-item-surface-context-segmented.png');
});

test('MDListItem surface context repository explorer story matches baseline', async ({ page }) => {
  await openStory(
    page,
    'material-3-components-lists-mdlistitem--surface-context-repository-explorer',
  );

  const surface = page.getByTestId('visual-md-list-surface-repository');

  await expect(surface).toHaveScreenshot('md-list-item-surface-context-repository.png');
});

test('MDListItem consumer patterns story matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

  const surface = page.getByTestId('visual-md-list-consumer-patterns');

  await expect(surface).toHaveScreenshot('md-list-item-consumer-patterns.png');
});

test('MDListItem standalone public API story matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

  const surface = page.getByTestId('visual-md-list-item-standalone');

  await expect(surface).toHaveScreenshot('md-list-item-standalone.png');
});

test('MDListItem standalone with leading icon has measurable space between icon and content', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

  const row = page.locator('#standalone-static-leading .md-list-item').first();
  const leading = row.locator('.md-list-item__leading').first();
  const content = row.locator('.md-list-item__content').first();

  const leadingBox = await leading.boundingBox();
  const contentBox = await content.boundingBox();

  expect(leadingBox, 'leading slot must have a bounding box').not.toBeNull();
  expect(contentBox, 'content slot must have a bounding box').not.toBeNull();

  if (!leadingBox || !contentBox) {
    throw new Error('Could not get bounding boxes for standalone leading/content gap test.');
  }

  const gap = contentBox.x - (leadingBox.x + leadingBox.width);

  expect(
    gap,
    'standalone MDListItem must have measurable space (>= 8px) between leading icon and content — gap of 0 means anatomy vars were not resolved',
  ).toBeGreaterThanOrEqual(8);
});

test('MDListItem standalone content column does not overlap leading slot', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

  const row = page.locator('#standalone-static-leading .md-list-item').first();
  const leading = row.locator('.md-list-item__leading').first();
  const content = row.locator('.md-list-item__content').first();

  const leadingBox = await leading.boundingBox();
  const contentBox = await content.boundingBox();

  expect(leadingBox, 'leading slot must have a bounding box').not.toBeNull();
  expect(contentBox, 'content slot must have a bounding box').not.toBeNull();

  if (!leadingBox || !contentBox) {
    throw new Error('Could not get bounding boxes for standalone overlap test.');
  }

  expect(
    contentBox.x,
    'standalone MDListItem content must start to the right of the leading slot right edge',
  ).toBeGreaterThan(leadingBox.x + leadingBox.width);
});

test('MDListItem standalone single-action root element is the interactive button', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

  // Standalone single-action: root IS the button (not a wrapper div with an internal button).
  // This verifies the standalone DOM contract: no extra wrapper layer around the action surface.
  const row = page.locator('#standalone-single-action-leading .md-list-item').first();
  const tagName = await row.evaluate((node) => node.tagName.toLowerCase());

  expect(
    tagName,
    'standalone single-action MDListItem root must be a button (not a div wrapper with internal button)',
  ).toBe('button');

  // The button must meet the Material minimum item height (64px for one-line items).
  const box = await row.boundingBox();
  expect(box, 'standalone single-action button must have a bounding box').not.toBeNull();
  if (box) {
    expect(
      box.height,
      'standalone single-action button must meet minimum item height (64dp = 64px)',
    ).toBeGreaterThanOrEqual(64);
  }
});

test('MDListItem standalone multi-action keeps primary/trailing action separation', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

  const row = page.locator('#standalone-multi-action .md-list-item').first();
  const trailingSlot = row.locator('.md-list-item__trailing-action');
  const iconButton = row.getByRole('button');

  const trailingBox = await trailingSlot.boundingBox();
  const iconBox = await iconButton.boundingBox();

  expect(trailingBox, 'trailing action container must have a bounding box').not.toBeNull();
  expect(iconBox, 'trailing action icon button must have a bounding box').not.toBeNull();

  if (!trailingBox || !iconBox) {
    throw new Error('Could not get bounding boxes for standalone multi-action separation test.');
  }

  // The trailing container padding-inline-start (8dp) must create a visible gap to the left
  // of the icon button — this gap is the non-interactive padding that falls through to the
  // primary action.
  expect(
    trailingBox.x,
    'trailing action container must start to the left of the icon button (padding gap required)',
  ).toBeLessThan(iconBox.x);
});

test('MDListItem EntryAddSheet consumer rows have correct leading icon spacing', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

  const rows = page.locator('#standalone-entry-add-sheet .md-list-item');
  const count = await rows.count();

  expect(count).toBeGreaterThan(0);

  const boxPairs = await Promise.all(
    Array.from({ length: count }, (_, i) => {
      const row = rows.nth(i);
      return Promise.all([
        row.locator('.md-list-item__leading').boundingBox(),
        row.locator('.md-list-item__content').boundingBox(),
      ]);
    }),
  );

  for (const [i, [leadingBox, contentBox]] of boxPairs.entries()) {
    if (!leadingBox || !contentBox) {
      throw new Error(`Row ${i}: could not get bounding boxes for EntryAddSheet spacing test.`);
    }

    expect(
      contentBox.x,
      `EntryAddSheet row ${i}: content must start to the right of the leading icon right edge — no overlap allowed`,
    ).toBeGreaterThan(leadingBox.x + leadingBox.width);
  }
});

test('MDListItem Home actions are two-line items without forced three-line layout', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

  const homeSection = page.locator('#consumer-home-actions');
  const listItems = homeSection.locator('.md-list-item');
  const items = await listItems.all();

  expect(items.length).toBeGreaterThan(0);

  // Home actions have supporting text but no overline → must be two-line, not three-line.
  await Promise.all(
    items.map(async (item) => {
      await expect(item).toHaveClass(/md-list-item_line-count_2/);
      await expect(item).not.toHaveClass(/md-list-item_line-count_3/);
    }),
  );
});

test('MDListItem Settings checkbox row does not contain nested interactive controls', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

  const checkboxSection = page.locator('#consumer-settings-checkbox');

  // The presentation checkbox must not be a standalone interactive control.
  // No native inputs or labels should exist inside the row.
  const inputs = checkboxSection.locator('input');
  await expect(inputs).toHaveCount(0);

  const labels = checkboxSection.locator('label');
  await expect(labels).toHaveCount(0);

  // Nested buttons inside the row's primary action button are invalid.
  const nestedButtons = checkboxSection.locator('button button');
  await expect(nestedButtons).toHaveCount(0);
});

test('MDListItem disabled Settings checkbox row shows no pointer cursor', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

  const checkboxSection = page.locator('#consumer-settings-checkbox');
  const disabledRow = checkboxSection.locator('.md-list-item.md-state_disabled').first();

  const cursor = await disabledRow.evaluate((node) => getComputedStyle(node).cursor);

  expect(cursor, 'disabled checkbox row must not show pointer cursor').not.toBe('pointer');
});

test('MDListItem consumer patterns have no nested native buttons', async ({ page }) => {
  await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

  const surface = page.getByTestId('visual-md-list-consumer-patterns');
  const nestedButtons = surface.locator('button button');

  await expect(nestedButtons).toHaveCount(0);
});
