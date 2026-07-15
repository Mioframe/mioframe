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
      button.locator('.md-button__icon').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, labelColor, iconColor]) => ({
      background: normalizeColorString(background),
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
  expect(filled.iconColor).toBe(onPrimary);
  expect(tonal.background).toBe(secondaryContainer);
  expect(tonal.labelColor).toBe(onSecondaryContainer);
  expect(tonal.iconColor).toBe(onSecondaryContainer);
  expect(outlined.labelColor).toBe(onSurfaceVariant);
  expect(outlined.iconColor).toBe(onSurfaceVariant);
  expect(text.labelColor).toBe(primary);
  expect(text.iconColor).toBe(primary);
  expect(elevated.background).toBe(surfaceContainerLow);
  expect(elevated.labelColor).toBe(primary);
  expect(elevated.iconColor).toBe(primary);
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

test('MDButton selected/unselected toggle token routing is independently verified for elevated, filled, tonal, and outlined', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--toggle-token-routing-matrix');

  // Literals mirror `BUTTON_TOGGLE_MATRIX` in `MDButton.stories.ts`. Container and outline (where
  // published) are read at rest; label, icon, and state-layer color/opacity are read under a
  // forced hover state, since `MDStateLayer` only paints a color once a state is active.
  const TOGGLE_MATRIX: Record<
    'elevated' | 'filled' | 'tonal' | 'outlined',
    {
      selected: {
        container?: string;
        label: string;
        icon: string;
        stateLayerColor: string;
        outline?: string;
      };
      unselected: {
        container?: string;
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
        label: 'rgb(200 255 200)',
        icon: 'rgb(255 210 0)',
        stateLayerColor: 'rgb(0 200 160)',
      },
      unselected: {
        container: 'rgb(10 10 90)',
        label: 'rgb(190 210 255)',
        icon: 'rgb(255 120 180)',
        stateLayerColor: 'rgb(150 80 0)',
      },
      hoverOpacity: '0.09',
    },
    filled: {
      selected: {
        container: 'rgb(120 20 20)',
        label: 'rgb(20 20 20)',
        icon: 'rgb(40 40 40)',
        stateLayerColor: 'rgb(180 0 0)',
      },
      unselected: {
        container: 'rgb(20 20 120)',
        label: 'rgb(50 50 50)',
        icon: 'rgb(70 70 70)',
        stateLayerColor: 'rgb(0 0 180)',
      },
      hoverOpacity: '0.11',
    },
    tonal: {
      selected: {
        container: 'rgb(90 60 10)',
        label: 'rgb(255 240 200)',
        icon: 'rgb(255 255 0)',
        stateLayerColor: 'rgb(200 100 0)',
      },
      unselected: {
        container: 'rgb(10 90 60)',
        label: 'rgb(200 255 240)',
        icon: 'rgb(0 255 255)',
        stateLayerColor: 'rgb(0 120 200)',
      },
      hoverOpacity: '0.13',
    },
    outlined: {
      selected: {
        container: 'rgb(60 10 90)',
        label: 'rgb(240 200 255)',
        icon: 'rgb(255 0 150)',
        stateLayerColor: 'rgb(150 0 255)',
        outline: 'rgb(200 0 120)',
      },
      unselected: {
        label: 'rgb(210 210 210)',
        icon: 'rgb(0 255 120)',
        stateLayerColor: 'rgb(0 90 255)',
        outline: 'rgb(90 60 0)',
      },
      hoverOpacity: '0.15',
    },
  };
  const BUTTON_TOGGLE_STYLE_KEYS = ['elevated', 'filled', 'tonal', 'outlined'] as const;

  await Promise.all(
    BUTTON_TOGGLE_STYLE_KEYS.flatMap((style) =>
      (['selected', 'unselected'] as const).map(async (branch) => {
        const entry = TOGGLE_MATRIX[style];
        const tokens = entry[branch];

        const resting = await readButtonVisuals(page, `toggle-token-${style}-${branch}-resting`);
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

        const hover = await readButtonVisuals(page, `toggle-token-${style}-${branch}-hover`, {
          labelSelector: '.md-button__label-text',
          iconSelector: '.md-button__icon',
        });
        const expectedStateLayerBackground = await getColorAtOpacity(
          page,
          tokens.stateLayerColor,
          entry.hoverOpacity,
        );
        expect(normalizeColorString(asColor(hover.labelColor)), `${style} ${branch} label`).toBe(
          normalizeColorString(tokens.label),
        );
        expect(normalizeColorString(asColor(hover.iconColor)), `${style} ${branch} icon`).toBe(
          normalizeColorString(tokens.icon),
        );
        expect(
          normalizeColorString(hover.stateLayerColor),
          `${style} ${branch} state-layer color`,
        ).toBe(normalizeColorString(tokens.stateLayerColor));
        expect(hover.hoverOpacity, `${style} ${branch} state-layer opacity`).toBe(
          entry.hoverOpacity,
        );
        expect(
          normalizeColorString(asColor(hover.stateLayerBackground)),
          `${style} ${branch} rendered state-layer background`,
        ).toBe(expectedStateLayerBackground);
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
