import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

// Small rendering tolerance for direct geometry comparisons below: the indicator's box is set
// from the host's `getBoundingClientRect()` via a reactive watcher, so it can differ from the
// host by a sub-pixel rounding amount even once settled.
const GEOMETRY_TOLERANCE_PX = 1;

/**
 * Shared by each button family's real-focus-visible test: waits for the global focus indicator
 * to finish animating into position (it CSS-transitions top/left/width/height on focus change),
 * then asserts its x/y/width/height directly match the focused host's geometry (not just
 * contain it), plus corner radius, and that its visible outline extent
 * (outline-width + outline-offset) stays within the viewport.
 * @param page - The Playwright page used by the behavior test.
 * @param indicator - The shared `.md-focus-indicator` element.
 * @param host - The focused component host.
 */
const assertFocusIndicatorFollowsHost = async (page: Page, indicator: Locator, host: Locator) => {
  const readBoxes = async () => Promise.all([indicator.boundingBox(), host.boundingBox()] as const);

  // The indicator animates toward the host via a CSS transition, so poll for settlement instead
  // of trusting a fixed frame count or an arbitrary sleep.
  await expect
    .poll(
      async () => {
        const [indicatorBox, hostBox] = await readBoxes();
        if (!indicatorBox || !hostBox) {
          return Number.POSITIVE_INFINITY;
        }
        return Math.max(
          Math.abs(indicatorBox.x - hostBox.x),
          Math.abs(indicatorBox.y - hostBox.y),
          Math.abs(indicatorBox.width - hostBox.width),
          Math.abs(indicatorBox.height - hostBox.height),
        );
      },
      { timeout: 2_000 },
    )
    .toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);

  const [indicatorBox, hostBox] = await readBoxes();
  const viewport = page.viewportSize();

  if (!indicatorBox || !hostBox || !viewport) {
    throw new Error('Missing bounding boxes for focus indicator test.');
  }

  expect(indicatorBox.width).toBeGreaterThan(0);
  expect(indicatorBox.height).toBeGreaterThan(0);

  // Geometry directly matches the rendered host container, not merely contains it.
  expect(Math.abs(indicatorBox.x - hostBox.x)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  expect(Math.abs(indicatorBox.y - hostBox.y)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  expect(Math.abs(indicatorBox.width - hostBox.width)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  expect(Math.abs(indicatorBox.height - hostBox.height)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);

  // The indicator's border-radius tracks the focused host's own rendered corner radius.
  const indicatorRadius = await indicator.evaluate((el) =>
    parseFloat(getComputedStyle(el).borderRadius),
  );
  const hostRadius = await host.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
  expect(indicatorRadius).toBeCloseTo(hostRadius, 0);

  // Clipping must account for the indicator's *visible* outline extent (outline-width +
  // outline-offset), not just its positioned box, since the outline paints outward from it.
  const { outlineWidth, outlineOffset } = await indicator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      outlineWidth: parseFloat(style.outlineWidth),
      outlineOffset: parseFloat(style.outlineOffset),
    };
  });
  const visibleExtent = outlineWidth + outlineOffset;

  expect(indicatorBox.x - visibleExtent).toBeGreaterThanOrEqual(0);
  expect(indicatorBox.y - visibleExtent).toBeGreaterThanOrEqual(0);
  expect(indicatorBox.x + indicatorBox.width + visibleExtent).toBeLessThanOrEqual(viewport.width);
  expect(indicatorBox.y + indicatorBox.height + visibleExtent).toBeLessThanOrEqual(viewport.height);
};

test('MDButton expanded target activates clicks outside the visible container box', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--expanded-target-hit-area');

  const surface = page.locator('#visual-md-button-target-hit');
  // The button host reserves the full 48dp minimum interaction target as its own real layout
  // box; `.md-button__container` renders the smaller documented visual pill centered inside it.
  const button = surface.getByRole('button', { name: 'OK', exact: true });
  const container = surface.locator('.md-button__container');
  const count = page.locator('#visual-md-button-target-hit-count');
  const buttonBox = await button.boundingBox();
  const containerBox = await container.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(containerBox).not.toBeNull();

  if (buttonBox == null || containerBox == null) {
    throw new Error('Missing MDButton bounding boxes for expanded target hit test.');
  }

  const clickPoint = {
    x: containerBox.x + containerBox.width / 2,
    y: buttonBox.y + 2,
  };

  expect(clickPoint.x).toBeGreaterThan(buttonBox.x);
  expect(clickPoint.x).toBeLessThan(buttonBox.x + buttonBox.width);
  expect(clickPoint.y).toBeGreaterThan(buttonBox.y);
  expect(clickPoint.y).toBeLessThan(buttonBox.y + buttonBox.height);
  expect(clickPoint.y).toBeLessThan(containerBox.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
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

test('MDButton focus indicator follows real keyboard focus and is not clipped', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  // Wait for the story to finish mounting before driving Tab, otherwise the fixed-position
  // fixture may not yet be an eligible tab stop.
  await expect(host).toBeVisible();

  // Tab from a page with no focused element: the browser focuses the first focusable element.
  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  // The focused host reserves the (possibly larger) minimum interaction target; the indicator's
  // documented bounding source is `.md-button__container` (`data-md-focus-indicator-target`),
  // the actual visible button.
  await assertFocusIndicatorFollowsHost(page, indicator, host.locator('.md-button__container'));
});

test('MDButton pressed shape starts releasing immediately after a quick pointer press', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--size-geometry-matrix');

  const button = page.getByTestId('geometry-small-round');
  const readContainerRadius = (el: HTMLElement) =>
    parseFloat(getComputedStyle(el.querySelector('.md-button__container') ?? el).borderRadius);
  const restingRadius = await button.evaluate(readContainerRadius);
  const pressedRadius = await page
    .getByTestId('geometry-small-pressed')
    .evaluate(readContainerRadius);
  const box = await button.boundingBox();

  if (box == null) {
    throw new Error('Missing MDButton bounding box for pressed-shape release test.');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(button).toHaveClass(/md-button_pressed/);
  await expect.poll(() => button.evaluate(readContainerRadius)).toBeCloseTo(pressedRadius, 1);

  await page.mouse.up();
  await expect(button).not.toHaveClass(/md-button_pressed/);

  await expect
    .poll(() => button.evaluate(readContainerRadius), {
      timeout: 150,
    })
    .toBeGreaterThan(pressedRadius + (restingRadius - pressedRadius) / 4);
});

test('MDIconButton focus indicator follows real keyboard focus and is not clipped', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  await expect(host).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
});

test('MDFab focus indicator follows real keyboard focus and is not clipped', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  await expect(host).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
});

test('MDExtendedFab focus indicator follows real keyboard focus and is not clipped', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  await expect(host).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
});

test('MDIconButton selected pressed shape wins over selected shape under a real pointer press', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--geometry');

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
