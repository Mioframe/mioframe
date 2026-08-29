import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

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

test('MDIconButton selected pressed shape wins over selected shape under a real pointer press', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--geometry');

  /**
   * Read the rendered public host radius for the named geometry fixture.
   * @param testId - Geometry fixture test identifier.
   * @returns Rendered border radius in CSS pixels.
   */
  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  const selectedButton = page.getByTestId('geometry-round-selected');
  const selectedOnlyRadius = await readRadius('geometry-round-selected');
  const pressedOnlyRadius = await readRadius('geometry-round-pressed');

  const box = await selectedButton.boundingBox();
  if (box == null) {
    throw new Error('Missing MDIconButton bounding box for real-press shape precedence test.');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(selectedButton).toHaveClass(/md-state_pressed/);

  // A real native `:active` press on a selected icon button must still render the plain pressed
  // shape, matching MDButton's equivalent precedence, not the selected shape. The shape morph is
  // an animated `border-radius` transition, so poll for the settled value instead of an arbitrary
  // sleep.
  await expect
    .poll(() => readRadius('geometry-round-selected'), { timeout: 2_000 })
    .toBeCloseTo(pressedOnlyRadius, 5);

  const pressedRadius = await readRadius('geometry-round-selected');
  await page.mouse.up();

  expect(pressedRadius).not.toBeCloseTo(selectedOnlyRadius, 5);
});
