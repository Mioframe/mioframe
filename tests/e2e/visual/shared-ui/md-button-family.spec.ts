import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openStory } from '../storybook';

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

const readProgressIndicatorColor = async (page: Page, testId: string) => {
  const rawColor = await page.getByTestId(testId).evaluate((el) => {
    const indicator = el.querySelector('.md-circular-progress-indicator__progress');

    if (!(indicator instanceof SVGElement)) {
      throw new Error(`Missing progress indicator in ${testId}.`);
    }

    return getComputedStyle(indicator).stroke.trim();
  });

  return normalizeColorString(rawColor);
};

const readElementColor = async (page: Page, testId: string, selector: string) => {
  const rawColor = await page.getByTestId(testId).evaluate((el, targetSelector) => {
    const target = el.querySelector(targetSelector);

    if (!(target instanceof HTMLElement) && !(target instanceof SVGElement)) {
      throw new Error(`Missing ${targetSelector} in ${testId}.`);
    }

    return getComputedStyle(target).color.trim();
  }, selector);

  return normalizeColorString(rawColor);
};

// Resolves a `--md-sys-color-*` role to its rendered value in the current page, so default
// (no-override) component-token resolution can be verified against the documented Material
// system role rather than only a hardcoded literal. Normalized like every other color read here,
// since an unstyled probe element can serialize the same color via a different CSS color()
// function than an element inside the component's own cascade.
const getSysColorValue = async (page: Page, sysColorVar: string) => {
  const rawColor = await page.evaluate((cssVar) => {
    const probe = document.createElement('div');
    probe.style.background = `var(${cssVar})`;
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, sysColorVar);

  return normalizeColorString(rawColor);
};

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

test('MDButton toggle shapes match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-shapes');

  const surface = page.getByTestId('visual-md-button-toggle-shapes');

  await expect(surface).toHaveScreenshot('md-button-toggle-shapes.png');
});

test('MDButton toggle interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-interaction-states');

  const surface = page.getByTestId('visual-md-button-toggle-interaction-states');

  await expect(surface).toHaveScreenshot('md-button-toggle-interaction-states.png');
});

test('MDButton text toggle selects without the removed color restriction', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-text');

  const button = page.getByRole('button', { name: 'Bookmark' });

  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveClass(/md-button_selected/);
});

test('MDButton resting styles resolve to the documented Material color role by default', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');

  const readResting = (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    return Promise.all([
      button.evaluate((el) => getComputedStyle(el).backgroundColor),
      button.locator('.md-button__label-text').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, labelColor]) => ({
      background: normalizeColorString(background),
      labelColor: normalizeColorString(labelColor),
    }));
  };

  const [filled, tonal, outlined, text, elevated] = await Promise.all([
    readResting('Filled'),
    readResting('Tonal'),
    readResting('Outlined'),
    readResting('Text'),
    readResting('Elevated'),
  ]);
  const [
    primary,
    onPrimary,
    secondaryContainer,
    onSecondaryContainer,
    onSurfaceVariant,
    surfaceContainerLow,
  ] = await Promise.all([
    getSysColorValue(page, '--md-sys-color-primary'),
    getSysColorValue(page, '--md-sys-color-on-primary'),
    getSysColorValue(page, '--md-sys-color-secondary-container'),
    getSysColorValue(page, '--md-sys-color-on-secondary-container'),
    getSysColorValue(page, '--md-sys-color-on-surface-variant'),
    getSysColorValue(page, '--md-sys-color-surface-container-low'),
  ]);

  expect(filled.background).toBe(primary);
  expect(filled.labelColor).toBe(onPrimary);
  expect(tonal.background).toBe(secondaryContainer);
  expect(tonal.labelColor).toBe(onSecondaryContainer);
  expect(outlined.labelColor).toBe(onSurfaceVariant);
  expect(text.labelColor).toBe(primary);
  expect(elevated.background).toBe(surfaceContainerLow);
  expect(elevated.labelColor).toBe(primary);
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
  const tonalHover = await readButtonVisuals(page, 'button-tonal-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const tonalFocus = await readButtonVisuals(page, 'button-tonal-focus', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const tonalPressed = await readButtonVisuals(page, 'button-tonal-pressed', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const elevatedHover = await readButtonVisuals(page, 'button-elevated-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const elevatedFocus = await readButtonVisuals(page, 'button-elevated-focus', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const elevatedPressed = await readButtonVisuals(page, 'button-elevated-pressed', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const textHover = await readButtonVisuals(page, 'button-text-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const textFocus = await readButtonVisuals(page, 'button-text-focus', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const textPressed = await readButtonVisuals(page, 'button-text-pressed', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
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

  // Tonal: label/icon/state-layer/elevation route independently per state, same contract as filled.
  expect(tonalHover.labelColor).not.toBe(tonalHover.iconColor);
  expect(tonalFocus.labelColor).not.toBe(tonalFocus.iconColor);
  expect(tonalPressed.labelColor).not.toBe(tonalPressed.iconColor);
  expect(tonalHover.boxShadow).not.toBe(tonalFocus.boxShadow);
  expect(tonalFocus.boxShadow).not.toBe(tonalPressed.boxShadow);
  expect(tonalHover.stateLayerBackground).not.toBe(tonalFocus.stateLayerBackground);
  expect(tonalFocus.stateLayerBackground).not.toBe(tonalPressed.stateLayerBackground);
  expect(tonalHover.hoverOpacity).toBe('0.03');
  expect(tonalFocus.focusOpacity).toBe('0.17');
  expect(tonalPressed.pressedOpacity).toBe('0.29');

  // Elevated: same contract, plus a visible per-state elevation change (box-shadow).
  expect(elevatedHover.labelColor).not.toBe(elevatedHover.iconColor);
  expect(elevatedFocus.labelColor).not.toBe(elevatedFocus.iconColor);
  expect(elevatedPressed.labelColor).not.toBe(elevatedPressed.iconColor);
  expect(elevatedHover.boxShadow).not.toBe(elevatedFocus.boxShadow);
  expect(elevatedFocus.boxShadow).not.toBe(elevatedPressed.boxShadow);
  expect(elevatedHover.stateLayerBackground).not.toBe(elevatedFocus.stateLayerBackground);
  expect(elevatedFocus.stateLayerBackground).not.toBe(elevatedPressed.stateLayerBackground);
  expect(elevatedHover.hoverOpacity).toBe('0.03');
  expect(elevatedFocus.focusOpacity).toBe('0.17');
  expect(elevatedPressed.pressedOpacity).toBe('0.29');

  // Text: no container/elevation surface, but label/icon/state-layer still route independently.
  expect(textHover.labelColor).not.toBe(textHover.iconColor);
  expect(textFocus.labelColor).not.toBe(textFocus.iconColor);
  expect(textPressed.labelColor).not.toBe(textPressed.iconColor);
  expect(textHover.stateLayerBackground).not.toBe(textFocus.stateLayerBackground);
  expect(textFocus.stateLayerBackground).not.toBe(textPressed.stateLayerBackground);
  expect(textHover.hoverOpacity).toBe('0.03');
  expect(textFocus.focusOpacity).toBe('0.17');
  expect(textPressed.pressedOpacity).toBe('0.29');

  expect(selected.stateLayerBackground).not.toBe(unselected.stateLayerBackground);
  expect(selected.labelColor).not.toBe(unselected.labelColor);
  expect(selected.iconColor).not.toBe(unselected.iconColor);
  expect(selected.hoverOpacity).toBe('0.11');
  expect(unselected.hoverOpacity).toBe('0.11');
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

test('MDFab routes independent icon, elevation, and state-layer tokens for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdfab--interaction-state-tokens');

  const colors = [
    'primary',
    'secondary',
    'tertiary',
    'primary-container',
    'secondary-container',
    'tertiary-container',
  ] as const;

  await Promise.all(
    colors.map(async (color) => {
      const [resting, hover, focus, pressed] = await Promise.all([
        readButtonVisuals(page, `${color}-resting`, { iconSelector: '.md-fab__icon' }),
        readButtonVisuals(page, `${color}-hover`, { iconSelector: '.md-fab__icon' }),
        readButtonVisuals(page, `${color}-focus`, { iconSelector: '.md-fab__icon' }),
        readButtonVisuals(page, `${color}-pressed`, { iconSelector: '.md-fab__icon' }),
      ]);
      // `*-container` styles use a distinct override opacity set from the story fixture; see
      // FAB_TOKEN_MATRIX in MDFab.stories.ts.
      const isContainer = color.endsWith('-container');

      expect(hover.iconColor, `${color} hover icon`).not.toBe(resting.iconColor);
      expect(focus.iconColor, `${color} focus icon`).not.toBe(hover.iconColor);
      expect(pressed.iconColor, `${color} pressed icon`).not.toBe(focus.iconColor);
      expect(hover.boxShadow, `${color} hover elevation`).not.toBe(resting.boxShadow);
      expect(focus.boxShadow, `${color} focus elevation`).not.toBe(resting.boxShadow);
      expect(pressed.boxShadow, `${color} pressed elevation`).not.toBe(resting.boxShadow);
      expect(hover.stateLayerBackground, `${color} hover state layer`).not.toBe(
        focus.stateLayerBackground,
      );
      expect(focus.stateLayerBackground, `${color} focus state layer`).not.toBe(
        pressed.stateLayerBackground,
      );
      expect(hover.hoverOpacity, `${color} hover opacity`).toBe(isContainer ? '0.05' : '0.03');
      expect(focus.focusOpacity, `${color} focus opacity`).toBe(isContainer ? '0.19' : '0.17');
      expect(pressed.pressedOpacity, `${color} pressed opacity`).toBe(
        isContainer ? '0.31' : '0.29',
      );
    }),
  );
});

test('MDFab default color resolves to the primary-container token', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--default');

  const button = page.getByRole('button');

  await expect(button).toHaveClass(/md-fab_color_primary-container/);

  const backgroundColor = normalizeColorString(
    await button.evaluate((el) => getComputedStyle(el).backgroundColor),
  );
  const primaryContainerColor = await getSysColorValue(page, '--md-sys-color-primary-container');

  expect(backgroundColor).toBe(primaryContainerColor);
});

test('MDFab resting styles resolve to the documented Material color role for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdfab--visual-states');

  const readResting = (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    return Promise.all([
      button.evaluate((el) => getComputedStyle(el).backgroundColor),
      button.locator('.md-fab__icon').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, iconColor]) => ({
      background: normalizeColorString(background),
      iconColor: normalizeColorString(iconColor),
    }));
  };

  const [primary, secondary, tertiary, primaryContainer, secondaryContainer, tertiaryContainer] =
    await Promise.all([
      readResting('Primary'),
      readResting('Secondary'),
      readResting('Tertiary'),
      readResting('Primary container'),
      readResting('Secondary container'),
      readResting('Tertiary container'),
    ]);
  const roles = await Promise.all(
    [
      'primary',
      'on-primary',
      'secondary',
      'on-secondary',
      'tertiary',
      'on-tertiary',
      'primary-container',
      'on-primary-container',
      'secondary-container',
      'on-secondary-container',
      'tertiary-container',
      'on-tertiary-container',
    ].map((role) => getSysColorValue(page, `--md-sys-color-${role}`)),
  );
  const [
    sysPrimary,
    sysOnPrimary,
    sysSecondary,
    sysOnSecondary,
    sysTertiary,
    sysOnTertiary,
    sysPrimaryContainer,
    sysOnPrimaryContainer,
    sysSecondaryContainer,
    sysOnSecondaryContainer,
    sysTertiaryContainer,
    sysOnTertiaryContainer,
  ] = roles;

  expect(primary.background).toBe(sysPrimary);
  expect(primary.iconColor).toBe(sysOnPrimary);
  expect(secondary.background).toBe(sysSecondary);
  expect(secondary.iconColor).toBe(sysOnSecondary);
  expect(tertiary.background).toBe(sysTertiary);
  expect(tertiary.iconColor).toBe(sysOnTertiary);
  expect(primaryContainer.background).toBe(sysPrimaryContainer);
  expect(primaryContainer.iconColor).toBe(sysOnPrimaryContainer);
  expect(secondaryContainer.background).toBe(sysSecondaryContainer);
  expect(secondaryContainer.iconColor).toBe(sysOnSecondaryContainer);
  expect(tertiaryContainer.background).toBe(sysTertiaryContainer);
  expect(tertiaryContainer.iconColor).toBe(sysOnTertiaryContainer);
});

test('MDFab container height and icon size match the exact documented size tokens', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdfab--size-comparison');

  const readGeometry = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => {
      const icon = el.querySelector('.md-fab__icon');
      return {
        height: el.getBoundingClientRect().height,
        iconSize: icon ? icon.getBoundingClientRect().height : null,
      };
    });

  const regular = await readGeometry('fab-size-regular');
  const medium = await readGeometry('fab-size-medium');
  const large = await readGeometry('fab-size-large');

  // md.comp.fab.container.height / md.comp.fab.{medium,large}.container.height (1dp == 1px).
  expect(regular.height).toBe(56);
  expect(medium.height).toBe(80);
  expect(large.height).toBe(96);
  // md.comp.fab.icon.size / md.comp.fab.{medium,large}.icon.size.
  expect(regular.iconSize).toBe(24);
  expect(medium.iconSize).toBe(28);
  expect(large.iconSize).toBe(36);
});

test('MDFab size comparison matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdfab--size-comparison');

  const surface = page.getByTestId('visual-md-fab-size-comparison');

  await expect(surface).toHaveScreenshot('md-fab-size-comparison.png');
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

test('MDIconButton default small layout footprint remains 40dp', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-states');

  const button = page.getByRole('button', { name: 'Standard', exact: true });
  const box = await button.boundingBox();

  expect(box?.width).toBe(40);
  expect(box?.height).toBe(40);
});

test('MDIconButton resting styles resolve to the documented Material color role by default', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-states');

  const readResting = (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    return Promise.all([
      button.evaluate((el) => getComputedStyle(el).backgroundColor),
      button.locator('.md-icon-button__icon').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, iconColor]) => ({
      background: normalizeColorString(background),
      iconColor: normalizeColorString(iconColor),
    }));
  };

  const [standard, filled, tonal, outlined] = await Promise.all([
    readResting('Standard'),
    readResting('Filled'),
    readResting('Tonal'),
    readResting('Outlined'),
  ]);
  const [primary, onPrimary, secondaryContainer, onSecondaryContainer, onSurfaceVariant] =
    await Promise.all([
      getSysColorValue(page, '--md-sys-color-primary'),
      getSysColorValue(page, '--md-sys-color-on-primary'),
      getSysColorValue(page, '--md-sys-color-secondary-container'),
      getSysColorValue(page, '--md-sys-color-on-secondary-container'),
      getSysColorValue(page, '--md-sys-color-on-surface-variant'),
    ]);

  expect(standard.iconColor).toBe(onSurfaceVariant);
  expect(filled.background).toBe(primary);
  expect(filled.iconColor).toBe(onPrimary);
  expect(tonal.background).toBe(secondaryContainer);
  expect(tonal.iconColor).toBe(onSecondaryContainer);
  expect(outlined.iconColor).toBe(onSurfaceVariant);
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
  const tonalHover = await readButtonVisuals(page, 'icon-button-tonal-hover', {
    iconSelector: '.md-icon-button__icon',
  });
  const tonalFocus = await readButtonVisuals(page, 'icon-button-tonal-focus', {
    iconSelector: '.md-icon-button__icon',
  });
  const tonalPressed = await readButtonVisuals(page, 'icon-button-tonal-pressed', {
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
  expect(tonalHover.iconColor).not.toBe(tonalFocus.iconColor);
  expect(tonalFocus.iconColor).not.toBe(tonalPressed.iconColor);
  expect(tonalHover.stateLayerBackground).not.toBe(tonalFocus.stateLayerBackground);
  expect(tonalFocus.stateLayerBackground).not.toBe(tonalPressed.stateLayerBackground);
  expect(tonalHover.hoverOpacity).toBe('0.03');
  expect(tonalFocus.focusOpacity).toBe('0.17');
  expect(tonalPressed.pressedOpacity).toBe('0.29');
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

test('MDIconButton geometry matches baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--geometry');

  const surface = page.getByTestId('visual-md-icon-button-geometry');

  await expect(surface).toHaveScreenshot('md-icon-button-geometry.png');
});

test('MDIconButton toggle interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--toggle-interaction-states');

  const surface = page.getByTestId('visual-md-icon-button-toggle-interaction-states');

  await expect(surface).toHaveScreenshot('md-icon-button-toggle-interaction-states.png');
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

test('Button-family loading keeps the accessible name, outer size, and enabled activation contract', async ({
  page,
}) => {
  const assertLoadingContract = async (restingTestId: string, loadingTestId: string) => {
    const resting = page.getByTestId(restingTestId);
    const loading = page.getByTestId(loadingTestId);

    await expect(resting).toHaveAccessibleName('Loading');
    await expect(loading).toHaveAccessibleName('Loading');

    // Loading alone does not disable the control; only the explicit `disabled` prop does.
    await expect(loading).toBeEnabled();

    const restingBox = await resting.boundingBox();
    const loadingBox = await loading.boundingBox();

    expect(restingBox).not.toBeNull();
    expect(loadingBox).not.toBeNull();

    if (restingBox == null || loadingBox == null) {
      throw new Error(`Missing bounding boxes for ${restingTestId}/${loadingTestId}.`);
    }

    expect(loadingBox.width).toBeCloseTo(restingBox.width, 0);
    expect(loadingBox.height).toBeCloseTo(restingBox.height, 0);
  };

  await openStory(page, 'material-3-components-buttons-mdbutton--loading-color-routing');
  await assertLoadingContract('button-resting-color', 'button-loading-color');

  await openStory(page, 'material-3-components-buttons-mdiconbutton--loading-color-routing');
  await assertLoadingContract('icon-button-resting-color', 'icon-button-loading-color');

  await openStory(page, 'material-3-components-buttons-mdfab--loading-color-routing');
  await assertLoadingContract('fab-resting-color', 'fab-loading-color');

  await openStory(page, 'material-3-components-buttons-mdextendedfab--loading-color-routing');
  await assertLoadingContract('extended-fab-resting-color', 'extended-fab-loading-color');
});

test('MDExtendedFab routes independent label, icon, elevation, and state-layer tokens for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-state-tokens');

  const colors = [
    'primary',
    'secondary',
    'tertiary',
    'primary-container',
    'secondary-container',
    'tertiary-container',
  ] as const;

  await Promise.all(
    colors.map(async (color) => {
      const [hover, focus, pressed] = await Promise.all([
        readButtonVisuals(page, `extended-${color}-hover`, {
          labelSelector: '.md-extended-fab__label',
          iconSelector: '.md-extended-fab__icon',
        }),
        readButtonVisuals(page, `extended-${color}-focus`, {
          labelSelector: '.md-extended-fab__label',
          iconSelector: '.md-extended-fab__icon',
        }),
        readButtonVisuals(page, `extended-${color}-pressed`, {
          labelSelector: '.md-extended-fab__label',
          iconSelector: '.md-extended-fab__icon',
        }),
      ]);
      // `*-container` styles use a distinct override opacity set from the story fixture; see
      // EXTENDED_FAB_TOKEN_MATRIX in MDExtendedFab.stories.ts.
      const isContainer = color.endsWith('-container');

      expect(hover.labelColor, `${color} hover label vs icon`).not.toBe(hover.iconColor);
      expect(focus.labelColor, `${color} focus label vs icon`).not.toBe(focus.iconColor);
      expect(pressed.labelColor, `${color} pressed label vs icon`).not.toBe(pressed.iconColor);
      expect(hover.boxShadow, `${color} hover vs focus elevation`).not.toBe(focus.boxShadow);
      expect(focus.boxShadow, `${color} focus vs pressed elevation`).not.toBe(pressed.boxShadow);
      expect(hover.stateLayerBackground, `${color} hover vs focus state layer`).not.toBe(
        focus.stateLayerBackground,
      );
      expect(focus.stateLayerBackground, `${color} focus vs pressed state layer`).not.toBe(
        pressed.stateLayerBackground,
      );
      expect(hover.hoverOpacity, `${color} hover opacity`).toBe(isContainer ? '0.05' : '0.03');
      expect(focus.focusOpacity, `${color} focus opacity`).toBe(isContainer ? '0.19' : '0.17');
      expect(pressed.pressedOpacity, `${color} pressed opacity`).toBe(
        isContainer ? '0.31' : '0.29',
      );
    }),
  );
});

test('MDExtendedFab renders without an icon container when only a label is given', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-states');

  const noIcon = page.getByRole('button', { name: 'No icon', exact: true });

  await expect(noIcon.locator('.md-extended-fab__icon')).toHaveCount(0);
  await expect(noIcon.locator('.md-extended-fab__label')).toHaveText('No icon');
});

test('MDExtendedFab resting styles resolve to the documented Material color role for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-states');

  const readResting = (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    return Promise.all([
      button.evaluate((el) => getComputedStyle(el).backgroundColor),
      button.locator('.md-extended-fab__label').evaluate((el) => getComputedStyle(el).color),
      button.locator('.md-extended-fab__icon').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, labelColor, iconColor]) => ({
      background: normalizeColorString(background),
      labelColor: normalizeColorString(labelColor),
      iconColor: normalizeColorString(iconColor),
    }));
  };

  const [primary, secondary, tertiary, primaryContainer, secondaryContainer, tertiaryContainer] =
    await Promise.all([
      readResting('Primary'),
      readResting('Secondary'),
      readResting('Tertiary'),
      readResting('Primary container'),
      readResting('Secondary container'),
      readResting('Tertiary container'),
    ]);
  const [
    sysPrimary,
    sysOnPrimary,
    sysSecondary,
    sysOnSecondary,
    sysTertiary,
    sysOnTertiary,
    sysPrimaryContainer,
    sysOnPrimaryContainer,
    sysSecondaryContainer,
    sysOnSecondaryContainer,
    sysTertiaryContainer,
    sysOnTertiaryContainer,
  ] = await Promise.all(
    [
      'primary',
      'on-primary',
      'secondary',
      'on-secondary',
      'tertiary',
      'on-tertiary',
      'primary-container',
      'on-primary-container',
      'secondary-container',
      'on-secondary-container',
      'tertiary-container',
      'on-tertiary-container',
    ].map((role) => getSysColorValue(page, `--md-sys-color-${role}`)),
  );

  expect(primary.background).toBe(sysPrimary);
  expect(primary.labelColor).toBe(sysOnPrimary);
  expect(primary.iconColor).toBe(sysOnPrimary);
  expect(secondary.background).toBe(sysSecondary);
  expect(secondary.labelColor).toBe(sysOnSecondary);
  expect(secondary.iconColor).toBe(sysOnSecondary);
  expect(tertiary.background).toBe(sysTertiary);
  expect(tertiary.labelColor).toBe(sysOnTertiary);
  expect(tertiary.iconColor).toBe(sysOnTertiary);
  expect(primaryContainer.background).toBe(sysPrimaryContainer);
  expect(primaryContainer.labelColor).toBe(sysOnPrimaryContainer);
  expect(primaryContainer.iconColor).toBe(sysOnPrimaryContainer);
  expect(secondaryContainer.background).toBe(sysSecondaryContainer);
  expect(secondaryContainer.labelColor).toBe(sysOnSecondaryContainer);
  expect(secondaryContainer.iconColor).toBe(sysOnSecondaryContainer);
  expect(tertiaryContainer.background).toBe(sysTertiaryContainer);
  expect(tertiaryContainer.labelColor).toBe(sysOnTertiaryContainer);
  expect(tertiaryContainer.iconColor).toBe(sysOnTertiaryContainer);
});

test('MDExtendedFab container height matches the exact documented size tokens', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--size-gaps');

  const readHeight = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => el.getBoundingClientRect().height);

  // md.comp.extended-fab.{small,medium,large}.container.height (1dp == 1px).
  expect(await readHeight('gap-small')).toBe(56);
  expect(await readHeight('gap-medium')).toBe(80);
  expect(await readHeight('gap-large')).toBe(96);
});

test('MDExtendedFab interaction states match baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-states');

  const surface = page.getByTestId('visual-md-extended-fab-interaction-states');

  await expect(surface).toHaveScreenshot('md-extended-fab-interaction-states.png');
});
