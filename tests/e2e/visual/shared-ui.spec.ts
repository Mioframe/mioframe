import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

test('MDButton visual states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');

  const surface = page.getByTestId('visual-md-button-states');

  await expect(surface).toHaveScreenshot('md-button-states.png');
});

test('MDButton interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-interaction-states');

  const surface = page.getByTestId('visual-md-button-interaction-states');

  await expect(surface).toHaveScreenshot('md-button-interaction-states.png');
});

test('MDButton expanded target activates clicks outside the visible button box', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--expanded-target-hit-area');

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

test('MDIconButton expanded target activates clicks outside the visible button box', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--expanded-target-hit-area');

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

test('MDButton label typography changes by size', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--size-typography');

  const readTypography = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => ({
      fontSize: getComputedStyle(el).fontSize,
      fontWeight: getComputedStyle(el).fontWeight,
    }));

  await expect(page.getByTestId('typography-small')).toBeVisible();

  const small = await readTypography('typography-small');
  const medium = await readTypography('typography-medium');
  const large = await readTypography('typography-large');
  const extraLarge = await readTypography('typography-extra-large');

  // label-large: 14px / 500
  expect(small.fontSize).toBe('14px');
  expect(small.fontWeight).toBe('500');
  // title-medium: 16px / 500
  expect(medium.fontSize).toBe('16px');
  expect(medium.fontWeight).toBe('500');
  // headline-small: 24px / 400
  expect(large.fontSize).toBe('24px');
  expect(large.fontWeight).toBe('400');
  // headline-large: 32px / 400
  expect(extraLarge.fontSize).toBe('32px');
  expect(extraLarge.fontWeight).toBe('400');
});

test('MDButton selected toggle shape morphs round and square input shapes', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-shapes');

  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  const roundSelected = await readRadius('toggle-round-selected');
  const roundUnselected = await readRadius('toggle-round-unselected');
  const squareSelected = await readRadius('toggle-square-selected');
  const squareUnselected = await readRadius('toggle-square-unselected');

  // A round input shape morphs from a full pill to the size's square corner token (smaller).
  expect(roundSelected).toBeLessThan(roundUnselected);
  // A square input shape morphs from its corner token to a fully-rounded shape (larger).
  expect(squareSelected).toBeGreaterThan(squareUnselected);
});

test('MDButton text toggle selects without the removed color restriction', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-text');

  const button = page.getByRole('button', { name: 'Bookmark' });

  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveClass(/md-button_selected/);
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

test('MDSwitch visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdswitch--visual-states');

  const surface = page.getByTestId('visual-md-switch-states');

  await expect(surface).toHaveScreenshot('md-switch-states.png');
});

test('MDSwitch interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdswitch--visual-interaction-states');
  const surface = page.getByTestId('visual-md-switch-interaction-states');
  await expect(surface).toHaveScreenshot('md-switch-interaction-states.png');
});

test('MDSwitch icon states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdswitch--visual-icon-states');

  const surface = page.getByTestId('visual-md-switch-icon-states');

  await expect(surface).toHaveScreenshot('md-switch-icon-states.png');
});

test('MDSwitch icon interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdswitch--visual-icon-interaction-states');

  const surface = page.getByTestId('visual-md-switch-icon-interaction-states');

  await expect(surface).toHaveScreenshot('md-switch-icon-interaction-states.png');
});

test('MDSwitch keeps a 48dp target layer without growing the visual track height', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdswitch--expanded-target-hit-area');

  const surface = page.locator('#visual-md-switch-target-hit');
  const switchHost = surface.getByRole('switch', { name: 'Expanded target', exact: true });
  const target = surface.locator('.md-switch__target');
  const count = page.locator('#visual-md-switch-target-hit-count');
  const switchBox = await switchHost.boundingBox();
  const targetBox = await target.boundingBox();

  expect(switchBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  if (switchBox == null || targetBox == null) {
    throw new Error('Missing MDSwitch bounding boxes for expanded target hit test.');
  }

  expect(switchBox.width).toBe(52);
  expect(switchBox.height).toBe(32);
  expect(targetBox.width).toBeGreaterThanOrEqual(52);
  expect(targetBox.height).toBeGreaterThanOrEqual(48);

  const clickPoint = {
    x: switchBox.x + switchBox.width / 2,
    y: switchBox.y - 2,
  };

  expect(clickPoint.x).toBeGreaterThan(targetBox.x);
  expect(clickPoint.x).toBeLessThan(targetBox.x + targetBox.width);
  expect(clickPoint.y).toBeGreaterThan(targetBox.y);
  expect(clickPoint.y).toBeLessThan(targetBox.y + targetBox.height);
  expect(clickPoint.y).toBeLessThan(switchBox.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
});

test('MDSwitch drag from unselected to selected changes state without double-toggle', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdswitch--drag-interaction');

  const surface = page.locator('#visual-md-switch-drag');
  const switchHost = surface.getByRole('switch', { name: 'Drag switch', exact: true });
  const clickCount = page.locator('#visual-md-switch-drag-count');
  const currentValue = page.locator('#visual-md-switch-drag-value');

  const box = await switchHost.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Missing MDSwitch bounding box for drag test.');

  // Start on left side (unselected handle area), drag to right side.
  const startX = box.x + box.width * 0.2;
  const endX = box.x + box.width * 0.8;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(startX, centerY);
  await page.mouse.down();
  await page.mouse.move(endX, centerY, { steps: 5 });
  await page.mouse.up();

  await expect(currentValue).toHaveText('true');
  // Only one toggle event should have fired (drag resolves once; click is suppressed).
  await expect(clickCount).toHaveText('1');
});

test('MDSwitch drag from selected to unselected changes state', async ({ page }) => {
  await openStory(page, 'shared-ui-mdswitch--drag-interaction');

  const surface = page.locator('#visual-md-switch-drag');
  const switchHost = surface.getByRole('switch', { name: 'Drag switch', exact: true });
  const currentValue = page.locator('#visual-md-switch-drag-value');

  const box = await switchHost.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Missing MDSwitch bounding box for drag test.');

  // First click to reach selected state.
  await switchHost.click();
  await expect(currentValue).toHaveText('true');

  // Drag left to unselect.
  const startX = box.x + box.width * 0.8;
  const endX = box.x + box.width * 0.2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(startX, centerY);
  await page.mouse.down();
  await page.mouse.move(endX, centerY, { steps: 5 });
  await page.mouse.up();

  await expect(currentValue).toHaveText('false');
});

test('MDSwitch focus indicator follows handle target bounding box, not switch host', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdswitch--focus-indicator-target');

  const switchHost = page.getByRole('switch', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  // Tab from a page with no focused element: the browser focuses the first focusable
  // element (the switch) and the Tab keydown sets isKeyboardNav = true in useFocusIndicator.
  await page.keyboard.press('Tab');
  await expect(switchHost).toBeFocused();

  // Wait two frames: one for useElementBounding to read getBoundingClientRect,
  // one for the Vue watcher to apply moveIndicator inline styles.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            resolve();
          }),
        ),
      ),
  );

  const indicatorBox = await indicator.boundingBox();
  const handleBox = await switchHost.locator('.md-switch__handle').boundingBox();
  const switchBox = await switchHost.boundingBox();

  expect(indicatorBox).not.toBeNull();
  expect(handleBox).not.toBeNull();
  expect(switchBox).not.toBeNull();

  if (!indicatorBox || !handleBox || !switchBox) {
    throw new Error('Missing bounding boxes for MDSwitch focus indicator test.');
  }

  // The focus indicator must be narrower than the switch host (52dp track).
  // The unselected handle is 16dp; with a 2dp focus-indicator-offset on each side it is ~20dp.
  expect(indicatorBox.width).toBeLessThan(switchBox.width);

  // Center of indicator must be close to center of the handle (within offset + rendering tolerance).
  const TOLERANCE = 8;
  const indicatorCenterX = indicatorBox.x + indicatorBox.width / 2;
  const indicatorCenterY = indicatorBox.y + indicatorBox.height / 2;
  const handleCenterX = handleBox.x + handleBox.width / 2;
  const handleCenterY = handleBox.y + handleBox.height / 2;

  expect(Math.abs(indicatorCenterX - handleCenterX)).toBeLessThan(TOLERANCE);
  expect(Math.abs(indicatorCenterY - handleCenterY)).toBeLessThan(TOLERANCE);
});

test('MDFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--visual-states');

  const surface = page.getByTestId('visual-md-fab-states');

  await expect(surface).toHaveScreenshot('md-fab-states.png');
});

test('MDFab interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--visual-interaction-states');

  const surface = page.getByTestId('visual-md-fab-interaction-states');

  await expect(surface).toHaveScreenshot('md-fab-interaction-states.png');
});

test('MDExtendedFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--visual-states');

  const surface = page.getByTestId('visual-md-extended-fab-states');

  await expect(surface).toHaveScreenshot('md-extended-fab-states.png');
});

test('MDExtendedFab icon-label gap changes by size', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--size-gaps');

  const readGap = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => getComputedStyle(el).columnGap);

  await expect(page.getByTestId('gap-small')).toBeVisible();

  expect(await readGap('gap-small')).toBe('8px');
  expect(await readGap('gap-medium')).toBe('12px');
  expect(await readGap('gap-large')).toBe('16px');
});

test('MDFab default color resolves to the primary-container token', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--default');

  const button = page.getByRole('button');

  await expect(button).toHaveClass(/md-fab_color_primary-container/);

  const backgroundColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
  const primaryContainerColor = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'var(--md-sys-color-primary-container)';
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });

  expect(backgroundColor).toBe(primaryContainerColor);
});

test('MDCard visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--visual-states');

  const surface = page.getByTestId('visual-md-card-states');

  await expect(surface).toHaveScreenshot('md-card-states.png');
});

test('MDCard interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--visual-interaction-states');

  const surface = page.getByTestId('visual-md-card-interaction-states');

  await expect(surface).toHaveScreenshot('md-card-interaction-states.png');
});

test('MDCard static card has no role, tabindex, or actionable affordance', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--static-with-internal-actions');

  const card = page.locator('.md-card').first();

  await expect(card).not.toHaveAttribute('role');
  await expect(card).not.toHaveAttribute('tabindex');
  // Scoped to a direct child: the card's own conditional MDStateLayer renders
  // as a direct child of the root, while `.md-state-layer` descendant search
  // would also match the internal MDButtons' own state layers.
  await expect(card.locator('> .md-state-layer')).toHaveCount(0);

  await card.click({ position: { x: 4, y: 4 } });
  await expect(card.locator('> .md-ripple')).toHaveCount(0);

  await expect(page.getByRole('button', { name: 'Install' })).toBeVisible();
});

test('MDCard actionable button card emits action on click and keyboard activation', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcard--action-behavior');

  const card = page.getByTestId('md-card-button-action');
  const count = page.getByTestId('md-card-button-action-count');

  await expect(card).toHaveCount(1);
  await expect(count).toHaveText('0');

  await card.click();
  await expect(count).toHaveText('1');

  await card.focus();
  await page.keyboard.press('Enter');
  await expect(count).toHaveText('2');

  await page.keyboard.press('Space');
  await expect(count).toHaveText('3');
});

test('MDCard actionable link card emits action and navigates on click and Enter', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcard--action-behavior');

  const card = page.getByTestId('md-card-link-action');
  const count = page.getByTestId('md-card-link-action-count');

  await expect(card).toHaveAttribute('href', '#md-card-link-action-target');
  await expect(count).toHaveText('0');

  await card.click();
  await expect(count).toHaveText('1');
  await expect(page).toHaveURL(/#md-card-link-action-target$/);

  await page.evaluate(() => {
    window.location.hash = '';
  });
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(count).toHaveText('2');
  await expect(page).toHaveURL(/#md-card-link-action-target$/);
});

test('MDCard disabled link card blocks navigation, keeps aria-disabled semantics, and does not emit action', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcard--action-behavior');

  const linkCard = page.getByTestId('md-card-disabled-link-action');
  const count = page.getByTestId('md-card-disabled-link-action-count');
  const urlBeforeClick = page.url();

  await expect(linkCard).toHaveAttribute('aria-disabled', 'true');
  await expect(linkCard).toHaveAttribute('tabindex', '-1');
  await expect(linkCard).not.toHaveAttribute('href');

  // `aria-disabled="true"` makes Playwright's actionability check treat the
  // link as not enabled, so a plain click would hang waiting for it to
  // become enabled. Force the click to exercise MDCard's own script-level
  // click guard instead of Playwright's actionability check.
  await linkCard.click({ force: true });

  await expect(count).toHaveText('0');
  expect(page.url()).toBe(urlBeforeClick);
});

test('MDCard root establishes the Material surface context for descendants', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--variants');

  const card = page.locator('.md-card').first();

  const surfaceContext = await card.evaluate((node) => {
    const style = getComputedStyle(node);

    return {
      containerColor: style.getPropertyValue('--md-container-color').trim(),
      contentColor: style.getPropertyValue('--md-content-color').trim(),
      currentContainerColor: style.getPropertyValue('--md-current-container-color').trim(),
      currentContentColor: style.getPropertyValue('--md-current-content-color').trim(),
    };
  });

  expect(surfaceContext.containerColor).not.toBe('');
  expect(surfaceContext.contentColor).not.toBe('');
  expect(surfaceContext.currentContainerColor).toBe(surfaceContext.containerColor);
  expect(surfaceContext.currentContentColor).toBe(surfaceContext.contentColor);
});

test('MDIconButton compact toolbar buttons keep the develop-sized layout footprint', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--compact-toolbar-layout');

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
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-states');

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
  await openStory(page, 'material-3-components-buttons-mdbutton--target-layers');

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
  await openStory(page, 'material-3-components-buttons-mdiconbutton--dense-toolbar-interaction');

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
  await openStory(page, 'material-3-components-buttons-mdiconbutton--dense-toolbar-interaction');

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
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-states');

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
