import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';
import {
  normalizeColorString,
  readButtonVisuals,
  readProgressIndicatorColor,
  readElementColor,
  getSysColorValue,
  getColorAtOpacity,
  getSysPropertyValue,
  asColor,
  getBoxShadowValue,
  assertLoadingContract,
  readButtonLocatorVisuals,
} from './md-button-family.testUtils';

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

  const extraSmall = await readTypography('typography-extra-small');
  const small = await readTypography('typography-small');
  const medium = await readTypography('typography-medium');
  const large = await readTypography('typography-large');
  const extraLarge = await readTypography('typography-extra-large');

  // label-large: 14px / 500, rendered through the md-typescale-label-large utility class
  expect(extraSmall.className).toContain('md-typescale-label-large');
  expect(extraSmall.fontSize).toBe('14px');
  expect(extraSmall.fontWeight).toBe('500');
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

test('MDButton selected toggle shape morphs round and square input shapes to the exact documented corner tokens', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-shapes');

  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  const roundSelected = await readRadius('toggle-round-selected');
  const roundUnselected = await readRadius('toggle-round-unselected');
  const squareSelected = await readRadius('toggle-square-selected');
  const squareUnselected = await readRadius('toggle-square-unselected');

  // Default (small) size: round input shape morphs from a full pill (`corner-full`, a
  // deliberately oversized `cqmin` value with no established query container in this app, so its
  // *computed* value is viewport-relative rather than a fixed px — the design relies entirely on
  // the browser's automatic per-box radius clamp to render a pill, which is why this asserts a
  // "large enough to always clamp" floor rather than a hand-guessed px literal) down to the
  // size's square corner token (corner-medium = 12px, an ordinary fixed token). Square input
  // shape morphs the other direction: from its 12px corner token up to the same oversized pill
  // value.
  expect(roundSelected).toBe(12);
  expect(roundUnselected).toBeGreaterThanOrEqual(20);
  expect(squareUnselected).toBe(12);
  expect(squareSelected).toBeGreaterThanOrEqual(20);
});

test('MDButton exact geometry per size: height, icon, spacing, gap, outline width, and shape radii', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--size-geometry-matrix');

  const SIZES = ['extra-small', 'small', 'medium', 'large', 'extra-large'] as const;
  const SIZE_GEOMETRY = {
    'extra-small': {
      height: 32,
      icon: 20,
      space: 12,
      gap: 8,
      outline: 1,
      squareRadius: 12,
      pressedRadius: 8,
      selectedRoundRadius: 12,
    },
    small: {
      height: 40,
      icon: 20,
      space: 16,
      gap: 8,
      outline: 1,
      squareRadius: 12,
      pressedRadius: 8,
      selectedRoundRadius: 12,
    },
    medium: {
      height: 56,
      icon: 24,
      space: 24,
      gap: 8,
      outline: 1,
      squareRadius: 16,
      pressedRadius: 12,
      selectedRoundRadius: 16,
    },
    large: {
      height: 96,
      icon: 32,
      space: 48,
      gap: 12,
      outline: 2,
      squareRadius: 28,
      pressedRadius: 16,
      selectedRoundRadius: 28,
    },
    'extra-large': {
      height: 136,
      icon: 40,
      space: 64,
      gap: 16,
      outline: 3,
      squareRadius: 28,
      pressedRadius: 16,
      selectedRoundRadius: 28,
    },
  } satisfies Record<
    (typeof SIZES)[number],
    {
      height: number;
      icon: number;
      space: number;
      gap: number;
      outline: number;
      squareRadius: number;
      pressedRadius: number;
      selectedRoundRadius: number;
    }
  >;

  await Promise.all(
    SIZES.map(async (size) => {
      const expected = SIZE_GEOMETRY[size];
      // A fully-rounded ("full") corner clamps to exactly half the button's own rendered height,
      // regardless of the container-query math behind the `corner-full` token, so the round and
      // selected-square radii are asserted relative to this same instance's own height rather than
      // a second hand-derived literal.
      const round = await page.getByTestId(`geometry-${size}-round`).evaluate((el) => {
        const style = getComputedStyle(el);
        const content = el.querySelector('.md-button__content');
        const icon = el.querySelector('.md-button__icon');
        if (!content || !icon) {
          throw new Error('Missing .md-button__content or .md-button__icon in geometry fixture.');
        }
        return {
          height: parseFloat(style.height),
          iconSize: parseFloat(getComputedStyle(icon).width),
          gap: parseFloat(getComputedStyle(content).columnGap),
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight),
          radius: parseFloat(style.borderRadius),
        };
      });
      const square = await page
        .getByTestId(`geometry-${size}-square`)
        .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
      const pressed = await page
        .getByTestId(`geometry-${size}-pressed`)
        .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
      const selectedRound = await page
        .getByTestId(`geometry-${size}-selected-round`)
        .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
      const selectedSquare = await page
        .getByTestId(`geometry-${size}-selected-square`)
        .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
      const outline = await page
        .getByTestId(`geometry-${size}-outlined`)
        .evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));

      expect(round.height, `${size} height`).toBe(expected.height);
      expect(round.iconSize, `${size} icon size`).toBe(expected.icon);
      expect(round.paddingLeft, `${size} leading space`).toBe(expected.space);
      expect(round.paddingRight, `${size} trailing space`).toBe(expected.space);
      expect(round.gap, `${size} icon-label gap`).toBe(expected.gap);
      // `corner-full` is a deliberately oversized `cqmin` value with no established query
      // container in this app, so its *computed* value is viewport-relative rather than a fixed
      // px matching this instance's own height — the design relies entirely on the browser's
      // automatic per-box radius clamp to render a pill. Assert the floor that guarantees clamping
      // rather than a hand-guessed px literal for the two `corner-full` cases (round default shape,
      // selected square shape).
      expect(round.radius, `${size} round radius`).toBeGreaterThanOrEqual(expected.height / 2);
      expect(square, `${size} square radius`).toBe(expected.squareRadius);
      expect(pressed, `${size} pressed radius`).toBe(expected.pressedRadius);
      expect(selectedRound, `${size} selected-round radius`).toBe(expected.selectedRoundRadius);
      expect(selectedSquare, `${size} selected-square radius`).toBeGreaterThanOrEqual(
        expected.height / 2,
      );
      expect(outline, `${size} outlined outline width`).toBe(expected.outline);
    }),
  );
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

test('MDButton normalizes color="text" + variant="toggle" to the default variant', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-text');

  const button = page.getByRole('button', { name: 'Bookmark' });

  await expect(button).not.toHaveAttribute('aria-pressed');
  await expect(button).not.toHaveClass(/md-button_selected/);
  await expect(button).toHaveClass(/md-button_variant-default/);
  await expect(button).not.toHaveClass(/md-button_variant-toggle/);
});

test('MDButton resting styles resolve to the documented Material color role by default', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');

  const readResting = (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    return Promise.all([
      button.evaluate((el) => getComputedStyle(el).backgroundColor),
      button.evaluate((el) => getComputedStyle(el).borderColor),
      button.evaluate((el) => getComputedStyle(el).boxShadow),
      button.locator('.md-button__label-text').evaluate((el) => getComputedStyle(el).color),
      button.locator('.md-button__icon').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, borderColor, boxShadow, labelColor, iconColor]) => ({
      background: normalizeColorString(background),
      borderColor: normalizeColorString(borderColor),
      boxShadow,
      labelColor: normalizeColorString(labelColor),
      iconColor: normalizeColorString(iconColor),
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
    outlineVariant,
    level0,
    level1,
  ] = await Promise.all([
    getSysColorValue(page, '--md-sys-color-primary'),
    getSysColorValue(page, '--md-sys-color-on-primary'),
    getSysColorValue(page, '--md-sys-color-secondary-container'),
    getSysColorValue(page, '--md-sys-color-on-secondary-container'),
    getSysColorValue(page, '--md-sys-color-on-surface-variant'),
    getSysColorValue(page, '--md-sys-color-surface-container-low'),
    getSysColorValue(page, '--md-sys-color-outline-variant'),
    getBoxShadowValue(page, 'var(--md-sys-elevation-level0)'),
    getBoxShadowValue(page, 'var(--md-sys-elevation-level1)'),
  ]);

  expect(filled.background).toBe(primary);
  expect(filled.labelColor).toBe(onPrimary);
  expect(filled.iconColor).toBe(onPrimary);
  expect(tonal.background).toBe(secondaryContainer);
  expect(tonal.labelColor).toBe(onSecondaryContainer);
  expect(tonal.iconColor).toBe(onSecondaryContainer);
  expect(outlined.labelColor).toBe(onSurfaceVariant);
  expect(outlined.iconColor).toBe(onSurfaceVariant);
  expect(outlined.borderColor).toBe(outlineVariant);
  expect(outlined.boxShadow).toBe(level0);
  expect(text.labelColor).toBe(primary);
  expect(text.iconColor).toBe(primary);
  expect(text.boxShadow).toBe(level0);
  expect(filled.boxShadow).toBe(level0);
  expect(tonal.boxShadow).toBe(level0);
  expect(elevated.background).toBe(surfaceContainerLow);
  expect(elevated.labelColor).toBe(primary);
  expect(elevated.iconColor).toBe(primary);
  expect(elevated.boxShadow).toBe(level1);
  expect(outlined.background).toBe('rgba(0 0 0 0)');
  expect(text.background).toBe('rgba(0 0 0 0)');
});

test('MDButton hover, focus, and pressed default state-layer opacity resolves to the documented system role', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-interaction-states');

  const [hoverRole, focusRole, pressedRole] = await Promise.all([
    getSysPropertyValue(page, '--md-sys-state-hover-state-layer-opacity'),
    getSysPropertyValue(page, '--md-sys-state-focus-state-layer-opacity'),
    getSysPropertyValue(page, '--md-sys-state-pressed-state-layer-opacity'),
  ]);

  await Promise.all(
    ['Elevated', 'Filled', 'Tonal', 'Outlined', 'Text'].map(async (style) => {
      const hoverOpacity = await page
        .getByRole('button', { name: `${style} hover`, exact: true })
        .evaluate((el) =>
          getComputedStyle(el)
            .getPropertyValue('--md-private-state-hover-state-layer-opacity')
            .trim(),
        );
      const focusOpacity = await page
        .getByRole('button', { name: `${style} focus`, exact: true })
        .evaluate((el) =>
          getComputedStyle(el)
            .getPropertyValue('--md-private-state-focus-state-layer-opacity')
            .trim(),
        );
      const pressedOpacity = await page
        .getByRole('button', { name: `${style} pressed`, exact: true })
        .evaluate((el) =>
          getComputedStyle(el)
            .getPropertyValue('--md-private-state-pressed-state-layer-opacity')
            .trim(),
        );

      expect(hoverOpacity).toBe(hoverRole);
      expect(focusOpacity).toBe(focusRole);
      expect(pressedOpacity).toBe(pressedRole);
    }),
  );
});

test('MDButton disabled defaults cover every materially distinct style route', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');
  const [disabledContent, outlineVariant, level0, disabledContainer] = await Promise.all([
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.38'),
    getSysColorValue(page, '--md-sys-color-outline-variant'),
    getBoxShadowValue(page, 'var(--md-sys-elevation-level0)'),
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.1'),
  ]);
  await Promise.all(
    (['elevated', 'filled', 'tonal', 'outlined', 'text'] as const).map(async (style) => {
      const sample = await readButtonLocatorVisuals(
        page.getByRole('button', { name: `Disabled ${style}`, exact: true }),
        { labelSelector: '.md-button__label-text', iconSelector: '.md-button__icon' },
      );
      expect(normalizeColorString(asColor(sample.labelColor)), `${style} label`).toBe(
        disabledContent,
      );
      expect(normalizeColorString(asColor(sample.iconColor)), `${style} icon`).toBe(
        disabledContent,
      );
      expect(sample.disabledLabelOpacity, `${style} label opacity route`).toBe('.38');
      expect(sample.disabledIconOpacity, `${style} icon opacity route`).toBe('.38');
      expect(sample.boxShadow, `${style} elevation`).toBe(level0);
      expect(
        normalizeColorString(asColor(sample.stateLayerBackground)),
        `${style} state layer`,
      ).toBe('0 0 0 / 0');
      expect(normalizeColorString(sample.background), `${style} container`).toBe(
        style === 'outlined' ? 'rgba(0 0 0 0)' : disabledContainer,
      );
      if (style === 'outlined')
        expect(normalizeColorString(sample.borderColor)).toBe(outlineVariant);
    }),
  );
});

test('MDButton default interaction routes resolve rendered label, icon, outline, state layer, and elevation', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--default-role-matrix');
  const styles = {
    Elevated: { colorRole: 'primary', elevations: ['level2', 'level1', 'level1'] },
    Filled: { colorRole: 'on-primary', elevations: ['level1', 'level0', 'level0'] },
    Tonal: { colorRole: 'on-secondary-container', elevations: ['level1', 'level0', 'level0'] },
    Outlined: {
      colorRole: 'on-surface-variant',
      elevations: ['level0', 'level0', 'level0'],
      outlineRole: 'outline-variant',
    },
    Text: { colorRole: 'primary', elevations: ['level0', 'level0', 'level0'] },
  } as const;
  const states = ['hover', 'focus', 'pressed'] as const;
  const opacityVars = {
    hover: '--md-sys-state-hover-state-layer-opacity',
    focus: '--md-sys-state-focus-state-layer-opacity',
    pressed: '--md-sys-state-pressed-state-layer-opacity',
  } as const;

  await Promise.all(
    Object.entries(styles).flatMap(([style, route]) =>
      states.map(async (state, stateIndex) => {
        const expectedColor = await getSysColorValue(page, `--md-sys-color-${route.colorRole}`);
        const expectedOpacity = await getSysPropertyValue(page, opacityVars[state]);
        const expectedElevation = await getBoxShadowValue(
          page,
          `var(--md-sys-elevation-${route.elevations[stateIndex]})`,
        );
        const sample = await readButtonLocatorVisuals(
          page.getByRole('button', { name: `${style.toLowerCase()} ${state}`, exact: true }),
          { labelSelector: '.md-button__label-text', iconSelector: '.md-button__icon' },
        );
        expect(normalizeColorString(asColor(sample.labelColor))).toBe(expectedColor);
        expect(normalizeColorString(asColor(sample.iconColor))).toBe(expectedColor);
        expect(normalizeColorString(sample.stateLayerColor)).toBe(expectedColor);
        expect(sample[`${state}Opacity`]).toBe(expectedOpacity);
        expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
          await getColorAtOpacity(page, `var(--md-sys-color-${route.colorRole})`, expectedOpacity),
        );
        expect(sample.boxShadow).toBe(expectedElevation);
        if ('outlineRole' in route) {
          expect(normalizeColorString(sample.borderColor)).toBe(
            await getSysColorValue(page, `--md-sys-color-${route.outlineRole}`),
          );
        }
      }),
    ),
  );
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

  // Fixture uses `color="outlined"`, which has no disabled container-color override, so the
  // documented disabled contract is: transparent container, on-surface label/icon at 0.38
  // opacity, and the same (undimmed) outline-variant outline used at rest.
  const [onSurfaceAt38, outlineVariant] = await Promise.all([
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.38'),
    getSysColorValue(page, '--md-sys-color-outline-variant'),
  ]);
  const expectedDisabled = {
    background: normalizeColorString('rgba(0, 0, 0, 0)'),
    borderColor: outlineVariant,
    labelColor: onSurfaceAt38,
    iconColor: onSurfaceAt38,
  };

  for (const sample of [resting, hover, focus, pressed]) {
    expect(normalizeColorString(sample.background)).toBe(expectedDisabled.background);
    expect(normalizeColorString(asColor(sample.borderColor))).toBe(expectedDisabled.borderColor);
    expect(normalizeColorString(asColor(sample.labelColor))).toBe(expectedDisabled.labelColor);
    expect(normalizeColorString(asColor(sample.iconColor))).toBe(expectedDisabled.iconColor);
  }
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

test('MDButton routes independent label, icon, outline, elevation, and state-layer tokens, and paints the actual forced state-layer tint', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--token-routing-matrix');

  // Literals mirror the deterministic `:style` overrides authored in
  // `MDButton.stories.ts`'s `TokenRoutingMatrix` fixture, one independent value per routed
  // property so each assertion proves that exact property routed through, not merely that two
  // rendered values differ. Every fixture here is wrapped in `MDStateLayerForcedStateProvider`
  // (paired with the host `md-state_*` class MDButton itself reads for token routing), so the
  // nested `MDStateLayer` actually paints the forced state, not only the contract variable.
  const STATES = [
    {
      key: 'hover' as const,
      opacityKey: 'hoverOpacity' as const,
      label: 'rgb(0 128 0)',
      icon: 'rgb(255 0 0)',
      elevation: '0 0 0 3px rgb(12 34 56)',
      stateLayerColor: 'rgb(255 0 200)',
      opacity: '0.03',
    },
    {
      key: 'focus' as const,
      opacityKey: 'focusOpacity' as const,
      label: 'rgb(0 0 255)',
      icon: 'rgb(255 165 0)',
      elevation: '0 0 0 4px rgb(23 45 67)',
      stateLayerColor: 'rgb(0 128 0)',
      opacity: '0.17',
    },
    {
      key: 'pressed' as const,
      opacityKey: 'pressedOpacity' as const,
      label: 'rgb(255 0 255)',
      icon: 'rgb(0 255 255)',
      elevation: '0 0 0 5px rgb(34 56 78)',
      stateLayerColor: 'rgb(0 0 255)',
      opacity: '0.29',
    },
  ];
  const OUTLINE_COLOR = {
    hover: 'rgb(120 10 10)',
    focus: 'rgb(10 120 10)',
    pressed: 'rgb(10 10 120)',
  };

  await Promise.all(
    (['', 'tonal-', 'elevated-'] as const).flatMap((style) =>
      STATES.map(async (state) => {
        const sample = await readButtonVisuals(page, `button-${style}${state.key}`, {
          labelSelector: '.md-button__label-text',
          iconSelector: '.md-button__icon',
        });
        const expectedElevation = await getBoxShadowValue(page, state.elevation);
        const expectedStateLayerBackground = await getColorAtOpacity(
          page,
          state.stateLayerColor,
          state.opacity,
        );
        expect(normalizeColorString(asColor(sample.labelColor))).toBe(
          normalizeColorString(state.label),
        );
        expect(normalizeColorString(asColor(sample.iconColor))).toBe(
          normalizeColorString(state.icon),
        );
        expect(sample.boxShadow).toBe(expectedElevation);
        // Verifies the generic `MDStateLayer` contract var MDButton routes into, which is the
        // boundary this component owns.
        expect(normalizeColorString(sample.stateLayerColor)).toBe(
          normalizeColorString(state.stateLayerColor),
        );
        expect(sample[state.opacityKey]).toBe(state.opacity);
        // Verifies the nested `MDStateLayer` actually paints that color at that opacity, not only
        // that the contract variable carries the right value.
        expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
          expectedStateLayerBackground,
        );
      }),
    ),
  );

  // Text: no container/elevation surface, but label/icon/state-layer still route independently.
  await Promise.all(
    STATES.map(async (state) => {
      const sample = await readButtonVisuals(page, `button-text-${state.key}`, {
        labelSelector: '.md-button__label-text',
        iconSelector: '.md-button__icon',
      });
      const expectedStateLayerBackground = await getColorAtOpacity(
        page,
        state.stateLayerColor,
        state.opacity,
      );
      expect(normalizeColorString(asColor(sample.labelColor))).toBe(
        normalizeColorString(state.label),
      );
      expect(normalizeColorString(asColor(sample.iconColor))).toBe(
        normalizeColorString(state.icon),
      );
      expect(normalizeColorString(sample.stateLayerColor)).toBe(
        normalizeColorString(state.stateLayerColor),
      );
      expect(sample[state.opacityKey]).toBe(state.opacity);
      expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
        expectedStateLayerBackground,
      );
    }),
  );

  // Outlined: label, icon, outline, and state-layer routes remain independently swappable.
  await Promise.all(
    STATES.map(async (state) => {
      const sample = await readButtonVisuals(page, `button-outlined-${state.key}`, {
        labelSelector: '.md-button__label-text',
        iconSelector: '.md-button__icon',
      });
      const expectedStateLayerBackground = await getColorAtOpacity(
        page,
        state.stateLayerColor,
        state.opacity,
      );
      expect(normalizeColorString(sample.borderColor)).toBe(
        normalizeColorString(OUTLINE_COLOR[state.key]),
      );
      expect(normalizeColorString(asColor(sample.labelColor))).toBe(
        normalizeColorString(state.label),
      );
      expect(normalizeColorString(asColor(sample.iconColor))).toBe(
        normalizeColorString(state.icon),
      );
      expect(normalizeColorString(sample.stateLayerColor)).toBe(
        normalizeColorString(state.stateLayerColor),
      );
      expect(sample[state.opacityKey]).toBe(state.opacity);
      expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
        expectedStateLayerBackground,
      );
    }),
  );
});

test('MDButton selected/unselected hover, focus, and pressed token routing is independently verified for elevated, filled, tonal, and outlined', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-token-routing-matrix');

  // Literals mirror `BUTTON_TOGGLE_MATRIX` in `MDButton.stories.ts`. Container and outline (where
  // published) are read at rest; label, icon, and state-layer color/opacity are read under each
  // forced interaction state, since `MDStateLayer` only paints a color once a state is active.
  const TOGGLE_MATRIX: Record<
    'elevated' | 'filled' | 'tonal' | 'outlined',
    {
      selected: {
        container?: string;
        restingLabel: string;
        restingIcon: string;
        label: string;
        icon: string;
        stateLayerColor: string;
        outline?: string;
      };
      unselected: {
        container?: string;
        restingLabel: string;
        restingIcon: string;
        label: string;
        icon: string;
        stateLayerColor: string;
        outline?: string;
      };
      hoverOpacity: string;
    }
  > = {
    elevated: {
      selected: {
        container: 'rgb(10 60 10)',
        restingLabel: 'rgb(11 61 12)',
        restingIcon: 'rgb(13 62 14)',
        label: 'rgb(200 255 200)',
        icon: 'rgb(255 210 0)',
        stateLayerColor: 'rgb(0 200 160)',
      },
      unselected: {
        container: 'rgb(10 10 90)',
        restingLabel: 'rgb(11 12 91)',
        restingIcon: 'rgb(13 14 92)',
        label: 'rgb(190 210 255)',
        icon: 'rgb(255 120 180)',
        stateLayerColor: 'rgb(150 80 0)',
      },
      hoverOpacity: '0.09',
    },
    filled: {
      selected: {
        container: 'rgb(120 20 20)',
        restingLabel: 'rgb(121 21 22)',
        restingIcon: 'rgb(122 23 24)',
        label: 'rgb(20 20 20)',
        icon: 'rgb(40 40 40)',
        stateLayerColor: 'rgb(180 0 0)',
      },
      unselected: {
        container: 'rgb(20 20 120)',
        restingLabel: 'rgb(21 22 121)',
        restingIcon: 'rgb(23 24 122)',
        label: 'rgb(50 50 50)',
        icon: 'rgb(70 70 70)',
        stateLayerColor: 'rgb(0 0 180)',
      },
      hoverOpacity: '0.11',
    },
    tonal: {
      selected: {
        container: 'rgb(90 60 10)',
        restingLabel: 'rgb(91 61 12)',
        restingIcon: 'rgb(92 63 14)',
        label: 'rgb(255 240 200)',
        icon: 'rgb(255 255 0)',
        stateLayerColor: 'rgb(200 100 0)',
      },
      unselected: {
        container: 'rgb(10 90 60)',
        restingLabel: 'rgb(11 91 62)',
        restingIcon: 'rgb(13 92 64)',
        label: 'rgb(200 255 240)',
        icon: 'rgb(0 255 255)',
        stateLayerColor: 'rgb(0 120 200)',
      },
      hoverOpacity: '0.13',
    },
    outlined: {
      selected: {
        container: 'rgb(60 10 90)',
        restingLabel: 'rgb(61 12 91)',
        restingIcon: 'rgb(63 14 92)',
        label: 'rgb(240 200 255)',
        icon: 'rgb(255 0 150)',
        stateLayerColor: 'rgb(150 0 255)',
        outline: 'rgb(200 0 120)',
      },
      unselected: {
        restingLabel: 'rgb(211 212 213)',
        restingIcon: 'rgb(2 251 121)',
        label: 'rgb(210 210 210)',
        icon: 'rgb(0 255 120)',
        stateLayerColor: 'rgb(0 90 255)',
        outline: 'rgb(90 60 0)',
      },
      hoverOpacity: '0.15',
    },
  };
  const ADDITIONAL_STATES = {
    elevated: {
      selected: {
        focus: ['rgb(201 254 199)', 'rgb(254 209 2)', 'rgb(2 198 161)'],
        pressed: ['rgb(202 253 198)', 'rgb(253 208 4)', 'rgb(4 196 162)'],
      },
      unselected: {
        focus: ['rgb(189 211 254)', 'rgb(254 121 179)', 'rgb(149 82 1)'],
        pressed: ['rgb(188 212 253)', 'rgb(253 122 178)', 'rgb(148 84 2)'],
      },
      focusOpacity: '0.19',
      pressedOpacity: '0.29',
    },
    filled: {
      selected: {
        focus: ['rgb(21 22 23)', 'rgb(41 42 43)', 'rgb(179 2 3)'],
        pressed: ['rgb(24 25 26)', 'rgb(44 45 46)', 'rgb(178 4 6)'],
      },
      unselected: {
        focus: ['rgb(51 52 53)', 'rgb(71 72 73)', 'rgb(2 3 179)'],
        pressed: ['rgb(54 55 56)', 'rgb(74 75 76)', 'rgb(4 6 178)'],
      },
      focusOpacity: '0.21',
      pressedOpacity: '0.31',
    },
    tonal: {
      selected: {
        focus: ['rgb(254 239 198)', 'rgb(254 253 2)', 'rgb(199 102 3)'],
        pressed: ['rgb(253 238 196)', 'rgb(253 251 4)', 'rgb(198 104 6)'],
      },
      unselected: {
        focus: ['rgb(198 254 239)', 'rgb(2 253 254)', 'rgb(3 119 199)'],
        pressed: ['rgb(196 253 238)', 'rgb(4 251 253)', 'rgb(6 118 198)'],
      },
      focusOpacity: '0.23',
      pressedOpacity: '0.33',
    },
    outlined: {
      selected: {
        focus: ['rgb(239 198 254)', 'rgb(254 2 149)', 'rgb(149 3 254)'],
        pressed: ['rgb(238 196 253)', 'rgb(253 4 148)', 'rgb(148 6 253)'],
      },
      unselected: {
        focus: ['rgb(209 208 207)', 'rgb(2 253 119)', 'rgb(3 89 254)'],
        pressed: ['rgb(206 205 204)', 'rgb(4 251 118)', 'rgb(6 88 253)'],
      },
      focusOpacity: '0.25',
      pressedOpacity: '0.35',
    },
  } as const;
  const BUTTON_TOGGLE_STYLE_KEYS = ['elevated', 'filled', 'tonal', 'outlined'] as const;

  await Promise.all(
    BUTTON_TOGGLE_STYLE_KEYS.flatMap((style) =>
      (['selected', 'unselected'] as const).map(async (branch) => {
        const entry = TOGGLE_MATRIX[style];
        const tokens = entry[branch];

        const resting = await readButtonVisuals(page, `toggle-token-${style}-${branch}-resting`, {
          labelSelector: '.md-button__label-text',
          iconSelector: '.md-button__icon',
        });
        if (tokens.container !== undefined) {
          expect(normalizeColorString(resting.background), `${style} ${branch} container`).toBe(
            normalizeColorString(tokens.container),
          );
        }
        if (tokens.outline !== undefined) {
          expect(normalizeColorString(resting.borderColor), `${style} ${branch} outline`).toBe(
            normalizeColorString(tokens.outline),
          );
        }
        expect(normalizeColorString(asColor(resting.labelColor)), `${style} ${branch} label`).toBe(
          normalizeColorString(tokens.restingLabel),
        );
        expect(normalizeColorString(asColor(resting.iconColor)), `${style} ${branch} icon`).toBe(
          normalizeColorString(tokens.restingIcon),
        );

        await Promise.all(
          (['hover', 'focus', 'pressed'] as const).map(async (state) => {
            const sample = await readButtonVisuals(
              page,
              `toggle-token-${style}-${branch}-${state}`,
              {
                labelSelector: '.md-button__label-text',
                iconSelector: '.md-button__icon',
              },
            );
            const [label, icon, stateLayerColor] =
              state === 'hover'
                ? [tokens.label, tokens.icon, tokens.stateLayerColor]
                : ADDITIONAL_STATES[style][branch][state];
            const opacity =
              state === 'hover' ? entry.hoverOpacity : ADDITIONAL_STATES[style][`${state}Opacity`];
            expect(
              normalizeColorString(asColor(sample.labelColor)),
              `${style} ${branch} ${state} label`,
            ).toBe(normalizeColorString(label));
            expect(
              normalizeColorString(asColor(sample.iconColor)),
              `${style} ${branch} ${state} icon`,
            ).toBe(normalizeColorString(icon));
            expect(
              normalizeColorString(sample.stateLayerColor),
              `${style} ${branch} ${state} state-layer color`,
            ).toBe(normalizeColorString(stateLayerColor));
            expect(sample[`${state}Opacity`], `${style} ${branch} ${state} opacity`).toBe(opacity);
            expect(
              normalizeColorString(asColor(sample.stateLayerBackground)),
              `${style} ${branch} ${state} rendered state layer`,
            ).toBe(await getColorAtOpacity(page, stateLayerColor, opacity));
          }),
        );
      }),
    ),
  );
});

test('MDButton selected/unselected defaults resolve through documented Material roles', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--default-toggle-role-matrix');
  const routes = {
    elevated: {
      unselected: { container: 'surface-container-low', content: 'primary' },
      selected: { container: 'primary', content: 'on-primary' },
    },
    filled: {
      unselected: { container: 'surface-container', content: 'on-surface-variant' },
      selected: { container: 'primary', content: 'on-primary' },
    },
    tonal: {
      unselected: { container: 'secondary-container', content: 'on-secondary-container' },
      selected: { container: 'secondary', content: 'on-secondary' },
    },
    outlined: {
      unselected: { content: 'on-surface-variant', outline: 'outline-variant' },
      selected: {
        container: 'inverse-surface',
        content: 'inverse-on-surface',
        outline: 'inverse-surface',
      },
    },
  } as const;
  const states = ['hover', 'focus', 'pressed'] as const;
  const opacityVars = {
    hover: '--md-sys-state-hover-state-layer-opacity',
    focus: '--md-sys-state-focus-state-layer-opacity',
    pressed: '--md-sys-state-pressed-state-layer-opacity',
  } as const;
  await Promise.all(
    Object.entries(routes).flatMap(([style, branches]) =>
      (['selected', 'unselected'] as const).map(async (branch) => {
        const route = branches[branch];
        const color = await getSysColorValue(page, `--md-sys-color-${route.content}`);
        const resting = await readButtonVisuals(
          page,
          `default-button-toggle-${style}-${branch}-resting`,
          { labelSelector: '.md-button__label-text', iconSelector: '.md-button__icon' },
        );
        expect(normalizeColorString(asColor(resting.labelColor))).toBe(color);
        expect(normalizeColorString(asColor(resting.iconColor))).toBe(color);
        await Promise.all(
          states.map(async (state) => {
            const opacity = await getSysPropertyValue(page, opacityVars[state]);
            const sample = await readButtonVisuals(
              page,
              `default-button-toggle-${style}-${branch}-${state}`,
              { labelSelector: '.md-button__label-text', iconSelector: '.md-button__icon' },
            );
            expect(normalizeColorString(asColor(sample.labelColor))).toBe(color);
            expect(normalizeColorString(asColor(sample.iconColor))).toBe(color);
            expect(normalizeColorString(sample.stateLayerColor)).toBe(color);
            expect(sample[`${state}Opacity`]).toBe(opacity);
            expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
              await getColorAtOpacity(page, `var(--md-sys-color-${route.content})`, opacity),
            );
          }),
        );
        if ('container' in route)
          expect(normalizeColorString(resting.background)).toBe(
            await getSysColorValue(page, `--md-sys-color-${route.container}`),
          );
        if ('outline' in route)
          expect(normalizeColorString(resting.borderColor)).toBe(
            await getSysColorValue(page, `--md-sys-color-${route.outline}`),
          );
      }),
    ),
  );
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

test('MDButton loading indicator consumes the rendered label color', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-color-routing');
  expect(await readProgressIndicatorColor(page, 'button-loading-color')).toBe(
    await readElementColor(page, 'button-loading-color', '.md-button__label-text'),
  );
});

test('MDButton loading keeps the accessible name, outer size, and enabled activation contract', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-color-routing');
  await assertLoadingContract(page, 'button-resting-color', 'button-loading-color');
});

test('MDButton container shadow-color routes an override into the shared elevation bridge', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');
  const button = page.getByRole('button', { name: 'Filled', exact: true });

  const defaultBridge = await button.evaluate((el) =>
    getComputedStyle(el).getPropertyValue('--md-private-elevation-shadow-color').trim(),
  );
  const defaultShadow = await getSysColorValue(page, '--md-sys-color-shadow');
  expect(normalizeColorString(defaultBridge)).toBe(defaultShadow);

  await button.evaluate((el) => {
    el.style.setProperty('--md-comp-button-filled-container-shadow-color', 'rgb(1, 2, 3)');
  });
  const overriddenBridge = await button.evaluate((el) =>
    getComputedStyle(el).getPropertyValue('--md-private-elevation-shadow-color').trim(),
  );
  expect(normalizeColorString(overriddenBridge)).toBe('1 2 3');
});

test('MDButton shape morph and color transitions use the documented Expressive Web motion durations', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');
  const button = page.getByRole('button', { name: 'Filled', exact: true });

  const transition = await button.evaluate((el) => {
    const style = getComputedStyle(el);
    return { properties: style.transitionProperty, durations: style.transitionDuration };
  });
  const properties = transition.properties.split(',').map((value) => value.trim());
  const durations = transition.durations.split(',').map((value) => value.trim());
  const durationFor = (property: string) => durations[properties.indexOf(property)];

  expect(durationFor('border-radius')).toBe('0.35s');
  expect(durationFor('box-shadow')).toBe('0.35s');
  expect(durationFor('color')).toBe('0.15s');
  expect(durationFor('background-color')).toBe('0.15s');
});

test('MDButton keeps a long label on a single line and grows wider instead of wrapping or truncating it', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--label-no-wrap');

  await Promise.all(
    (
      [
        { testId: 'no-wrap-small', singleLineHeight: 40 },
        { testId: 'no-wrap-medium', singleLineHeight: 56 },
      ] as const
    ).map(async ({ testId, singleLineHeight }) => {
      const button = page.getByTestId(testId);
      const label = button.locator('.md-button__label-text');

      const whiteSpace = await label.evaluate((el) => getComputedStyle(el).whiteSpace);
      expect(whiteSpace).toBe('nowrap');

      const buttonBox = await button.boundingBox();
      if (buttonBox == null) {
        throw new Error(`Missing bounding box for ${testId}.`);
      }

      // The label stays on one line and the button grows wider than its narrow containing
      // block to fit it — the fixed single-line height never grows to accommodate wrapped text.
      expect(buttonBox.height).toBe(singleLineHeight);

      // No content is hidden: the full label text is present and not CSS-truncated.
      const labelContent = await label.evaluate((el) => ({
        text: el.textContent,
        textOverflow: getComputedStyle(el).textOverflow,
      }));
      expect(labelContent.text).toBe(
        'This label is intentionally long enough to overflow a narrow container',
      );
      expect(labelContent.textOverflow).not.toBe('ellipsis');
    }),
  );
});

test('MDButton loading-state icon and label opacity fade uses the documented fast-effects duration', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-color-routing');

  const readOpacityTransition = (selector: string) =>
    page
      .getByTestId('button-loading-color')
      .locator(selector)
      .evaluate((el) => {
        const style = getComputedStyle(el);
        const properties = style.transitionProperty.split(',').map((value) => value.trim());
        const durations = style.transitionDuration.split(',').map((value) => value.trim());
        const index = properties.indexOf('opacity');
        return { duration: durations[index], easing: style.transitionTimingFunction };
      });

  const icon = await readOpacityTransition('.md-button__icon');
  const labelText = await readOpacityTransition('.md-button__label-text');

  // Same 150ms fast-effects duration/easing pair already proven for the color/background/border
  // transitions above ('MDButton shape morph and color transitions...'), read here from the
  // actual `.md-button__icon`/`.md-button__label-text` computed longhands rather than the class
  // toggle MDButton.test.ts already covers.
  expect(icon.duration).toBe('0.15s');
  expect(labelText.duration).toBe('0.15s');
  expect(icon.easing).toBe(labelText.easing);
});

test('MDButton mirrors the leading icon to the right of the label under dir="rtl"', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--rtl-icon-mirroring');

  const readIconAndLabelLeft = async (testId: string) => {
    const button = page.getByTestId(testId);
    const [iconBox, labelBox] = await Promise.all([
      button.locator('.md-button__icon').boundingBox(),
      button.locator('.md-button__label-text').boundingBox(),
    ]);
    if (iconBox == null || labelBox == null) {
      throw new Error(`Missing icon or label box for ${testId}.`);
    }
    return { iconLeft: iconBox.x, labelLeft: labelBox.x };
  };

  const ltr = await readIconAndLabelLeft('rtl-icon-ltr');
  const rtl = await readIconAndLabelLeft('rtl-icon-rtl');

  // LTR: leading icon renders to the left of the label (DOM order, default row direction).
  expect(ltr.iconLeft).toBeLessThan(ltr.labelLeft);
  // RTL: the same leading icon mirrors to the right of the label with no RTL-specific code —
  // `flex-direction: row` is writing-mode/direction relative, so DOM order alone reverses the
  // visual placement under `dir="rtl"`.
  expect(rtl.iconLeft).toBeGreaterThan(rtl.labelLeft);
});

test('MDStateLayer state-layer transition uses the Button family fast-effects mapping', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--visual-states');
  const stateLayer = page
    .getByRole('button', { name: 'Filled', exact: true })
    .locator('.md-state-layer');

  const duration = await stateLayer.evaluate((el) =>
    getComputedStyle(el).transitionDuration.trim(),
  );

  expect(duration).toBe('0.15s');
});
