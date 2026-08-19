import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDExtendedFloatingActionButton exposes its visible label as one accessible action and accepts pointer activation from the icon', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--behavior-contracts',
  );

  const fab = page.getByRole('button', { name: 'Create a new note' });
  const icon = page.getByTestId('behavior-extended-fab-icon');
  const clickCount = page.locator('#md-extended-fab-click-count');

  await expect(fab).toBeVisible();
  await expect(fab).toBeEnabled();

  await icon.click();
  await expect(clickCount).toHaveText('1');
});

test('MDExtendedFloatingActionButton accepts real hover, Tab focus, and pointer press on one action owner', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--behavior-contracts',
  );

  const fab = page.getByRole('button', { name: 'Create a new note' });
  const clickCount = page.locator('#md-extended-fab-click-count');

  await fab.hover();
  expect(await fab.evaluate((element) => element.matches(':hover'))).toBe(true);

  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await expect(fab).toBeFocused();
  expect(await fab.evaluate((element) => element.matches(':focus-visible'))).toBe(true);

  const box = await fab.boundingBox();
  if (!box) {
    throw new Error('Missing MDExtendedFloatingActionButton pointer target.');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await fab.evaluate((element) => element.matches(':active'))).toBe(true);
  await expect(clickCount).toHaveText('0');

  await page.mouse.up();
  await expect(clickCount).toHaveText('1');
});

test('MDExtendedFloatingActionButton supports one Enter and one Space activation from the keyboard', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--behavior-contracts',
  );

  const fab = page.getByRole('button', { name: 'Create a new note' });
  const clickCount = page.locator('#md-extended-fab-click-count');

  await fab.focus();
  await expect(fab).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(clickCount).toHaveText('1');

  await page.keyboard.press('Space');
  await expect(clickCount).toHaveText('2');
});

test('MDExtendedFloatingActionButton keeps a label-only Extended FAB focusable and actionable', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--behavior-contracts',
  );

  const fab = page.getByRole('button', { name: 'Create note without icon' });
  const clickCount = page.locator('#md-extended-fab-click-count');

  await fab.focus();
  await expect(fab).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(clickCount).toHaveText('1');
});

test('MDExtendedFloatingActionButton renders the Material small, medium, and large public geometry', async ({
  page,
}) => {
  // Fixed geometry is measured immediately after story load. The appear transition
  // (MDExtendedFloatingActionButton.vue) animates a `transform: scale()` on the same host that
  // `boundingBox()` measures, so reduced motion is emulated to settle geometry deterministically
  // instead of racing the transition's real-time duration.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--geometry-contracts',
  );

  const measurements = await Promise.all(
    [
      { gap: 8, height: 56, leading: 16, size: 'small', trailing: 16, width: 24 },
      { gap: 12, height: 80, leading: 26, size: 'medium', trailing: 26, width: 28 },
      { gap: 16, height: 96, leading: 28, size: 'large', trailing: 28, width: 36 },
    ].map(async (expected) => {
      const fab = page.getByTestId(`geometry-extended-fab-${expected.size}`);
      const icon = page.getByTestId(`geometry-extended-fab-${expected.size}-icon`);
      const label = fab.locator('[slot="label"]');
      const [fabBox, iconBox, labelBox] = await Promise.all([
        fab.boundingBox(),
        icon.boundingBox(),
        label.boundingBox(),
      ]);
      if (!fabBox || !iconBox || !labelBox) {
        throw new Error(`Missing ${expected.size} Extended FAB geometry.`);
      }
      return { expected, fabBox, iconBox, labelBox };
    }),
  );

  for (const { expected, fabBox, iconBox, labelBox } of measurements) {
    expect(fabBox.height).toBe(expected.height);
    expect(iconBox.width).toBe(expected.width);
    expect(iconBox.height).toBe(expected.width);
    expect(iconBox.x - fabBox.x).toBe(expected.leading);
    expect(labelBox.x - (iconBox.x + iconBox.width)).toBe(expected.gap);
    expect(fabBox.x + fabBox.width - (labelBox.x + labelBox.width)).toBe(expected.trailing);
  }
});

test('MDExtendedFloatingActionButton routes public size/geometry token overrides to rendered geometry across small, medium, and large', async ({
  page,
}) => {
  // Same reduced-motion reasoning as the default-geometry test above: settle the appear
  // transition deterministically before measuring bounding boxes.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--geometry-token-override-contracts',
  );

  // Values match the public `--md-comp-extended-fab-<size>-container-height` and
  // `--md-comp-extended-fab-<size>-icon-size` overrides set on each host in the
  // `GeometryTokenOverrideContracts` story, and are intentionally distinct from every current
  // Material default for that size (docs/testing/geometry-contracts test above), so a passing
  // assertion here can only mean the override actually reached the rendered result rather than
  // coincidentally matching an unrelated default.
  const measurements = await Promise.all(
    [
      { height: 72, iconSize: 32, size: 'small' },
      { height: 96, iconSize: 36, size: 'medium' },
      { height: 112, iconSize: 44, size: 'large' },
    ].map(async (expected) => {
      const fab = page.getByTestId(`geometry-token-override-extended-fab-${expected.size}`);
      const icon = page.getByTestId(`geometry-token-override-extended-fab-${expected.size}-icon`);
      const [fabBox, iconBox] = await Promise.all([fab.boundingBox(), icon.boundingBox()]);
      if (!fabBox || !iconBox) {
        throw new Error(`Missing ${expected.size} Extended FAB geometry-token-override box.`);
      }
      return { expected, fabBox, iconBox };
    }),
  );

  for (const { expected, fabBox, iconBox } of measurements) {
    expect(fabBox.height).toBe(expected.height);
    expect(iconBox.width).toBe(expected.iconSize);
    expect(iconBox.height).toBe(expected.iconSize);
  }
});

test('MDExtendedFloatingActionButton drops undeclared dynamic attributes and keeps renderer configuration adapter-owned', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--host-attribute-boundary',
  );

  const host = page.getByTestId('host-boundary-extended-fab');
  const toggle = page.getByTestId('host-boundary-toggle');
  const readRendererState = () =>
    host.evaluate<
      { disabled: boolean; extended: boolean; lowered: boolean; size: string; variant: string },
      HTMLElement & {
        disabled: boolean;
        extended: boolean;
        lowered: boolean;
        size: string;
        variant: string;
      }
    >((fab) => ({
      disabled: fab.disabled,
      extended: fab.extended,
      lowered: fab.lowered,
      size: fab.size,
      variant: fab.variant,
    }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: true,
    lowered: false,
    size: 'small',
    variant: 'primary-container',
  });
  await expect(host).not.toHaveAttribute('aria-label');
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  await toggle.click();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: true,
    lowered: false,
    size: 'small',
    variant: 'primary-container',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');
});

test('MDExtendedFloatingActionButton mirrors the icon and label position under right-to-left direction', async ({
  page,
}) => {
  // Same reasoning as the LTR geometry-contracts test: settle the appear transition
  // deterministically before measuring bounding boxes.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--rtl-contracts',
  );

  const fab = page.getByTestId('rtl-extended-fab');
  const icon = page.getByTestId('rtl-extended-fab-icon');
  const label = fab.locator('[slot="label"]');
  const [fabBox, iconBox, labelBox] = await Promise.all([
    fab.boundingBox(),
    icon.boundingBox(),
    label.boundingBox(),
  ]);
  if (!fabBox || !iconBox || !labelBox) {
    throw new Error('Missing RTL Extended FAB geometry.');
  }

  // BEHAVIOR.md "Anatomy and content roles": in RTL, the elements mirror the LTR geometry
  // contract, so the icon sits at the trailing (physical right) edge and the label precedes it
  // toward the leading (physical left) edge.
  expect(fabBox.x + fabBox.width - (iconBox.x + iconBox.width)).toBe(16);
  expect(iconBox.x - (labelBox.x + labelBox.width)).toBe(8);
  expect(labelBox.x - fabBox.x).toBe(16);
});

test('MDExtendedFloatingActionButton settles immediately with no expand transition under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--motion-contracts',
  );

  const fab = page.getByTestId('motion-extended-fab');
  await expect(fab).toBeVisible();

  const { opacity, transform } = await fab.evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, transform: style.transform };
  });

  expect(opacity).toBe('1');
  expect(transform).toBe('none');
});

test('MDExtendedFloatingActionButton runs a real expand-and-fade appear transition when motion is not reduced', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--motion-contracts',
  );

  const fab = page.getByTestId('motion-extended-fab');
  await expect(fab).toBeVisible();

  // The story overrides `--md-private-motion-expressive-fast-spatial-duration` to 2s, giving a
  // comfortably wide, deterministic window (far longer than story navigation/mount latency) to
  // observe the transition still in flight rather than racing its real production duration.
  const { opacity, transform } = await fab.evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, transform: style.transform };
  });

  expect(Number(opacity)).toBeLessThan(1);
  expect(transform).not.toBe('none');

  await expect(fab).toHaveCSS('opacity', '1', { timeout: 3000 });
});
