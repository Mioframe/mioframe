import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openStory } from '../storybook';

const normalizeColorString = (rawColor: string) => {
  const rgbMatch = rawColor.match(/^rgb\(([^)]+)\)$/);
  if (rgbMatch) {
    return rgbMatch[1].replaceAll(',', '').replace(/\s+/g, ' ').trim();
  }

  // Chromium may serialize relative-color results (`rgb(from ... / <alpha>)`) as
  // `color(srgb r g b / a)` with 0-1 channel values instead of `rgb()`/`rgba()`; normalize both
  // forms to the same `R G B` (or `R G B / A`) shape so they compare equal.
  const srgbAlphaMatch = rawColor.match(
    /^color\(srgb (?<r>[^ ]+) (?<g>[^ ]+) (?<b>[^ )]+)\s*\/\s*(?<alpha>[^)]+)\)$/,
  );
  if (srgbAlphaMatch?.groups) {
    const { r, g, b, alpha } = srgbAlphaMatch.groups;
    const channels = [r, g, b].map((channel) => Math.round(Number(channel) * 255)).join(' ');
    return `${channels} / ${alpha.trim()}`;
  }

  const srgbMatch = rawColor.match(/^color\(srgb (?<r>[^ ]+) (?<g>[^ ]+) (?<b>[^ )]+)\)$/);
  if (srgbMatch?.groups) {
    const { r, g, b } = srgbMatch.groups;
    return [r, g, b].map((channel) => Math.round(Number(channel) * 255)).join(' ');
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
        // The generic contract var `MDStateLayer` reads its color from. Reading it here (rather
        // than the rendered `.md-state-layer` background) verifies the routing MDButton owns —
        // whether `MDStateLayer` itself then paints that color is a separate, generic concern.
        stateLayerColor: style.getPropertyValue('--md-private-state-layer-color').trim(),
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

// Reproduces the exact `rgb(from <expr> r g b / <opacity>)` relative-color composition used by
// `MDStateLayer` and by disabled-token opacity blending, so exact-value assertions compare
// against the browser's own resolved serialization instead of a hand-guessed literal.
const getColorAtOpacity = async (page: Page, colorExpression: string, opacity: string) => {
  const rawColor = await page.evaluate(
    (probeInput) => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = `rgb(from ${probeInput.colorExpression} r g b / ${probeInput.opacity})`;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    },
    { colorExpression, opacity },
  );

  return normalizeColorString(rawColor);
};

// Reads a documented `--md-sys-*` role's raw (non-color) value, such as a state-layer opacity
// fraction, so default-role assertions compare against the system token instead of a literal.
const getSysPropertyValue = async (page: Page, sysVar: string) =>
  page.evaluate(
    (cssVar) => getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim(),
    sysVar,
  );

// Narrows a `readButtonVisuals` color field (`string | null`) for exact-value comparisons; the
// selector was requested by the caller, so a `null` here means the fixture is broken and the
// assertion should fail loudly rather than silently compare against an empty string.
const asColor = (value: string | null): string => {
  if (value === null) {
    throw new Error('Expected a non-null color value from readButtonVisuals.');
  }

  return value;
};

// Resolves a raw `box-shadow` literal through the browser's own serialization (color reordered,
// units normalized) so exact elevation assertions compare against how Chromium actually reports
// the value rather than a hand-guessed serialization.
const getBoxShadowValue = async (page: Page, boxShadow: string) =>
  page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.boxShadow = value;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).boxShadow;
    probe.remove();
    return computed;
  }, boxShadow);

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

test('MDButton routes independent label, icon, outline, elevation, state-layer, and toggle state tokens', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--token-routing-matrix');

  // Literals mirror the deterministic `:style` overrides authored in
  // `MDButton.stories.ts`'s `TokenRoutingMatrix` fixture, one independent value per routed
  // property so each assertion proves that exact property routed through, not merely that two
  // rendered values differ.
  const STATES = [
    {
      key: 'hover' as const,
      opacityKey: 'hoverOpacity' as const,
      label: 'rgb(0 128 0)',
      icon: 'rgb(255 0 0)',
      elevation: '0 0 0 3px rgb(12 34 56)',
      stateLayerColor: 'rgb(255 0 0)',
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
        expect(normalizeColorString(asColor(sample.labelColor))).toBe(
          normalizeColorString(state.label),
        );
        expect(normalizeColorString(asColor(sample.iconColor))).toBe(
          normalizeColorString(state.icon),
        );
        expect(sample.boxShadow).toBe(expectedElevation);
        // Verifies the generic `MDStateLayer` contract var MDButton routes into, which is the
        // boundary this component owns; `MDStateLayer`'s own rendering of that var is generic,
        // out-of-family behavior with its own coverage.
        expect(normalizeColorString(sample.stateLayerColor)).toBe(
          normalizeColorString(state.stateLayerColor),
        );
        expect(sample[state.opacityKey]).toBe(state.opacity);
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
    }),
  );

  // Outlined: only outline color and state-layer route per state (no label/icon override).
  await Promise.all(
    STATES.map(async (state) => {
      const sample = await readButtonVisuals(page, `button-outlined-${state.key}`);
      expect(normalizeColorString(sample.borderColor)).toBe(
        normalizeColorString(OUTLINE_COLOR[state.key]),
      );
      expect(normalizeColorString(sample.stateLayerColor)).toBe(
        normalizeColorString(state.stateLayerColor),
      );
      expect(sample[state.opacityKey]).toBe(state.opacity);
    }),
  );

  // Selected vs. unselected toggle routing: container, label, icon, and state-layer color each
  // use an independent literal per branch, proving the selected/unselected token paths are
  // genuinely distinct rather than sharing one fixture value.
  const selected = await readButtonVisuals(page, 'button-selected-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });
  const unselected = await readButtonVisuals(page, 'button-unselected-hover', {
    labelSelector: '.md-button__label-text',
    iconSelector: '.md-button__icon',
  });

  expect(normalizeColorString(selected.background)).toBe(normalizeColorString('rgb(120 20 20)'));
  expect(normalizeColorString(asColor(selected.labelColor))).toBe(
    normalizeColorString('rgb(180 0 180)'),
  );
  expect(normalizeColorString(asColor(selected.iconColor))).toBe(
    normalizeColorString('rgb(0 120 120)'),
  );
  expect(normalizeColorString(selected.stateLayerColor)).toBe(normalizeColorString('rgb(180 0 0)'));
  expect(selected.hoverOpacity).toBe('0.11');

  expect(normalizeColorString(unselected.background)).toBe(normalizeColorString('rgb(20 20 120)'));
  expect(normalizeColorString(asColor(unselected.labelColor))).toBe(
    normalizeColorString('rgb(0 90 0)'),
  );
  expect(normalizeColorString(asColor(unselected.iconColor))).toBe(
    normalizeColorString('rgb(160 80 0)'),
  );
  expect(normalizeColorString(unselected.stateLayerColor)).toBe(
    normalizeColorString('rgb(0 0 180)'),
  );
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

// Mirrors `FAB_TOKEN_MATRIX` in `MDFab.stories.ts` (icon color, elevation, opacity) plus the
// same channel-rotation the fixture applies to derive an independent state-layer color, so the
// expected table has one source of truth with the fixture literals rather than a re-typed copy.
const rotateRgbChannels = (rgb: string) => {
  const [r, g, b] = rgb.replace(/^rgb\(|\)$/g, '').split(' ');
  return `rgb(${b} ${r} ${g})`;
};

const FAB_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'primary-container',
  'secondary-container',
  'tertiary-container',
] as const;

const FAB_TOKEN_MATRIX = {
  primary: {
    hover: { icon: 'rgb(255 0 0)', elevation: '0 0 0 3px rgb(12 34 56)', opacity: '0.03' },
    focus: { icon: 'rgb(0 128 0)', elevation: '0 0 0 4px rgb(23 45 67)', opacity: '0.17' },
    pressed: { icon: 'rgb(0 0 255)', elevation: '0 0 0 5px rgb(34 56 78)', opacity: '0.29' },
  },
  secondary: {
    hover: { icon: 'rgb(255 90 0)', elevation: '0 0 0 9px rgb(78 90 112)', opacity: '0.03' },
    focus: { icon: 'rgb(0 150 40)', elevation: '0 0 0 10px rgb(89 101 123)', opacity: '0.17' },
    pressed: { icon: 'rgb(20 20 255)', elevation: '0 0 0 11px rgb(101 112 134)', opacity: '0.29' },
  },
  tertiary: {
    hover: { icon: 'rgb(255 140 0)', elevation: '0 0 0 12px rgb(112 123 145)', opacity: '0.03' },
    focus: { icon: 'rgb(0 170 90)', elevation: '0 0 0 13px rgb(123 134 156)', opacity: '0.17' },
    pressed: { icon: 'rgb(60 20 255)', elevation: '0 0 0 14px rgb(134 145 167)', opacity: '0.29' },
  },
  'primary-container': {
    hover: { icon: 'rgb(255 80 0)', elevation: '0 0 0 6px rgb(45 67 89)', opacity: '0.05' },
    focus: { icon: 'rgb(0 180 120)', elevation: '0 0 0 7px rgb(56 78 90)', opacity: '0.19' },
    pressed: { icon: 'rgb(60 60 255)', elevation: '0 0 0 8px rgb(67 89 101)', opacity: '0.31' },
  },
  'secondary-container': {
    hover: { icon: 'rgb(255 100 20)', elevation: '0 0 0 15px rgb(145 156 178)', opacity: '0.05' },
    focus: { icon: 'rgb(20 190 140)', elevation: '0 0 0 16px rgb(156 167 189)', opacity: '0.19' },
    pressed: { icon: 'rgb(80 80 255)', elevation: '0 0 0 17px rgb(167 178 200)', opacity: '0.31' },
  },
  'tertiary-container': {
    hover: { icon: 'rgb(255 120 40)', elevation: '0 0 0 18px rgb(178 189 211)', opacity: '0.05' },
    focus: { icon: 'rgb(40 200 160)', elevation: '0 0 0 19px rgb(189 200 222)', opacity: '0.19' },
    pressed: {
      icon: 'rgb(100 100 255)',
      elevation: '0 0 0 20px rgb(200 211 233)',
      opacity: '0.31',
    },
  },
} satisfies Record<
  (typeof FAB_COLORS)[number],
  Record<'hover' | 'focus' | 'pressed', { icon: string; elevation: string; opacity: string }>
>;

test('MDFab routes independent icon, elevation, and state-layer tokens for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdfab--interaction-state-tokens');

  const colors = FAB_COLORS;
  const opacityKeys = {
    hover: 'hoverOpacity',
    focus: 'focusOpacity',
    pressed: 'pressedOpacity',
  } as const;

  await Promise.all(
    colors.flatMap((color) =>
      (['hover', 'focus', 'pressed'] as const).map(async (stateKey) => {
        const expected = FAB_TOKEN_MATRIX[color][stateKey];
        const sample = await readButtonVisuals(page, `${color}-${stateKey}`, {
          iconSelector: '.md-fab__icon',
        });
        const expectedElevation = await getBoxShadowValue(page, expected.elevation);

        expect(normalizeColorString(asColor(sample.iconColor)), `${color} ${stateKey} icon`).toBe(
          normalizeColorString(expected.icon),
        );
        expect(sample.boxShadow, `${color} ${stateKey} elevation`).toBe(expectedElevation);
        expect(
          normalizeColorString(sample.stateLayerColor),
          `${color} ${stateKey} state-layer color`,
        ).toBe(normalizeColorString(rotateRgbChannels(expected.icon)));
        expect(sample[opacityKeys[stateKey]], `${color} ${stateKey} opacity`).toBe(
          expected.opacity,
        );
      }),
    ),
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

test('MDFab default hover, focus, and pressed elevation resolves to the documented system levels for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdfab--visual-interaction-states');

  const [level3, level4] = await Promise.all([
    getBoxShadowValue(page, 'var(--md-sys-elevation-level3)'),
    getBoxShadowValue(page, 'var(--md-sys-elevation-level4)'),
  ]);

  await Promise.all(
    [
      'Primary',
      'Secondary',
      'Tertiary',
      'Primary container',
      'Secondary container',
      'Tertiary container',
    ].map(async (color) => {
      const [hover, focus, pressed] = await Promise.all([
        page
          .getByRole('button', { name: `${color} hover`, exact: true })
          .evaluate((el) => getComputedStyle(el).boxShadow),
        page
          .getByRole('button', { name: `${color} focus`, exact: true })
          .evaluate((el) => getComputedStyle(el).boxShadow),
        page
          .getByRole('button', { name: `${color} pressed`, exact: true })
          .evaluate((el) => getComputedStyle(el).boxShadow),
      ]);

      expect(hover, `${color} hover elevation`).toBe(level4);
      expect(focus, `${color} focus elevation`).toBe(level3);
      expect(pressed, `${color} pressed elevation`).toBe(level3);
    }),
  );
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

test('MDIconButton hover, focus, and pressed default state-layer opacity resolves to the documented system role', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-interaction-states');

  const [hoverRole, focusRole, pressedRole] = await Promise.all([
    getSysPropertyValue(page, '--md-sys-state-hover-state-layer-opacity'),
    getSysPropertyValue(page, '--md-sys-state-focus-state-layer-opacity'),
    getSysPropertyValue(page, '--md-sys-state-pressed-state-layer-opacity'),
  ]);

  await Promise.all(
    ['Standard', 'Filled', 'Tonal', 'Outlined'].map(async (style) => {
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

  // Fixture uses `color="outlined"`, which has no disabled container-color override, so the
  // documented disabled contract is: transparent container, on-surface icon at 0.38 opacity, and
  // the same (undimmed) outline-variant outline used at rest.
  const [onSurfaceAt38, outlineVariant] = await Promise.all([
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.38'),
    getSysColorValue(page, '--md-sys-color-outline-variant'),
  ]);
  const expectedDisabled = {
    background: normalizeColorString('rgba(0, 0, 0, 0)'),
    borderColor: outlineVariant,
    iconColor: onSurfaceAt38,
  };

  for (const sample of [resting, hover, focus, pressed]) {
    expect(normalizeColorString(sample.background)).toBe(expectedDisabled.background);
    expect(normalizeColorString(asColor(sample.borderColor))).toBe(expectedDisabled.borderColor);
    expect(normalizeColorString(asColor(sample.iconColor))).toBe(expectedDisabled.iconColor);
  }
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

  const ICON_BUTTON_STATES = [
    {
      key: 'hover',
      opacityKey: 'hoverOpacity' as const,
      icon: 'rgb(255 0 0)',
      stateLayerColor: 'rgb(255 0 0)',
      opacity: '0.03',
    },
    {
      key: 'focus',
      opacityKey: 'focusOpacity' as const,
      icon: 'rgb(0 128 0)',
      stateLayerColor: 'rgb(0 128 0)',
      opacity: '0.17',
    },
    {
      key: 'pressed',
      opacityKey: 'pressedOpacity' as const,
      icon: 'rgb(0 0 255)',
      stateLayerColor: 'rgb(0 0 255)',
      opacity: '0.29',
    },
  ];

  // Filled and tonal: icon and state-layer color/opacity route independently per state.
  await Promise.all(
    (['', 'tonal-'] as const).flatMap((style) =>
      ICON_BUTTON_STATES.map(async (state) => {
        const sample = await readButtonVisuals(page, `icon-button-${style}${state.key}`, {
          iconSelector: '.md-icon-button__icon',
        });
        expect(normalizeColorString(asColor(sample.iconColor))).toBe(
          normalizeColorString(state.icon),
        );
        expect(normalizeColorString(sample.stateLayerColor)).toBe(
          normalizeColorString(state.stateLayerColor),
        );
        expect(sample[state.opacityKey]).toBe(state.opacity);
      }),
    ),
  );

  // Outlined: one official outline-color token, held constant across hover/focus/pressed; icon
  // and state-layer still route independently per state (hover keeps the default icon color
  // since the fixture only overrides focus/pressed icon color).
  const outlinedHover = await readButtonVisuals(page, 'icon-button-outlined-hover', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedFocus = await readButtonVisuals(page, 'icon-button-outlined-focus', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedPressed = await readButtonVisuals(page, 'icon-button-outlined-pressed', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlineColor = normalizeColorString('rgb(120 10 10)');
  expect(normalizeColorString(outlinedHover.borderColor)).toBe(outlineColor);
  expect(normalizeColorString(outlinedFocus.borderColor)).toBe(outlineColor);
  expect(normalizeColorString(outlinedPressed.borderColor)).toBe(outlineColor);
  expect(normalizeColorString(asColor(outlinedFocus.iconColor))).toBe(
    normalizeColorString('rgb(10 120 10)'),
  );
  expect(normalizeColorString(asColor(outlinedPressed.iconColor))).toBe(
    normalizeColorString('rgb(10 10 120)'),
  );
  expect(normalizeColorString(outlinedHover.stateLayerColor)).toBe(
    normalizeColorString('rgb(255 0 0)'),
  );
  expect(outlinedHover.hoverOpacity).toBe('0.03');
  expect(normalizeColorString(outlinedFocus.stateLayerColor)).toBe(
    normalizeColorString('rgb(0 128 0)'),
  );
  expect(outlinedFocus.focusOpacity).toBe('0.17');
  expect(normalizeColorString(outlinedPressed.stateLayerColor)).toBe(
    normalizeColorString('rgb(0 0 255)'),
  );
  expect(outlinedPressed.pressedOpacity).toBe('0.29');

  // Selected vs. unselected outlined toggle routing (resting, no forced interaction state):
  // container and outline each use an independent literal per branch.
  const outlinedUnselected = await readButtonVisuals(page, 'icon-button-outlined-unselected', {
    iconSelector: '.md-icon-button__icon',
  });
  const outlinedSelected = await readButtonVisuals(page, 'icon-button-outlined-selected', {
    iconSelector: '.md-icon-button__icon',
  });
  expect(normalizeColorString(outlinedUnselected.borderColor)).toBe(
    normalizeColorString('rgb(120 10 10)'),
  );
  expect(normalizeColorString(outlinedSelected.background)).toBe(
    normalizeColorString('rgb(10 120 10)'),
  );

  // Selected vs. unselected standard toggle routing under a forced pressed state: icon,
  // state-layer color, and state-layer opacity each use an independent literal per branch.
  const selected = await readButtonVisuals(page, 'icon-button-selected-pressed', {
    iconSelector: '.md-icon-button__icon',
  });
  const unselected = await readButtonVisuals(page, 'icon-button-unselected-pressed', {
    iconSelector: '.md-icon-button__icon',
  });
  expect(normalizeColorString(asColor(selected.iconColor))).toBe(
    normalizeColorString('rgb(180 0 180)'),
  );
  expect(normalizeColorString(selected.stateLayerColor)).toBe(normalizeColorString('rgb(180 0 0)'));
  expect(selected.pressedOpacity).toBe('0.11');
  expect(normalizeColorString(asColor(unselected.iconColor))).toBe(
    normalizeColorString('rgb(0 90 0)'),
  );
  expect(normalizeColorString(unselected.stateLayerColor)).toBe(
    normalizeColorString('rgb(0 0 180)'),
  );
  expect(unselected.pressedOpacity).toBe('0.21');
});

test('MDIconButton exact geometry per size: container height/width, icon size, leading/trailing space, outline width, and shape radii', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--size-geometry-matrix');

  const ICON_BUTTON_SIZES = ['extra-small', 'small', 'medium', 'large', 'extra-large'] as const;
  const ICON_BUTTON_GEOMETRY = {
    'extra-small': {
      height: 32,
      icon: 20,
      narrow: 4,
      default: 6,
      wide: 10,
      outline: 1,
      squareRadius: 12,
      pressedRadius: 8,
      selectedRoundRadius: 12,
    },
    small: {
      height: 40,
      icon: 24,
      narrow: 4,
      default: 8,
      wide: 14,
      outline: 1,
      squareRadius: 12,
      pressedRadius: 8,
      selectedRoundRadius: 12,
    },
    medium: {
      height: 56,
      icon: 24,
      narrow: 12,
      default: 16,
      wide: 24,
      outline: 1,
      squareRadius: 16,
      pressedRadius: 12,
      selectedRoundRadius: 16,
    },
    large: {
      height: 96,
      icon: 32,
      narrow: 16,
      default: 32,
      wide: 48,
      outline: 2,
      squareRadius: 28,
      pressedRadius: 16,
      selectedRoundRadius: 28,
    },
    'extra-large': {
      height: 136,
      icon: 40,
      narrow: 32,
      default: 48,
      wide: 72,
      outline: 3,
      squareRadius: 28,
      pressedRadius: 16,
      selectedRoundRadius: 28,
    },
  } satisfies Record<
    (typeof ICON_BUTTON_SIZES)[number],
    {
      height: number;
      icon: number;
      narrow: number;
      default: number;
      wide: number;
      outline: number;
      squareRadius: number;
      pressedRadius: number;
      selectedRoundRadius: number;
    }
  >;

  const readPaddingInline = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd);
    });
  const readRadius = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

  await Promise.all(
    ICON_BUTTON_SIZES.map(async (size) => {
      const expected = ICON_BUTTON_GEOMETRY[size];
      const defaultInstance = await page
        .getByTestId(`icon-geometry-${size}-default`)
        .evaluate((el) => {
          const style = getComputedStyle(el);
          const icon = el.querySelector('.md-icon-button__icon');
          if (!icon) {
            throw new Error('Missing .md-icon-button__icon in geometry fixture.');
          }
          return {
            height: parseFloat(style.height),
            iconSize: parseFloat(getComputedStyle(icon).width),
            paddingInline:
              parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd),
            roundRadius: parseFloat(style.borderRadius),
          };
        });
      const narrowPadding = await readPaddingInline(`icon-geometry-${size}-narrow`);
      const widePadding = await readPaddingInline(`icon-geometry-${size}-wide`);
      const square = await readRadius(`icon-geometry-${size}-square`);
      const pressed = await readRadius(`icon-geometry-${size}-pressed`);
      const selectedRound = await readRadius(`icon-geometry-${size}-selected-round`);
      // `corner-full` (selected-square, default round shape) is a deliberately oversized `cqmin`
      // value with no established query container in this app, so it relies on the browser's
      // automatic per-box radius clamp rather than resolving to a fixed px matching this instance's
      // own height at the computed-style level; see the equivalent MDButton geometry test.
      const selectedSquare = await readRadius(`icon-geometry-${size}-selected-square`);
      const outline = await page
        .getByTestId(`icon-geometry-${size}-outlined`)
        .evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));

      expect(defaultInstance.height, `${size} container height`).toBe(expected.height);
      expect(defaultInstance.iconSize, `${size} icon size`).toBe(expected.icon);
      expect(defaultInstance.paddingInline, `${size} default leading+trailing space`).toBe(
        expected.default * 2,
      );
      expect(narrowPadding, `${size} narrow leading+trailing space`).toBe(expected.narrow * 2);
      expect(widePadding, `${size} wide leading+trailing space`).toBe(expected.wide * 2);
      expect(defaultInstance.roundRadius, `${size} round radius`).toBeGreaterThanOrEqual(
        expected.height / 2,
      );
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

// Mirrors `EXTENDED_FAB_TOKEN_MATRIX` in `MDExtendedFab.stories.ts` (label color, icon color,
// elevation, opacity) plus the same channel-rotation the fixture applies to derive an
// independent state-layer color, so the expected table shares one source of truth with the
// fixture literals rather than a re-typed copy.
const EXTENDED_FAB_TOKEN_MATRIX = {
  // Uses the same six official color names as `FAB_COLORS`.
  primary: {
    hover: {
      label: 'rgb(255 0 0)',
      icon: 'rgb(255 120 0)',
      elevation: '0 0 0 3px rgb(12 34 56)',
      opacity: '0.03',
    },
    focus: {
      label: 'rgb(0 128 0)',
      icon: 'rgb(0 180 120)',
      elevation: '0 0 0 4px rgb(23 45 67)',
      opacity: '0.17',
    },
    pressed: {
      label: 'rgb(0 0 255)',
      icon: 'rgb(120 0 255)',
      elevation: '0 0 0 5px rgb(34 56 78)',
      opacity: '0.29',
    },
  },
  secondary: {
    hover: {
      label: 'rgb(255 60 0)',
      icon: 'rgb(255 150 0)',
      elevation: '0 0 0 9px rgb(78 90 112)',
      opacity: '0.03',
    },
    focus: {
      label: 'rgb(0 150 60)',
      icon: 'rgb(0 200 150)',
      elevation: '0 0 0 10px rgb(89 101 123)',
      opacity: '0.17',
    },
    pressed: {
      label: 'rgb(20 20 255)',
      icon: 'rgb(150 20 255)',
      elevation: '0 0 0 11px rgb(101 112 134)',
      opacity: '0.29',
    },
  },
  tertiary: {
    hover: {
      label: 'rgb(255 100 0)',
      icon: 'rgb(255 180 0)',
      elevation: '0 0 0 12px rgb(112 123 145)',
      opacity: '0.03',
    },
    focus: {
      label: 'rgb(0 170 90)',
      icon: 'rgb(0 220 180)',
      elevation: '0 0 0 13px rgb(123 134 156)',
      opacity: '0.17',
    },
    pressed: {
      label: 'rgb(60 20 255)',
      icon: 'rgb(180 20 255)',
      elevation: '0 0 0 14px rgb(134 145 167)',
      opacity: '0.29',
    },
  },
  'primary-container': {
    hover: {
      label: 'rgb(255 80 0)',
      icon: 'rgb(255 180 0)',
      elevation: '0 0 0 6px rgb(45 67 89)',
      opacity: '0.05',
    },
    focus: {
      label: 'rgb(0 160 120)',
      icon: 'rgb(0 220 180)',
      elevation: '0 0 0 7px rgb(56 78 90)',
      opacity: '0.19',
    },
    pressed: {
      label: 'rgb(80 80 255)',
      icon: 'rgb(140 80 255)',
      elevation: '0 0 0 8px rgb(67 89 101)',
      opacity: '0.31',
    },
  },
  'secondary-container': {
    hover: {
      label: 'rgb(255 110 20)',
      icon: 'rgb(255 200 20)',
      elevation: '0 0 0 15px rgb(145 156 178)',
      opacity: '0.05',
    },
    focus: {
      label: 'rgb(20 190 140)',
      icon: 'rgb(20 230 200)',
      elevation: '0 0 0 16px rgb(156 167 189)',
      opacity: '0.19',
    },
    pressed: {
      label: 'rgb(100 100 255)',
      icon: 'rgb(160 100 255)',
      elevation: '0 0 0 17px rgb(167 178 200)',
      opacity: '0.31',
    },
  },
  'tertiary-container': {
    hover: {
      label: 'rgb(255 130 40)',
      icon: 'rgb(255 210 40)',
      elevation: '0 0 0 18px rgb(178 189 211)',
      opacity: '0.05',
    },
    focus: {
      label: 'rgb(40 200 160)',
      icon: 'rgb(40 240 210)',
      elevation: '0 0 0 19px rgb(189 200 222)',
      opacity: '0.19',
    },
    pressed: {
      label: 'rgb(120 120 255)',
      icon: 'rgb(180 120 255)',
      elevation: '0 0 0 20px rgb(200 211 233)',
      opacity: '0.31',
    },
  },
} satisfies Record<
  (typeof FAB_COLORS)[number],
  Record<
    'hover' | 'focus' | 'pressed',
    { label: string; icon: string; elevation: string; opacity: string }
  >
>;

test('MDExtendedFab routes independent label, icon, elevation, and state-layer tokens for all six colors', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdextendedfab--interaction-state-tokens');

  const colors = FAB_COLORS;
  const opacityKeys = {
    hover: 'hoverOpacity',
    focus: 'focusOpacity',
    pressed: 'pressedOpacity',
  } as const;

  await Promise.all(
    colors.flatMap((color) =>
      (['hover', 'focus', 'pressed'] as const).map(async (stateKey) => {
        const expected = EXTENDED_FAB_TOKEN_MATRIX[color][stateKey];
        const sample = await readButtonVisuals(page, `extended-${color}-${stateKey}`, {
          labelSelector: '.md-extended-fab__label',
          iconSelector: '.md-extended-fab__icon',
        });
        const expectedElevation = await getBoxShadowValue(page, expected.elevation);

        expect(normalizeColorString(asColor(sample.labelColor)), `${color} ${stateKey} label`).toBe(
          normalizeColorString(expected.label),
        );
        expect(normalizeColorString(asColor(sample.iconColor)), `${color} ${stateKey} icon`).toBe(
          normalizeColorString(expected.icon),
        );
        expect(sample.boxShadow, `${color} ${stateKey} elevation`).toBe(expectedElevation);
        expect(
          normalizeColorString(sample.stateLayerColor),
          `${color} ${stateKey} state-layer color`,
        ).toBe(normalizeColorString(rotateRgbChannels(expected.label)));
        expect(sample[opacityKeys[stateKey]], `${color} ${stateKey} opacity`).toBe(
          expected.opacity,
        );
      }),
    ),
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
