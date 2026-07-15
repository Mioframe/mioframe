import { expect, type Locator, type Page } from '@playwright/test';

/* eslint-disable jsdoc/require-jsdoc -- Narrow browser-test helpers and callback shapes are local to the Button-family visual specs. */

export const normalizeColorString = (rawColor: string) => {
  const hexMatch = rawColor.match(/^#(?<hex>[0-9a-f]{6})$/i);
  if (hexMatch?.groups) {
    const { hex } = hexMatch.groups;
    return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(' ');
  }

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

export const readButtonVisuals = async (
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

export const readButtonLocatorVisuals = async (
  locator: Locator,
  options?: { labelSelector?: string; iconSelector?: string },
) =>
  locator.evaluate(
    (el, selectors) => {
      const style = getComputedStyle(el);
      const label = selectors.labelSelector ? el.querySelector(selectors.labelSelector) : null;
      const icon = selectors.iconSelector ? el.querySelector(selectors.iconSelector) : null;
      const stateLayer = el.querySelector('.md-state-layer');
      return {
        background: style.backgroundColor,
        boxShadow: style.boxShadow,
        borderColor: style.borderColor,
        labelColor: label ? getComputedStyle(label).color : null,
        iconColor: icon ? getComputedStyle(icon).color : null,
        stateLayerColor: style.getPropertyValue('--md-private-state-layer-color').trim(),
        stateLayerBackground: stateLayer ? getComputedStyle(stateLayer).backgroundColor : null,
        hoverOpacity: style.getPropertyValue('--md-private-state-hover-state-layer-opacity').trim(),
        focusOpacity: style.getPropertyValue('--md-private-state-focus-state-layer-opacity').trim(),
        pressedOpacity: style
          .getPropertyValue('--md-private-state-pressed-state-layer-opacity')
          .trim(),
      };
    },
    {
      labelSelector: options?.labelSelector ?? null,
      iconSelector: options?.iconSelector ?? null,
    },
  );

export const readProgressIndicatorColor = async (page: Page, testId: string) => {
  const rawColor = await page.getByTestId(testId).evaluate((el) => {
    const indicator = el.querySelector('.md-circular-progress-indicator__progress');

    if (!(indicator instanceof SVGElement)) {
      throw new Error(`Missing progress indicator in ${testId}.`);
    }

    return getComputedStyle(indicator).stroke.trim();
  });

  return normalizeColorString(rawColor);
};

export const readElementColor = async (page: Page, testId: string, selector: string) => {
  const rawColor = await page.getByTestId(testId).evaluate((el, targetSelector) => {
    const target = el.querySelector(targetSelector);

    if (!(target instanceof HTMLElement) && !(target instanceof SVGElement)) {
      throw new Error(`Missing ${targetSelector} in ${testId}.`);
    }

    return getComputedStyle(target).color.trim();
  }, selector);

  return normalizeColorString(rawColor);
};

export const assertLoadingContract = async (
  page: Page,
  restingTestId: string,
  loadingTestId: string,
) => {
  const resting = page.getByTestId(restingTestId);
  const loading = page.getByTestId(loadingTestId);

  await expect(resting).toHaveAccessibleName('Loading');
  await expect(loading).toHaveAccessibleName('Loading');
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

// Resolves a `--md-sys-color-*` role to its rendered value in the current page, so default
// (no-override) component-token resolution can be verified against the documented Material
// system role rather than only a hardcoded literal. Normalized like every other color read here,
// since an unstyled probe element can serialize the same color via a different CSS color()
// function than an element inside the component's own cascade.
export const getSysColorValue = async (page: Page, sysColorVar: string) => {
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
export const getColorAtOpacity = async (page: Page, colorExpression: string, opacity: string) => {
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
export const getSysPropertyValue = async (page: Page, sysVar: string) =>
  page.evaluate(
    (cssVar) => getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim(),
    sysVar,
  );

// Narrows a `readButtonVisuals` color field (`string | null`) for exact-value comparisons; the
// selector was requested by the caller, so a `null` here means the fixture is broken and the
// assertion should fail loudly rather than silently compare against an empty string.
export const asColor = (value: string | null): string => {
  if (value === null) {
    throw new Error('Expected a non-null color value from readButtonVisuals.');
  }

  return value;
};

// Resolves a raw `box-shadow` literal through the browser's own serialization (color reordered,
// units normalized) so exact elevation assertions compare against how Chromium actually reports
// the value rather than a hand-guessed serialization.
export const getBoxShadowValue = async (page: Page, boxShadow: string) =>
  page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.boxShadow = value;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).boxShadow;
    probe.remove();
    return computed;
  }, boxShadow);

/* eslint-enable jsdoc/require-jsdoc -- End the local exemption for browser-test helper shapes. */
