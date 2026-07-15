import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';
import {
  normalizeColorString,
  readButtonVisuals,
  getSysColorValue,
  getColorAtOpacity,
  getSysPropertyValue,
  asColor,
  readProgressIndicatorColor,
  readElementColor,
  assertLoadingContract,
  readButtonLocatorVisuals,
} from './md-button-family.testUtils';

test('MDIconButton loading color and enabled geometry contract', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--loading-color-routing');
  expect(await readProgressIndicatorColor(page, 'icon-button-loading-color')).toBe(
    await readElementColor(page, 'icon-button-loading-color', '.md-icon-button__icon'),
  );
  await assertLoadingContract(page, 'icon-button-resting-color', 'icon-button-loading-color');
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
      button.evaluate((el) => getComputedStyle(el).borderColor),
      button.locator('.md-icon-button__icon').evaluate((el) => getComputedStyle(el).color),
    ]).then(([background, borderColor, iconColor]) => ({
      background: normalizeColorString(background),
      borderColor: normalizeColorString(borderColor),
      iconColor: normalizeColorString(iconColor),
    }));
  };

  const [standard, filled, tonal, outlined] = await Promise.all([
    readResting('Standard'),
    readResting('Filled'),
    readResting('Tonal'),
    readResting('Outlined'),
  ]);
  const [
    primary,
    onPrimary,
    secondaryContainer,
    onSecondaryContainer,
    onSurfaceVariant,
    outlineVariant,
  ] = await Promise.all([
    getSysColorValue(page, '--md-sys-color-primary'),
    getSysColorValue(page, '--md-sys-color-on-primary'),
    getSysColorValue(page, '--md-sys-color-secondary-container'),
    getSysColorValue(page, '--md-sys-color-on-secondary-container'),
    getSysColorValue(page, '--md-sys-color-on-surface-variant'),
    getSysColorValue(page, '--md-sys-color-outline-variant'),
  ]);

  expect(standard.iconColor).toBe(onSurfaceVariant);
  expect(filled.background).toBe(primary);
  expect(filled.iconColor).toBe(onPrimary);
  expect(tonal.background).toBe(secondaryContainer);
  expect(tonal.iconColor).toBe(onSecondaryContainer);
  expect(outlined.iconColor).toBe(onSurfaceVariant);
  expect(outlined.borderColor).toBe(outlineVariant);
  expect(standard.background).toBe('rgba(0 0 0 0)');
  expect(outlined.background).toBe('rgba(0 0 0 0)');
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

test('MDIconButton disabled defaults cover standard, filled, tonal, and outlined routes', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-states');
  const [disabledIcon, outlineVariant, filledContainer, tonalContainer] = await Promise.all([
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.38'),
    getSysColorValue(page, '--md-sys-color-outline-variant'),
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.1'),
    getColorAtOpacity(page, 'var(--md-sys-color-on-surface)', '0.12'),
  ]);
  const cases = [
    ['standard', 'Disabled standard', 'rgba(0 0 0 0)'],
    ['filled', 'Disabled filled', filledContainer],
    ['tonal', 'Disabled tonal', tonalContainer],
    ['outlined', 'Disabled outlined', 'rgba(0 0 0 0)'],
  ] as const;
  await Promise.all(
    cases.map(async ([style, name, container]) => {
      const sample = await readButtonLocatorVisuals(
        page.getByRole('button', { name, exact: true }),
        { iconSelector: '.md-icon-button__icon' },
      );
      expect(normalizeColorString(sample.background), `${style} container`).toBe(container);
      expect(normalizeColorString(asColor(sample.iconColor)), `${style} icon`).toBe(disabledIcon);
      expect(sample.disabledIconButtonOpacity, `${style} icon opacity route`).toBe('.38');
      expect(
        normalizeColorString(asColor(sample.stateLayerBackground)),
        `${style} state layer`,
      ).toBe('0 0 0 / 0');
      if (style === 'outlined')
        expect(normalizeColorString(sample.borderColor)).toBe(outlineVariant);
    }),
  );
});

test('MDIconButton default interaction routes resolve rendered icon, outline, and state layer', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--visual-interaction-states');
  const styles = {
    Standard: { colorRole: 'on-surface-variant' },
    Filled: { colorRole: 'on-primary' },
    Tonal: { colorRole: 'on-secondary-container' },
    Outlined: { colorRole: 'on-surface-variant', outlineRole: 'outline-variant' },
  } as const;
  const states = ['hover', 'focus', 'pressed'] as const;
  const opacityVars = {
    hover: '--md-sys-state-hover-state-layer-opacity',
    focus: '--md-sys-state-focus-state-layer-opacity',
    pressed: '--md-sys-state-pressed-state-layer-opacity',
  } as const;

  await Promise.all(
    Object.entries(styles).flatMap(([style, route]) =>
      states.map(async (state) => {
        const expectedColor = await getSysColorValue(page, `--md-sys-color-${route.colorRole}`);
        const expectedOpacity = await getSysPropertyValue(page, opacityVars[state]);
        const sample = await readButtonLocatorVisuals(
          page.getByRole('button', { name: `${style} ${state}`, exact: true }),
          { iconSelector: '.md-icon-button__icon' },
        );
        expect(normalizeColorString(asColor(sample.iconColor))).toBe(expectedColor);
        expect(normalizeColorString(sample.stateLayerColor)).toBe(expectedColor);
        expect(sample[`${state}Opacity`]).toBe(expectedOpacity);
        expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
          await getColorAtOpacity(page, `var(--md-sys-color-${route.colorRole})`, expectedOpacity),
        );
        if ('outlineRole' in route) {
          expect(normalizeColorString(sample.borderColor)).toBe(
            await getSysColorValue(page, `--md-sys-color-${route.outlineRole}`),
          );
        }
      }),
    ),
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

test('MDIconButton routes icon, outline, and state-layer tokens through the rendered contract, and paints the actual forced state-layer tint', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--token-routing-matrix');

  // Every forced fixture is wrapped in `MDStateLayerForcedStateProvider` (paired with the host
  // `md-state_*` class), so the nested `MDStateLayer` actually paints the forced state.
  const ICON_BUTTON_STATES = [
    {
      key: 'hover',
      opacityKey: 'hoverOpacity' as const,
      icon: 'rgb(255 0 0)',
      stateLayerColor: 'rgb(0 200 200)',
      opacity: '0.03',
    },
    {
      key: 'focus',
      opacityKey: 'focusOpacity' as const,
      icon: 'rgb(0 128 0)',
      stateLayerColor: 'rgb(200 0 200)',
      opacity: '0.17',
    },
    {
      key: 'pressed',
      opacityKey: 'pressedOpacity' as const,
      icon: 'rgb(0 0 255)',
      stateLayerColor: 'rgb(200 120 0)',
      opacity: '0.29',
    },
  ];

  const STANDARD_STATES = [
    {
      key: 'hover',
      opacityKey: 'hoverOpacity' as const,
      icon: 'rgb(240 20 20)',
      stateLayerColor: 'rgb(20 210 210)',
      opacity: '0.04',
    },
    {
      key: 'focus',
      opacityKey: 'focusOpacity' as const,
      icon: 'rgb(20 140 20)',
      stateLayerColor: 'rgb(210 20 210)',
      opacity: '0.18',
    },
    {
      key: 'pressed',
      opacityKey: 'pressedOpacity' as const,
      icon: 'rgb(20 20 240)',
      stateLayerColor: 'rgb(210 130 20)',
      opacity: '0.30',
    },
  ];
  await Promise.all(
    STANDARD_STATES.map(async (state) => {
      const sample = await readButtonVisuals(page, `icon-button-standard-${state.key}`, {
        iconSelector: '.md-icon-button__icon',
      });
      expect(normalizeColorString(asColor(sample.iconColor))).toBe(
        normalizeColorString(state.icon),
      );
      expect(normalizeColorString(sample.stateLayerColor)).toBe(
        normalizeColorString(state.stateLayerColor),
      );
      expect(sample[state.opacityKey]).toBe(state.opacity);
      expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
        await getColorAtOpacity(page, state.stateLayerColor, state.opacity),
      );
    }),
  );

  // Filled and tonal: icon and state-layer color/opacity route independently per state.
  await Promise.all(
    (['', 'tonal-'] as const).flatMap((style) =>
      ICON_BUTTON_STATES.map(async (state) => {
        const sample = await readButtonVisuals(page, `icon-button-${style}${state.key}`, {
          iconSelector: '.md-icon-button__icon',
        });
        const expectedStateLayerBackground = await getColorAtOpacity(
          page,
          state.stateLayerColor,
          state.opacity,
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
  expect(normalizeColorString(asColor(outlinedHover.iconColor))).toBe(
    normalizeColorString('rgb(120 10 200)'),
  );
  expect(normalizeColorString(asColor(outlinedFocus.iconColor))).toBe(
    normalizeColorString('rgb(10 120 10)'),
  );
  expect(normalizeColorString(asColor(outlinedPressed.iconColor))).toBe(
    normalizeColorString('rgb(10 10 120)'),
  );
  expect(normalizeColorString(outlinedHover.stateLayerColor)).toBe(
    normalizeColorString('rgb(0 200 200)'),
  );
  expect(outlinedHover.hoverOpacity).toBe('0.03');
  expect(normalizeColorString(await getColorAtOpacity(page, 'rgb(0 200 200)', '0.03'))).toBe(
    normalizeColorString(asColor(outlinedHover.stateLayerBackground)),
  );
  expect(normalizeColorString(outlinedFocus.stateLayerColor)).toBe(
    normalizeColorString('rgb(200 0 200)'),
  );
  expect(outlinedFocus.focusOpacity).toBe('0.17');
  expect(normalizeColorString(await getColorAtOpacity(page, 'rgb(200 0 200)', '0.17'))).toBe(
    normalizeColorString(asColor(outlinedFocus.stateLayerBackground)),
  );
  expect(normalizeColorString(outlinedPressed.stateLayerColor)).toBe(
    normalizeColorString('rgb(200 120 0)'),
  );
  expect(outlinedPressed.pressedOpacity).toBe('0.29');
  expect(normalizeColorString(await getColorAtOpacity(page, 'rgb(200 120 0)', '0.29'))).toBe(
    normalizeColorString(asColor(outlinedPressed.stateLayerBackground)),
  );

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
  expect(normalizeColorString(await getColorAtOpacity(page, 'rgb(180 0 0)', '0.11'))).toBe(
    normalizeColorString(asColor(selected.stateLayerBackground)),
  );
  expect(normalizeColorString(asColor(unselected.iconColor))).toBe(
    normalizeColorString('rgb(0 90 0)'),
  );
  expect(normalizeColorString(unselected.stateLayerColor)).toBe(
    normalizeColorString('rgb(0 0 180)'),
  );
  expect(unselected.pressedOpacity).toBe('0.21');
  expect(normalizeColorString(await getColorAtOpacity(page, 'rgb(0 0 180)', '0.21'))).toBe(
    normalizeColorString(asColor(unselected.stateLayerBackground)),
  );
});

test('MDIconButton selected/unselected hover, focus, and pressed token routing is independently verified for standard, filled, tonal, and outlined', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--toggle-token-routing-matrix');

  // Literals mirror `ICON_BUTTON_TOGGLE_MATRIX` in `MDIconButton.stories.ts`. Container (where
  // published) and resting icon are read at rest; interaction icon and state-layer color/opacity
  // are read under each forced state, since `MDStateLayer` only paints while a state is active.
  const TOGGLE_MATRIX: Record<
    'standard' | 'filled' | 'tonal' | 'outlined',
    {
      selected: {
        container?: string;
        icon: string;
        hoverIcon: string;
        stateLayerColor: string;
        outline?: string;
      };
      unselected: {
        container?: string;
        icon: string;
        hoverIcon: string;
        stateLayerColor: string;
        outline?: string;
      };
      hoverOpacity: string;
    }
  > = {
    standard: {
      selected: {
        icon: 'rgb(210 90 0)',
        hoverIcon: 'rgb(210 90 40)',
        stateLayerColor: 'rgb(0 150 210)',
      },
      unselected: {
        icon: 'rgb(0 140 70)',
        hoverIcon: 'rgb(40 140 70)',
        stateLayerColor: 'rgb(150 0 90)',
      },
      hoverOpacity: '0.07',
    },
    filled: {
      selected: {
        container: 'rgb(10 60 10)',
        icon: 'rgb(255 210 0)',
        hoverIcon: 'rgb(255 230 60)',
        stateLayerColor: 'rgb(0 200 160)',
      },
      unselected: {
        container: 'rgb(10 10 90)',
        icon: 'rgb(255 120 180)',
        hoverIcon: 'rgb(255 150 200)',
        stateLayerColor: 'rgb(150 80 0)',
      },
      hoverOpacity: '0.09',
    },
    tonal: {
      selected: {
        container: 'rgb(90 60 10)',
        icon: 'rgb(255 255 0)',
        hoverIcon: 'rgb(255 255 90)',
        stateLayerColor: 'rgb(200 100 0)',
      },
      unselected: {
        container: 'rgb(10 90 60)',
        icon: 'rgb(0 255 255)',
        hoverIcon: 'rgb(90 255 255)',
        stateLayerColor: 'rgb(0 120 200)',
      },
      hoverOpacity: '0.13',
    },
    outlined: {
      // `outlined` selected has no independent outline token in `MDIconButton.vue`: its outline
      // is routed to mirror `selected-container-color`, so `outline` is intentionally omitted
      // here (not independently routed) rather than asserted against an invented value.
      selected: {
        container: 'rgb(60 10 90)',
        icon: 'rgb(255 0 150)',
        hoverIcon: 'rgb(255 60 180)',
        stateLayerColor: 'rgb(150 0 255)',
      },
      unselected: {
        icon: 'rgb(0 255 120)',
        hoverIcon: 'rgb(60 255 150)',
        stateLayerColor: 'rgb(0 90 255)',
        outline: 'rgb(90 60 0)',
      },
      hoverOpacity: '0.15',
    },
  };
  const ADDITIONAL_STATES = {
    standard: {
      selected: {
        focus: ['rgb(209 91 2)', 'rgb(2 149 209)'],
        pressed: ['rgb(208 92 4)', 'rgb(4 148 208)'],
      },
      unselected: {
        focus: ['rgb(2 139 71)', 'rgb(149 2 91)'],
        pressed: ['rgb(4 138 72)', 'rgb(148 4 92)'],
      },
      focusOpacity: '0.17',
      pressedOpacity: '0.27',
    },
    filled: {
      selected: {
        focus: ['rgb(254 229 62)', 'rgb(2 198 161)'],
        pressed: ['rgb(253 228 64)', 'rgb(4 196 162)'],
      },
      unselected: {
        focus: ['rgb(254 149 202)', 'rgb(149 82 1)'],
        pressed: ['rgb(253 148 204)', 'rgb(148 84 2)'],
      },
      focusOpacity: '0.19',
      pressedOpacity: '0.29',
    },
    tonal: {
      selected: {
        focus: ['rgb(254 253 92)', 'rgb(199 102 3)'],
        pressed: ['rgb(253 251 94)', 'rgb(198 104 6)'],
      },
      unselected: {
        focus: ['rgb(92 253 254)', 'rgb(3 119 199)'],
        pressed: ['rgb(94 251 253)', 'rgb(6 118 198)'],
      },
      focusOpacity: '0.23',
      pressedOpacity: '0.33',
    },
    outlined: {
      selected: {
        focus: ['rgb(254 62 179)', 'rgb(149 3 254)'],
        pressed: ['rgb(253 64 178)', 'rgb(148 6 253)'],
      },
      unselected: {
        focus: ['rgb(62 253 149)', 'rgb(3 89 254)'],
        pressed: ['rgb(64 251 148)', 'rgb(6 88 253)'],
      },
      focusOpacity: '0.25',
      pressedOpacity: '0.35',
    },
  } as const;
  const ICON_BUTTON_TOGGLE_STYLE_KEYS = ['standard', 'filled', 'tonal', 'outlined'] as const;

  await Promise.all(
    ICON_BUTTON_TOGGLE_STYLE_KEYS.flatMap((style) =>
      (['selected', 'unselected'] as const).map(async (branch) => {
        const entry = TOGGLE_MATRIX[style];
        const tokens = entry[branch];

        const resting = await readButtonVisuals(
          page,
          `icon-toggle-token-${style}-${branch}-resting`,
          { iconSelector: '.md-icon-button__icon' },
        );
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
        if (style === 'outlined' && branch === 'selected') {
          expect(
            normalizeColorString(resting.borderColor),
            'outlined selected outline mirrors container',
          ).toBe(normalizeColorString(resting.background));
        }
        expect(normalizeColorString(asColor(resting.iconColor)), `${style} ${branch} icon`).toBe(
          normalizeColorString(tokens.icon),
        );

        await Promise.all(
          (['hover', 'focus', 'pressed'] as const).map(async (state) => {
            const sample = await readButtonVisuals(
              page,
              `icon-toggle-token-${style}-${branch}-${state}`,
              { iconSelector: '.md-icon-button__icon' },
            );
            const [icon, stateLayerColor] =
              state === 'hover'
                ? [tokens.hoverIcon, tokens.stateLayerColor]
                : ADDITIONAL_STATES[style][branch][state];
            const opacity =
              state === 'hover' ? entry.hoverOpacity : ADDITIONAL_STATES[style][`${state}Opacity`];
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

test('MDIconButton selected/unselected defaults resolve through documented Material roles', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdiconbutton--default-toggle-role-matrix');
  const routes = {
    standard: { unselected: { icon: 'on-surface-variant' }, selected: { icon: 'primary' } },
    filled: {
      unselected: { container: 'surface-container', icon: 'on-surface-variant' },
      selected: { container: 'primary', icon: 'on-primary' },
    },
    tonal: {
      unselected: { container: 'secondary-container', icon: 'on-secondary-container' },
      selected: { container: 'secondary', icon: 'on-secondary' },
    },
    outlined: {
      unselected: { icon: 'on-surface-variant', outline: 'outline-variant' },
      selected: { container: 'inverse-surface', icon: 'inverse-on-surface' },
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
        const expectedIcon = await getSysColorValue(page, `--md-sys-color-${route.icon}`);
        const resting = await readButtonVisuals(page, `default-toggle-${style}-${branch}-resting`, {
          iconSelector: '.md-icon-button__icon',
        });
        expect(normalizeColorString(asColor(resting.iconColor))).toBe(expectedIcon);
        await Promise.all(
          states.map(async (state) => {
            const opacity = await getSysPropertyValue(page, opacityVars[state]);
            const sample = await readButtonVisuals(
              page,
              `default-toggle-${style}-${branch}-${state}`,
              { iconSelector: '.md-icon-button__icon' },
            );
            expect(normalizeColorString(asColor(sample.iconColor))).toBe(expectedIcon);
            expect(normalizeColorString(sample.stateLayerColor)).toBe(expectedIcon);
            expect(sample[`${state}Opacity`]).toBe(opacity);
            expect(normalizeColorString(asColor(sample.stateLayerBackground))).toBe(
              await getColorAtOpacity(page, `var(--md-sys-color-${route.icon})`, opacity),
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
        if (style === 'outlined' && branch === 'selected')
          expect(normalizeColorString(resting.borderColor)).toBe(
            normalizeColorString(resting.background),
          );
      }),
    ),
  );
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
