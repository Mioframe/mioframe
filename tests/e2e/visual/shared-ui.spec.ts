import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { openStory } from './storybook';

// Shared by each button family's real-focus-visible test: waits for the global focus indicator
// to reposition, then asserts it covers the focused host and stays within the viewport.
const assertFocusIndicatorFollowsHost = async (page: Page, indicator: Locator, host: Locator) => {
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
  const hostBox = await host.boundingBox();
  const viewport = page.viewportSize();

  if (!indicatorBox || !hostBox || !viewport) {
    throw new Error('Missing bounding boxes for focus indicator test.');
  }

  expect(indicatorBox.width).toBeGreaterThan(0);
  expect(indicatorBox.height).toBeGreaterThan(0);

  // Geometry follows the rendered host container (allowing for the indicator's outer offset).
  const TOLERANCE = 1;
  expect(indicatorBox.x).toBeLessThanOrEqual(hostBox.x + TOLERANCE);
  expect(indicatorBox.y).toBeLessThanOrEqual(hostBox.y + TOLERANCE);
  expect(indicatorBox.x + indicatorBox.width).toBeGreaterThanOrEqual(
    hostBox.x + hostBox.width - TOLERANCE,
  );
  expect(indicatorBox.y + indicatorBox.height).toBeGreaterThanOrEqual(
    hostBox.y + hostBox.height - TOLERANCE,
  );

  // Not clipped: fully within the viewport.
  expect(indicatorBox.x).toBeGreaterThanOrEqual(0);
  expect(indicatorBox.y).toBeGreaterThanOrEqual(0);
  expect(indicatorBox.x + indicatorBox.width).toBeLessThanOrEqual(viewport.width);
  expect(indicatorBox.y + indicatorBox.height).toBeLessThanOrEqual(viewport.height);
};

const readButtonVisuals = async (
  page: Page,
  testId: string,
  options?: { labelSelector?: string; iconSelector?: string },
) =>
  page.getByTestId(testId).evaluate(
    (el, selectors) => {
      const stateLayer = el.querySelector('.md-state-layer');
      const label = selectors.labelSelector ? el.querySelector(selectors.labelSelector) : null;
      const icon = selectors.iconSelector ? el.querySelector(selectors.iconSelector) : null;
      const style = getComputedStyle(el);
      return {
        background: style.backgroundColor,
        boxShadow: style.boxShadow,
        borderColor: style.borderColor,
        hoverOpacity: style.getPropertyValue('--md-private-state-hover-state-layer-opacity').trim(),
        focusOpacity: style.getPropertyValue('--md-private-state-focus-state-layer-opacity').trim(),
        pressedOpacity: style
          .getPropertyValue('--md-private-state-pressed-state-layer-opacity')
          .trim(),
        labelColor: label ? getComputedStyle(label).color : null,
        iconColor: icon ? getComputedStyle(icon).color : null,
        stateLayerBackground: stateLayer ? getComputedStyle(stateLayer).backgroundColor : null,
      };
    },
    {
      labelSelector: options?.labelSelector ?? null,
      iconSelector: options?.iconSelector ?? null,
    },
  );

const readProgressIndicatorColor = async (page: Page, testId: string) =>
  page.getByTestId(testId).evaluate((el) => {
    const indicator = el.querySelector('.md-circular-progress-indicator__progress');
    const normalizeColorString = (rawColor: string) => {
      const rgbMatch = rawColor.match(/^rgb\(([^)]+)\)$/);
      if (rgbMatch) {
        return rgbMatch[1].replaceAll(',', '').replace(/\s+/g, ' ').trim();
      }

      const srgbMatch = rawColor.match(/^color\(srgb ([^ ]+) ([^ ]+) ([^)]+)\)$/);
      if (srgbMatch) {
        return [srgbMatch[1], srgbMatch[2], srgbMatch[3]]
          .map((channel) => Math.round(Number(channel) * 255))
          .join(' ');
      }

      return rawColor.replaceAll(',', '').replace(/\s+/g, ' ').trim();
    };

    if (!(indicator instanceof SVGElement)) {
      throw new Error(`Missing progress indicator in ${testId}.`);
    }

    return normalizeColorString(getComputedStyle(indicator).stroke.trim());
  });

const readElementColor = async (page: Page, testId: string, selector: string) =>
  page.getByTestId(testId).evaluate((el, targetSelector) => {
    const target = el.querySelector(targetSelector);
    const normalizeColorString = (rawColor: string) => {
      const rgbMatch = rawColor.match(/^rgb\(([^)]+)\)$/);
      if (rgbMatch) {
        return rgbMatch[1].replaceAll(',', '').replace(/\s+/g, ' ').trim();
      }

      const srgbMatch = rawColor.match(/^color\(srgb ([^ ]+) ([^ ]+) ([^)]+)\)$/);
      if (srgbMatch) {
        return [srgbMatch[1], srgbMatch[2], srgbMatch[3]]
          .map((channel) => Math.round(Number(channel) * 255))
          .join(' ');
      }

      return rawColor.replaceAll(',', '').replace(/\s+/g, ' ').trim();
    };

    if (!(target instanceof HTMLElement) && !(target instanceof SVGElement)) {
      throw new Error(`Missing ${targetSelector} in ${testId}.`);
    }

    return normalizeColorString(getComputedStyle(target).color.trim());
  }, selector);

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
    page
      .getByTestId(testId)
      .locator('.md-button__label-text')
      .evaluate((el) => ({
        className: Array.from(el.classList).join(' '),
        fontSize: getComputedStyle(el).fontSize,
        fontWeight: getComputedStyle(el).fontWeight,
      }));

  await expect(page.getByTestId('typography-small')).toBeVisible();

  const small = await readTypography('typography-small');
  const medium = await readTypography('typography-medium');
  const large = await readTypography('typography-large');
  const extraLarge = await readTypography('typography-extra-large');

  // label-large: 14px / 500, rendered through the md-typescale-label-large utility class
  expect(small.className).toContain('md-typescale-label-large');
  expect(small.fontSize).toBe('14px');
  expect(small.fontWeight).toBe('500');
  // title-medium: 16px / 500
  expect(medium.className).toContain('md-typescale-title-medium');
  expect(medium.fontSize).toBe('16px');
  expect(medium.fontWeight).toBe('500');
  // headline-small: 24px / 400
  expect(large.className).toContain('md-typescale-headline-small');
  expect(large.fontSize).toBe('24px');
  expect(large.fontWeight).toBe('400');
  // headline-large: 32px / 400
  expect(extraLarge.className).toContain('md-typescale-headline-large');
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

test('MDButton pressed shape takes precedence over selected shape', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-shapes');

  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  const selectedOnly = await readRadius('toggle-round-selected');
  const pressedOnly = await readRadius('toggle-round-pressed');
  const selectedPressed = await readRadius('toggle-round-selected-pressed');

  // Selected + pressed renders the pressed shape, matching a plain pressed button and diverging
  // from the selected-only shape.
  expect(selectedPressed).toBeCloseTo(pressedOnly, 5);
  expect(selectedPressed).not.toBeCloseTo(selectedOnly, 5);
});

test('MDButton focus indicator follows real keyboard focus and is not clipped', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  // Tab from a page with no focused element: the browser focuses the first focusable element.
  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
});

test('MDButton text toggle selects without the removed color restriction', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-text');

  const button = page.getByRole('button', { name: 'Bookmark' });

  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveClass(/md-button_selected/);
});

test('MDButton disabled state wins over forced hover, focus, and pressed visuals', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--disabled-state-precedence');

  const resting = await readButtonVisuals(page, 'disabled-resting', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const hover = await readButtonVisuals(page, 'disabled-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const focus = await readButtonVisuals(page, 'disabled-focus', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const pressed = await readButtonVisuals(page, 'disabled-pressed', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });

  expect(hover).toEqual(resting);
  expect(focus).toEqual(resting);
  expect(pressed).toEqual(resting);
  expect(resting.stateLayerBackground).toMatch(/[,/]\s*0\)$/);
});

test('MDButton text-color spacing follows the active size, including the icon case', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--text-button-spacing');

  const readPadding = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => ({
      left: getComputedStyle(el).paddingLeft,
      right: getComputedStyle(el).paddingRight,
    }));

  const small = await readPadding('text-spacing-small');
  const medium = await readPadding('text-spacing-medium');
  const large = await readPadding('text-spacing-large');
  const extraLarge = await readPadding('text-spacing-extra-large');
  const smallIcon = await readPadding('text-spacing-small-icon');

  // md.comp.button.<size>.leading-space / trailing-space applied to both sides.
  expect(small).toEqual({ left: '16px', right: '16px' });
  expect(medium).toEqual({ left: '24px', right: '24px' });
  expect(large).toEqual({ left: '48px', right: '48px' });
  expect(extraLarge).toEqual({ left: '64px', right: '64px' });
  // The icon/no-icon anatomy does not change the active size's leading/trailing space.
  expect(smallIcon).toEqual(small);
});

test('MDButton routes independent label, icon, outline, elevation, state-layer, and toggle state tokens', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--token-routing-matrix');

  const hover = await readButtonVisuals(page, 'button-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const focus = await readButtonVisuals(page, 'button-focus', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const pressed = await readButtonVisuals(page, 'button-pressed', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const outlinedHover = await readButtonVisuals(page, 'button-outlined-hover');
  const outlinedFocus = await readButtonVisuals(page, 'button-outlined-focus');
  const outlinedPressed = await readButtonVisuals(page, 'button-outlined-pressed');
  const selected = await readButtonVisuals(page, 'button-selected-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const unselected = await readButtonVisuals(page, 'button-unselected-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });

  expect(hover.labelColor).not.toBe(hover.iconColor);
  expect(focus.labelColor).not.toBe(focus.iconColor);
  expect(pressed.labelColor).not.toBe(pressed.iconColor);
  expect(hover.boxShadow).not.toBe(focus.boxShadow);
  expect(focus.boxShadow).not.toBe(pressed.boxShadow);
  expect(hover.stateLayerBackground).not.toBe(focus.stateLayerBackground);
  expect(focus.stateLayerBackground).not.toBe(pressed.stateLayerBackground);
  expect(hover.hoverOpacity).toBe('0.03');
  expect(focus.focusOpacity).toBe('0.17');
  expect(pressed.pressedOpacity).toBe('0.29');
  expect(outlinedHover.borderColor).not.toBe(outlinedFocus.borderColor);
  expect(outlinedFocus.borderColor).not.toBe(outlinedPressed.borderColor);
  expect(selected.stateLayerBackground).not.toBe(unselected.stateLayerBackground);
  expect(selected.labelColor).not.toBe(unselected.labelColor);
  expect(selected.iconColor).not.toBe(unselected.iconColor);
  expect(selected.hoverOpacity).toBe('0.11');
  expect(unselected.hoverOpacity).toBe('0.11');
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

test('MDExtendedFab label uses MD_TYPESCALE classes and computed typography per size', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--size-gaps');

  const readLabelTypography = (testId: string) =>
    page
      .getByTestId(testId)
      .locator('.md-extended-fab__label')
      .evaluate((el) => ({
        className: Array.from(el.classList).join(' '),
        fontSize: getComputedStyle(el).fontSize,
        fontWeight: getComputedStyle(el).fontWeight,
      }));

  const small = await readLabelTypography('gap-small');
  const medium = await readLabelTypography('gap-medium');
  const large = await readLabelTypography('gap-large');

  // title-medium: 16px / 500
  expect(small.className).toContain('md-typescale-title-medium');
  expect(small.fontSize).toBe('16px');
  expect(small.fontWeight).toBe('500');
  // title-large: 22px / 400
  expect(medium.className).toContain('md-typescale-title-large');
  expect(medium.fontSize).toBe('22px');
  // headline-small: 24px / 400
  expect(large.className).toContain('md-typescale-headline-small');
  expect(large.fontSize).toBe('24px');
});

test('MDFab hover, focus, and pressed elevation change for one plain and one container style', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdfab--interaction-state-tokens');

  const restingPrimary = await readButtonVisuals(page, 'primary-resting', {
    iconSelector: '.md-fab__icon',
  });
  const restingPrimaryContainer = await readButtonVisuals(page, 'primary-container-resting', {
    iconSelector: '.md-fab__icon',
  });
  const primaryHover = await readButtonVisuals(page, 'primary-hover', {
    iconSelector: '.md-fab__icon',
  });
  const primaryFocus = await readButtonVisuals(page, 'primary-focus', {
    iconSelector: '.md-fab__icon',
  });
  const primaryPressed = await readButtonVisuals(page, 'primary-pressed', {
    iconSelector: '.md-fab__icon',
  });
  const primaryContainerHover = await readButtonVisuals(page, 'primary-container-hover', {
    iconSelector: '.md-fab__icon',
  });
  const primaryContainerFocus = await readButtonVisuals(page, 'primary-container-focus', {
    iconSelector: '.md-fab__icon',
  });
  const primaryContainerPressed = await readButtonVisuals(page, 'primary-container-pressed', {
    iconSelector: '.md-fab__icon',
  });

  expect(primaryHover.iconColor).not.toBe(restingPrimary.iconColor);
  expect(primaryFocus.iconColor).not.toBe(primaryHover.iconColor);
  expect(primaryPressed.iconColor).not.toBe(primaryFocus.iconColor);
  expect(primaryHover.boxShadow).not.toBe(restingPrimary.boxShadow);
  expect(primaryFocus.boxShadow).not.toBe(restingPrimary.boxShadow);
  expect(primaryPressed.boxShadow).not.toBe(restingPrimary.boxShadow);
  expect(primaryHover.stateLayerBackground).not.toBe(primaryFocus.stateLayerBackground);
  expect(primaryFocus.stateLayerBackground).not.toBe(primaryPressed.stateLayerBackground);
  expect(primaryHover.hoverOpacity).toBe('0.03');
  expect(primaryFocus.focusOpacity).toBe('0.17');
  expect(primaryPressed.pressedOpacity).toBe('0.29');
  expect(primaryContainerHover.iconColor).not.toBe(restingPrimaryContainer.iconColor);
  expect(primaryContainerFocus.iconColor).not.toBe(primaryContainerHover.iconColor);
  expect(primaryContainerPressed.iconColor).not.toBe(primaryContainerFocus.iconColor);
  expect(primaryContainerHover.boxShadow).not.toBe(restingPrimaryContainer.boxShadow);
  expect(primaryContainerFocus.boxShadow).not.toBe(restingPrimaryContainer.boxShadow);
  expect(primaryContainerPressed.boxShadow).not.toBe(restingPrimaryContainer.boxShadow);
  expect(primaryContainerHover.stateLayerBackground).not.toBe(
    primaryContainerFocus.stateLayerBackground,
  );
  expect(primaryContainerFocus.stateLayerBackground).not.toBe(
    primaryContainerPressed.stateLayerBackground,
  );
  expect(primaryContainerHover.hoverOpacity).toBe('0.05');
  expect(primaryContainerFocus.focusOpacity).toBe('0.19');
  expect(primaryContainerPressed.pressedOpacity).toBe('0.31');
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

test('MDFab container height increases from regular to medium to large', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--size-comparison');

  const readHeight = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => el.getBoundingClientRect().height);

  const regular = await readHeight('fab-size-regular');
  const medium = await readHeight('fab-size-medium');
  const large = await readHeight('fab-size-large');

  expect(regular).toBeLessThan(medium);
  expect(medium).toBeLessThan(large);
});

test('MDFab focus indicator follows real keyboard focus and is not clipped', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
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

test('MDIconButton disabled state wins over forced hover, focus, and pressed visuals', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--disabled-state-precedence');

  const resting = await readButtonVisuals(page, 'disabled-resting', {
    iconSelector: '.md-icon-button__icon',
  });
  const hover = await readButtonVisuals(page, 'disabled-hover', {
    iconSelector: '.md-icon-button__icon',
  });
  const focus = await readButtonVisuals(page, 'disabled-focus', {
    iconSelector: '.md-icon-button__icon',
  });
  const pressed = await readButtonVisuals(page, 'disabled-pressed', {
    iconSelector: '.md-icon-button__icon',
  });

  expect(hover).toEqual(resting);
  expect(focus).toEqual(resting);
  expect(pressed).toEqual(resting);
  expect(resting.stateLayerBackground).toMatch(/[,/]\s*0\)$/);
});

test('MDIconButton outlined outline width scales by size', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--outlined-outline-widths');

  const readBorderWidth = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => getComputedStyle(el).borderTopWidth);

  const small = await readBorderWidth('outline-width-small');
  const large = await readBorderWidth('outline-width-large');
  const extraLarge = await readBorderWidth('outline-width-extra-large');

  expect(small).toBe('1px');
  expect(large).toBe('2px');
  expect(extraLarge).toBe('3px');
});

test('MDIconButton routes icon, outline, state-layer, and toggle tokens through the rendered contract', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--token-routing-matrix');

  const hover = await readButtonVisuals(page, 'icon-button-hover', {
    iconSelector: '.md-icon-button__icon',
  });
  const focus = await readButtonVisuals(page, 'icon-button-focus', {
    iconSelector: '.md-icon-button__icon',
  });
  const pressed = await readButtonVisuals(page, 'icon-button-pressed', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedHover = await readButtonVisuals(page, 'icon-button-outlined-hover', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedFocus = await readButtonVisuals(page, 'icon-button-outlined-focus', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedPressed = await readButtonVisuals(page, 'icon-button-outlined-pressed', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedUnselected = await readButtonVisuals(page, 'icon-button-outlined-unselected', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedSelected = await readButtonVisuals(page, 'icon-button-outlined-selected', {
    iconSelector: '.md-icon-button__icon',
  });
  const selected = await readButtonVisuals(page, 'icon-button-selected-pressed', {
    iconSelector: '.md-icon-button__icon',
  });
  const unselected = await readButtonVisuals(page, 'icon-button-unselected-pressed', {
    iconSelector: '.md-icon-button__icon',
  });

  expect(hover.iconColor).not.toBe(focus.iconColor);
  expect(focus.iconColor).not.toBe(pressed.iconColor);
  expect(outlinedHover.borderColor).toBe(outlinedFocus.borderColor);
  expect(outlinedFocus.borderColor).toBe(outlinedPressed.borderColor);
  expect(hover.stateLayerBackground).not.toBe(focus.stateLayerBackground);
  expect(focus.stateLayerBackground).not.toBe(pressed.stateLayerBackground);
  expect(hover.hoverOpacity).toBe('0.03');
  expect(focus.focusOpacity).toBe('0.17');
  expect(pressed.pressedOpacity).toBe('0.29');
  expect(outlinedHover.stateLayerBackground).not.toBe(outlinedFocus.stateLayerBackground);
  expect(outlinedFocus.stateLayerBackground).not.toBe(outlinedPressed.stateLayerBackground);
  expect(outlinedHover.iconColor).not.toBe(outlinedFocus.iconColor);
  expect(outlinedFocus.iconColor).not.toBe(outlinedPressed.iconColor);
  expect(outlinedSelected.background).not.toBe(outlinedUnselected.background);
  expect(outlinedSelected.borderColor).not.toBe(outlinedUnselected.borderColor);
  expect(selected.iconColor).not.toBe(unselected.iconColor);
  expect(selected.stateLayerBackground).not.toBe(unselected.stateLayerBackground);
});

test('MDIconButton width and shape geometry differ by prop', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--geometry');

  const readPaddingInline = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd);
    });
  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  const narrow = await readPaddingInline('geometry-width-narrow');
  const defaultWidth = await readPaddingInline('geometry-width-default');
  const wide = await readPaddingInline('geometry-width-wide');

  expect(narrow).toBeLessThan(defaultWidth);
  expect(defaultWidth).toBeLessThan(wide);

  const round = await readRadius('geometry-shape-round');
  const square = await readRadius('geometry-shape-square');

  expect(round).toBeGreaterThan(square);
});

test('MDIconButton pressed shape takes precedence over selected shape', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--geometry');

  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  const selectedOnly = await readRadius('geometry-round-selected');
  const pressedOnly = await readRadius('geometry-round-pressed');
  const selectedPressed = await readRadius('geometry-round-selected-pressed');

  expect(selectedPressed).toBeCloseTo(pressedOnly, 5);
  expect(selectedPressed).not.toBeCloseTo(selectedOnly, 5);
});

test('MDIconButton focus indicator follows real keyboard focus and is not clipped', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
});

test('Button-family loading indicators consume the rendered component colors', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-color-routing');
  expect(await readProgressIndicatorColor(page, 'button-loading-color')).toBe(
    await readElementColor(page, 'button-loading-color', '.md-button__label-text'),
  );

  await openStory(page, 'material-3-components-buttons-mdiconbutton--loading-color-routing');
  expect(await readProgressIndicatorColor(page, 'icon-button-loading-color')).toBe(
    await readElementColor(page, 'icon-button-loading-color', '.md-icon-button__icon'),
  );

  await openStory(page, 'material-3-components-buttons-mdfab--loading-color-routing');
  expect(await readProgressIndicatorColor(page, 'fab-loading-color')).toBe(
    await readElementColor(page, 'fab-loading-color', '.md-fab__icon'),
  );

  await openStory(page, 'material-3-components-buttons-mdextendedfab--loading-color-routing');
  expect(await readProgressIndicatorColor(page, 'extended-fab-loading-color')).toBe(
    await readElementColor(page, 'extended-fab-loading-color', '.md-extended-fab__icon'),
  );
});

test('MDExtendedFab routes independent label, icon, elevation, and state-layer tokens', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-state-tokens');

  const primaryHover = await readButtonVisuals(page, 'extended-primary-hover', {
    labelSelector: '.md-extended-fab__label',
    iconSelector: '.md-extended-fab__icon',
  });
  const primaryFocus = await readButtonVisuals(page, 'extended-primary-focus', {
    labelSelector: '.md-extended-fab__label',
    iconSelector: '.md-extended-fab__icon',
  });
  const primaryPressed = await readButtonVisuals(page, 'extended-primary-pressed', {
    labelSelector: '.md-extended-fab__label',
    iconSelector: '.md-extended-fab__icon',
  });
  const containerHover = await readButtonVisuals(page, 'extended-container-hover', {
    labelSelector: '.md-extended-fab__label',
    iconSelector: '.md-extended-fab__icon',
  });
  const containerFocus = await readButtonVisuals(page, 'extended-container-focus', {
    labelSelector: '.md-extended-fab__label',
    iconSelector: '.md-extended-fab__icon',
  });
  const containerPressed = await readButtonVisuals(page, 'extended-container-pressed', {
    labelSelector: '.md-extended-fab__label',
    iconSelector: '.md-extended-fab__icon',
  });

  expect(primaryHover.labelColor).not.toBe(primaryHover.iconColor);
  expect(primaryFocus.labelColor).not.toBe(primaryFocus.iconColor);
  expect(primaryPressed.labelColor).not.toBe(primaryPressed.iconColor);
  expect(primaryHover.boxShadow).not.toBe(primaryFocus.boxShadow);
  expect(primaryFocus.boxShadow).not.toBe(primaryPressed.boxShadow);
  expect(primaryHover.stateLayerBackground).not.toBe(primaryFocus.stateLayerBackground);
  expect(primaryFocus.stateLayerBackground).not.toBe(primaryPressed.stateLayerBackground);
  expect(primaryHover.hoverOpacity).toBe('0.03');
  expect(primaryFocus.focusOpacity).toBe('0.17');
  expect(primaryPressed.pressedOpacity).toBe('0.29');
  expect(containerHover.labelColor).not.toBe(containerHover.iconColor);
  expect(containerFocus.labelColor).not.toBe(containerFocus.iconColor);
  expect(containerPressed.labelColor).not.toBe(containerPressed.iconColor);
  expect(containerHover.boxShadow).not.toBe(containerFocus.boxShadow);
  expect(containerFocus.boxShadow).not.toBe(containerPressed.boxShadow);
  expect(containerHover.stateLayerBackground).not.toBe(containerFocus.stateLayerBackground);
  expect(containerFocus.stateLayerBackground).not.toBe(containerPressed.stateLayerBackground);
  expect(containerHover.hoverOpacity).toBe('0.05');
  expect(containerFocus.focusOpacity).toBe('0.19');
  expect(containerPressed.pressedOpacity).toBe('0.31');
});

test('MDExtendedFab renders without an icon container when only a label is given', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-states');

  const noIcon = page.getByRole('button', { name: 'No icon', exact: true });

  await expect(noIcon.locator('.md-extended-fab__icon')).toHaveCount(0);
  await expect(noIcon.locator('.md-extended-fab__label')).toHaveText('No icon');
});

test('MDExtendedFab focus indicator follows real keyboard focus and is not clipped', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--focus-indicator-target');

  const host = page.getByRole('button', { name: 'Focus target', exact: true });
  const indicator = page.locator('.md-focus-indicator');

  await page.keyboard.press('Tab');
  await expect(host).toBeFocused();
  expect(await host.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(indicator).toHaveCSS('opacity', '1');

  await assertFocusIndicatorFollowsHost(page, indicator, host);
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
