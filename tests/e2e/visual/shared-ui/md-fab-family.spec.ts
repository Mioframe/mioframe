import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';
import {
  normalizeColorString,
  readButtonVisuals,
  getSysColorValue,
  getColorAtOpacity,
  asColor,
  getBoxShadowValue,
} from './md-button-family.testUtils';

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
        const expectedStateLayerColor = rotateRgbChannels(expected.icon);
        const sample = await readButtonVisuals(page, `${color}-${stateKey}`, {
          iconSelector: '.md-fab__icon',
        });
        const expectedElevation = await getBoxShadowValue(page, expected.elevation);
        const expectedStateLayerBackground = await getColorAtOpacity(
          page,
          expectedStateLayerColor,
          expected.opacity,
        );

        expect(normalizeColorString(asColor(sample.iconColor)), `${color} ${stateKey} icon`).toBe(
          normalizeColorString(expected.icon),
        );
        expect(sample.boxShadow, `${color} ${stateKey} elevation`).toBe(expectedElevation);
        expect(
          normalizeColorString(sample.stateLayerColor),
          `${color} ${stateKey} state-layer color`,
        ).toBe(normalizeColorString(expectedStateLayerColor));
        expect(sample[opacityKeys[stateKey]], `${color} ${stateKey} opacity`).toBe(
          expected.opacity,
        );
        expect(
          normalizeColorString(asColor(sample.stateLayerBackground)),
          `${color} ${stateKey} rendered state-layer background`,
        ).toBe(expectedStateLayerBackground);
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
        const expectedStateLayerColor = rotateRgbChannels(expected.label);
        const sample = await readButtonVisuals(page, `extended-${color}-${stateKey}`, {
          labelSelector: '.md-extended-fab__label',
          iconSelector: '.md-extended-fab__icon',
        });
        const expectedElevation = await getBoxShadowValue(page, expected.elevation);
        const expectedStateLayerBackground = await getColorAtOpacity(
          page,
          expectedStateLayerColor,
          expected.opacity,
        );

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
        ).toBe(normalizeColorString(expectedStateLayerColor));
        expect(sample[opacityKeys[stateKey]], `${color} ${stateKey} opacity`).toBe(
          expected.opacity,
        );
        expect(
          normalizeColorString(asColor(sample.stateLayerBackground)),
          `${color} ${stateKey} rendered state-layer background`,
        ).toBe(expectedStateLayerBackground);
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
