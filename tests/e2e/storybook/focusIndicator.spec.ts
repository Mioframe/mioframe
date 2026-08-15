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

  await assertFocusIndicatorFollowsHost(page, indicator, host);
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
