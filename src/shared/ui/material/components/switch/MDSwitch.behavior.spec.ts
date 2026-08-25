import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDSwitch click, Space, and Enter activation each produce exactly one public intent through the real renderer beforeinput/preventDefault lifecycle', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--behavior-contracts');

  // `exact: true` avoids any case-insensitive substring collision with the story's separate
  // "Standalone labelled switch".
  const labelled = page.getByRole('switch', { name: 'Labelledby switch', exact: true });
  const changeCount = page.locator('#md-switch-change-count');

  await expect(labelled).toHaveAttribute('aria-checked', 'false');

  await labelled.click();
  await expect(labelled).toHaveAttribute('aria-checked', 'true');
  await expect(changeCount).toHaveText('1');

  await labelled.focus();
  await page.keyboard.press('Space');
  await expect(labelled).toHaveAttribute('aria-checked', 'false');
  await expect(changeCount).toHaveText('2');

  // Official Accessibility guidance documents both Space and Enter toggling the switch
  // (DESIGN.md "Accessibility"); every activation path reaches the identical compiled renderer
  // click handler and its single cancelable `beforeinput` dispatch, which the adapter
  // intercepts uniformly regardless of input modality.
  await page.keyboard.press('Enter');
  await expect(labelled).toHaveAttribute('aria-checked', 'true');
  await expect(changeCount).toHaveText('3');
});

test('MDSwitch resolves an accessible name from aria-labelledby and aria-label, and blocks disabled activation', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--behavior-contracts');

  await expect(page.getByRole('switch', { name: 'Labelledby switch', exact: true })).toBeVisible();

  const standalone = page.getByRole('switch', { name: 'Standalone labelled switch' });
  await expect(standalone).toHaveAttribute('aria-checked', 'false');
  await standalone.click();
  await expect(standalone).toHaveAttribute('aria-checked', 'true');

  const disabled = page.getByRole('switch', { name: 'Disabled switch' });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveAttribute('aria-checked', 'false');

  // `disabled` is not Playwright-actionable (its own guard blocks `beforeinput` dispatch before
  // any mutation, per ARCHITECTURE.md's "Renderer mapping and gaps"), so locator `.click()` would
  // require the forbidden `force` option. Prove the same pointer-activation-is-blocked contract
  // with ordinary real pointer input at the rendered element's own coordinates instead, matching
  // the `page.mouse.click` pattern already used for the `presentation` and target-hit fixtures
  // below.
  const disabledBox = await disabled.boundingBox();
  if (disabledBox == null) {
    throw new Error('Missing MDSwitch disabled bounding box.');
  }
  await page.mouse.click(
    disabledBox.x + disabledBox.width / 2,
    disabledBox.y + disabledBox.height / 2,
  );
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Tab');
  await expect(disabled).not.toBeFocused();
});

test('MDSwitch native implicit and explicit label associations do not produce accessible names (M3E-004)', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--native-label-association');

  // The installed renderer documents both associations through its public LabelledMixin surface,
  // but neither produces an accessibility-tree name. Mioframe deliberately relies on the
  // separately proven aria-label/aria-labelledby contract instead of synthesizing one.
  await expect(page.locator('#native-label-implicit-switch')).toHaveAccessibleName('');
  await expect(page.locator('#native-label-explicit-switch')).toHaveAccessibleName('');
});

test('MDSwitch rejected intent leaves the rendered checked unchanged when the owning consumer does not write the emitted value back', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--rejected-intent');

  const toggle = page.getByRole('switch', { name: 'Rejected intent' });
  const count = page.locator('#md-switch-rejected-intent-count');
  const value = page.locator('#md-switch-rejected-intent-value');

  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();

  // Exactly one intent was reported with the intended next value...
  await expect(count).toHaveText('1');
  await expect(value).toHaveText('true');
  // ...but since the fixture never writes it back to `selected`, the rendered switch stays at
  // its prior value: `selected` remains the sole, one-directional source of truth, with no
  // window in which the renderer's own `checked` could have diverged.
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();
  await expect(count).toHaveText('2');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('MDSwitch disabled and presentation are both unreachable by Tab, resolving the renderer disabled-focus-order gap', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--tab-order-fixture');

  const before = page.locator('#tab-order-before');
  const after = page.locator('#tab-order-after');

  await before.focus();
  await expect(before).toBeFocused();

  // Only one Tab press from `before` reaches `after`: both the disabled switch and the
  // presentation switch sitting between them in the DOM are skipped. This confirms the renderer's
  // own Focusable/Disabled mixins already remove it from the tab order (no wrapper tabindex="-1"
  // correction is needed for `disabled`) and that `presentation` stays fully out of the tab order.
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('MDSwitch presentation is unreachable by real pointer input and stays hidden from the accessibility tree', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--presentation');

  // The decorative composition scenario: the wrapping element owns the accessible switch role;
  // MDSwitch itself must not add a second accessible switch node.
  await expect(page.getByRole('switch', { name: 'Automatic updates' })).toHaveCount(1);

  const decorative = page.locator('[data-testid="md-switch-presentation"] m3e-switch');
  await expect(decorative).toBeVisible();
  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  await expect(decorative).toHaveAttribute('tabindex', '-1');

  const readChecked = () =>
    decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

  expect(await readChecked()).toBe(true);

  const box = await decorative.boundingBox();
  if (box == null) {
    throw new Error('Missing MDSwitch presentation bounding box.');
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // A real pointer click at the decorative switch's own rendered location must not reach the
  // renderer's internal click-toggle handler: `pointer-events: none` blocks it, so the
  // renderer's own `checked` value stays exactly as authored.
  expect(await readChecked()).toBe(true);
});

test('MDSwitch presentation composition: pointer input on the decorative region reaches the owning fixture action, and its state flows back into the rendered checked', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--presentation-composition');

  const owner = page.getByTestId('md-switch-presentation-composition');
  const decorative = owner.locator('m3e-switch');
  const count = page.locator('#md-switch-presentation-composition-count');

  const readChecked = () =>
    decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

  await expect(owner).toHaveAttribute('aria-checked', 'false');
  expect(await readChecked()).toBe(false);

  const box = await decorative.boundingBox();
  if (box == null) {
    throw new Error('Missing MDSwitch presentation-composition bounding box.');
  }

  // A real pointer click at the decorative switch's own visible location: `pointer-events: none`
  // makes the renderer itself unreachable, so the click must land on the owning fixture element
  // instead, which owns the accessible role and the actual toggle action.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(count).toHaveText('1');
  await expect(owner).toHaveAttribute('aria-checked', 'true');
  // The owner's state update flows back into `selected`, the only thing that ever writes the
  // renderer's `checked`; the decorative renderer never independently toggled itself.
  expect(await readChecked()).toBe(true);
});

test('MDSwitch expanded 48dp target activates a toggle outside the visible 32dp track', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--target-hit-area');

  const surface = page.locator('[data-testid="visual-md-switch-target-hit"]');
  const toggle = surface.getByRole('switch', { name: 'Target hit' });
  const count = page.locator('#visual-md-switch-target-hit-count');
  const box = await toggle.boundingBox();

  if (box == null) {
    throw new Error('Missing MDSwitch bounding box for target hit test.');
  }

  // The visible track is 32 CSS pixels tall; the renderer's internal 48dp touch target is
  // vertically centered over it, so a point a few pixels above the host's own bounding box
  // still lands inside the larger interactive target (DESIGN.md "Geometry and layout": Track
  // height 32dp, Target size 48dp).
  const clickPoint = { x: box.x + box.width / 2, y: box.y - 4 };

  expect(clickPoint.y).toBeLessThan(box.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('MDSwitch presentation is unreachable by real touch input and its renderer-owned checked does not mutate', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-switch-mdswitch--presentation');

    // The decorative composition scenario: the wrapping element owns the accessible switch role;
    // MDSwitch itself must not become the interactive owner under touch either.
    await expect(page.getByRole('switch', { name: 'Automatic updates' })).toHaveCount(1);

    const decorative = page.locator('[data-testid="md-switch-presentation"] m3e-switch');
    await expect(decorative).toBeVisible();
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).toHaveAttribute('tabindex', '-1');

    const readChecked = () =>
      decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

    expect(await readChecked()).toBe(true);

    const box = await decorative.boundingBox();
    if (box == null) {
      throw new Error('Missing MDSwitch presentation bounding box.');
    }

    // Real touch input (Playwright's CDP-backed `touchscreen.tap`, which requires the context's
    // `hasTouch: true` set above) at the decorative switch's own rendered location: `pointer-events:
    // none` must block it exactly as it blocks mouse input in the sibling mouse-path test above, so
    // the renderer's own `checked` value stays exactly as authored and its presentation semantics
    // are unchanged.
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

    expect(await readChecked()).toBe(true);
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).toHaveAttribute('tabindex', '-1');
  });

  test('MDSwitch presentation composition: real touch input on the decorative region reaches the owning fixture action exactly once, and its state flows back into the rendered checked', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-switch-mdswitch--presentation-composition');

    const owner = page.getByTestId('md-switch-presentation-composition');
    const decorative = owner.locator('m3e-switch');
    const count = page.locator('#md-switch-presentation-composition-count');

    const readChecked = () =>
      decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

    await expect(owner).toHaveAttribute('aria-checked', 'false');
    expect(await readChecked()).toBe(false);

    const box = await decorative.boundingBox();
    if (box == null) {
      throw new Error('Missing MDSwitch presentation-composition bounding box.');
    }

    // Real touch input at the decorative switch's own visible location: `pointer-events: none`
    // makes the renderer itself unreachable by touch too, so the touch must land on the owning
    // fixture element instead, produce exactly one owner action, and that owner's resulting state
    // must flow back into `selected`/the rendered `checked` through the existing controlled path —
    // the decorative renderer itself never independently toggles.
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

    await expect(count).toHaveText('1');
    await expect(owner).toHaveAttribute('aria-checked', 'true');
    expect(await readChecked()).toBe(true);
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).toHaveAttribute('tabindex', '-1');
  });
});

test('MDSwitch drops undeclared dynamic renderer inputs and never exposes their state or an undeclared click listener', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--host-attribute-boundary');

  const host = page.getByTestId('host-boundary-switch');
  const toggle = page.getByTestId('host-boundary-toggle');
  const clickCount = page.getByTestId('host-boundary-click-count');

  const readRendererState = () =>
    host.evaluate<
      { checked: boolean; icons: string; name: string; value: string },
      HTMLElement & { checked: boolean; icons: string; name: string; value: string }
    >((el) => ({ checked: el.checked, icons: el.icons, name: el.name, value: el.value }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    checked: false,
    icons: 'none',
    name: '',
    value: 'on',
  });

  await toggle.click();
  expect(await readRendererState()).toEqual({
    checked: false,
    icons: 'none',
    name: '',
    value: 'on',
  });

  // The story's own `@click` handler is not part of MDSwitch's public API; a real click on the
  // rendered host must never invoke it.
  const box = await host.boundingBox();
  if (box == null) {
    throw new Error('Missing MDSwitch bounding box for host-attribute boundary test.');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(clickCount).toHaveText('0');
});
