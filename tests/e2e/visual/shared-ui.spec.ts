import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

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
