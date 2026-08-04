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

test('MDButton expanded target activates clicks outside the visible button box', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--expanded-target-hit-area');

  const surface = page.locator('#visual-md-button-target-hit');
  const button = surface.getByRole('button', { name: 'OK', exact: true });
  const count = page.locator('#visual-md-button-target-hit-count');
  const buttonBox = await button.boundingBox();

  expect(buttonBox).not.toBeNull();

  if (buttonBox == null) {
    throw new Error('Missing MDButton bounding box for expanded target hit test.');
  }

  const clickPoint = {
    x: buttonBox.x + buttonBox.width / 2,
    y: buttonBox.y - 2,
  };

  expect(clickPoint.y).toBeLessThan(buttonBox.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
});

test('MDButton preserves form, loading accessibility, disabled, and public press contracts', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--behavior-contracts');

  const submit = page.getByRole('button', { name: 'Submit action', exact: true });
  const loading = page.getByRole('button', { name: 'Loading action', exact: true });
  const disabled = page.getByRole('button', { name: 'Disabled action', exact: true });
  const disabledLoading = page.getByRole('button', {
    name: 'Disabled loading action',
    exact: true,
  });

  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#md-button-submit-count')).toHaveText('1');

  await submit.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#md-button-submit-count')).toHaveText('2');

  await expect(loading).toHaveAttribute('aria-busy', 'true');
  await expect(loading).toBeEnabled();
  await expect(loading.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await loading.click();
  await expect(page.locator('#md-button-loading-count')).toHaveText('1');

  await expect(disabled).toBeDisabled();
  const disabledBox = await disabled.boundingBox();
  if (!disabledBox) throw new Error('Missing disabled MDButton geometry.');
  await page.mouse.click(
    disabledBox.x + disabledBox.width / 2,
    disabledBox.y + disabledBox.height / 2,
  );
  await expect(page.locator('#md-button-disabled-count')).toHaveText('0');

  // Disabled plus loading keeps explicit activation blocking and decorative feedback together.
  await expect(disabledLoading).toBeDisabled();
  await expect(disabledLoading).toHaveAttribute('aria-busy', 'true');
  await expect(disabledLoading.getByRole('progressbar')).toHaveCount(0);
  const disabledLoadingBox = await disabledLoading.boundingBox();
  if (!disabledLoadingBox) throw new Error('Missing disabled+loading MDButton geometry.');
  await page.mouse.click(
    disabledLoadingBox.x + disabledLoadingBox.width / 2,
    disabledLoadingBox.y + disabledLoadingBox.height / 2,
  );
  await expect(page.locator('#md-button-disabled-count')).toHaveText('0');
});

test('MDButton drops undeclared dynamic attrs and never exposes their renderer state', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--host-attribute-boundary');

  const host = page.getByTestId('host-boundary-button');
  const toggle = page.getByTestId('host-boundary-toggle');

  const readRendererState = () =>
    host.evaluate<
      { selected: boolean; shape: string; toggle: boolean; variant: string },
      HTMLElement & { variant: string; shape: string; toggle: boolean; selected: boolean }
    >((button) => ({
      selected: button.selected,
      shape: button.shape,
      toggle: button.toggle,
      variant: button.variant,
    }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    selected: false,
    shape: 'rounded',
    toggle: false,
    variant: 'filled',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  // The fixture flips the attempted override values on every click; the rendered custom-element
  // state must stay pinned to the adapter-owned defaults across every dynamic update, not just
  // on first render.
  await toggle.click();
  expect(await readRendererState()).toEqual({
    selected: false,
    shape: 'rounded',
    toggle: false,
    variant: 'filled',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  await toggle.click();
  expect(await readRendererState()).toEqual({
    selected: false,
    shape: 'rounded',
    toggle: false,
    variant: 'filled',
  });
});

test('MDButton preserves normal native click bubbling to ancestor listeners', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--behavior-contracts');

  const button = page.getByRole('button', { name: 'Loading action', exact: true });
  const bubbledToDocument = page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        document.addEventListener(
          'click',
          () => {
            resolve(true);
          },
          { once: true },
        );
      }),
  );

  await button.click();

  expect(await bubbledToDocument).toBe(true);
});

test('MDButton variants and content keep component color inside a legacy Material surface', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--legacy-surface-color-ownership');

  await expect(page.getByTestId('legacy-surface-text')).toHaveCSS('color', 'rgb(179, 38, 30)');
  await expect(
    page.getByRole('button', { name: 'Surface filled' }).locator('.md-button__label-text'),
  ).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(
    page.getByRole('button', { name: 'Surface outlined' }).locator('.md-button__label-text'),
  ).toHaveCSS('color', 'rgb(73, 69, 79)');
  await expect(
    page.getByRole('button', { name: 'Surface text' }).locator('.md-button__label-text'),
  ).toHaveCSS('color', 'rgb(103, 80, 164)');

  const iconButton = page.getByRole('button', { name: 'Surface icon' });
  await expect(iconButton.locator('.md-button__label-text')).toHaveCSS('color', 'rgb(73, 69, 79)');
  await expect(page.getByTestId('legacy-surface-button-icon')).toHaveCSS(
    'color',
    'rgb(73, 69, 79)',
  );

  const loadingButton = page.getByRole('button', { name: 'Surface loading' });
  await expect(loadingButton.locator('.md-button__label-text')).toHaveCSS(
    'color',
    'rgb(103, 80, 164)',
  );
  await expect(loadingButton.locator('.md-loading-indicator')).toHaveCSS(
    'color',
    'rgb(103, 80, 164)',
  );
});

test('MDButton renders contextual text label colors in every selected state', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--contextual-text-tokens');

  const button = page.getByTestId('contextual-text-button');
  const label = button.locator('.md-button__label-text');
  const inversePrimary = 'rgb(208, 188, 255)';

  await expect(label).toHaveCSS('color', inversePrimary);

  await button.hover();
  await expect(label).toHaveCSS('color', inversePrimary);

  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(label).toHaveCSS('color', inversePrimary);

  const box = await button.boundingBox();
  if (!box) throw new Error('Missing contextual MDButton geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(label).toHaveCSS('color', inversePrimary);
  await page.mouse.up();
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
